from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv(".env")

class Settings(BaseModel):
    PROJECT_NAME: str = "IntelliDoc AI"
    API_V1_STR: str = "/api/v1"
    
    # Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Vector DB
    CHROMA_PERSIST_DIRECTORY: str = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
    
    # Uploads
    UPLOADS_DIRECTORY: str = os.getenv("UPLOADS_DIRECTORY", "./uploads")
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

settings = Settings()
