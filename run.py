import sys
import uvicorn
import os
from app.config import PORT, HOST

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("=" * 64)
    print("  Starting 90-Day Fat-Loss & Strength Application")
    print(f"  Web UI: http://localhost:{PORT}")
    print("  Database: Connected to MongoDB Atlas")
    print("=" * 64)
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)
