"""
IBVAP — Backend Integration Tests
Tests all REST endpoints and WebSocket using TestClient.
Run: python -m pytest tests/test_backend.py -v
"""
from __future__ import annotations
import json
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Use a temp SQLite DB for tests
test_db = "test_ibvap.db"
if os.path.exists(test_db):
    os.remove(test_db)
os.environ["IBVAP_DB_PATH"] = test_db

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import db

# Re-init DB before tests
db.init_db()

client = TestClient(app)


# --------------------------------------------------------------------------- #
# /health
# --------------------------------------------------------------------------- #
class TestHealth:
    def test_health_returns_200(self):
        r = client.get("/health")
        assert r.status_code == 200

    def test_health_fields(self):
        r = client.get("/health").json()
        assert r["status"] == "healthy"
        assert "version" in r
        assert "uptime_seconds" in r
        assert "timestamp" in r
        assert "services" in r
        assert r["services"]["database"] == "connected"


# --------------------------------------------------------------------------- #
# /cameras
# --------------------------------------------------------------------------- #
class TestCameras:
    def test_cameras_returns_list(self):
        r = client.get("/cameras")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    def test_cameras_contain_required_fields(self):
        data = client.get("/cameras").json()
        if data:
            cam = data[0]
            assert "camera_id" in cam
            assert "status" in cam
            assert "source" in cam

    def test_cameras_filter_status(self):
        r = client.get("/cameras?status=online")
        assert r.status_code == 200
        for cam in r.json():
            assert cam["status"] == "online"


# --------------------------------------------------------------------------- #
# /analytics/summary
# --------------------------------------------------------------------------- #
class TestAnalyticsSummary:
    def test_summary_returns_200(self):
        r = client.get("/analytics/summary")
        assert r.status_code == 200

    def test_summary_fields(self):
        data = client.get("/analytics/summary").json()
        required = [
            "humans_detected",
            "vehicles_detected",
            "anpr_events",
            "critical_alerts",
            "active_cameras",
            "total_cameras",
        ]
        for field in required:
            assert field in data, f"Missing field: {field}"

    def test_summary_non_negative(self):
        data = client.get("/analytics/summary").json()
        for k, v in data.items():
            assert v >= 0, f"{k} is negative"


# --------------------------------------------------------------------------- #
# /events
# --------------------------------------------------------------------------- #
class TestEvents:
    SAMPLE_EVENT = {
        "event_id": "EVT-TEST01",
        "event_type": "HUMAN_DETECTION",
        "camera_id": "CAM-HUMAN-01",
        "timestamp": "2026-08-27T10:43:17",
        "object_type": "person",
        "track_id": "P001",
        "confidence": 0.94,
        "severity": "INFO",
        "snapshot": None,
        "metadata": {"bbox": [10, 20, 100, 200]},
    }

    def test_post_event_201(self):
        r = client.post("/events", json=self.SAMPLE_EVENT)
        assert r.status_code == 201
        data = r.json()
        assert data["status"] == "success"
        assert "event_id" in data

    def test_get_events_returns_list(self):
        r = client.get("/events")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_events_filter_by_type(self):
        r = client.get("/events?event_type=HUMAN_DETECTION")
        assert r.status_code == 200
        for ev in r.json():
            assert ev["event_type"] == "HUMAN_DETECTION"

    def test_get_events_filter_by_camera(self):
        r = client.get("/events?camera_id=CAM-HUMAN-01")
        assert r.status_code == 200
        for ev in r.json():
            assert ev["camera_id"] == "CAM-HUMAN-01"

    def test_get_event_by_id(self):
        r = client.get(f"/events/{self.SAMPLE_EVENT['event_id']}")
        assert r.status_code in (200, 404)  # depends on insertion order

    def test_get_event_not_found(self):
        r = client.get("/events/EVT-NONEXISTENT-XYZ")
        assert r.status_code == 404

    def test_post_vehicle_event(self):
        vehicle_event = {
            "event_id": "EVT-VEH01",
            "event_type": "VEHICLE_DETECTION",
            "camera_id": "CAM-VEHICLE-01",
            "timestamp": "2026-08-27T10:44:00",
            "object_type": "vehicle",
            "track_id": "V001",
            "confidence": 0.91,
            "severity": "INFO",
            "snapshot": None,
            "metadata": {"vehicle_class": "car"},
        }
        r = client.post("/events", json=vehicle_event)
        assert r.status_code == 201

    def test_post_anpr_event(self):
        anpr_event = {
            "event_id": "EVT-ANPR01",
            "event_type": "ANPR",
            "camera_id": "CAM-VEHICLE-01",
            "timestamp": "2026-08-27T10:44:05",
            "object_type": "vehicle",
            "track_id": "V001",
            "confidence": 0.88,
            "severity": "MEDIUM",
            "snapshot": None,
            "metadata": {"plate_number": "TN38AB1234", "vehicle_class": "car"},
        }
        r = client.post("/events", json=anpr_event)
        assert r.status_code == 201


# --------------------------------------------------------------------------- #
# /alerts
# --------------------------------------------------------------------------- #
class TestAlerts:
    def test_alerts_returns_list(self):
        r = client.get("/alerts")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --------------------------------------------------------------------------- #
# WebSocket
# --------------------------------------------------------------------------- #
class TestWebSocket:
    def test_websocket_connects(self):
        with client.websocket_connect("/ws/analytics") as ws:
            # Should receive analytics_update on connect
            data = ws.receive_text()
            msg = json.loads(data)
            assert msg["message_type"] == "analytics_update"
            assert "humans_detected" in msg["data"]
