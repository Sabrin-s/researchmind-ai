import gradio as gr
from backend.api import app as fastapi_app

# Mount FastAPI inside Gradio — this is the standard pattern for
# running FastAPI on Hugging Face Spaces (Gradio SDK) for free.
app = gr.mount_gradio_app(
    gr.Blocks(),
    fastapi_app,
    path="/api"
)

# Simple Gradio UI that shows API info
with gr.Blocks(title="ResearchMind API") as demo:
    gr.Markdown("""
    # 🧠 ResearchMind — Multi-Agent AI Research Assistant API
    
    **This is the backend API server.**
    
    ### Endpoints:
    - `POST /api/projects` — Create a new research project
    - `GET /api/projects` — List all projects
    - `GET /api/projects/{id}` — Get project details & report
    - `GET /api/projects/{id}/logs/stream` — Real-time agent logs (SSE)
    - `POST /api/projects/{id}/qa` — Ask questions about the report
    - `GET /api/reports/{id}/download/{format}` — Download PDF/DOCX/MD
    
    ### Documentation:
    Visit `/api/docs` for interactive Swagger documentation.
    """)

app = gr.mount_gradio_app(demo, fastapi_app, path="/api")

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
