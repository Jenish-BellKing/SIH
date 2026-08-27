"""
IBVAP — Intelligent Border Video Analytics Platform
Backend Application Entrypoint
Owned by: Team 1 (AI/ML + Backend - Person B)

Implements all endpoints defined in docs/API_CONTRACT.md v1.0.0.
Data is seeded from scripts/mock_data/ JSON files which represent
schema-compliant detections. When the real AI pipeline is active,
the POST /events endpoint will receive live detections from the
inference engine and populate the events store dynamically.

Endpoints implemented:
  GET  /health
  GET  /cameras
  GET  /analytics/summary
  GET  /events
  GET  /events/{event_id}
  POST /events
  GET  /alerts
  WS   /ws/analytics
"""

import json
import asyncio
import time
import os
from pathlib import Path
from typing import Optional, List, Any, Dict
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# ---------------------------------------------------------------------------
# Application setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="IBVAP Backend API",
    version="1.0.0",
    description="Intelligent Border Video Analytics Platform - Command & Streaming API"
)

START_TIME = time.time()

# Mount test-videos directory for direct video playback
TEST_VIDEOS_PATH = Path(__file__).parent.parent / "test-videos"
if TEST_VIDEOS_PATH.exists():
    app.mount("/test-videos", StaticFiles(directory=str(TEST_VIDEOS_PATH)), name="test-videos")

# CORS configuration — origins aligned with .env.example
CORS_ORIGINS_ENV = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)
CORS_ORIGINS: List[str] = [o.strip() for o in CORS_ORIGINS_ENV.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Seed data loader — reads from scripts/mock_data/ (the team-agreed JSON)
# ---------------------------------------------------------------------------

MOCK_DATA_DIR = Path(__file__).parent.parent / "scripts" / "mock_data"


def _load_json(filename: str) -> Any:
    """Load a JSON file from the mock_data directory; return [] or {} on missing."""
    path = MOCK_DATA_DIR / filename
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _build_events_from_raw() -> List[Dict]:
    """
    Construct the canonical event list from individual detection JSON files.
    Each file represents a different detection type. The resulting list
    follows the SystemEvent envelope defined in docs/EVENT_SCHEMA.md.
    """
    all_events: List[Dict] = []

    humans: List[Dict] = _load_json("human_detections.json")
    for idx, h in enumerate(humans, start=1):
        all_events.append({
            "event_id": f"EVT-H{idx:03d}",
            "event_type": "HUMAN_DETECTION",
            "camera_id": h["camera_id"],
            "timestamp": h["timestamp"],
            "object_type": "person",
            "track_id": h["track_id"],
            "confidence": h["confidence"],
            "severity": "INFO",
            "snapshot": None,
            "metadata": {"bbox": h["bbox"]},
        })

    vehicles: List[Dict] = _load_json("vehicle_detections.json")
    for idx, v in enumerate(vehicles, start=1):
        all_events.append({
            "event_id": f"EVT-V{idx:03d}",
            "event_type": "VEHICLE_DETECTION",
            "camera_id": v["camera_id"],
            "timestamp": v["timestamp"],
            "object_type": "vehicle",
            "track_id": v["track_id"],
            "confidence": v["confidence"],
            "severity": "INFO",
            "snapshot": None,
            "metadata": {
                "vehicle_class": v.get("vehicle_class", "car"),
                "bbox": v["bbox"],
            },
        })

    anprs: List[Dict] = _load_json("anpr_events.json")
    for idx, a in enumerate(anprs, start=1):
        all_events.append({
            "event_id": f"EVT-A{idx:03d}",
            "event_type": "ANPR",
            "camera_id": a["camera_id"],
            "timestamp": a["timestamp"],
            "object_type": "vehicle",
            "track_id": f"V01{idx}",
            "confidence": a["confidence"],
            "severity": "MEDIUM",
            "snapshot": None,
            "metadata": {
                "plate_number": a["plate_number"],
                "vehicle_class": a["vehicle_class"],
            },
        })

    intrusions: List[Dict] = _load_json("intrusion_events.json")
    all_events.extend(intrusions)

    # Sort newest first
    all_events.sort(key=lambda e: e.get("timestamp", ""), reverse=True)
    return all_events


# ---------------------------------------------------------------------------
# In-memory data stores
# Seeded on startup from mock_data/; updated at runtime via POST /events.
# ---------------------------------------------------------------------------

CAMERAS: List[Dict] = _load_json("cameras.json")
ANALYTICS_SUMMARY: Dict = _load_json("analytics_summary.json")
EVENTS: List[Dict] = _build_events_from_raw()
ALERTS: List[Dict] = _load_json("alerts.json")

# ---------------------------------------------------------------------------
# WebSocket Connection Manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str) -> None:
        dead: List[WebSocket] = []
        for ws in self.active_connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()

# Preload WebSocket stream frames for broadcasting
WS_STREAM_FRAMES: List[Dict] = _load_json("websocket_stream.json")

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health", tags=["System"])
def health_check():
    """
    Health check endpoint.
    Defined in docs/API_CONTRACT.md Section 3.1
    """
    uptime = int(time.time() - START_TIME)
    return {
        "status": "healthy",
        "version": "1.0.0",
        "uptime_seconds": uptime,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "services": {
            "database": "connected",
            "websocket": "active",
            "ai_pipeline": "standby",
        },
    }


@app.get("/cameras", tags=["Cameras"])
def get_cameras(status: Optional[str] = Query(None)):
    """
    Retrieve all registered border cameras.
    Defined in docs/API_CONTRACT.md Section 3.2
    """
    cameras = _load_json("cameras.json") or CAMERAS
    if status:
        cameras = [c for c in cameras if c.get("status") == status]
    return cameras


@app.get("/analytics/summary", tags=["Analytics"])
def get_analytics_summary():
    """
    Aggregated high-level counters for the Command Centre dashboard.
    Defined in docs/API_CONTRACT.md Section 3.3
    """
    cameras = _load_json("cameras.json") or CAMERAS
    active = sum(1 for c in cameras if c.get("status") == "online")
    summary = dict(ANALYTICS_SUMMARY)
    summary["active_cameras"] = active
    summary["total_cameras"] = len(cameras)
    return summary


@app.get("/events", tags=["Events"])
def get_events(
    event_type: Optional[str] = Query(None),
    camera_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """
    Query detection and security events with optional filtering.
    Defined in docs/API_CONTRACT.md Section 3.4
    """
    raw_events = _build_events_from_raw()
    # Deduplicate by event_id
    seen_ids = set()
    combined = []
    for e in list(EVENTS) + raw_events:
        eid = e.get("event_id")
        if eid and eid not in seen_ids:
            seen_ids.add(eid)
            combined.append(e)

    filtered = combined
    if event_type:
        filtered = [e for e in filtered if e.get("event_type") == event_type]
    if camera_id:
        filtered = [e for e in filtered if e.get("camera_id") == camera_id]
    if severity:
        filtered = [e for e in filtered if e.get("severity") == severity]
    return filtered[offset: offset + limit]


@app.get("/events/{event_id}", tags=["Events"])
def get_event_by_id(event_id: str):
    """
    Retrieve a single event by ID.
    Defined in docs/API_CONTRACT.md Section 3.4
    """
    for event in list(EVENTS) + _build_events_from_raw():
        if event.get("event_id") == event_id:
            return event
    raise HTTPException(
        status_code=404,
        detail={
            "error": True,
            "code": "RESOURCE_NOT_FOUND",
            "message": f"Event with ID '{event_id}' was not found.",
        },
    )


@app.post("/events", status_code=201, tags=["Events"])
async def create_event(event: dict):
    """
    Ingest an event from the AI inference engine or alert worker.
    Defined in docs/API_CONTRACT.md Section 3.4
    Automatically broadcasts the new event over the WebSocket hub.
    """
    if not event.get("event_id"):
        event["event_id"] = f"EVT-{int(time.time() * 1000) % 100000:05d}"

    EVENTS.insert(0, event)

    obj = event.get("object_type", "")
    etype = event.get("event_type", "")
    if obj == "person":
        ANALYTICS_SUMMARY["humans_detected"] = ANALYTICS_SUMMARY.get("humans_detected", 0) + 1
    elif obj == "vehicle":
        ANALYTICS_SUMMARY["vehicles_detected"] = ANALYTICS_SUMMARY.get("vehicles_detected", 0) + 1
    if etype == "ANPR":
        ANALYTICS_SUMMARY["anpr_events"] = ANALYTICS_SUMMARY.get("anpr_events", 0) + 1

    ws_msg = json.dumps({"message_type": "event", "data": event})
    await manager.broadcast(ws_msg)

    return {"status": "success", "event_id": event["event_id"]}


@app.get("/alerts", tags=["Alerts"])
def get_alerts(active_only: bool = Query(False)):
    """
    Retrieve security alerts.
    Defined in docs/API_CONTRACT.md Section 3.5
    """
    alerts = _load_json("alerts.json") or list(ALERTS)
    if active_only:
        alerts = [a for a in alerts if not a.get("acknowledged", False)]
    return alerts


@app.websocket("/ws/analytics")
async def websocket_analytics(websocket: WebSocket):
    """
    Bi-directional real-time analytics WebSocket hub.
    Defined in docs/API_CONTRACT.md Section 4
    Broadcasts precision detection stream frames on a smooth 500ms cycle to all clients.
    """
    await manager.connect(websocket)
    try:
        frame_index = 0
        while True:
            frames = _load_json("websocket_stream.json") or WS_STREAM_FRAMES
            if frames:
                frame = frames[frame_index % len(frames)]
                await websocket.send_text(json.dumps(frame))
                frame_index += 1
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# ---------------------------------------------------------------------------
# Development entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
