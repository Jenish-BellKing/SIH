"""
REST + WebSocket routes for the IBVAP backend.
Adheres strictly to docs/API_CONTRACT.md.
"""
from __future__ import annotations
import time
from typing import List, Optional

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from backend import config
from backend.schemas.models import Event, CameraModel, AnalyticsSummary
from backend.database import db
from backend.websocket.manager import manager

router = APIRouter()


# --------------------------------------------------------------------------- #
# 3.1 Health
# --------------------------------------------------------------------------- #
@router.get("/health", tags=["system"])
def health_check():
    uptime = int(time.time() - config.START_TIME)
    return {
        "status": "healthy",
        "version": config.VERSION,
        "uptime_seconds": uptime,
        "timestamp": _utc_now(),
        "services": {
            "database": "connected",
            "websocket": "active",
            "ai_pipeline": "standby",
        },
    }


# --------------------------------------------------------------------------- #
# 3.2 Cameras
# --------------------------------------------------------------------------- #
@router.get("/cameras", response_model=List[CameraModel], tags=["cameras"])
def get_cameras(status: Optional[str] = None):
    return db.get_cameras(status=status)


# --------------------------------------------------------------------------- #
# 3.3 Analytics Summary
# --------------------------------------------------------------------------- #
@router.get("/analytics/summary", response_model=AnalyticsSummary, tags=["analytics"])
def get_analytics_summary():
    return db.get_analytics_summary()


# --------------------------------------------------------------------------- #
# 3.4 Events
# --------------------------------------------------------------------------- #
@router.get("/events", tags=["events"])
def get_events(
    event_type: Optional[str] = None,
    camera_id: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    return db.get_events(event_type, camera_id, severity, limit, offset)


@router.get("/events/{event_id}", tags=["events"])
def get_event_detail(event_id: str):
    event = db.get_event_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=404,
            detail={
                "error": True,
                "code": "RESOURCE_NOT_FOUND",
                "message": f"Event with ID '{event_id}' was not found.",
            },
        )
    return event


@router.post("/events", status_code=201, tags=["events"])
async def create_event(event: Event):
    from backend.services.event_service import EventService
    event_id = await EventService.process_event(event.model_dump())
    return {"status": "success", "event_id": event_id}


# --------------------------------------------------------------------------- #
# 3.5 Alerts
# --------------------------------------------------------------------------- #
@router.get("/alerts", tags=["alerts"])
def get_alerts(active_only: bool = False):
    events = db.get_events(limit=200)
    alerts = []
    for idx, e in enumerate(events):
        if e.get("severity") in ("HIGH", "CRITICAL"):
            alerts.append({
                "alert_id": f"ALT-{idx+1:03d}",
                "event_id": e.get("event_id"),
                "alert_title": _alert_title(e),
                "camera_id": e.get("camera_id"),
                "timestamp": e.get("timestamp"),
                "severity": e.get("severity"),
                "is_phase_2_simulated": e.get("metadata", {}).get("simulated", False),
                "description": e.get("metadata", {}).get("note", ""),
                "acknowledged": False,
            })
    return alerts


# --------------------------------------------------------------------------- #
# 4. WebSocket
# --------------------------------------------------------------------------- #
@router.websocket("/ws/analytics")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Send current analytics snapshot on connect
    try:
        import json
        await websocket.send_text(
            json.dumps({
                "message_type": "analytics_update",
                "data": db.get_analytics_summary(),
            })
        )
    except Exception:
        pass
    try:
        while True:
            # Keep alive — client can send pings; we just absorb them
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _utc_now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _alert_title(event: dict) -> str:
    et = event.get("event_type", "")
    if et == "HUMAN_DETECTION":
        return f"Human Detected — {event.get('camera_id', '')}"
    elif et == "VEHICLE_DETECTION":
        return f"Vehicle Detected — {event.get('camera_id', '')}"
    elif et == "ANPR":
        plate = event.get("metadata", {}).get("plate_number", "UNKNOWN")
        return f"Plate Read: {plate} — {event.get('camera_id', '')}"
    elif et == "INTRUSION":
        return f"Perimeter Breach — {event.get('camera_id', '')}"
    return f"Alert — {event.get('camera_id', '')}"
