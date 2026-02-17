from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from app.core.config import settings
import os
import shutil
from datetime import datetime

def ingest_document(file_path: str, original_filename: str):
    """Ingests a document into the ChromaDB vector store and saves the file."""
    
    # Create uploads directory if it doesn't exist
    os.makedirs(settings.UPLOADS_DIRECTORY, exist_ok=True)
    
    # Save the file to uploads directory
    save_path = os.path.join(settings.UPLOADS_DIRECTORY, original_filename)
    shutil.copy(file_path, save_path)
    
    if file_path.endswith(".pdf"):
        loader = PyPDFLoader(file_path)
    else:
        loader = TextLoader(file_path)
        
    documents = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(documents)
    
    vectorstore = Chroma(
        persist_directory=settings.CHROMA_PERSIST_DIRECTORY,
        embedding_function=GoogleGenerativeAIEmbeddings(google_api_key=settings.GEMINI_API_KEY, model="models/embedding-001")
    )
    
    vectorstore.add_documents(documents=splits)
    
    return len(splits)

def get_uploaded_files():
    """Returns list of uploaded files with metadata."""
    os.makedirs(settings.UPLOADS_DIRECTORY, exist_ok=True)
    
    files = []
    for filename in os.listdir(settings.UPLOADS_DIRECTORY):
        file_path = os.path.join(settings.UPLOADS_DIRECTORY, filename)
        if os.path.isfile(file_path):
            size = os.path.getsize(file_path)
            modified_time = os.path.getmtime(file_path)
            files.append({
                "name": filename,
                "size": size,
                "modified": modified_time,
                "url": f"/uploads/{filename}"
            })
    
    return sorted(files, key=lambda x: x['modified'], reverse=True)
