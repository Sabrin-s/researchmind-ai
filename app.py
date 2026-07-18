import gradio as gr
import os
import sys

# Ensure the app directory is in the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set demo mode for HF Spaces
os.environ["DEMO_MODE"] = "true"

from backend.api import app as fastapi_app

# Simple Gradio UI that shows API info
with gr.Blocks(title="ResearchMind API") as demo:
    gr.Markdown("""
    # 🧠 ResearchMind — Multi-Agent AI Research Assistant API

    **This is the backend API server running on Hugging Face Spaces.**

    ### Endpoints:
    - `POST /api/projects` — Create a new research project
    - `GET /api/projects` — List all projects
    - `GET /api/projects/{id}` — Get project details & report
    - `GET /api/projects/{id}/logs/stream` — Real-time agent logs (SSE)
    - `POST /api/projects/{id}/qa` — Ask questions about the report
    - `GET /api/reports/{id}/download/{format}` — Download PDF/DOCX/MD

    ### Documentation:
    Visit the `/api/docs` path for interactive Swagger documentation.
    """)

# Mount FastAPI under /api
app = gr.mount_gradio_app(demo, fastapi_app, path="/api")

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
