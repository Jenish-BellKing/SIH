# IBVAP — Shared Event & WebSocket Schema
**Version:** 1.0.0  
**Status:** FROZEN — Universal Event Envelope & Streaming Contract

---

## 1. Universal Common Event Contract

Every system event ingested by backend or delivered to the dashboard timeline MUST adhere to the Universal Event Envelope.

### Universal Event Envelope JSON
```json
{
  "event_id": "EVT-0001",
  "event_type": "HUMAN_DETECTION",
  "camera_id": "BOP-07",
  "timestamp": "2026-08-27T10:43:17",
  "object_type": "person",
  "track_id": "P023",
  "confidence": 0.96,
  "severity": "INFO",
  "snapshot": null,
  "metadata": {}
}
```

### Field Definitions
| Field | Type | Mandatory | Allowed Values / Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| `event_id` | String | **YES** | Format: `"EVT-XXXX"` (e.g. `"EVT-0001"`) | Unique event identifier |
| `event_type` | String | **YES** | `"HUMAN_DETECTION"`, `"VEHICLE_DETECTION"`, `"ANPR"`, `"INTRUSION"` | Category of event |
| `camera_id` | String | **YES** | Valid camera identifier (e.g. `"BOP-07"`) | Originating camera source |
| `timestamp` | String | **YES** | ISO-8601 UTC string (`YYYY-MM-DDTHH:MM:SS`) | Timestamp of event occurrence |
| `object_type` | String | **YES** | `"person"`, `"vehicle"`, `"system"` | Target object class |
| `track_id` | String | No/Yes | Tracker ID (e.g. `"P023"`, `"V012"`) or `null` | Tracker instance ID |
| `confidence` | Float | **YES** | `0.0` to `1.0` | Classification/OCR confidence |
| `severity` | String | **YES** | `"INFO"`, `"LOW"`, `"MEDIUM"`, `"HIGH"`, `"CRITICAL"` | Alert severity tier |
| `snapshot` | String/Null | No | Path or URL to JPEG snapshot or `null` | Visual evidence snapshot path |
| `metadata` | Object | **YES** | Key-value dictionary | Type-specific contextual metadata |

---

## 2. Event Types & Severity Matrix

| `event_type` | Implementation Stage | Typical Severity | Typical `metadata` Payload Keys |
| :--- | :--- | :--- | :--- |
| `HUMAN_DETECTION` | **Phase 1 (Real AI)** | `INFO` / `LOW` | `{"bbox": [x1, y1, x2, y2], "direction": "south_to_north"}` |
| `VEHICLE_DETECTION` | **Phase 1 (Real AI)** | `INFO` / `LOW` | `{"vehicle_class": "car", "bbox": [x1, y1, x2, y2], "speed_estimate_kmh": 32}` |
| `ANPR` | **Phase 1 (Real AI)** | `INFO` / `MEDIUM` | `{"plate_number": "TN30AB1234", "vehicle_class": "car", "watchlist_match": false}` |
| `INTRUSION` | **Phase 2 (Simulated in Phase 1)** | `HIGH` / `CRITICAL` | `{"zone_id": "ZONE-NORTH-01", "breach_type": "virtual_fence", "simulated": true}` |

> [!IMPORTANT]
> `INTRUSION` events are strictly marked as Phase 2 or simulated placeholders. Do not mislead users into thinking real automated geometrical zone intrusion is fully active in Phase 1.

---

## 3. Concrete Event Examples

### Example 1: Human Detection Event
```json
{
  "event_id": "EVT-1001",
  "event_type": "HUMAN_DETECTION",
  "camera_id": "BOP-07",
  "timestamp": "2026-08-27T10:43:17",
  "object_type": "person",
  "track_id": "P023",
  "confidence": 0.96,
  "severity": "INFO",
  "snapshot": "/snapshots/EVT-1001.jpg",
  "metadata": {
    "bbox": [412, 238, 520, 610],
    "dwell_time_seconds": 14.5
  }
}
```

### Example 2: Vehicle Classification & Detection Event
```json
{
  "event_id": "EVT-1002",
  "event_type": "VEHICLE_DETECTION",
  "camera_id": "BOP-03",
  "timestamp": "2026-08-27T10:44:02",
  "object_type": "vehicle",
  "track_id": "V012",
  "confidence": 0.94,
  "severity": "INFO",
  "snapshot": "/snapshots/EVT-1002.jpg",
  "metadata": {
    "vehicle_class": "truck",
    "bbox": [210, 180, 580, 520]
  }
}
```

### Example 3: ANPR Recognition Event
```json
{
  "event_id": "EVT-1003",
  "event_type": "ANPR",
  "camera_id": "BOP-03",
  "timestamp": "2026-08-27T10:44:05",
  "object_type": "vehicle",
  "track_id": "V012",
  "confidence": 0.91,
  "severity": "MEDIUM",
  "snapshot": "/snapshots/EVT-1003.jpg",
  "metadata": {
    "vehicle_class": "truck",
    "plate_number": "TN30AB1234",
    "plate_bbox": [320, 420, 430, 460],
    "watchlist_flag": "FLAGGED_CHECKPOINT"
  }
}
```

### Example 4: Simulated Perimeter Intrusion (Phase 2 Placeholder)
```json
{
  "event_id": "EVT-1004",
  "event_type": "INTRUSION",
  "camera_id": "BOP-07",
  "timestamp": "2026-08-27T10:48:10",
  "object_type": "person",
  "track_id": "P023",
  "confidence": 0.89,
  "severity": "CRITICAL",
  "snapshot": "/snapshots/EVT-1004.jpg",
  "metadata": {
    "zone_name": "Restricted North Perimeter Zone A",
    "breach_rule": "Virtual Line Crossing",
    "simulated": true,
    "note": "Phase-2 demonstration placeholder event"
  }
}
```

---

## 4. WebSocket Streaming Protocol (`WS /ws/analytics`)

### 4.1. Message Envelope
All messages transmitted across `ws://localhost:8000/ws/analytics` MUST use the envelope:
```json
{
  "message_type": "<type>",
  "data": {}
}
```

Allowed `message_type` values:
- `detection`: High-frequency frame inference results (bounding boxes, tracker coordinates).
- `event`: Discrete high-level events (saved in database).
- `alert`: Immediate high-priority alerts to trigger visual/audio warnings in frontend.
- `camera_status`: Health/connectivity status updates for cameras.
- `analytics_update`: Incremental or refreshed aggregate statistics.

---

### 4.2. WebSocket Message Payloads

#### Type 1: `detection` (High Frequency)
```json
{
  "message_type": "detection",
  "data": {
    "camera_id": "BOP-07",
    "frame_id": 1420,
    "timestamp": "2026-08-27T10:43:17.250Z",
    "detections": [
      {
        "object_type": "person",
        "track_id": "P023",
        "confidence": 0.96,
        "bbox": [412, 238, 520, 610]
      }
    ]
  }
}
```

#### Type 2: `event`
```json
{
  "message_type": "event",
  "data": {
    "event_id": "EVT-1003",
    "event_type": "ANPR",
    "camera_id": "BOP-03",
    "timestamp": "2026-08-27T10:44:05",
    "object_type": "vehicle",
    "track_id": "V012",
    "confidence": 0.91,
    "severity": "MEDIUM",
    "snapshot": "/snapshots/EVT-1003.jpg",
    "metadata": {
      "plate_number": "TN30AB1234",
      "vehicle_class": "truck"
    }
  }
}
```

#### Type 3: `alert`
```json
{
  "message_type": "alert",
  "data": {
    "alert_id": "ALT-001",
    "event_id": "EVT-1004",
    "camera_id": "BOP-07",
    "title": "Perimeter Breach Detected",
    "severity": "CRITICAL",
    "timestamp": "2026-08-27T10:48:10",
    "message": "Track P023 crossed North Fence Restricted Zone (Simulated).",
    "is_phase_2_simulated": true
  }
}
```

#### Type 4: `camera_status`
```json
{
  "message_type": "camera_status",
  "data": {
    "camera_id": "BOP-01",
    "status": "warning",
    "fps": 12.4,
    "latency_ms": 110,
    "timestamp": "2026-08-27T10:49:00Z"
  }
}
```

#### Type 5: `analytics_update`
```json
{
  "message_type": "analytics_update",
  "data": {
    "humans_detected": 24,
    "vehicles_detected": 17,
    "anpr_events": 8,
    "critical_alerts": 5,
    "active_cameras": 11,
    "total_cameras": 12
  }
}
```
