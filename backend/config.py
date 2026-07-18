import os

try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        BaseSettings = object

class Settings(BaseSettings if isinstance(BaseSettings, type) else object):
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    
    # Run mode
    # If API keys are missing, default to mock/demo mode to ensure usability
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'data', 'researchmind.db')}")
    REPORTS_DIR: str = os.path.join(BASE_DIR, "reports")
    DATA_DIR: str = os.path.join(BASE_DIR, "data")

settings = Settings()

# Ensure directories exist
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.DATA_DIR, exist_ok=True)
