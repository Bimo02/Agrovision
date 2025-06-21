import logging
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from typing import List, Tuple, Dict, Any
from langchain.docstore.document import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.text_splitter import Language, RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from chromadb.config import Settings
from langchain_community.document_loaders import (
    CSVLoader, UnstructuredMarkdownLoader, TextLoader,
    UnstructuredExcelLoader, Docx2txtLoader, UnstructuredPowerPointLoader,
    UnstructuredImageLoader
)
from langchain_unstructured import UnstructuredLoader

# Configure logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("file_ingest.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

# Constants
SOURCE_DIRECTORY = "SOURCE_DOCUMENTS/"
PERSIST_DIRECTORY = "DB/"
MAX_WORKERS = os.cpu_count() * 2  
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

CHROMA_SETTINGS = Settings(
    anonymized_telemetry=False,
    is_persistent=True,
)

# Document loaders mapping - loader class, loader args
DOCUMENT_MAP: Dict[str, Tuple[Any, Dict[str, Any]]] = {
    ".pdf": (UnstructuredLoader, {"mode": "elements"}), 
    ".txt": (TextLoader, {}),
    ".md": (UnstructuredMarkdownLoader, {}),
    ".py": (TextLoader, {}),
    ".csv": (CSVLoader, {}),
    ".xls": (UnstructuredExcelLoader, {}),
    ".xlsx": (UnstructuredExcelLoader, {}),
    ".docx": (Docx2txtLoader, {}),
    ".doc": (Docx2txtLoader, {}),
    ".pptx": (UnstructuredPowerPointLoader, {}),
    ".ppt": (UnstructuredPowerPointLoader, {}),
    ".png": (UnstructuredImageLoader, {}),
    ".jpg": (UnstructuredImageLoader, {}),
    ".jpeg": (UnstructuredImageLoader, {}),
}

def load_single_document(file_path: str) -> List[Document]:
    """Load a document with error handling."""
    try:
        file_extension = os.path.splitext(file_path)[1]
        loader_class, loader_args = DOCUMENT_MAP.get(file_extension, (None, None))

        if not loader_class:
            logging.warning(f"Unsupported file type: {file_path}")
            return []

        logging.info(f"Loading {file_path}")
        loader = loader_class(file_path, **loader_args)
        docs = loader.load()

        if not docs:
            logging.warning(f"Empty document: {file_path}")
            return []

        # Ensure metadata includes the source file path
        for doc in docs:
            if "source" not in doc.metadata:
                doc.metadata["source"] = file_path

        return docs  # Return all documents (some loaders return multiple)
    except Exception as e:
        logging.error(f"Failed to load {file_path}: {str(e)}")
        return []

def clean_metadata(doc: Document) -> Document:
    """Ensure metadata contains only valid ChromaDB-compatible types."""
    if isinstance(doc, Document) and isinstance(doc.metadata, dict):
        doc.metadata = {
            k: (str(v) if isinstance(v, (list, tuple, dict)) else v) 
            for k, v in doc.metadata.items() if isinstance(v, (str, int, float, bool, list, tuple, dict))
        }
    return doc

def load_documents(source_dir: str) -> List[Document]:
    """Load all documents using ThreadPoolExecutor."""
    paths = [
        os.path.join(root, file_name)
        for root, _, files in os.walk(source_dir)
        for file_name in files if os.path.splitext(file_name)[1] in DOCUMENT_MAP
    ]

    if not paths:
        logging.warning("No valid documents found.")
        return []

    all_docs = []
    with ThreadPoolExecutor(min(len(paths), MAX_WORKERS)) as executor:
        results = executor.map(load_single_document, paths)
        for docs in results:
            all_docs.extend(docs)

    return all_docs

def split_documents(documents: List[Document]) -> List[Document]:
    """Split documents into chunks using appropriate text splitters."""
    text_docs = []
    python_docs = []

    for doc in documents:
        if isinstance(doc, Document) and "source" in doc.metadata:
            ext = os.path.splitext(doc.metadata["source"])[1]
            if ext == ".py":
                python_docs.append(doc)
            else:
                text_docs.append(doc)

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    python_splitter = RecursiveCharacterTextSplitter.from_language(
        language=Language.PYTHON, chunk_size=CHUNK_SIZE - 120, chunk_overlap=CHUNK_OVERLAP
    )

    # Split documents
    text_chunks = text_splitter.split_documents(text_docs)
    python_chunks = python_splitter.split_documents(python_docs)

    return text_chunks + python_chunks

def main():
    """Main processing pipeline."""
    logging.info("Starting ingestion pipeline")

    # Load documents
    documents = load_documents(SOURCE_DIRECTORY)
    logging.info(f"Loaded {len(documents)} documents")

    # Clean the loaded documents
    documents = [clean_metadata(doc) for doc in documents]
    logging.info("Cleaning all documents metadata")

    # Split documents into chunks
    chunked_documents = split_documents(documents)
    logging.info(f"Split into {len(chunked_documents)} chunks")

    # Create embeddings & store in ChromaDB
    logging.info("Creating embeddings...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

    logging.info("Creating Chroma database...")
    try:
        Chroma.from_documents(
            documents=chunked_documents,
            embedding=embeddings,
            persist_directory=PERSIST_DIRECTORY,
            client_settings=CHROMA_SETTINGS
        )
        logging.info("Successfully stored embeddings in ChromaDB.")
    except Exception as e:
        logging.error(f"Failed to create ChromaDB vector store: {e}")
        logging.error("Check your ChromaDB installation, permissions, or try a different persist directory.")
        sys.exit(1)

    logging.info("Ingestion complete. Data stored in ChromaDB.")

if __name__ == "__main__":
    main()