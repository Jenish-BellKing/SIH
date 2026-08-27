"""
IBVAP — FastAPI Backend Entry Point
Run: python -m backend.main   or   uvicorn backend.main:app --reload
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router
from backend.database import db
from backend import config


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(
    title="IBVAP Backend Prototype",
    description="Intelligent Border Video Analytics Platform — AI + Backend API",
    version=config.VERSION,
    lifespan=lifespan,
)

# CORS — allow Team 2 frontend on any local port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
