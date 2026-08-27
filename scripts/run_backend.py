"""
IBVAP — Run Backend Server
Usage: python scripts/run_backend.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

if __name__ == "__main__":
    import uvicorn
    print("[IBVAP] Starting backend server on http://0.0.0.0:8000")
    print("[IBVAP] WebSocket: ws://localhost:8000/ws/analytics")
    print("[IBVAP] Docs: http://localhost:8000/docs")
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
