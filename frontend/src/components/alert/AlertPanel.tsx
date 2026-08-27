"use client";

import React, { useState } from "react";
import { useSurveillance } from "@/context/SurveillanceContext";
import { AlertCard } from "./AlertCard";
import {
  BellRing,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Layers,
  Sparkles,
} from "lucide-react";

export const AlertPanel: React.FC<{
  onViewEvent?: (eventId: string) => void;
}> = ({ onViewEvent }) => {
  const {
    alerts,
    unacknowledgedAlertsCount,
    triggerSimulatedIntrusion,
    acknowledgeAlert,
  } = useSurveillance();

  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACKNOWLEDGED">("ALL");

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== "ALL" && a.severity !== severityFilter) return false;
    if (statusFilter === "PENDING" && a.acknowledged) return false;
    if (statusFilter === "ACKNOWLEDGED" && !a.acknowledged) return false;
    return true;
  });

  const handleAcknowledgeAll = () => {
    alerts
      .filter((a) => !a.acknowledged)
      .forEach((a) => acknowledgeAlert(a.alert_id));
  };

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL" && !a.acknowledged).length;

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-[#0d131f] rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs">TOTAL ALERTS</span>
            <div className="text-xl font-bold text-slate-100">{alerts.length}</div>
          </div>
          <BellRing className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="p-3 bg-[#0d131f] rounded-lg border border-red-900/50 flex items-center justify-between">
          <div>
            <span className="text-red-400 text-xs">CRITICAL PENDING</span>
            <div className="text-xl font-bold text-red-400">{criticalCount}</div>
          </div>
          <Flame className="w-6 h-6 text-red-500 animate-pulse" />
        </div>

        <div className="p-3 bg-[#0d131f] rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-amber-400 text-xs">UNACKNOWLEDGED</span>
            <div className="text-xl font-bold text-amber-300">
              {unacknowledgedAlertsCount}
            </div>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0d131f] rounded-lg border border-slate-800 text-xs">
        {/* Severity & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            FILTER:
          </span>

          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-1 rounded transition ${
                severityFilter === sev
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {sev}
            </button>
          ))}

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2 ml-1">
            {(["ALL", "PENDING", "ACKNOWLEDGED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded capitalize transition ${
                  statusFilter === st
                    ? "bg-slate-800 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {unacknowledgedAlertsCount > 0 && (
            <button
              onClick={handleAcknowledgeAll}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ACK ALL ({unacknowledgedAlertsCount})</span>
            </button>
          )}

          <button
            onClick={triggerSimulatedIntrusion}
            className="px-3 py-1 bg-red-950 border border-red-500/70 hover:bg-red-900 text-red-300 rounded font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>TEST SIMULATION [P2]</span>
          </button>
        </div>
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <div className="p-8 text-center bg-[#0d131f] rounded-lg border border-slate-800 text-slate-500">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/60" />
          <p className="font-bold text-slate-400">NO ACTIVE ALERTS MATCHING CRITERIA</p>
          <p className="text-xs text-slate-600">All surveillance sectors currently nominal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.alert_id}
              alert={alert}
              onViewEvent={onViewEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
};
