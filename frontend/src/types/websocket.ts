/**
 * IBVAP WebSocket Streaming Envelope & Payloads
 * Strict adherence to docs/EVENT_SCHEMA.md Section 4
 */

import { CameraStatus } from "./camera";
import { HumanDetection, VehicleDetection } from "./detection";
import { SystemEvent } from "./event";
import { Alert } from "./alert";
import { AnalyticsSummary } from "./analytics";

export type WebSocketMessageType =
  | "detection"
  | "event"
  | "alert"
  | "camera_status"
  | "analytics_update";

export interface WSDetectionPayload {
  camera_id: string;
  frame_id: number;
  timestamp: string;
  detections: Array<HumanDetection | VehicleDetection>;
}

export interface WSCameraStatusPayload {
  camera_id: string;
  status: CameraStatus;
  fps: number;
  latency_ms: number;
  timestamp: string;
}

export type WSMessagePayload =
  | { message_type: "detection"; data: WSDetectionPayload }
  | { message_type: "event"; data: SystemEvent }
  | { message_type: "alert"; data: Alert }
  | { message_type: "camera_status"; data: WSCameraStatusPayload }
  | { message_type: "analytics_update"; data: AnalyticsSummary };

export interface WebSocketEnvelope<T = unknown> {
  message_type: WebSocketMessageType;
  data: T;
}
