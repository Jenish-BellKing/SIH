/**
 * IBVAP Analytics Schemas
 * Strict adherence to docs/DATA_SCHEMA.md Section 6
 */

export interface AnalyticsSummary {
  humans_detected: number;
  vehicles_detected: number;
  anpr_events: number;
  critical_alerts: number;
  active_cameras: number;
  total_cameras: number;
}

export interface DetectionHourlyPoint {
  hour: string;
  humans: number;
  vehicles: number;
  anpr: number;
  alerts: number;
}

export interface VehicleClassDistribution {
  name: string;
  count: number;
  fill: string;
}

export interface ThreatDistributionPoint {
  hour: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface CameraTelemetryPoint {
  time: string;
  camera_id: string;
  fps: number;
  latency_ms: number;
}
