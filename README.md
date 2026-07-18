# ResearchMind: Multi-Agent AI Research Assistant

ResearchMind is an autonomous multi-agent research assistant designed to search, analyze, verify, and write structured research reports on any given topic.

## System Architecture

The application coordinates six specialized agents:
1. **Planner Agent**: Formulates a structured research layout.
2. **Web Research Agent**: Crawls/searches the web for articles and publications.
3. **PDF Reader Agent**: Parses research papers, chunks text, and stores them in a local vector database.
4. **Fact Checker Agent**: Cross-verifies facts across multiple sources and computes evidence confidence.
5. **Citation Verifier Agent**: Formats citations in APA, IEEE, or MLA styles.
6. **Report Writer Agent**: Generates a unified Markdown report, exports to PDF and Word DOCX formats.

## Setup Instructions

### Backend (FastAPI)
1. Navigate to the `backend/` directory.
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r ../requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn api:app --reload --port 8000
   ```

### Frontend (React + Vite)
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
