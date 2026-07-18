import os
import json
import asyncio
import requests
from typing import List
from fastapi import FastAPI, Depends, BackgroundTasks, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.config import settings
from backend.database import engine, Base, get_db
from backend.models import Project, Source, Report, TaskLog, ChatMessage
from backend.graph import run_research_workflow
from backend.tools.vector_store import LocalVectorStore
from backend.tools.embeddings import EmbeddingClient

# Initialize SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ResearchMind API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas
class ProjectCreate(BaseModel):
    topic: str
    citation_style: str = "IEEE"

class QAQuery(BaseModel):
    question: str

@app.get("/")
def read_root():
    return {"message": "Welcome to ResearchMind Multi-Agent API"}

@app.get("/projects")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return projects

@app.post("/projects")
def create_project(payload: ProjectCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not payload.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
        
    project = Project(
        topic=payload.topic,
        citation_style=payload.citation_style,
        demo_mode=settings.DEMO_MODE,
        status="pending"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Initial log
    log = TaskLog(
        project_id=project.id,
        agent_name="System",
        step_name="Project Created",
        log_message="Project initialized. Ready to execute multi-agent research.",
        status="info"
    )
    db.add(log)
    db.commit()

    # Trigger background workflow execution
    background_tasks.add_task(run_workflow_wrapper, project.id)

    return project

def run_workflow_wrapper(project_id: int):
    # Retrieve fresh session
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        run_research_workflow(project_id, db)
    finally:
        db.close()

@app.get("/projects/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    report = db.query(Report).filter_by(project_id=project_id).first()
    sources = db.query(Source).filter_by(project_id=project_id).all()
    messages = db.query(ChatMessage).filter_by(project_id=project_id).all()
    
    return {
        "project": project,
        "report": report,
        "sources": sources,
        "messages": messages
    }

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete uploaded files directory
    project_upload_dir = os.path.join(settings.DATA_DIR, "uploads", f"project_{project_id}")
    if os.path.exists(project_upload_dir):
        try:
            import shutil
            shutil.rmtree(project_upload_dir)
        except Exception as e:
            print(f"Could not remove uploads: {e}")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}

@app.post("/projects/{project_id}/upload-pdf")
async def upload_pdf(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    upload_dir = os.path.join(settings.DATA_DIR, "uploads", f"project_{project_id}")
    os.makedirs(upload_dir, exist_ok=True)

    dest_path = os.path.join(upload_dir, file.filename)
    with open(dest_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {"message": f"Successfully uploaded {file.filename}"}

@app.get("/projects/{project_id}/logs/stream")
def stream_logs(project_id: int, db: Session = Depends(get_db)):
    """
    Server-Sent Events (SSE) endpoint to stream execution logs in real-time.
    """
    async def log_generator():
        last_log_id = 0
        while True:
            # Query db session for new logs
            # We open a fresh connection inside the loop to avoid threading issues
            from backend.database import SessionLocal
            session = SessionLocal()
            try:
                new_logs = session.query(TaskLog).filter(
                    TaskLog.project_id == project_id,
                    TaskLog.id > last_log_id
                ).order_by(TaskLog.timestamp.asc()).all()

                for log in new_logs:
                    last_log_id = log.id
                    log_data = {
                        "id": log.id,
                        "agent_name": log.agent_name,
                        "step_name": log.step_name,
                        "log_message": log.log_message,
                        "status": log.status,
                        "timestamp": log.timestamp.isoformat()
                    }
                    yield f"data: {json.dumps(log_data)}\n\n"

                # Check if project has completed or failed
                project = session.query(Project).filter_by(id=project_id).first()
                if project and project.status in ("completed", "failed"):
                    # Send final completion message then break
                    yield f"data: {json.dumps({'status': 'done', 'project_status': project.status})}\n\n"
                    break
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                break
            finally:
                session.close()
                
            await asyncio.sleep(1.0) # sleep 1 second before checking for new logs

    return StreamingResponse(log_generator(), media_type="text/event-stream")

@app.post("/projects/{project_id}/qa")
def ask_question(project_id: int, payload: QAQuery, db: Session = Depends(get_db)):
    """
    RAG-based Question Answering endpoint scoped to the project's vector store and web references.
    """
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Save user message
    user_msg = ChatMessage(project_id=project_id, sender="user", message=payload.question)
    db.add(user_msg)
    db.commit()

    # Retrieve context from local vector store
    vector_store = LocalVectorStore(project_id=project_id)
    vector_store.load(settings.DATA_DIR)
    matches = vector_store.search(payload.question, limit=3)
    
    context_chunks = []
    for chunk, score in matches:
        context_chunks.append(f"[{chunk.get('source', 'Doc')} (Page {chunk.get('page', 1)})] ...{chunk['text']}...")

    # Also grab top web sources
    web_sources = db.query(Source).filter_by(project_id=project_id, source_type="web").limit(3).all()
    for s in web_sources:
        context_chunks.append(f"[Web: {s.title} ({s.url})] ...{s.content[:300]}...")

    context = "\n\n".join(context_chunks)

    # Call OpenAI if available
    reply_text = ""
    if settings.OPENAI_API_KEY and not settings.DEMO_MODE:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
            }
            prompt = f"""
            You are a helpful Research Assistant for the project topic: "{project.topic}".
            The user is asking: "{payload.question}"

            Here is the retrieved context from web reports and uploaded papers:
            {context}

            Provide a clear, accurate, and concise answer based strictly on the context. Cite the documents and web sources where appropriate.
            """
            chat_payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.4
            }
            res = requests.post(url, json=chat_payload, headers=headers, timeout=15)
            if res.status_code == 200:
                reply_text = res.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"OpenAI QA failed: {e}")

    # Fallback/Offline QA response incorporating vector search match preview
    if not reply_text:
        if matches:
            top_match = matches[0][0]
            reply_text = (
                f"Based on your local indexed source **{top_match.get('source', 'document')}** (Page {top_match.get('page', 1)}): \n\n"
                f"\"{top_match['text'][:400]}...\"\n\n"
                f"This matches your question with a cosine similarity score of {matches[0][1]:.3f}."
            )
        else:
            reply_text = (
                f"I parsed your question \"{payload.question}\" but could not locate specific references "
                f"in the vector search chunks. Here is a generic summary based on the web research sources:\n\n"
                f"Web sources indicate that {project.topic} involves cyclic planning, multi-agent frameworks, and validation. "
                f"Please verify if your API keys are set for deeper generative answers."
            )

    # Save assistant message
    bot_msg = ChatMessage(project_id=project_id, sender="assistant", message=reply_text)
    db.add(bot_msg)
    db.commit()

    return bot_msg

@app.get("/reports/{project_id}/download/{file_format}")
def download_report(project_id: int, file_format: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter_by(project_id=project_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    file_path = None
    media_type = "application/octet-stream"
    filename = ""

    if file_format.lower() == "pdf":
        file_path = report.pdf_path
        media_type = "application/pdf"
        filename = f"report_project_{project_id}.pdf"
    elif file_format.lower() == "docx":
        file_path = report.docx_path
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"report_project_{project_id}.docx"
    elif file_format.lower() == "md":
        # Write markdown on the fly to download
        temp_md_path = os.path.join(settings.REPORTS_DIR, f"project_{project_id}_report.md")
        with open(temp_md_path, "w", encoding="utf-8") as f:
            f.write(report.content)
        file_path = temp_md_path
        media_type = "text/markdown"
        filename = f"report_project_{project_id}.md"
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Supported formats: pdf, docx, md")

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested file format does not exist on disk.")

    return FileResponse(file_path, media_type=media_type, filename=filename)
