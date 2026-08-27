# IBVAP — Shared API Contract
**Version:** 1.0.0
**Status:** FROZEN — Source of Truth for All Teams
**Base URL (Local):** `http://localhost:8000`
**WebSocket URL (Local):** `ws://localhost:8000/ws/analytics`
**Implementation Status:** ✅ All endpoints implemented in `backend/api/routes.py`

---

## 1. Overview & Golden Rules

This document specifies the exact REST API endpoints and WebSocket channels for the **IBVAP (Intelligent Border Video Analytics Platform)**.

> [!IMPORTANT]
> - **Schema Immutability:** Neither Team 1 (AI/Backend) nor Team 2 (Frontend) nor Team 3 (Video Testing) may alter endpoint routes, query parameter names, or response payload keys without prior documentation update and team agreement.
> - **Consistent Data Types:** All timestamps must strictly follow ISO-8601 UTC format (`YYYY-MM-DDTHH:MM:SS` or `YYYY-MM-DDTHH:MM:SSZ`).
> - **Null Values:** Missing string fields must be serialized as `null` or empty string `""` as defined by schema; missing arrays must be `[]`.

---

## 2. Standard Response Wrapper & Error Handling

Standard HTTP Status Codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or missing parameters.
- `404 Not Found`: Resource does not exist.
- `500 Internal Server Error`: Backend error.

Error Response Format:
```json
{
  "error": true,
  "code": "RESOURCE_NOT_FOUND",
  "message": "Event with ID 'EVT-9999' was not found."
}
```

---

## 3. Endpoints Specification

### 3.1. System Health Check

- **Endpoint:** `GET /health`
- **Authentication:** None
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 142,
  "timestamp": "2026-08-27T10:00:00Z",
  "services": {
    "database": "connected",
    "websocket": "active",
    "ai_pipeline": "standby"
  }
}
```

---

### 3.2. Camera Management

#### `GET /cameras`
- **Query Parameters:**
  - `status` *(optional)*: Filter by `online`, `offline`, `warning`
- **Response `200 OK`:** Array of Camera objects (see `docs/DATA_SCHEMA.md` §2)

**Prototype cameras always present:**
```json
[
  {
    "camera_id": "CAM-HUMAN-01",
    "name": "Human Detection Camera",
    "location": "Prototype — Pedestrian Zone",
    "status": "online",
    "source_type": "video",
    "source": "test-videos/humans/pedestrian-road.mp4",
    "latitude": 31.1048,
    "longitude": 77.1734
  },
  {
    "camera_id": "CAM-VEHICLE-01",
    "name": "Vehicle & ANPR Camera",
    "location": "Prototype — Vehicle Checkpoint",
    "status": "online",
    "source_type": "video",
    "source": "test-videos/vehicles/vehicle-road.mp4",
    "latitude": 31.1082,
    "longitude": 77.1791
  }
]
```

---

### 3.3. Analytics Summary

#### `GET /analytics/summary`
- **Response `200 OK`:**
```json
{
  "humans_detected": 23,
  "vehicles_detected": 17,
  "anpr_events": 8,
  "critical_alerts": 4,
  "active_cameras": 2,
  "total_cameras": 2
}
```

---

### 3.4. Events Management

#### `GET /events`
- **Query Parameters:**
  - `event_type` *(optional)*: `HUMAN_DETECTION`, `VEHICLE_DETECTION`, `ANPR`, `INTRUSION`
  - `camera_id` *(optional)*: e.g. `CAM-HUMAN-01`
  - `severity` *(optional)*: `INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - `limit` *(optional, default: 50)*
  - `offset` *(optional, default: 0)*
- **Response `200 OK`:** Array of Event objects

#### `GET /events/{event_id}`
- **Response `200 OK`:** Single Event object
- **Response `404 Not Found`** if missing

#### `POST /events`
- **Request Body:** Event object (see `docs/EVENT_SCHEMA.md`)
- **Response `201 Created`:**
```json
{ "status": "success", "event_id": "EVT-TEST01" }
```

> [!NOTE]
> POST /events persists to SQLite AND broadcasts via WebSocket. AI pipelines use this
> route for meaningful discrete events (not every frame).

---

### 3.5. Alerts

#### `GET /alerts`
- **Query Parameters:** `active_only` *(optional, bool)*
- **Response `200 OK`:** Array of Alert objects (events with severity `HIGH`/`CRITICAL`)
```json
[
  {
    "alert_id": "ALT-001",
    "event_id": "EVT-0001",
    "alert_title": "Human Detected — CAM-HUMAN-01",
    "camera_id": "CAM-HUMAN-01",
    "timestamp": "2026-08-27T10:43:17",
    "severity": "HIGH",
    "is_phase_2_simulated": false,
    "description": "",
    "acknowledged": false
  }
]
```

---

## 4. WebSocket Contract

### `WS /ws/analytics`
- **URL:** `ws://localhost:8000/ws/analytics`
- **On connect:** Server immediately broadcasts `analytics_update` with current summary
- **Payload Framing:** All messages use the envelope:
```json
{
  "message_type": "<type>",
  "data": {}
}
```

Allowed `message_type` values:
1. `detection` — High-frequency bounding boxes (NOT persisted to DB)
2. `event` — Discrete persisted event
3. `alert` — High-priority alert toast
4. `camera_status` — Camera health/stream state
5. `analytics_update` — Refreshed aggregate counters

*Detailed payload samples in `docs/EVENT_SCHEMA.md`.*

---

## 5. CORS

The backend sets `Access-Control-Allow-Origin: *` for all origins.
Team 2 frontend on any local port can call the API without proxy configuration.

---

## 6. Running the Backend

```bash
# From repo root:
python scripts/run_backend.py
# or:
uvicorn backend.main:app --reload
```

Interactive docs: `http://localhost:8000/docs`
