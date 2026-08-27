"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Camera } from "@/types/camera";
import { SystemEvent } from "@/types/event";
import { Alert } from "@/types/alert";
import { AnalyticsSummary } from "@/types/analytics";
import {
  WSDetectionPayload,
  WSMessagePayload,
  WSCameraStatusPayload,
} from "@/types/websocket";
import { api } from "@/lib/api";
import { surveillanceWS } from "@/lib/websocket";
import { tacticalSound } from "@/lib/sound";
import { MOCK_ANALYTICS_SUMMARY } from "@/mock/analytics";

interface SurveillanceContextType {
  // Cameras
  cameras: Camera[];
  selectedCameraId: string | null;
  setSelectedCameraId: (id: string | null) => void;
  updateCameraStatus: (payload: WSCameraStatusPayload) => void;

  // Detections (live per camera)
  liveDetections: Record<string, WSDetectionPayload>;

  // Events
  events: SystemEvent[];
  selectedEvent: SystemEvent | null;
  setSelectedEvent: (event: SystemEvent | null) => void;
  addEvent: (event: SystemEvent) => void;

  // Alerts
  alerts: Alert[];
  unacknowledgedAlertsCount: number;
  latestCriticalAlert: Alert | null;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;

  // Analytics
  analyticsSummary: AnalyticsSummary;
  threatLevel: "NORMAL" | "ELEVATED" | "HIGH" | "CRITICAL";

  // System & Telemetry
  wsState: "connected" | "connecting" | "simulated" | "disconnected";
  packetCount: number;
  isMuted: boolean;
  toggleMute: () => void;

  // Actions / Simulation
  triggerSimulatedIntrusion: () => void;
  refreshData: () => Promise<void>;
}

const SurveillanceContext = createContext<SurveillanceContextType | undefined>(
  undefined
);

export const SurveillanceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>("BOP-07");
  const [liveDetections, setLiveDetections] = useState<
    Record<string, WSDetectionPayload>
  >({});
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SystemEvent | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analyticsSummary, setAnalyticsSummary] =
    useState<AnalyticsSummary>(MOCK_ANALYTICS_SUMMARY);
  const [wsState, setWsState] = useState<
    "connected" | "connecting" | "simulated" | "disconnected"
  >("disconnected");
  const [packetCount, setPacketCount] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Fetch initial REST data
  const refreshData = useCallback(async () => {
    try {
      const [fetchedCameras, fetchedEvents, fetchedAlerts, fetchedSummary] =
        await Promise.all([
          api.getCameras(),
          api.getEvents({ limit: 50 }),
          api.getAlerts(),
          api.getAnalyticsSummary(),
        ]);

      setCameras(fetchedCameras);
      setEvents(fetchedEvents);
      setAlerts(fetchedAlerts);
      setAnalyticsSummary(fetchedSummary);
    } catch {
      // Handled in api client
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle incoming WebSocket messages
  const handleWSMessage = useCallback((payload: WSMessagePayload) => {
    setPacketCount((prev) => prev + 1);

    switch (payload.message_type) {
      case "detection": {
        const data = payload.data as WSDetectionPayload;
        setLiveDetections((prev) => ({
          ...prev,
          [data.camera_id]: data,
        }));
        tacticalSound.playDetectionPing();
        break;
      }

      case "event": {
        const evt = payload.data as SystemEvent;
        setEvents((prev) => {
          if (prev.some((e) => e.event_id === evt.event_id)) return prev;
          return [evt, ...prev.slice(0, 99)];
        });

        if (evt.event_type === "ANPR") {
          tacticalSound.playANPRTone();
        }

        setAnalyticsSummary((prev) => ({
          ...prev,
          humans_detected:
            evt.object_type === "person"
              ? prev.humans_detected + 1
              : prev.humans_detected,
          vehicles_detected:
            evt.object_type === "vehicle"
              ? prev.vehicles_detected + 1
              : prev.vehicles_detected,
          anpr_events:
            evt.event_type === "ANPR"
              ? prev.anpr_events + 1
              : prev.anpr_events,
        }));
        break;
      }

      case "alert": {
        const alt = payload.data as Alert;
        setAlerts((prev) => {
          if (prev.some((a) => a.alert_id === alt.alert_id)) return prev;
          return [alt, ...prev];
        });

        if (alt.severity === "CRITICAL" || alt.severity === "HIGH") {
          tacticalSound.playCriticalAlarm();
        }

        setAnalyticsSummary((prev) => ({
          ...prev,
          critical_alerts: prev.critical_alerts + 1,
        }));
        break;
      }

      case "camera_status": {
        const stat = payload.data as WSCameraStatusPayload;
        setCameras((prev) =>
          prev.map((c) =>
            c.camera_id === stat.camera_id
              ? {
                  ...c,
                  status: stat.status,
                  fps: stat.fps,
                  latency_ms: stat.latency_ms,
                }
              : c
          )
        );
        break;
      }

      case "analytics_update": {
        const summary = payload.data as AnalyticsSummary;
        setAnalyticsSummary(summary);
        break;
      }
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const unsubState = surveillanceWS.onStateChange(setWsState);
    const unsubMsg = surveillanceWS.subscribe(handleWSMessage);
    surveillanceWS.connect();

    return () => {
      unsubState();
      unsubMsg();
      surveillanceWS.disconnect();
    };
  }, [handleWSMessage]);

  // Audio mute toggle
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      tacticalSound.setMuted(next);
      return next;
    });
  }, []);

  // Alert management
  const acknowledgeAlert = useCallback((alertId: string) => {
    tacticalSound.playAckClick();
    setAlerts((prev) =>
      prev.map((a) =>
        a.alert_id === alertId
          ? {
              ...a,
              acknowledged: true,
              acknowledged_at: new Date().toISOString(),
              acknowledged_by: "Commander Alpha (HQ)",
            }
          : a
      )
    );
    setAnalyticsSummary((prev) => ({
      ...prev,
      critical_alerts: Math.max(0, prev.critical_alerts - 1),
    }));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    tacticalSound.playAckClick();
    setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
  }, []);

  const addEvent = useCallback((event: SystemEvent) => {
    setEvents((prev) => [event, ...prev]);
  }, []);

  const updateCameraStatus = useCallback((payload: WSCameraStatusPayload) => {
    setCameras((prev) =>
      prev.map((c) =>
        c.camera_id === payload.camera_id
          ? {
              ...c,
              status: payload.status,
              fps: payload.fps,
              latency_ms: payload.latency_ms,
            }
          : c
      )
    );
  }, []);

  // 1-Click Simulated Intrusion Trigger
  const triggerSimulatedIntrusion = useCallback(() => {
    const simEventId = `EVT-SIM-${Date.now().toString().slice(-4)}`;
    const simAlertId = `ALT-SIM-${Date.now().toString().slice(-3)}`;

    const intrusionEvent: SystemEvent = {
      event_id: simEventId,
      event_type: "INTRUSION",
      camera_id: "BOP-07",
      timestamp: new Date().toISOString(),
      object_type: "person",
      track_id: "P099",
      confidence: 0.94,
      severity: "CRITICAL",
      snapshot: "/snapshots/EVT-1004.jpg",
      metadata: {
        zone_name: "North Fence Red Zone Alpha",
        breach_rule: "Virtual Line Crossing",
        simulated: true,
        note: "Phase-2 demonstration placeholder event",
        bbox: [412, 238, 520, 610],
      },
    };

    const intrusionAlert: Alert = {
      alert_id: simAlertId,
      event_id: simEventId,
      alert_title: "Simulated Virtual Perimeter Breach",
      title: "Simulated Virtual Perimeter Breach",
      camera_id: "BOP-07",
      timestamp: new Date().toISOString(),
      severity: "CRITICAL",
      is_phase_2_simulated: true,
      description: "Person P099 crossed calibrated red zone boundary (simulated indicator).",
      message: "Person P099 crossed calibrated red zone boundary (simulated indicator).",
      acknowledged: false,
    };

    surveillanceWS.dispatchSimulatedMessage({
      message_type: "event",
      data: intrusionEvent,
    });

    surveillanceWS.dispatchSimulatedMessage({
      message_type: "alert",
      data: intrusionAlert,
    });
  }, []);

  const unacknowledgedAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  const latestCriticalAlert =
    alerts.find((a) => !a.acknowledged && (a.severity === "CRITICAL" || a.severity === "HIGH")) ||
    null;

  // Compute calculated threat level
  let threatLevel: "NORMAL" | "ELEVATED" | "HIGH" | "CRITICAL" = "NORMAL";
  if (unacknowledgedAlertsCount >= 3 || alerts.some((a) => !a.acknowledged && a.severity === "CRITICAL")) {
    threatLevel = "CRITICAL";
  } else if (unacknowledgedAlertsCount >= 1 || alerts.some((a) => !a.acknowledged && a.severity === "HIGH")) {
    threatLevel = "HIGH";
  } else if (alerts.some((a) => a.severity === "MEDIUM")) {
    threatLevel = "ELEVATED";
  }

  return (
    <SurveillanceContext.Provider
      value={{
        cameras,
        selectedCameraId,
        setSelectedCameraId,
        updateCameraStatus,
        liveDetections,
        events,
        selectedEvent,
        setSelectedEvent,
        addEvent,
        alerts,
        unacknowledgedAlertsCount,
        latestCriticalAlert,
        acknowledgeAlert,
        dismissAlert,
        analyticsSummary,
        threatLevel,
        wsState,
        packetCount,
        isMuted,
        toggleMute,
        triggerSimulatedIntrusion,
        refreshData,
      }}
    >
      {children}
    </SurveillanceContext.Provider>
  );
};

export const useSurveillance = () => {
  const context = useContext(SurveillanceContext);
  if (!context) {
    throw new Error(
      "useSurveillance must be used within a SurveillanceProvider"
    );
  }
  return context;
};
