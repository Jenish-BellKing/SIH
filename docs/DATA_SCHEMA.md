# IBVAP — Shared Data Schemas
**Version:** 1.0.0  
**Status:** FROZEN — Master Contract for AI Perception, Backend Models, and Frontend Types

---

## 1. Overview

This document specifies the exact JSON structures, data types, and field constraints for all domain entities across the **IBVAP** platform. All teams must use these exact field names in Pydantic models (Backend), YOLO/Tracker output parsers (AI), and TypeScript interfaces (Frontend).

---

## 2. Camera Schema

Represents a CCTV or border surveillance sensor input.

### JSON Structure
```json
{
  "camera_id": "BOP-07",
  "name": "North Fence Camera",
  "location": "North Fence Sector 4",
  "status": "online",
  "source_type": "video",
  "source": "test-videos/humans/human_single.mp4",
  "latitude": 31.1048,
  "longitude": 77.1734
}
```

### Field Definitions
| Field | Type | Mandatory | Allowed Values / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `camera_id` | String | **YES** | Unique identifier (e.g. `"BOP-01"`, `"BOP-07"`) | Primary key for camera routing |
| `name` | String | No | Free text (e.g. `"North Fence Camera"`) | Human-readable camera label |
| `location` | String | No | Free text (e.g. `"North Fence Sector 4"`) | Physical post / sector name |
| `status` | String | **YES** | `"online"`, `"offline"`, `"warning"` | Live operational health |
| `source_type` | String | **YES** | `"video"`, `"rtsp"`, `"webcam"` | Type of video stream |
| `source` | String | **YES** | File path or RTSP URL | Stream source uri / path |
| `latitude` | Float | No | `-90.0` to `90.0` | Geographic coordinate for Map view |
| `longitude` | Float | No | `-180.0` to `180.0` | Geographic coordinate for Map view |

---

## 3. Human Detection & Tracking Schema (Real AI)

Produced by the AI perception pipeline during human detection and ByteTrack tracking.

### JSON Structure
```json
{
  "camera_id": "BOP-07",
  "object_type": "person",
  "track_id": "P023",
  "confidence": 0.96,
  "bbox": [412, 238, 520, 610],
  "timestamp": "2026-08-27T10:43:17"
}
```

### Field Definitions
| Field | Type | Mandatory | Constraints / Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| `camera_id` | String | **YES** | Valid camera identifier | Source camera ID |
| `object_type` | String | **YES** | Strictly `"person"` | Detected object class |
| `track_id` | String | **YES** | String identifier (e.g. `"P001"`, `"P023"`) | Persistent tracker ID across video frames |
| `confidence` | Float | **YES** | `0.0` to `1.0` (2 decimal places recommended) | AI Model confidence score |
| `bbox` | Array[Int/Float] | **YES** | `[x1, y1, x2, y2]` (Top-Left X, Top-Left Y, Bottom-Right X, Bottom-Right Y) in pixels | Bounding box coordinates |
| `timestamp` | String | **YES** | ISO-8601 UTC string (`YYYY-MM-DDTHH:MM:SS`) | Timestamp of inference frame |

> [!WARNING]
> Do NOT rename `track_id`, `bbox`, or `object_type`.

---

## 4. Vehicle Detection & Classification Schema (Real AI)

Produced by the AI perception pipeline during vehicle detection, classification, and tracking.

### JSON Structure
```json
{
  "camera_id": "BOP-03",
  "object_type": "vehicle",
  "vehicle_class": "car",
  "track_id": "V012",
  "confidence": 0.94,
  "bbox": [412, 238, 620, 510],
  "timestamp": "2026-08-27T10:42:31"
}
```

### Field Definitions
| Field | Type | Mandatory | Constraints / Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| `camera_id` | String | **YES** | Valid camera identifier | Source camera ID |
| `object_type` | String | **YES** | Strictly `"vehicle"` | General object category |
| `vehicle_class` | String | **YES** | `"car"`, `"truck"`, `"bus"`, `"motorcycle"`, `"suv"`, `"van"` | Specific vehicle sub-class |
| `track_id` | String | **YES** | String identifier (e.g. `"V001"`, `"V012"`) | Persistent vehicle tracker ID |
| `confidence` | Float | **YES** | `0.0` to `1.0` | Detection confidence |
| `bbox` | Array[Int/Float] | **YES** | `[x1, y1, x2, y2]` | Bounding box coordinates |
| `timestamp` | String | **YES** | ISO-8601 UTC string | Inference timestamp |

---

## 5. ANPR (Automatic Number Plate Recognition) Schema (Real AI)

Generated when a license plate is recognized and extracted from a vehicle frame.

### JSON Structure
```json
{
  "camera_id": "BOP-03",
  "event_type": "ANPR",
  "vehicle_class": "car",
  "plate_number": "TN30AB1234",
  "confidence": 0.91,
  "timestamp": "2026-08-27T10:42:31"
}
```

### Field Definitions
| Field | Type | Mandatory | Constraints / Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| `camera_id` | String | **YES** | Valid camera ID | Source camera |
| `event_type` | String | **YES** | Strictly `"ANPR"` | Event identifier |
| `vehicle_class` | String | **YES** | `"car"`, `"truck"`, `"bus"`, `"motorcycle"`, etc. | Detected vehicle type |
| `plate_number` | String | **YES** | Alphanumeric uppercase string (e.g. `"TN30AB1234"`, `"DL01AB9999"`) | Cleaned license plate text |
| `confidence` | Float | **YES** | `0.0` to `1.0` | OCR / recognition confidence |
| `timestamp` | String | **YES** | ISO-8601 UTC string | Detection timestamp |

> [!CRITICAL]
> Do NOT rename `plate_number` to `license_plate` or `number_plate`.

---

## 6. Analytics Summary Schema

Used by the Command Centre dashboard for summary metrics.

### JSON Structure
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

### Field Definitions
| Field | Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `humans_detected` | Integer | **YES** | Total distinct human tracks / detections today |
| `vehicles_detected` | Integer | **YES** | Total distinct vehicle tracks detected today |
| `anpr_events` | Integer | **YES** | Total verified number plates read today |
| `critical_alerts` | Integer | **YES** | Count of unacknowledged critical/high alerts |
| `active_cameras` | Integer | **YES** | Number of cameras currently in `"online"` status |
| `total_cameras` | Integer | **YES** | Total count of configured cameras |

---

## 7. TypeScript & Pydantic Definitions Reference

### Pydantic (Python 3.10+)
```python
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class CameraModel(BaseModel):
    camera_id: str
    name: str
    location: str
    status: Literal["online", "offline", "warning"]
    source_type: str = "video"
    source: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class HumanDetection(BaseModel):
    camera_id: str
    object_type: Literal["person"] = "person"
    track_id: str
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: List[float] = Field(min_length=4, max_length=4)
    timestamp: str

class VehicleDetection(BaseModel):
    camera_id: str
    object_type: Literal["vehicle"] = "vehicle"
    vehicle_class: str
    track_id: str
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: List[float] = Field(min_length=4, max_length=4)
    timestamp: str

class ANPREvent(BaseModel):
    camera_id: str
    event_type: Literal["ANPR"] = "ANPR"
    vehicle_class: str
    plate_number: str
    confidence: float = Field(ge=0.0, le=1.0)
    timestamp: str

class AnalyticsSummary(BaseModel):
    humans_detected: int
    vehicles_detected: int
    anpr_events: int
    critical_alerts: int
    active_cameras: int
    total_cameras: int
```

### TypeScript (Frontend)
```typescript
export type CameraStatus = "online" | "offline" | "warning";

export interface Camera {
  camera_id: string;
  name: string;
  location: string;
  status: CameraStatus;
  source_type: string;
  source: string;
  latitude?: number;
  longitude?: number;
}

export interface HumanDetection {
  camera_id: string;
  object_type: "person";
  track_id: string;
  confidence: number;
  bbox: [number, number, number, number];
  timestamp: string;
}

export interface VehicleDetection {
  camera_id: string;
  object_type: "vehicle";
  vehicle_class: string;
  track_id: string;
  confidence: number;
  bbox: [number, number, number, number];
  timestamp: string;
}

export interface ANPREvent {
  camera_id: string;
  event_type: "ANPR";
  vehicle_class: string;
  plate_number: string;
  confidence: number;
  timestamp: string;
}

export interface AnalyticsSummary {
  humans_detected: number;
  vehicles_detected: number;
  anpr_events: number;
  critical_alerts: number;
  active_cameras: number;
  total_cameras: number;
}
```
