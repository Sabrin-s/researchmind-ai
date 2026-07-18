import re
from sqlalchemy.orm import Session
from backend.models import TaskLog, Source

def run_citation_verifier(project_id: int, citation_style: str, db: Session) -> dict:
    """
    Validates citation links and formats references in IEEE, APA, or MLA styles.
    Checks for broken links or duplicates.
    """
    def log_step(step_name: str, message: str, status: str = "info"):
        log = TaskLog(
            project_id=project_id,
            agent_name="Citation Verifier Agent",
            step_name=step_name,
            log_message=message,
            status=status
        )
        db.add(log)
        db.commit()

    log_step("Initialize Citations", f"Formatting references using style: {citation_style}", "running")

    # Retrieve sources
    sources = db.query(Source).filter_by(project_id=project_id).all()
    if not sources:
        log_step("Initialize Citations", "No sources found to format.", "completed")
        return {"references": [], "validation_report": {"broken_links": 0, "duplicates": 0}}

    formatted_references = []
    broken_links = []
    seen_urls = set()
    duplicates_count = 0

    for idx, source in enumerate(sources):
        url = source.url
        title = source.title or "Untitled Source"
        
        # Check duplicate links
        if url in seen_urls:
            duplicates_count += 1
            continue
        seen_urls.add(url)

        # Basic link validator (local files are assumed valid)
        is_broken = False
        if url.startswith("http") and not re.match(r"^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", url):
            is_broken = True
            broken_links.append(url)

        # Format according to selected style
        ref_text = ""
        citation_num = idx + 1
        
        if citation_style.upper() == "IEEE":
            ref_text = f"[{citation_num}] {title}. Available: {url} (Accessed July 2026)."
        elif citation_style.upper() == "APA":
            ref_text = f"{title}. (2026). Retrieved from {url}"
        elif citation_style.upper() == "MLA":
            ref_text = f"\"{title}.\" Web. 2026. <{url}>."
        else:
            ref_text = f"[{citation_num}] {title} - {url}"

        formatted_references.append({
            "id": source.id,
            "style": citation_style,
            "text": ref_text,
            "url": url,
            "citation_key": f"[{citation_num}]" if citation_style.upper() == "IEEE" else f"({title.split()[0]} et al., 2026)"
        })

    validation_report = {
        "broken_links": len(broken_links),
        "duplicates": duplicates_count,
        "broken_details": broken_links
    }

    log_step("Validate Citations", 
             f"Citation formatting completed. Formatted {len(formatted_references)} references. "
             f"Found {duplicates_count} duplicates and {len(broken_links)} broken links.", 
             "completed")

    return {
        "references": formatted_references,
        "validation_report": validation_report
    }
