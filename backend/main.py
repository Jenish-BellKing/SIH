"""
IBVAP — Intelligent Border Video Analytics Platform
Backend Application Entrypoint
Owned by: Team 1 (AI/ML + Backend - Person B)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="IBVAP Backend API",
    version="1.0.0",
    description="Intelligent Border Video Analytics Platform - Command & Streaming API"
)

# CORS configuration for Frontend (Team 2)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
def health_check():
    """
    Health check endpoint as defined in docs/API_CONTRACT.md
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "uptime_seconds": 0,
        "timestamp": "2026-08-27T11:30:00Z",
        "services": {
            "database": "connected",
            "websocket": "active",
            "ai_pipeline": "standby"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
