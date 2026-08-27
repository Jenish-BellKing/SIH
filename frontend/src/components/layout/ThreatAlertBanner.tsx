"use client";

import React from "react";
import { useSurveillance } from "@/context/SurveillanceContext";
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
} from "lucide-react";
import { formatTimestamp } from "@/lib/utils";

export const ThreatAlertBanner: React.FC<{
  onViewEvent?: (eventId: string) => void;
}> = ({ onViewEvent }) => {
  const { latestCriticalAlert, acknowledgeAlert, dismissAlert } =
    useSurveillance();

  if (!latestCriticalAlert) return null;

  return (
    <div className="bg-red-950/90 border-b-2 border-red-500 px-4 py-2 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] flex flex-wrap items-center justify-between gap-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-red-600 rounded text-white shadow-lg animate-bounce">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs tracking-wider uppercase bg-red-800 px-1.5 py-0.5 rounded font-mono">
              {latestCriticalAlert.severity} ALERT
            </span>
            <span className="font-mono text-xs text-red-200">
              CAMERA: {latestCriticalAlert.camera_id}
            </span>
            <span className="text-[11px] text-red-300 font-mono">
              @ {formatTimestamp(latestCriticalAlert.timestamp)}
            </span>
            {latestCriticalAlert.is_phase_2_simulated && (
              <span className="text-[10px] px-1 bg-amber-900/80 border border-amber-500/50 text-amber-300 rounded font-mono">
                SIMULATED [P2]
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-red-100 tracking-tight">
            {latestCriticalAlert.description ||
              latestCriticalAlert.title ||
              "Intrusion detected in restricted sector."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {latestCriticalAlert.event_id && onViewEvent && (
          <button
            onClick={() => onViewEvent(latestCriticalAlert.event_id!)}
            className="px-2.5 py-1 text-xs font-mono bg-red-900/80 hover:bg-red-800 border border-red-400 text-white rounded flex items-center gap-1 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Forensics</span>
          </button>
        )}
        <button
          onClick={() => acknowledgeAlert(latestCriticalAlert.alert_id)}
          className="px-3 py-1 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow flex items-center gap-1.5 transition cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ACKNOWLEDGE</span>
        </button>
        <button
          onClick={() => dismissAlert(latestCriticalAlert.alert_id)}
          className="p-1 text-red-300 hover:text-white rounded hover:bg-red-900/50 transition cursor-pointer"
          title="Dismiss Alert"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
