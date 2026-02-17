from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from app.core.config import settings

def get_retriever():
    """Returns a retriever from the ChromaDB vector store."""
    
    vectorstore = Chroma(
        persist_directory=settings.CHROMA_PERSIST_DIRECTORY,
        embedding_function=GoogleGenerativeAIEmbeddings(google_api_key=settings.GEMINI_API_KEY, model="models/embedding-001")
    )
    
    # Return as a retriever interface
    return vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 4})
