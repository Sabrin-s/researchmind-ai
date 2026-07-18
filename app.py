import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["DEMO_MODE"] = "true"

import gradio as gr
import spaces
from backend.api import app as fastapi_app
import uvicorn

@spaces.GPU
def dummy_gpu_func():
    return "GPU Active"



# Minimal Gradio UI — required so HF Spaces health check passes
with gr.Blocks(title="ResearchMind Backend API") as demo:
    gr.Markdown("""
    # 🧠 ResearchMind — Multi-Agent AI Research Assistant
    **Backend API is running successfully.**

    ### Available API Endpoints:
    - `GET  /`                             — Health check
    - `POST /projects`                     — Start new research
    - `GET  /projects`                     — List all projects  
    - `GET  /projects/{id}`                — Get project + report
    - `GET  /projects/{id}/logs/stream`    — Live agent logs (SSE)
    - `POST /projects/{id}/qa`             — Ask about the report
    - `GET  /reports/{id}/download/{fmt}`  — Download PDF/DOCX/MD
    - `GET  /docs`                         — Swagger API docs
    """)

# Mount Gradio at root so HF health check /info exists
# All our FastAPI routes (/projects, /reports, etc.) remain intact
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
