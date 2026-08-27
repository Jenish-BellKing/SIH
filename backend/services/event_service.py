"""
IBVAP — Event Service: AI → SQLite → WebSocket pipeline.
This is the single integration point between AI pipelines and backend.
No AI inference lives here.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

from backend.database import db
from backend.websocket.manager import manager


class EventService:

    @staticmethod
    async def process_event(event_dict: Dict[str, Any]) -> str:
        """
        Persist a meaningful event to SQLite and broadcast via WebSocket.
        Returns the final event_id.
        """
        # Assign ID if missing
        if not event_dict.get("event_id"):
            event_dict["event_id"] = f"EVT-{uuid.uuid4().hex[:6].upper()}"

        # Assign timestamp if missing
        if not event_dict.get("timestamp"):
            event_dict["timestamp"] = datetime.now(timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%S"
            )

        # Assign default severity
        if not event_dict.get("severity"):
            if event_dict.get("event_type") in ("HIGH", "CRITICAL"):
                event_dict["severity"] = "HIGH"
            elif event_dict.get("event_type") == "ANPR":
                event_dict["severity"] = "MEDIUM"
            else:
                event_dict["severity"] = "INFO"

        # Persist
        db.save_event(event_dict)

        # Broadcast the event over WebSocket
        await manager.broadcast({"message_type": "event", "data": event_dict})

        # Update analytics counters
        event_type = event_dict.get("event_type", "")
        if event_type == "HUMAN_DETECTION":
            db.increment_statistic("humans_detected")
        elif event_type == "VEHICLE_DETECTION":
            db.increment_statistic("vehicles_detected")
        elif event_type == "ANPR":
            db.increment_statistic("anpr_events")

        if event_dict.get("severity") in ("HIGH", "CRITICAL"):
            db.increment_statistic("critical_alerts")

        # Broadcast updated aggregate
        await manager.broadcast(
            {"message_type": "analytics_update", "data": db.get_analytics_summary()}
        )

        return event_dict["event_id"]

    @staticmethod
    async def broadcast_detection_frame(
        camera_id: str,
        frame_id: int,
        timestamp: str,
        detections: List[Dict[str, Any]],
    ) -> None:
        """
        Stream high-frequency bounding-box data to WebSocket WITHOUT touching SQLite.
        Used for live frame-by-frame display in the frontend.
        """
        if not detections:
            return
        await manager.broadcast(
            {
                "message_type": "detection",
                "data": {
                    "camera_id": camera_id,
                    "frame_id": frame_id,
                    "timestamp": timestamp,
                    "detections": detections,
                },
            }
        )

    @staticmethod
    async def broadcast_camera_status(
        camera_id: str,
        status: str,
        fps: float = 0.0,
        latency_ms: float = 0.0,
    ) -> None:
        """Broadcast camera health update."""
        from datetime import datetime, timezone
        await manager.broadcast(
            {
                "message_type": "camera_status",
                "data": {
                    "camera_id": camera_id,
                    "status": status,
                    "fps": fps,
                    "latency_ms": latency_ms,
                    "timestamp": datetime.now(timezone.utc).strftime(
                        "%Y-%m-%dT%H:%M:%SZ"
                    ),
                },
            }
        )
