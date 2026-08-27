from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

class CameraModel(BaseModel):
    camera_id: str
    name: Optional[str] = None
    location: Optional[str] = None
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

class Event(BaseModel):
    event_id: str
    event_type: str
    camera_id: str
    timestamp: str
    object_type: str
    track_id: Optional[str] = None
    confidence: float
    severity: str
    snapshot: Optional[str] = None
    metadata: Dict[str, Any]

class WSEnvelope(BaseModel):
    message_type: str
    data: Dict[str, Any]
