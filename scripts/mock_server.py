"""
IBVAP Mock Server
Provides zero-dependency (FastAPI + uvicorn) simulated backend for Team 2 (Frontend)
Serves all mock data endpoints and broadcasts simulated WebSocket detections/alerts.
"""

import json
import asyncio
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="IBVAP Mock Server",
    version="1.0.0",
    description="Mock REST API and WebSocket Server for Frontend Development"
)

# Enable CORS for Next.js frontend running on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_DIR = Path(__file__).parent / "mock_data"


def load_mock(filename: str):
    path = MOCK_DIR / filename
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/health")
def get_health():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "uptime_seconds": 3600,
        "timestamp": "2026-08-27T11:30:00Z",
        "services": {
            "database": "mock_connected",
            "websocket": "mock_active",
            "ai_pipeline": "simulated"
        }
    }


@app.get("/cameras")
def get_cameras(status: Optional[str] = Query(None)):
    cameras = load_mock("cameras.json")
    if status:
        cameras = [c for c in cameras if c.get("status") == status]
    return cameras


@app.get("/analytics/summary")
def get_analytics_summary():
    return load_mock("analytics_summary.json")


@app.get("/events")
def get_events(
    event_type: Optional[str] = Query(None),
    camera_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = 50,
    offset: int = 0
):
    # Combine mock events
    humans = load_mock("human_detections.json")
    vehicles = load_mock("vehicle_detections.json")
    anprs = load_mock("anpr_events.json")
    intrusions = load_mock("intrusion_events.json")

    # Format into standard event envelope if not already formatted
    all_events = []
    
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
            "metadata": {"bbox": h["bbox"]}
        })

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
            "metadata": {"vehicle_class": v.get("vehicle_class", "car"), "bbox": v["bbox"]}
        })

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
            "metadata": {"plate_number": a["plate_number"], "vehicle_class": a["vehicle_class"]}
        })

    all_events.extend(intrusions)

    if event_type:
        all_events = [e for e in all_events if e.get("event_type") == event_type]
    if camera_id:
        all_events = [e for e in all_events if e.get("camera_id") == camera_id]
    if severity:
        all_events = [e for e in all_events if e.get("severity") == severity]

    return all_events[offset : offset + limit]


@app.get("/events/{event_id}")
def get_event_by_id(event_id: str):
    events = get_events(limit=500)
    for e in events:
        if e.get("event_id") == event_id:
            return e
    raise HTTPException(status_code=404, detail=f"Event {event_id} not found")


@app.get("/alerts")
def get_alerts():
    return load_mock("alerts.json")


@app.post("/events", status_code=201)
def create_event(event: dict):
    return {"status": "success", "event_id": event.get("event_id", "EVT-NEW")}


@app.websocket("/ws/analytics")
async def websocket_analytics_endpoint(websocket: WebSocket):
    await websocket.accept()
    stream_frames = load_mock("websocket_stream.json")
    try:
        while True:
            for frame in stream_frames:
                await websocket.send_text(json.dumps(frame))
                await asyncio.sleep(1.5)
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn
    print("Starting IBVAP Mock Server on http://localhost:8000 ...")
    uvicorn.run("mock_server:app", host="0.0.0.0", port=8000, reload=True)
