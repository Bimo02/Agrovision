import logging
import os
import uuid
import argparse
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from fastapi.responses import JSONResponse

import requests
from PIL import Image
import io
import tempfile

from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.chains.question_answering import load_qa_chain

from gemini import GOOGLE_API_KEY, gemini_chat_model, identify_url_content
from SpeechRecognition import process_user_voice, voice
from gemini_data_chat import retrieval_qa_pipline
#from upload_audio_file import get_firebase_url, upload_to_firebase
from gemini import memory

app = FastAPI()

class TextRequest(BaseModel):
    query: str
    speak: Optional[bool] = False

class VoiceRequest(BaseModel):
    audio_file_path: str
    speak: Optional[bool] = False

class ImageRequest(BaseModel):
    image_source: str
    mode: Optional[str] = "text"
    question: Optional[str] = None
    audio_file_path: Optional[str] = None
    speak: Optional[bool] = False

class PDFRequest(BaseModel):
    file_source: str
    mode: Optional[str] = "text"
    question: Optional[str] = None
    audio_file_path: Optional[str] = None
    speak: Optional[bool] = False

def process_response(query, convo, speak_response):
    response_data = {"Question": query, "Answer": convo}
    # if speak_response:
    #     audio_filename = f"{uuid.uuid4()}.mp3"
    #     audio_path = f"speak_audio_file/{audio_filename}"
    #     audio_filename = voice(convo, audio_filename)
    #     upload_to_firebase(audio_filename, audio_path)
    #     firebase_url = get_firebase_url(audio_path)
    #     os.remove(audio_filename)
    #     response_data["audio_url"] = firebase_url
    # return JSONResponse(content=response_data)

@app.post("/text_convo")
def text_conversation(request: TextRequest):
    query = request.query
    speak_response = request.speak

    if query.startswith('http'):
        content_type = identify_url_content(query)
        if content_type == 'image':
            return image_conversation(ImageRequest(image_source=query))
        elif content_type == 'pdf':
            return pdf_conversation(PDFRequest(file_source=query))
    
    qa = retrieval_qa_pipline()
    res = qa.invoke({"query": query})
    answer = res["result"]
    memory.append(f"answer: {answer}")
    
    if answer.lower() == 'answer is not available in the context':
        convo = gemini_chat_model(query)
        return {"Question": query, "Answer": convo}

    return {"Question": query, "Answer": answer}

@app.post("/voice_convo")
def voice_conversation(request: VoiceRequest):
    query = process_audio_path(request.audio_file_path)
    if not query:
        raise HTTPException(status_code=400, detail="No input detected. Please try again.")
    return text_conversation(TextRequest(query=query, speak=request.speak))

@app.post("/image_convo")
def image_conversation(request: ImageRequest):
    image_source = request.image_source
    mode = request.mode
    question = request.question
    speak_response = request.speak
    
    img = None
    if image_source.startswith('http'):
        response = requests.get(image_source)
        if response.status_code == 200:
            img = Image.open(io.BytesIO(response.content))
        else:
            raise HTTPException(status_code=500, detail="Error downloading image")
    elif os.path.isfile(image_source):
        img = Image.open(image_source)
    else:
        raise HTTPException(status_code=400, detail="Invalid image path")
    
    if mode == "text" and question:
        response_text = gemini_chat_model(question, img)
    elif mode == "voice" and request.audio_file_path:
        #question = process_audio_path(request.audio_file_path)
        response_text = gemini_chat_model(question, img)
    else:
        raise HTTPException(status_code=400, detail="Invalid mode or missing question.")
    
    return process_response(question, response_text, speak_response)

@app.post("/pdf_convo")
def pdf_conversation(request: PDFRequest):
    file_source = request.file_source
    mode = request.mode
    question = request.question
    speak_response = request.speak
    
    if os.path.isfile(file_source):
        pdf_loader = PyPDFLoader(file_source)
        pages = pdf_loader.load_and_split()
    else:
        response = requests.get(file_source, stream=True)
        if response.status_code == 200:
            with tempfile.NamedTemporaryFile(delete=False) as temp_pdf:
                temp_pdf.write(response.content)
                pdf_loader = PyPDFLoader(temp_pdf.name)
                pages = pdf_loader.load_and_split()
        else:
            raise HTTPException(status_code=500, detail="Error downloading PDF")
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    context = "\n\n".join(str(p.page_content) for p in pages)
    texts = text_splitter.split_text(context)
    
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)
    vector_index = Chroma.from_texts(texts, embeddings).as_retriever(search_kwargs={"k": 5})
    
    model = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=GOOGLE_API_KEY, temperature=0.2)
    qa_chain = RetrievalQA.from_chain_type(model, retriever=vector_index, return_source_documents=False)
    
    # if mode == "voice" and request.audio_file_path:
    #     #question = process_audio_path(request.audio_file_path)
    # elif not question:
    #     raise HTTPException(status_code=400, detail="Please provide a question.")
    
    result = qa_chain.invoke({"query": question})
    response_text = result["result"]
    return process_response(question, response_text, speak_response)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5110, help="Port to run the API on.")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to run the API on.")
    args = parser.parse_args()
    import uvicorn
    uvicorn.run(app, host=args.host, port=args.port)
