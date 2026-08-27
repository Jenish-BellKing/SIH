import { WSMessagePayload } from "@/types/websocket";

export const MOCK_STREAM_MESSAGES: WSMessagePayload[] = [
  {
    message_type: "detection",
    data: {
      camera_id: "BOP-07",
      frame_id: 100,
      timestamp: new Date().toISOString(),
      detections: [
        {
          camera_id: "BOP-07",
          object_type: "person",
          track_id: "P023",
          confidence: 0.96,
          bbox: [412, 238, 520, 610],
          timestamp: new Date().toISOString(),
        },
      ],
    },
  },
  {
    message_type: "detection",
    data: {
      camera_id: "BOP-07",
      frame_id: 101,
      timestamp: new Date().toISOString(),
      detections: [
        {
          camera_id: "BOP-07",
          object_type: "person",
          track_id: "P023",
          confidence: 0.96,
          bbox: [418, 240, 526, 614],
          timestamp: new Date().toISOString(),
        },
        {
          camera_id: "BOP-07",
          object_type: "person",
          track_id: "P024",
          confidence: 0.92,
          bbox: [530, 245, 625, 605],
          timestamp: new Date().toISOString(),
        },
      ],
    },
  },
  {
    message_type: "detection",
    data: {
      camera_id: "BOP-03",
      frame_id: 200,
      timestamp: new Date().toISOString(),
      detections: [
        {
          camera_id: "BOP-03",
          object_type: "vehicle",
          vehicle_class: "truck",
          track_id: "V012",
          confidence: 0.94,
          bbox: [210, 180, 580, 520],
          timestamp: new Date().toISOString(),
        },
      ],
    },
  },
  {
    message_type: "event",
    data: {
      event_id: "EVT-1003",
      event_type: "ANPR",
      camera_id: "BOP-03",
      timestamp: new Date().toISOString(),
      object_type: "vehicle",
      track_id: "V012",
      confidence: 0.91,
      severity: "MEDIUM",
      snapshot: "/snapshots/EVT-1003.jpg",
      metadata: {
        plate_number: "TN30AB1234",
        vehicle_class: "truck",
        watchlist_flag: "FLAGGED_CHECKPOINT",
      },
    },
  },
  {
    message_type: "camera_status",
    data: {
      camera_id: "BOP-07",
      status: "online",
      fps: 29.8,
      latency_ms: 42,
      timestamp: new Date().toISOString(),
    },
  },
  {
    message_type: "alert",
    data: {
      alert_id: "ALT-001",
      event_id: "EVT-1004",
      title: "Perimeter Breach Detected",
      alert_title: "Perimeter Breach Detected",
      camera_id: "BOP-07",
      severity: "CRITICAL",
      timestamp: new Date().toISOString(),
      description: "Track P023 crossed North Fence Restricted Zone (Simulated).",
      message: "Track P023 crossed North Fence Restricted Zone (Simulated).",
      is_phase_2_simulated: true,
      acknowledged: false,
    },
  },
  {
    message_type: "analytics_update",
    data: {
      humans_detected: 24,
      vehicles_detected: 17,
      anpr_events: 8,
      critical_alerts: 5,
      active_cameras: 11,
      total_cameras: 12,
    },
  },
];
