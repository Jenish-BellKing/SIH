import {
  AnalyticsSummary,
  DetectionHourlyPoint,
  VehicleClassDistribution,
  ThreatDistributionPoint,
  CameraTelemetryPoint,
} from "@/types/analytics";

export const MOCK_ANALYTICS_SUMMARY: AnalyticsSummary = {
  humans_detected: 23,
  vehicles_detected: 17,
  anpr_events: 8,
  critical_alerts: 4,
  active_cameras: 11,
  total_cameras: 12,
};

export const MOCK_HOURLY_DETECTIONS: DetectionHourlyPoint[] = [
  { hour: "00:00", humans: 2, vehicles: 1, anpr: 0, alerts: 0 },
  { hour: "02:00", humans: 1, vehicles: 0, anpr: 0, alerts: 0 },
  { hour: "04:00", humans: 3, vehicles: 2, anpr: 1, alerts: 1 },
  { hour: "06:00", humans: 8, vehicles: 5, anpr: 3, alerts: 0 },
  { hour: "08:00", humans: 14, vehicles: 12, anpr: 6, alerts: 1 },
  { hour: "10:00", humans: 23, vehicles: 17, anpr: 8, alerts: 4 },
  { hour: "12:00", humans: 19, vehicles: 15, anpr: 7, alerts: 2 },
  { hour: "14:00", humans: 16, vehicles: 11, anpr: 5, alerts: 1 },
  { hour: "16:00", humans: 21, vehicles: 14, anpr: 6, alerts: 3 },
  { hour: "18:00", humans: 18, vehicles: 9, anpr: 4, alerts: 2 },
  { hour: "20:00", humans: 12, vehicles: 6, anpr: 2, alerts: 1 },
  { hour: "22:00", humans: 5, vehicles: 3, anpr: 1, alerts: 0 },
];

export const MOCK_VEHICLE_CLASSES: VehicleClassDistribution[] = [
  { name: "Cars & Sedans", count: 9, fill: "#06B6D4" },
  { name: "Heavy Cargo Trucks", count: 4, fill: "#3B82F6" },
  { name: "SUVs & 4x4", count: 2, fill: "#8B5CF6" },
  { name: "Motorcycles", count: 1, fill: "#EC4899" },
  { name: "Buses / Transit", count: 1, fill: "#10B981" },
];

export const MOCK_THREAT_DISTRIBUTION: ThreatDistributionPoint[] = [
  { hour: "06:00", low: 4, medium: 2, high: 0, critical: 0 },
  { hour: "08:00", low: 7, medium: 4, high: 1, critical: 0 },
  { hour: "10:00", low: 11, medium: 5, high: 2, critical: 2 },
  { hour: "12:00", low: 8, medium: 3, high: 1, critical: 0 },
  { hour: "14:00", low: 6, medium: 2, high: 0, critical: 0 },
  { hour: "16:00", low: 9, medium: 4, high: 2, critical: 1 },
];

export const MOCK_CAMERA_TELEMETRY: CameraTelemetryPoint[] = [
  { time: "10:45", camera_id: "BOP-07", fps: 29.8, latency_ms: 42 },
  { time: "10:46", camera_id: "BOP-07", fps: 29.9, latency_ms: 40 },
  { time: "10:47", camera_id: "BOP-07", fps: 28.5, latency_ms: 48 },
  { time: "10:48", camera_id: "BOP-07", fps: 30.0, latency_ms: 39 },
  { time: "10:49", camera_id: "BOP-07", fps: 29.7, latency_ms: 43 },
  { time: "10:50", camera_id: "BOP-07", fps: 29.8, latency_ms: 42 },
];
