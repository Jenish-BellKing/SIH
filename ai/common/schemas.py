"""
IBVAP — Shared AI output schemas.

These Pydantic models are the canonical types produced by AI pipelines
and consumed by the Event Service. They match docs/DATA_SCHEMA.md exactly.
Do NOT add fields here without updating DATA_SCHEMA.md.
"""
from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    """[x1, y1, x2, y2] in pixel coordinates (top-left, bottom-right)."""
    x1: float
    y1: float
    x2: float
    y2: float

    def as_list(self) -> List[float]:
        return [self.x1, self.y1, self.x2, self.y2]


class HumanDetectionOutput(BaseModel):
    """Produced by the human AI pipeline per detected person per frame."""
    camera_id: str
    object_type: Literal["person"] = "person"
    track_id: str          # format: P001, P002, …
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: List[float] = Field(min_length=4, max_length=4)  # [x1,y1,x2,y2]
    timestamp: str         # ISO-8601 UTC


class VehicleDetectionOutput(BaseModel):
    """Produced by the vehicle AI pipeline per detected vehicle per frame."""
    camera_id: str
    object_type: Literal["vehicle"] = "vehicle"
    vehicle_class: str     # car / truck / bus / motorcycle
    track_id: str          # format: V001, V002, …
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: List[float] = Field(min_length=4, max_length=4)
    timestamp: str


class ANPRResult(BaseModel):
    """Produced by the ANPR pipeline once a stable plate is confirmed."""
    camera_id: str
    event_type: Literal["ANPR"] = "ANPR"
    vehicle_class: str
    plate_number: Optional[str] = None   # None means unreadable
    confidence: float = Field(ge=0.0, le=1.0)
    track_id: str
    timestamp: str
