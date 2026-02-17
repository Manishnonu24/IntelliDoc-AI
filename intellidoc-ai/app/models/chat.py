from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None
    
class IngestResponse(BaseModel):
    filename: str
    chunks: int
    message: str
