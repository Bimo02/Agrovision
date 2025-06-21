import os
import logging
from langchain.chains import RetrievalQA
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler  # for streaming response
from langchain.callbacks.manager import CallbackManager

callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])

from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_community.vectorstores import Chroma
from langchain_community.vectorstores.chroma import Chroma
from langchain_chroma import Chroma
from chromadb.config import Settings
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()

GOOGLE_API_KEY = genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

PERSIST_DIRECTORY = "DB/"

CHROMA_SETTINGS = Settings(
    anonymized_telemetry=False,
    is_persistent=True,
)

def retrieval_qa_pipline():
   
    embeddings = GoogleGenerativeAIEmbeddings(model = "models/embedding-001")
    # load the vectorstore
    db = Chroma(
        persist_directory=PERSIST_DIRECTORY,
        embedding_function=embeddings,
        client_settings=CHROMA_SETTINGS
    )
    retriever = db.as_retriever()

    # get the prompt template and memory if set by the user.
    prompt_template = """
   You are Khedr, an intelligent and knowledgeable AI assistant specializing in smart agriculture, crop health, and sustainable farming. Your role is to provide expert, data-driven guidance to farmers and agricultural researchers using AI-powered disease detection models and real-time sensor data from IoT devices.

You communicate fluently in Arabic and English, always responding in the same language as the user's query. Your explanations should be clear, practical, and engaging.

🌱 Areas of Expertise:
✅ Plant Disease Detection – Analyzing leaf images with AI to diagnose diseases and suggest treatments.
✅ Soil Analysis & Optimization – Interpreting sensor data (NPK, moisture, pH, temperature) to provide fertilization and irrigation guidance.
✅ Precision Farming & IoT Integration – Helping users leverage smart sensors and automation to enhance yield.
✅ Weather & Climate Insights – Offering farming recommendations based on weather forecasts.
✅ Sustainable Agriculture – Promoting eco-friendly farming techniques and resource efficiency.

⚠️ Strict Context Adherence
If a query is NOT related to agriculture, farming, or plant health, directly state:
"This question is outside my area of expertise. I can only assist with agriculture-related topics."

If an image is NOT related to farming, state:
"I can only analyze images related to crops, soil, or farming."

If the question is within agriculture but outside your predefined knowledge, state:
"The answer is not available in my current knowledge base."

💡 Response Guidelines:
Language Consistency: Respond in the same language as the user’s query.

Clarity & Practicality: Keep responses friendly, accurate, and useful for real-world farming applications.

No Repetitive Introductions → Only introduce yourself in the first message. Avoid saying "Hello" in every response.

Voice Assistance: Provide voice-based support when needed for better accessibility.

Your mission is to empower farmers with reliable, AI-driven insights, making agriculture more efficient, sustainable, and data-driven."*

    Context:\n {context}?\n
    Question: \n{question}\n

    Answer:
    """
    prompt = PromptTemplate(template = prompt_template, input_variables = ["context", "question"])

    # load the llm pipeline
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.3, LOGGING=logging)
    
    qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",  # try other chains types as well. refine, map_reduce, map_rerank
        retriever=retriever,
        return_source_documents=True,  # verbose=True,
        callbacks=callback_manager,
        chain_type_kwargs={
            "prompt": prompt,
        },
    )

    return qa

def main():

    qa = retrieval_qa_pipline()
    # Interactive questions and answers
    while True:
        query = input("\nEnter a query: ")
        if query == "exit":
            break
        
        # Get the answer from the chain
        res = qa.invoke({"query": query})  # Pass the query as a dictionary
        answer, docs = res["result"], res["source_documents"]

        # Print the result
        print("\n\n> Question:")
        print(query)
        print("\n> Answer:")
        print(answer)

if __name__ == "__main__":
    logging.basicConfig(
        format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s", level=logging.INFO
    )
    main()