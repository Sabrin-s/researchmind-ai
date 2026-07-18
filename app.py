import os
import sys

# Ensure correct path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set demo mode
os.environ["DEMO_MODE"] = "true"

import uvicorn
from backend.api import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
