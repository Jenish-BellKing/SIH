/**
 * IBVAP Camera Schema
 * Strict adherence to docs/DATA_SCHEMA.md Section 2
 */

export type CameraStatus = "online" | "offline" | "warning";

export type CameraSourceType = "video" | "rtsp" | "webcam";

export interface Camera {
  camera_id: string;
  name: string;
  location: string;
  status: CameraStatus;
  source_type: CameraSourceType;
  source: string;
  latitude?: number;
  longitude?: number;
  // Live telemetry (simulated/dynamic)
  fps?: number;
  latency_ms?: number;
  active_tracks?: number;
  threat_level?: "NORMAL" | "ELEVATED" | "CRITICAL";
}
