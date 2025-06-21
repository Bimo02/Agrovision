import logging
import os
import argparse
import uuid
import asyncio
from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, Union
import uvicorn
from werkzeug.utils import secure_filename
# for vision model and images visualization
import io
import requests
from PIL import Image
# for chat with docs
import tempfile
from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.chains.question_answering import load_qa_chain
from gemini import memory
from gemini import GOOGLE_API_KEY, gemini_chat_model, identify_url_content
from SpeechRecognition import recognize_speech, process_user_voice, voice, speek, text_to_speech, generate_speech , recognize__speech
from gemini_data_chat import retrieval_qa_pipline
import mimetypes
from fastapi import UploadFile, File, Form
from typing import Optional
from fastapi import Depends
from typing import List
app = FastAPI()
conversation_memory = []
import firebase_admin
from firebase_admin import credentials, db
import requests
from langdetect import detect

cred = credentials.Certificate("C:\\Users\\alir0\\Downloads\\Compressed\\Agrovision-Chatbot-main\\AR_chatbot\\config\\agrovision-sensor-data-firebase-adminsdk-ag5yl-32cd7df29d.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://agrovision-sensor-data-default-rtdb.firebaseio.com/"
})

def get_latest_sensor_data():
    ref = db.reference("sensor_data")
    data = ref.get()

    if not data or not isinstance(data, dict):
        return "No sensor data available."

    latest_key = max(data.keys())  # Get the latest entry key
    latest_entry = data[latest_key]
    
    return latest_entry


def get_memory() -> List[str]:
    """Returns the current conversation memory."""
    return conversation_memory

def update_memory(new_entry: str):
    """Adds a new entry to memory (max 10 messages)."""
    conversation_memory.append(new_entry)
    if len(conversation_memory) > 10:  # Limit memory size
        conversation_memory.pop(0)
# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIO_DIR = "audio_responses"
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/audio_responses", StaticFiles(directory=AUDIO_DIR), name="audio")

# Models for request bodies
class TextConversationRequest(BaseModel):
    query: str
    speak: bool = False

class VoiceConversationRequest(BaseModel):
    speak: bool = True

class ImageConversationRequest(BaseModel):
    image_source: str
    mode: str = "text"
    question: Optional[str] = None
    audio_file_path: Optional[str] = None
    speak: bool = False

class PDFConversationRequest(BaseModel):
    file_source: str
    mode: str = "text"
    audio_file_path: Optional[str] = None
    question: Optional[str] = None
    speak: bool = False

async def process_response(query: str, convo: str, speak_response: bool = False):
    response_data = {"Question": query, "Answer": convo}
    
    if speak_response:
        filename = f"response_{len(os.listdir(AUDIO_DIR))}.mp3"
        audio_path = os.path.join(AUDIO_DIR, filename)
        await generate_speech(convo, audio_path)
        response_data["audio_url"] = f"/get_audio/{filename}"
    
    return JSONResponse(content=response_data)

@app.get("/get_audio/{filename}")
async def get_audio(filename: str):
    """ API to serve generated audio files """
    audio_path = os.path.join(AUDIO_DIR, filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(audio_path, media_type="audio/mpeg") #filename=filename)

@app.post("/text_convo")
async def text_conversation(
    request_data: TextConversationRequest,
    memory: List[str] = Depends(get_memory)
):
    query = request_data.query
    speak_response = request_data.speak
    query_lang = detect(query)
    if query.startswith('http'):
        content_type = identify_url_content(query)
        if content_type == 'image':
            return await image_conversation(ImageConversationRequest(
                image_source=query,
                mode="text",
                question=query,
                speak=speak_response
            ))
        elif content_type == 'pdf':
            return await pdf_conversation(PDFConversationRequest(
                file_source=query,
                mode="text",
                question=query,
                speak=speak_response
            ))
    elif query.lower() in ['how is my farm doing today?', 'كيف حال مزرعتي اليوم؟']:
        latest_data = get_latest_sensor_data()
        if latest_data:
            if query_lang == "ar":
                sensor_context = (
                    f"أحدث بيانات المستشعر:\n"
                    f"- درجة الحرارة: {latest_data['Temp']}°C\n"
                    f"- الرطوبة: {latest_data['Hum']}%\n"
                    f"- مستوى الحموضة (pH): {latest_data['PH']}\n"
                    f"- خصوبة التربة: {latest_data['Fertility']}\n"
                    f"- النيتروجين: {latest_data['N']}، الفوسفور: {latest_data['P']}، البوتاسيوم: {latest_data['K']}\n\n"
                )
                query = f"كيف حال مزرعتي اليوم؟\n\n{sensor_context}"
            else:
                sensor_context = (
                    f"Latest sensor data:\n"
                    f"- Temperature: {latest_data['Temp']}°C\n"
                    f"- Humidity: {latest_data['Hum']}%\n"
                    f"- pH Level: {latest_data['PH']}\n"
                    f"- Soil Fertility: {latest_data['Fertility']}\n"
                    f"- Nitrogen: {latest_data['N']}, Phosphorus: {latest_data['P']}, Potassium: {latest_data['K']}\n\n"
                )
                query = f"How is my farm doing today?\n based on this \n{sensor_context}"

    # Update memory with user query
    update_memory(f"User: {query}")
    
    # Build context from memory
    context = "\n".join(memory)
    full_query = f"{context}\nCurrent Question: {query}"
    
    # Get response
    qa = retrieval_qa_pipline()
    res = qa.invoke({"query": full_query})
    answer = res["result"]
    
    # Update memory with assistant response
    update_memory(f"Assistant: {answer}")
    
    if answer.lower() != 'The answer is not available in my current knowledge base.':
        response = await process_response(query, answer, speak_response)
    else:
        convo = gemini_chat_model(full_query)
        update_memory(f"Assistant: {convo}")  # Update with Gemini response
        response = await process_response(query, convo, speak_response)
    return response
@app.post("/voice_convo")
async def voice_conversation(
    audio_file: UploadFile = File(..., description="Audio file (WAV/MP3)"),
    speak: bool = Form(True),
    language: str = Form("auto"),
    memory: List[str] = Depends(get_memory)  # Inject current memory
):
    """Process voice input with persistent memory."""
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, secure_filename(audio_file.filename))
    
    try:
        # Save and process audio
        with open(temp_path, "wb") as f:
            f.write(await audio_file.read())
        
        query = recognize__speech(temp_path,language=language)
        update_memory(f"User: {query}")

        # Build context from memory
        context = "\n".join(memory)
        full_query = f"{context}\nCurrent Question: {query}"
        
        # Get response
        qa = retrieval_qa_pipline()
        res = qa.invoke({"query": full_query})
        response_text = res["result"] if "not available" not in res["result"].lower() else gemini_chat_model(full_query)
        update_memory(f"Assistant: {response_text}")

        # Generate response
        response_data = {"text": response_text}
        if speak:
            filename = f"response_{len(os.listdir(AUDIO_DIR))}.mp3"
            audio_path = os.path.join(AUDIO_DIR, filename)
            await generate_speech(response_text, audio_path)
            response_data["audio_url"] = f"/get_audio/{filename}"
        
        return response_data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        # Cleanup temp files
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(temp_dir):
            os.rmdir(temp_dir)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_MIME_TYPES = {'image/png', 'image/jpeg', 'image/gif'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.post("/image_convo")
async def image_conversation(
    image_file: UploadFile = File(None),
    image_url: Optional[str] = Form(None),
    mode: str = Form("text"),
    question: Optional[str] = Form(None),
    audio_file_path: Optional[str] = Form(None),
    speak: bool = Form(False),
    memory: List[str] = Depends(get_memory)
):
    # Validate we have either a file or URL
    if not image_file and not image_url:
        raise HTTPException(status_code=400, detail="Either image_file or image_url must be provided")

    try:
        # Handle image source (file upload or URL)
        if image_file:
            contents = await image_file.read()
            img = Image.open(io.BytesIO(contents))
        else:
            img_response = requests.get(image_url, stream=True, timeout=10)
            img_response.raise_for_status()
            img = Image.open(io.BytesIO(img_response.content))

        # Process based on mode
        if mode == "text":
            if not question:
                raise HTTPException(status_code=400, detail="Question is required in text mode")
            
            update_memory(f"User: {question}")
            context = "\n".join(memory)
            full_query = f"{context}\nCurrent Question: {question}"
            
            response_text = gemini_chat_model(full_query, img)
            update_memory(f"Assistant: {response_text}")
            
        else:  # voice mode
            if not audio_file_path:
                raise HTTPException(status_code=400, detail="audio_file_path is required in voice mode")
            
            try:
                question = process_user_voice(audio_file_path)
                if not question:
                    raise HTTPException(status_code=400, detail="Speech not recognized or empty response")
                
                update_memory(f"User: {question}")
                context = "\n".join(memory)
                full_query = f"{context}\nCurrent Question: {question}"
                
                response_text = gemini_chat_model(full_query, img)
                update_memory(f"Assistant: {response_text}")
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")

        return await process_response(question if question else "Image query", response_text, speak)

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Image download failed: {str(e)}")
    except IOError as e:
        raise HTTPException(status_code=400, detail=f"Image loading failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.post("/pdf_convo")
async def pdf_conversation(request_data: PDFConversationRequest):
    file_source = request_data.file_source
    mode = request_data.mode
    audio_file_path = request_data.audio_file_path
    question = request_data.question
    speak_response = request_data.speak

    if os.path.isfile(file_source):
        pdf_loader = PyPDFLoader(file_source)
        pages = pdf_loader.load_and_split()
    else:
        pdf_response = requests.get(file_source, stream=True)
        if pdf_response.status_code == 200:
            with tempfile.NamedTemporaryFile(delete=False) as temp_pdf:
                temp_pdf.write(pdf_response.content)
                pdf_loader = PyPDFLoader(temp_pdf.name)
                pages = pdf_loader.load_and_split()
        else:
            raise HTTPException(status_code=pdf_response.status_code, detail="Error downloading PDF")

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    context = "\n\n".join(str(p.page_content) for p in pages)
    texts = text_splitter.split_text(context)

    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)
    vector_index = Chroma.from_texts(texts, embeddings).as_retriever(search_kwargs={"k": 5})

    model = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=GOOGLE_API_KEY, temperature=0.2)
    qa_chain = RetrievalQA.from_chain_type(
        model, retriever=vector_index, return_source_documents=False
    )

    prompt_template = """
    You are Khedr, an intelligent and knowledgeable AI assistant specializing in smart agriculture...
    """
    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
    full_prompt = prompt + "\n" + "\n".join(memory)

    stuff_chain = load_qa_chain(model, chain_type="stuff", prompt=full_prompt)
    
    if mode == "text":
        if not question:
            raise HTTPException(status_code=400, detail="Please provide a question in text mode.")
    elif mode == "voice":
        question = process_user_voice()
        if not question:
            raise HTTPException(status_code=400, detail="Speech not recognized.")
    else:
        raise HTTPException(status_code=400, detail="Invalid mode. Choose 'text' or 'voice'.")
    
    memory.append(f"User: {question}")
    
    result = stuff_chain.invoke({"input_documents": pages, "question": question}, return_only_outputs=True)
    memory.append(f"answer: {result['output_text']}")
    response_text = result['output_text']
    return await process_response(question, response_text, speak_response)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000, help="Port to run the API on. Defaults to 5110.")
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host to run the UI on. Defaults to 0.0.0.0 to make the UI externally accessible from other devices.",
    )
    args = parser.parse_args()

    logging.basicConfig(
        format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s", level=logging.INFO
    )
    uvicorn.run(app, host=args.host, port=args.port)