import logging
import os
import argparse
import uuid
import asyncio
from flask import Flask, request, jsonify , send_from_directory
from werkzeug.utils import secure_filename
# for vision model and images visulization
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

from gemini import GOOGLE_API_KEY, gemini_chat_model, identify_url_content
from SpeechRecognition import recognize_speech, process_user_voice, voice, speek, text_to_speech,generate_speech
from gemini_data_chat import retrieval_qa_pipline
#from upload_audio_file import get_firebase_url, upload_to_firebase
from flask_cors import CORS
from gemini import memory
from werkzeug.utils import secure_filename
import mimetypes
app = Flask(__name__)
CORS(app)
AUDIO_DIR = "audio_responses"
os.makedirs(AUDIO_DIR, exist_ok=True)
def process_response(query, convo, speak_response):
    response = jsonify({"Question": query, "Answer": convo})
    if speak_response:
        filename = secure_filename(f"response_{len(os.listdir(AUDIO_DIR))}.mp3")
        audio_path = os.path.join(AUDIO_DIR, filename)
        asyncio.run(generate_speech(response, audio_path))
        response["audio_url"] = f"/get_audio/{filename}"  # API route for downloading
        # audio_filename = f"{uuid.uuid4()}.mp3" 
        # audio_path = f"speak_audio_file/{audio_filename}"

        # # Generate the audio file
        # audio_filename = voice(convo, audio_filename)

        # # Upload the audio to Firebase Storage
        # upload_to_firebase(audio_filename, audio_path) 

        # # Get the Firebase URL
        # firebase_url = get_firebase_url(audio_path)

        # # Delete the local audio file after upload
        # os.remove(audio_filename)

        # Update the response to include the Firebase URL
        #response = jsonify({"Question": query}, {"Answer": convo}, {"audio_url": firebase_url})\
        return jsonify(response)
    return response
@app.route("/get_audio/<filename>", methods=["GET"])
def get_audio(filename):
    """ API to serve generated audio files """
    return send_from_directory(AUDIO_DIR, filename, as_attachment=True)

@app.route("/text_convo", methods=["POST"])
def text_conversation():
    data = request.get_json()
    query = data.get("query")
    speak_response = data.get("speak", False)

    if query.startswith('http'):
        content_type = identify_url_content(query)
        if content_type == 'image':
            return image_conversation()
        elif content_type == 'pdf':
            return pdf_conversation()
    
    elif isinstance(query, str):
        qa = retrieval_qa_pipline()
        res = qa.invoke({"query": query})
        answer, docs = res["result"], res["source_documents"]
        memory.append(f"answer: {answer}")

        if answer.lower() != 'answer is not available in the context':
             response = process_response(query, answer, speak_response)
        else:
            convo = gemini_chat_model(query)
            response = process_response(query, convo, speak_response)          
    return response

@app.route("/voice_convo", methods=["GET", "POST"])

def voice_conversation():
    """ API endpoint for voice-based chatbot interaction """
    data = request.get_json()
    speak_response = data.get("speak", True)  # Default to speaking response

    # Capture user voice and convert it to text
    query = recognize_speech()
    if not query:
        return jsonify({"text": "No input detected. Please try again."})

    # Process chatbot response
    qa = retrieval_qa_pipline()
    res = qa.invoke({"query": query})
    answer = res["result"]

    if answer.lower() == 'answer is not available in the context':
        convo = gemini_chat_model(query)
        response_text = convo
    else:
        response_text = answer

    # Response object
    response = {"text": response_text}

    # If speech response is required, generate speech
    if speak_response:
        filename = secure_filename(f"response_{len(os.listdir(AUDIO_DIR))}.mp3")
        audio_path = os.path.join(AUDIO_DIR, filename)
        asyncio.run(generate_speech(response_text, audio_path))
        response["audio_url"] = f"/get_audio/{filename}"  # API route for downloading

    return jsonify(response)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_MIME_TYPES = {'image/png', 'image/jpeg', 'image/gif'}

@app.route("/image_convo", methods=["POST"])
def image_conversation():
    # Validate request has JSON data
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    
    # Validate required fields
    required_fields = ['image_source', 'mode']
    if not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing required fields. Required: {required_fields}"}), 400

    # Extract and validate parameters
    image_source = data.get("image_source")
    mode = data.get("mode", "text").lower()  # Default to text mode
    question = data.get("question")
    audio_file_path = data.get("audio_file_path")
    speak_response = data.get("speak", False)

    # Validate mode
    if mode not in ["text", "voice"]:
        return jsonify({"error": "Invalid mode. Choose 'text' or 'voice'."}), 400

    # Mode-specific validation
    if mode == "text" and not question:
        return jsonify({"error": "Question is required in text mode"}), 400
    if mode == "voice" and not audio_file_path:
        return jsonify({"error": "audio_file_path is required in voice mode"}), 400

    try:
        # Handle image source (URL or file path)
        if image_source.startswith(('http://', 'https://')):
            # Download image from URL
            img_response = requests.get(image_source, stream=True, timeout=10)
            img_response.raise_for_status()
            
            # Verify content type
            content_type = img_response.headers.get('content-type')
            if content_type not in ALLOWED_MIME_TYPES:
                return jsonify({"error": f"Unsupported image type: {content_type}"}), 400
            
            img = Image.open(io.BytesIO(img_response.content))
        else:
            # Handle local file path
            if not os.path.isfile(image_source):
                return jsonify({"error": "Image file not found"}), 404
            
            # Verify file extension
            if not allowed_file(image_source):
                return jsonify({"error": "Unsupported file extension"}), 400
            
            # Verify MIME type
            mime_type, _ = mimetypes.guess_type(image_source)
            if mime_type not in ALLOWED_MIME_TYPES:
                return jsonify({"error": f"Unsupported image type: {mime_type}"}), 400
            
            img = Image.open(image_source)

        # Process based on mode
        if mode == "text":
            response_text = gemini_chat_model(question, img)
        else:  # voice mode
            try:
                question = process_user_voice(audio_file_path)
                if not question:
                    return jsonify({"error": "Speech not recognized or empty response"}), 400
                response_text = gemini_chat_model(question, img)
            except Exception as e:
                return jsonify({"error": f"Voice processing failed: {str(e)}"}), 500

        # Generate and return response
        response = process_response(question, response_text, speak_response)
        return response

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Image download failed: {str(e)}"}), 500
    except IOError as e:
        return jsonify({"error": f"Image loading failed: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
@app.route("/pdf_convo", methods=["GET", "POST"])
def pdf_conversation():
    data = request.get_json()
    file_source = data.get("file_source")
    mode = data.get("mode", "text")
    audio_file_path = data.get("audio_file_path")
    question = data.get("question")
    speak_response = data.get("speak", False)

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
            return jsonify({"Error downloading PDF": pdf_response.status_code})

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
    You are Khedr, an intelligent and knowledgeable AI assistant specializing in smart agriculture. You provide expert advice on farming, crop health, soil conditions, and sustainable agricultural practices. Your knowledge is backed by real-time sensor data from IoT devices and AI-driven disease detection models.

You assist farmers and agricultural researchers by answering questions in both Arabic and English, explaining complex concepts in a simple and friendly manner. Your expertise includes:

Plant disease detection: Using AI models trained on leaf images to diagnose and suggest treatments.
Soil analysis & recommendations: Interpreting sensor data (NPK, moisture, pH, temperature) to guide optimal fertilization and irrigation.
Precision farming & IoT integration: Helping users understand how smart sensors and automation can enhance yield.
Weather & climate insights: Advising on best farming practices based on weather conditions.
Sustainable agriculture: Promoting eco-friendly farming techniques and resource efficiency.
Your responses should be engaging, friendly, and practical, always aiming to support farmers in making data-driven decisions. You can also provide voice-based assistance when needed. If the user asks something outside your scope, guide them back to agriculture-related topics."*
    If the query is not about agricultre or the image is not related to farming, please state that you cannot analyze it.
    Context:
    {context}
    Question:
    {question}
    Answer:
    """
    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
    full_prompt = prompt + "\n" + "\n".join(memory)

    stuff_chain = load_qa_chain(model, chain_type="stuff", prompt= full_prompt)
    
    if mode == "text":
        if not question:
            return jsonify({"error": "Please provide a question in text mode."})
    elif mode == "voice":
        question = process_user_voice()
        if not question:
            return jsonify({"error": "Speech not recognized."})
    else:
        return jsonify({"error": "Invalid mode. Choose 'text' or 'voice'."})
    
    memory.append(f"User: {question}")
    
    result = stuff_chain.invoke({"input_documents": pages, "question": question}, return_only_outputs=True)
    memory.append(f"answer: {result['output_text']}")
    response_text = result['output_text']
    response = process_response(question, response_text, speak_response)
    return response
    
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5110, help="Port to run the API on. Defaults to 5110.")
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",  # Change this to 0.0.0.0
        help="Host to run the UI on. Defaults to 0.0.0.0 to make the UI externally accessible from other devices.",
    )
    args = parser.parse_args()

    logging.basicConfig(
        format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s", level=logging.INFO
    )
    app.run(debug=False, host=args.host, port=args.port)
