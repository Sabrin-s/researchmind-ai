from sqlalchemy.orm import Session
from backend.models import TaskLog, Source
from backend.tools.search import web_search

def run_web_research(project_id: int, plan: dict, db: Session) -> list:
    """
    Executes search queries based on the plan sections.
    Retrieves web articles and saves them in the database.
    """
    def log_step(step_name: str, message: str, status: str = "info"):
        log = TaskLog(
            project_id=project_id,
            agent_name="Web Research Agent",
            step_name=step_name,
            log_message=message,
            status=status
        )
        db.add(log)
        db.commit()

    log_step("Initialize Search", "Collecting queries from the plan sections to begin web search.", "running")

    # Gather unique queries
    queries = []
    for section in plan.get("sections", []):
        for q in section.get("queries", []):
            if q not in queries:
                queries.append(q)

    # limit to max 5 queries to prevent excessive rate-limiting or time delays
    active_queries = queries[:5]
    log_step("Initialize Search", f"Extracted {len(active_queries)} search terms: {', '.join(active_queries)}", "info")

    all_sources = []
    
    for query in active_queries:
        log_step("Executing Query", f"Searching for: '{query}'", "running")
        try:
            results = web_search(query, max_results=3)
            for res in results:
                # Basic domain trust assessment
                url = res.get("url", "")
                confidence = "Medium"
                
                # Check for high authority scientific or organization sites
                if any(domain in url for domain in [".gov", ".edu", ".org", "nature.com", "ieee.org", "arxiv.org", "scholar.google"]):
                    confidence = "High"
                elif any(domain in url for domain in ["wikipedia.org", "github.com"]):
                    confidence = "Medium"

                # Check if this URL is already added
                exists = db.query(Source).filter_by(project_id=project_id, url=url).first()
                if not exists:
                    source = Source(
                        project_id=project_id,
                        title=res.get("title", "Untitled Web Resource"),
                        url=url,
                        content=res.get("content", ""),
                        source_type="web",
                        confidence=confidence
                    )
                    db.add(source)
                    all_sources.append(source)
            
            db.commit()
            log_step("Executing Query", f"Query '{query}' completed. Added {len(results)} sources.", "completed")
        except Exception as e:
            log_step("Query Failed", f"Failed to execute query '{query}': {e}", "error")

    log_step("Search Complete", f"Web research completed. Added a total of {len(all_sources)} new sources.", "completed")
    return all_sources
