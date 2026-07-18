import os
from sqlalchemy.orm import Session
from backend.models import TaskLog, Source
from backend.tools.pdf_parser import parse_pdf
from backend.tools.vector_store import LocalVectorStore
from backend.config import settings

def run_pdf_reader(project_id: int, db: Session) -> list:
    """
    Scans project directory for PDFs, chunks and vectorizes them.
    If no PDFs are present, creates a sample PDF about the topic for demo purposes.
    """
    def log_step(step_name: str, message: str, status: str = "info"):
        log = TaskLog(
            project_id=project_id,
            agent_name="PDF Reader Agent",
            step_name=step_name,
            log_message=message,
            status=status
        )
        db.add(log)
        db.commit()

    log_step("Initialize Reader", "Scanning workspace for uploaded PDF papers.", "running")

    # Locate project upload folder
    project_upload_dir = os.path.join(settings.DATA_DIR, "uploads", f"project_{project_id}")
    os.makedirs(project_upload_dir, exist_ok=True)

    # Check for PDFs
    pdf_files = [f for f in os.listdir(project_upload_dir) if f.endswith(".pdf")]

    # Demo mode fallback: Create a dummy PDF if none exists
    if not pdf_files:
        log_step("Initialize Reader", "No uploaded PDFs found. Generating a sample IEEE research paper for demonstration.", "info")
        sample_pdf_path = os.path.join(project_upload_dir, "ieee_sample_paper.pdf")
        
        # Build simple PDF text and create using ReportLab if available, or just a mock file
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
            
            doc = SimpleDocTemplate(sample_pdf_path, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []
            
            title = "A Survey of Agentic Architectures in Safety-Critical Environments"
            author = "Dr. Jane Doe, IEEE Fellow"
            abstract = (
                "Abstract—Autonomous agents powered by Large Language Models (LLMs) represent a significant departure "
                "from traditional sequential pipelines. This paper explores the deployment of multi-agent cyclic workflows "
                "in safety-critical environments such as clinical healthcare and diagnostics. We evaluate state tracking, "
                "reflective feedback systems, and automatic schema validation. Preliminary clinical trials indicate that "
                "agentic diagnostics achieve high alignment with human practitioners but require real-time validation layers."
            )
            body = (
                "I. INTRODUCTION\n\n"
                "Artificial Intelligence in health systems has transitioned from classification networks to cognitive workflows. "
                "Agentic architectures permit the LLM to write code, select tools, and self-correct via loops. However, clinical "
                "integration demands safety assurances. Conflicting facts (e.g. drug dosage contradictions) must be flagged "
                "immediately. Traditional RAG systems fetch raw articles, but lack verification layers to filter noisy claims. "
                "We propose an active Fact-Checking node to dynamically resolve contradictions before compiling report summaries."
            )
            
            story.append(Paragraph(title, styles['Title']))
            story.append(Spacer(1, 10))
            story.append(Paragraph(author, styles['Normal']))
            story.append(Spacer(1, 20))
            story.append(Paragraph(abstract, styles['BodyText']))
            story.append(Spacer(1, 20))
            story.append(Paragraph(body, styles['BodyText']))
            
            doc.build(story)
            pdf_files.append("ieee_sample_paper.pdf")
            log_step("Initialize Reader", "Successfully generated sample paper 'ieee_sample_paper.pdf'.", "info")
        except Exception as ex:
            log_step("PDF Creation Failed", f"Could not build demo PDF: {ex}. Continuing with web sources.", "info")

    new_sources = []
    vector_store = LocalVectorStore(project_id=project_id)

    for pdf_file in pdf_files:
        pdf_path = os.path.join(project_upload_dir, pdf_file)
        log_step("Parsing PDF", f"Reading and chunking file: {pdf_file}", "running")
        
        try:
            chunks = parse_pdf(pdf_path)
            if not chunks:
                log_step("Parsing PDF", f"No text could be extracted from {pdf_file}.", "error")
                continue

            # Add to local vector database
            log_step("Vector Indexing", f"Vectorizing {len(chunks)} text chunks using embedding client.", "running")
            vector_store.add_chunks(chunks)
            
            # Save a master database Source for the file
            # Store first chunk as sample preview
            preview_content = chunks[0]["text"] if chunks else ""
            source = Source(
                project_id=project_id,
                title=f"Paper: {pdf_file}",
                url=f"local://uploads/{pdf_file}",
                content=preview_content,
                source_type="pdf",
                confidence="High"
            )
            db.add(source)
            new_sources.append(source)
            log_step("Parsing PDF", f"Successfully indexed {pdf_file} in vector database.", "completed")
            
        except Exception as e:
            log_step("Parsing Failed", f"Failed to parse PDF {pdf_file}: {e}", "error")

    # Persist the vector store to file
    vector_store.save(settings.DATA_DIR)
    db.commit()
    
    log_step("PDF Reading Completed", f"Successfully indexed {len(new_sources)} PDF sources.", "completed")
    return new_sources
