"""
Integration verification test suite for IBVAP Backend & API Contract
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "uptime_seconds" in data
    assert data["services"]["database"] == "connected"
    assert data["services"]["websocket"] == "active"


def test_cameras_endpoint():
    res = client.get("/cameras")
    assert res.status_code == 200
    cameras = res.json()
    assert isinstance(cameras, list)
    assert len(cameras) > 0
    assert "camera_id" in cameras[0]
    assert "status" in cameras[0]

    # Filter test
    online_res = client.get("/cameras?status=online")
    assert online_res.status_code == 200
    for cam in online_res.json():
        assert cam["status"] == "online"


def test_analytics_summary_endpoint():
    res = client.get("/analytics/summary")
    assert res.status_code == 200
    summary = res.json()
    assert "humans_detected" in summary
    assert "vehicles_detected" in summary
    assert "anpr_events" in summary
    assert "critical_alerts" in summary
    assert "active_cameras" in summary
    assert "total_cameras" in summary


def test_events_endpoint():
    res = client.get("/events")
    assert res.status_code == 200
    events = res.json()
    assert isinstance(events, list)
    assert len(events) > 0
    first = events[0]
    assert "event_id" in first
    assert "event_type" in first
    assert "camera_id" in first
    assert "timestamp" in first
    assert "severity" in first


def test_events_filtering_and_pagination():
    res = client.get("/events?limit=2&offset=0")
    assert res.status_code == 200
    assert len(res.json()) <= 2


def test_event_by_id_and_not_found():
    # First get an existing event id
    events = client.get("/events").json()
    if events:
        eid = events[0]["event_id"]
        res = client.get(f"/events/{eid}")
        assert res.status_code == 200
        assert res.json()["event_id"] == eid

    # Not found
    not_found = client.get("/events/NON-EXISTENT-999")
    assert not_found.status_code == 404


def test_post_event_and_counter_update():
    initial_summary = client.get("/analytics/summary").json()
    initial_humans = initial_summary["humans_detected"]

    new_event = {
        "event_id": "EVT-TEST-001",
        "event_type": "HUMAN_DETECTION",
        "camera_id": "BOP-07",
        "timestamp": "2026-08-27T12:00:00Z",
        "object_type": "person",
        "track_id": "P999",
        "confidence": 0.98,
        "severity": "INFO",
        "snapshot": None,
        "metadata": {"bbox": [100, 100, 200, 200]},
    }
    res = client.post("/events", json=new_event)
    assert res.status_code == 201
    assert res.json()["status"] == "success"

    # Verify event appears in list
    evt_res = client.get("/events/EVT-TEST-001")
    assert evt_res.status_code == 200
    assert evt_res.json()["track_id"] == "P999"

    # Verify analytics counter updated
    updated_summary = client.get("/analytics/summary").json()
    assert updated_summary["humans_detected"] == initial_humans + 1


def test_alerts_endpoint():
    res = client.get("/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert isinstance(alerts, list)
    assert len(alerts) > 0
    assert "alert_id" in alerts[0]
    assert "severity" in alerts[0]
