import sys

try:
    import fastapi
    print("FastAPI: OK")
except ImportError:
    print("FastAPI: MISSING")

try:
    import uvicorn
    print("Uvicorn: OK")
except ImportError:
    print("Uvicorn: MISSING")

try:
    import sqlalchemy
    print("SQLAlchemy: OK")
except ImportError:
    print("SQLAlchemy: MISSING")

try:
    import reportlab
    print("ReportLab: OK")
except ImportError:
    print("ReportLab: MISSING")

try:
    import docx
    print("python-docx: OK")
except ImportError:
    print("python-docx: MISSING")

try:
    import fitz
    print("PyMuPDF: OK")
except ImportError:
    print("PyMuPDF: MISSING")
