import json
from sqlalchemy.orm import Session
import requests
from backend.models import TaskLog
from backend.config import settings

def run_planner(project_id: int, topic: str, db: Session) -> dict:
    """
    Formulates a research plan based on the topic.
    Generates sections and search queries.
    """
    def log_step(step_name: str, message: str, status: str = "info"):
        log = TaskLog(
            project_id=project_id,
            agent_name="Planner Agent",
            step_name=step_name,
            log_message=message,
            status=status
        )
        db.add(log)
        db.commit()

    log_step("Initialize Plan", f"Starting planning phase for topic: '{topic}'", "running")

    # If OpenAI API is active and not in demo mode
    if settings.OPENAI_API_KEY and not settings.DEMO_MODE:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
            }
            prompt = f"""
            You are a research planner. For the research topic: "{topic}", break down the research into 5-7 key logical sections.
            For each section, define:
            1. Title
            2. Research objective/focus
            3. Recommended search query keywords to find sources.

            Return the output in valid JSON format with the schema:
            {{
              "sections": [
                {{"title": "Section Title", "description": "Objective", "queries": ["query 1", "query 2"]}}
              ]
            }}
            Do not include any markdown format tags like ```json in your response, return raw JSON string only.
            """
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2
            }
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            if response.status_code == 200:
                raw_json = response.json()["choices"][0]["message"]["content"].strip()
                # Clean markdown if returned
                if raw_json.startswith("```"):
                    raw_json = raw_json.split("\n", 1)[1].rsplit("\n", 1)[0].strip()
                    if raw_json.startswith("json"):
                        raw_json = raw_json[4:].strip()
                
                plan = json.loads(raw_json)
                log_step("Formulate Plan", f"Successfully structured research plan with {len(plan['sections'])} sections using GPT.", "completed")
                return plan
        except Exception as e:
            log_step("Formulate Plan", f"OpenAI plan generation failed: {e}. Falling back to default planner.", "info")

    # Fallback/Offline plan generator based on topic keywords
    log_step("Formulate Plan", "Formulating deterministic research plan based on topic keywords.", "running")
    
    sections = [
        {
            "title": "Introduction & Historical Context",
            "description": "Definition, origin, and general background of the research subject.",
            "queries": [f"{topic} history", f"what is {topic} definition"]
        },
        {
            "title": "Core Technical Principles",
            "description": "How the technology/concept works, architectures, and key system designs.",
            "queries": [f"{topic} architecture", f"{topic} working principles", f"{topic} core technology"]
        },
        {
            "title": "Practical Applications & Case Studies",
            "description": "Real-world implementations, current use cases, and notable impact analysis.",
            "queries": [f"{topic} applications", f"{topic} case studies", f"{topic} in industry"]
        },
        {
            "title": "Main Challenges & Constraints",
            "description": "Security risks, scalability issues, ethical concerns, or general limitations.",
            "queries": [f"{topic} challenges", f"{topic} limitations", f"{topic} security risks"]
        },
        {
            "title": "Future Horizons & Opportunities",
            "description": "Upcoming research gaps, emerging solutions, and the decade outlook.",
            "queries": [f"{topic} future scope", f"future of {topic}"]
        }
    ]

    plan = {"sections": sections}
    log_step("Formulate Plan", f"Created standard research plan with {len(sections)} sections.", "completed")
    return plan
