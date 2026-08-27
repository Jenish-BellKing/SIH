/**
 * IBVAP Universal Event Envelope Schema
 * Strict adherence to docs/EVENT_SCHEMA.md Section 1
 */

import { BoundingBox } from "./detection";

export type EventType =
  | "HUMAN_DETECTION"
  | "VEHICLE_DETECTION"
  | "ANPR"
  | "INTRUSION";

export type EventSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EventObjectType = "person" | "vehicle" | "system";

export interface EventMetadata {
  bbox?: BoundingBox;
  direction?: string;
  dwell_time_seconds?: number;
  vehicle_class?: string;
  plate_number?: string;
  plate_bbox?: BoundingBox;
  watchlist_flag?: string;
  watchlist_match?: boolean;
  speed_estimate_kmh?: number;
  zone_id?: string;
  zone_name?: string;
  breach_rule?: string;
  breach_type?: string;
  simulated?: boolean;
  note?: string;
  [key: string]: unknown;
}

export interface SystemEvent {
  event_id: string;
  event_type: EventType;
  camera_id: string;
  timestamp: string;
  object_type: EventObjectType;
  track_id: string | null;
  confidence: number;
  severity: EventSeverity;
  snapshot: string | null;
  metadata: EventMetadata;
}

export interface CreateEventRequest {
  event_id?: string;
  event_type: EventType;
  camera_id: string;
  timestamp: string;
  object_type: EventObjectType;
  track_id: string | null;
  confidence: number;
  severity: EventSeverity;
  snapshot?: string | null;
  metadata: EventMetadata;
}

export interface CreateEventResponse {
  status: "success" | "error";
  event_id: string;
}
