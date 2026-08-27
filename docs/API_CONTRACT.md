# IBVAP — Shared API Contract
**Version:** 1.0.0  
**Status:** FROZEN — Source of Truth for All Teams  
**Base URL (Local):** `http://localhost:8000`  
**WebSocket URL (Local):** `ws://localhost:8000/ws/analytics`

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
  "message": "Camera with ID 'BOP-99' was not found."
}
```

---

## 3. Endpoints Specification

### 3.1. System Health Check
Check operational status of backend services and database.

- **Endpoint:** `GET /health`
- **Authentication:** None
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "timestamp": "2026-08-27T11:30:00Z",
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
Retrieve all registered border cameras and CCTV streams.

- **Endpoint:** `GET /cameras`
- **Query Parameters:**
  - `status` *(optional, string)*: Filter by status (`online`, `offline`, `warning`).
- **Response `200 OK`:**
```json
[
  {
    "camera_id": "BOP-07",
    "name": "North Fence Camera",
    "location": "North Fence Sector 4",
    "status": "online",
    "source_type": "video",
    "source": "test-videos/humans/human_single.mp4",
    "latitude": 31.1048,
    "longitude": 77.1734
  },
  {
    "camera_id": "BOP-03",
    "name": "East Gate Checkpoint",
    "location": "East Gate Entry",
    "status": "online",
    "source_type": "video",
    "source": "test-videos/vehicles/vehicle_traffic.mp4",
    "latitude": 31.1082,
    "longitude": 77.1791
  },
  {
    "camera_id": "BOP-01",
    "name": "South Patrol Outpost",
    "location": "South Perimeter",
    "status": "warning",
    "source_type": "video",
    "source": "test-videos/anpr/plate_test.mp4",
    "latitude": 31.0995,
    "longitude": 77.1689
  }
]
```

#### `POST /cameras` *(Optional / Future Extension)*
Register a new camera source.

- **Endpoint:** `POST /cameras`
- **Request Body:**
```json
{
  "camera_id": "BOP-12",
  "name": "West Perimeter IR Camera",
  "location": "West Fence Sector 2",
  "status": "online",
  "source_type": "rtsp",
  "source": "rtsp://192.168.1.120:554/stream1",
  "latitude": 31.1012,
  "longitude": 77.1650
}
```
- **Response `201 Created`:** Camera object created.

---

### 3.3. Analytics Summary

#### `GET /analytics/summary`
Aggregated high-level counters for the Command Centre dashboard cards.

- **Endpoint:** `GET /analytics/summary`
- **Query Parameters:** None
- **Response `200 OK`:**
```json
{
  "humans_detected": 23,
  "vehicles_detected": 17,
  "anpr_events": 8,
  "critical_alerts": 4,
  "active_cameras": 11,
  "total_cameras": 12
}
```

> [!NOTE]
> In Phase 1, portions of this summary may combine real detections with simulated statistics. The JSON schema remains identical when full real-time pipelines are operational.

---

### 3.4. Events Management

#### `GET /events`
Query detection and security events with pagination and filtering.

- **Endpoint:** `GET /events`
- **Query Parameters:**
  - `event_type` *(optional, string)*: `HUMAN_DETECTION`, `VEHICLE_DETECTION`, `ANPR`, `INTRUSION`
  - `camera_id` *(optional, string)*: Filter by camera ID (e.g. `BOP-07`)
  - `severity` *(optional, string)*: `INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - `limit` *(optional, integer, default: 50)*: Number of records to return
  - `offset` *(optional, integer, default: 0)*: Pagination offset
- **Response `200 OK`:**
```json
[
  {
    "event_id": "EVT-0001",
    "event_type": "HUMAN_DETECTION",
    "camera_id": "BOP-07",
    "timestamp": "2026-08-27T10:43:17",
    "object_type": "person",
    "track_id": "P023",
    "confidence": 0.96,
    "severity": "INFO",
    "snapshot": "/snapshots/EVT-0001.jpg",
    "metadata": {
      "bbox": [412, 238, 520, 610],
      "direction": "south_to_north"
    }
  },
  {
    "event_id": "EVT-0002",
    "event_type": "ANPR",
    "camera_id": "BOP-03",
    "timestamp": "2026-08-27T10:42:31",
    "object_type": "vehicle",
    "track_id": "V012",
    "confidence": 0.91,
    "severity": "MEDIUM",
    "snapshot": "/snapshots/EVT-0002.jpg",
    "metadata": {
      "vehicle_class": "car",
      "plate_number": "TN30AB1234",
      "bbox": [412, 238, 620, 510]
    }
  }
]
```

#### `GET /events/{event_id}`
Retrieve full details for a specific event.

- **Endpoint:** `GET /events/{event_id}`
- **Response `200 OK`:** Single Event object (see `docs/EVENT_SCHEMA.md`).
- **Response `404 Not Found`:** If event does not exist.

#### `POST /events`
Ingest an event triggered by the AI inference engine or alert worker.

- **Endpoint:** `POST /events`
- **Request Body:**
```json
{
  "event_id": "EVT-0003",
  "event_type": "HUMAN_DETECTION",
  "camera_id": "BOP-07",
  "timestamp": "2026-08-27T10:45:00",
  "object_type": "person",
  "track_id": "P024",
  "confidence": 0.94,
  "severity": "INFO",
  "snapshot": null,
  "metadata": {
    "bbox": [310, 150, 420, 500]
  }
}
```
- **Response `201 Created`:**
```json
{
  "status": "success",
  "event_id": "EVT-0003"
}
```

---

### 3.5. Alerts

#### `GET /alerts`
Retrieve active and historical security alerts (events with severity `HIGH` or `CRITICAL`, or designated alert triggers).

- **Endpoint:** `GET /alerts`
- **Query Parameters:**
  - `active_only` *(optional, boolean, default: false)*
- **Response `200 OK`:**
```json
[
  {
    "alert_id": "ALT-001",
    "event_id": "EVT-0005",
    "alert_title": "Simulated Virtual Perimeter Breach",
    "camera_id": "BOP-07",
    "timestamp": "2026-08-27T10:48:10",
    "severity": "CRITICAL",
    "is_phase_2_simulated": true,
    "description": "Person crossed calibrated red zone boundary (simulated indicator).",
    "acknowledged": false
  }
]
```

---

## 4. WebSocket Contract

### `WS /ws/analytics`
Bi-directional real-time communication channel for live bounding boxes, detection streams, alert toasts, and status changes.

- **URL:** `ws://localhost:8000/ws/analytics`
- **Payload Framing:** All messages sent over WebSocket MUST adhere to the envelope:
```json
{
  "message_type": "detection",
  "data": {}
}
```

Allowed `message_type` values:
1. `detection`: Real-time frame detection / bounding box update.
2. `event`: New persisted event generated by AI engine.
3. `alert`: Critical alert broadcast.
4. `camera_status`: Camera health / stream state change.
5. `analytics_update`: Live aggregate counter increments.

*Detailed payload samples are documented in `docs/EVENT_SCHEMA.md`.*
