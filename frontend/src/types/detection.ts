/**
 * IBVAP Perception Schemas (Human, Vehicle, ANPR)
 * Strict adherence to docs/DATA_SCHEMA.md Sections 3, 4, 5
 */

// Bounding box format: [x1, y1, x2, y2]
export type BoundingBox = [number, number, number, number];

export interface HumanDetection {
  camera_id: string;
  object_type: "person";
  track_id: string;
  confidence: number;
  bbox: BoundingBox;
  timestamp: string;
  dwell_time_seconds?: number;
  direction?: string;
}

export type VehicleClass = "car" | "truck" | "bus" | "motorcycle" | "suv" | "van";

export interface VehicleDetection {
  camera_id: string;
  object_type: "vehicle";
  vehicle_class: VehicleClass | string;
  track_id: string;
  confidence: number;
  bbox: BoundingBox;
  timestamp: string;
  speed_estimate_kmh?: number;
}

export interface ANPREvent {
  camera_id: string;
  event_type: "ANPR";
  vehicle_class: string;
  plate_number: string;
  confidence: number;
  timestamp: string;
  plate_bbox?: BoundingBox;
  watchlist_flag?: string;
}

export type DetectionUnion = HumanDetection | VehicleDetection;
