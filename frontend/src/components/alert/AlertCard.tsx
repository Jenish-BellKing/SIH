"use client";

import React from "react";
import { Alert } from "@/types/alert";
import { useSurveillance } from "@/context/SurveillanceContext";
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Camera as CameraIcon,
  ShieldAlert,
  Send,
  ExternalLink,
} from "lucide-react";
import { formatTimestamp, formatFullDateTime, getSeverityBadgeClass } from "@/lib/utils";

interface AlertCardProps {
  alert: Alert;
  onViewEvent?: (eventId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onViewEvent }) => {
  const { acknowledgeAlert, dismissAlert } = useSurveillance();
  const severityStyle = getSeverityBadgeClass(alert.severity);

  return (
    <div
      className={`p-3.5 rounded-lg border bg-[#0d131f] transition-all font-mono text-xs ${
        alert.acknowledged
          ? "border-slate-800 opacity-70"
          : alert.severity === "CRITICAL"
          ? "border-red-500/80 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          : alert.severity === "HIGH"
          ? "border-orange-500/70 bg-orange-950/20"
          : "border-slate-800"
      }`}
    >
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Severity Badge */}
          <span
            className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${severityStyle.bg} ${severityStyle.text} ${severityStyle.border}`}
          >
            {alert.severity}
          </span>

          {/* Camera ID */}
          <span className="flex items-center gap-1 text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            <CameraIcon className="w-3 h-3 text-cyan-400" />
            <span>{alert.camera_id}</span>
          </span>

          {/* Phase 2 Simulated Badge */}
          {alert.is_phase_2_simulated && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/60">
              SIMULATED [P2]
            </span>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{formatTimestamp(alert.timestamp)}</span>
        </div>
      </div>

      {/* Alert Title & Message */}
      <div className="mb-3">
        <h4 className="font-bold text-slate-100 text-sm mb-0.5">
          {alert.alert_title || alert.title || "Surveillance Warning"}
        </h4>
        <p className="text-slate-300 text-xs">
          {alert.description || alert.message || "Anomalous event triggered."}
        </p>
      </div>

      {/* Footer & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        {/* Acknowledged Status */}
        {alert.acknowledged ? (
          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ACKNOWLEDGED {alert.acknowledged_by ? `(${alert.acknowledged_by})` : ""}</span>
          </div>
        ) : (
          <span className="text-[11px] text-red-400 font-bold animate-pulse">
            ● PENDING COMMANDER ACTION
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {alert.event_id && onViewEvent && (
            <button
              onClick={() => onViewEvent(alert.event_id!)}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Event</span>
            </button>
          )}

          {!alert.acknowledged ? (
            <button
              onClick={() => acknowledgeAlert(alert.alert_id)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] flex items-center gap-1 transition shadow cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>ACK</span>
            </button>
          ) : (
            <button
              onClick={() => dismissAlert(alert.alert_id)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded transition cursor-pointer"
              title="Dismiss Alert"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
