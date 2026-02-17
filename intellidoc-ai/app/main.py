from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.agent.graph import app_graph
from app.rag.ingest import ingest_document, get_uploaded_files
from app.models.chat import ChatRequest, IngestResponse
from langchain_core.messages import HumanMessage
import os
import shutil
import json

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/health")
def health_check():
    return {"status": "ok", "app_name": settings.PROJECT_NAME}

@app.post("/ingest", response_model=IngestResponse)
async def ingest_file(file: UploadFile = File(...)):
    temp_file_path = f"temp_{file.filename}"
    try:
        # Create uploads directory if it doesn't exist
        os.makedirs(settings.UPLOADS_DIRECTORY, exist_ok=True)
        
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"Temp file created: {temp_file_path}")
        print(f"Ingesting document: {file.filename}")
        
        chunks = ingest_document(temp_file_path, file.filename)
        
        print(f"Document ingested successfully. Chunks: {chunks}")
        
        return IngestResponse(
            filename=file.filename, 
            chunks=chunks, 
            message="Successfully ingested document"
        )
    except Exception as e:
        print(f"Error during ingest: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/api/v1/files")
async def list_files():
    """Get list of uploaded files"""
    files = get_uploaded_files()
    return {"files": files}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    inputs = {"messages": [HumanMessage(content=request.message)]}
    config = {"configurable": {"thread_id": request.thread_id or "default"}}
    
    async def event_stream():
        async for event in app_graph.astream_events(inputs, config=config, version="v1"):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    yield f"data: {json.dumps({'content': content})}\n\n"
            elif kind == "on_tool_start":
                yield f"data: {json.dumps({'status': 'Searching knowledge base...'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
