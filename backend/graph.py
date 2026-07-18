from sqlalchemy.orm import Session
from backend.models import Project, TaskLog
from backend.agents.planner import run_planner
from backend.agents.web_research import run_web_research
from backend.agents.pdf_reader import run_pdf_reader
from backend.agents.fact_checker import run_fact_checker
from backend.agents.citation_agent import run_citation_verifier
from backend.agents.report_writer import run_report_writer

def run_research_workflow(project_id: int, db: Session) -> bool:
    """
    Coordinates the multi-agent research workflow synchronously or as a background task.
    Transitions project status: pending -> researching -> writing -> completed.
    Logs execution steps to the database for real-time SSE streaming.
    """
    def log_global_error(message: str):
        log = TaskLog(
            project_id=project_id,
            agent_name="Orchestrator",
            step_name="Workflow Failure",
            log_message=message,
            status="error"
        )
        db.add(log)
        db.commit()

    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        print(f"Project {project_id} not found.")
        return False

    try:
        # Step 1: Planner Agent
        project.status = "researching"
        db.commit()
        
        plan = run_planner(
            project_id=project_id,
            topic=project.topic,
            db=db
        )
        
        # Step 2: Web Research Agent
        run_web_research(
            project_id=project_id,
            plan=plan,
            db=db
        )
        
        # Step 3: PDF Reader Agent
        run_pdf_reader(
            project_id=project_id,
            db=db
        )
        
        # Step 4: Fact Checker Agent
        project.status = "writing"
        db.commit()
        
        fact_check = run_fact_checker(
            project_id=project_id,
            db=db
        )
        
        # Step 5: Citation Agent
        citations = run_citation_verifier(
            project_id=project_id,
            citation_style=project.citation_style,
            db=db
        )
        
        # Step 6: Report Writer Agent
        run_report_writer(
            project_id=project_id,
            topic=project.topic,
            plan=plan,
            fact_check=fact_check,
            citations=citations,
            db=db
        )
        
        project.status = "completed"
        db.commit()
        return True
        
    except Exception as e:
        project.status = "failed"
        db.commit()
        log_global_error(f"Execution failed during multi-agent pipeline: {str(e)}")
        print(f"Error executing workflow: {e}")
        return False
