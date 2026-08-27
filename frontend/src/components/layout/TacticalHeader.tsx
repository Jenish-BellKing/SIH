"use client";

import React, { useState, useEffect } from "react";
import { useSurveillance } from "@/context/SurveillanceContext";
import {
  ShieldAlert,
  Radio,
  Volume2,
  VolumeX,
  RefreshCw,
  AlertTriangle,
  Flame,
  Activity,
  Cpu,
  Clock,
} from "lucide-react";

export const TacticalHeader: React.FC = () => {
  const {
    threatLevel,
    unacknowledgedAlertsCount,
    wsState,
    packetCount,
    isMuted,
    toggleMute,
    triggerSimulatedIntrusion,
    refreshData,
  } = useSurveillance();

  const [timeStr, setTimeStr] = useState<string>("");
  const [timeZoneMode, setTimeZoneMode] = useState<"IST" | "UTC">("IST");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      if (timeZoneMode === "UTC") {
        setTimeStr(now.toUTCString().replace("GMT", "UTC"));
      } else {
        setTimeStr(
          now.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour12: false,
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) + " IST"
        );
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timeZoneMode]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getThreatBadge = () => {
    switch (threatLevel) {
      case "CRITICAL":
        return {
          bg: "bg-red-950/80 border-red-500 text-red-300 animate-pulse",
          label: "DEFCON 1 // CRITICAL BREACH",
          icon: Flame,
        };
      case "HIGH":
        return {
          bg: "bg-orange-950/80 border-orange-500 text-orange-300",
          label: "DEFCON 2 // HIGH ALERT",
          icon: AlertTriangle,
        };
      case "ELEVATED":
        return {
          bg: "bg-amber-950/80 border-amber-500 text-amber-300",
          label: "DEFCON 3 // ELEVATED WATCH",
          icon: AlertTriangle,
        };
      case "NORMAL":
      default:
        return {
          bg: "bg-emerald-950/60 border-emerald-500/50 text-emerald-300",
          label: "DEFCON 4 // SECURE PATROL",
          icon: ShieldAlert,
        };
    }
  };

  const threatBadge = getThreatBadge();
  const ThreatIcon = threatBadge.icon;

  const getWsBadge = () => {
    switch (wsState) {
      case "connected":
        return {
          dot: "bg-emerald-400 animate-pulse",
          text: "text-emerald-400",
          label: "WS LIVE HUB",
        };
      case "simulated":
        return {
          dot: "bg-amber-400 animate-ping",
          text: "text-amber-400",
          label: "WS SIMULATED [P1]",
        };
      case "connecting":
        return {
          dot: "bg-cyan-400 animate-bounce",
          text: "text-cyan-400",
          label: "WS CONNECTING...",
        };
      case "disconnected":
      default:
        return {
          dot: "bg-red-500",
          text: "text-red-400",
          label: "WS OFFLINE",
        };
    }
  };

  const wsBadge = getWsBadge();

  return (
    <header className="border-b border-slate-800 bg-[#0a0e17]/95 backdrop-blur sticky top-0 z-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
          <Radio className="w-5 h-5 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-base text-white">
              IBVAP
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
              C2 v1.0
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/40 flex items-center gap-1">
              <Cpu className="w-2.5 h-2.5" /> LIVE AI ENGINE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
            INTELLIGENT BORDER VIDEO ANALYTICS PLATFORM • SECTOR COMMAND HQ
          </p>
        </div>
      </div>

      {/* Threat Status & Telemetry Beacons */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* DEFCON Threat Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono font-bold tracking-wider shadow-sm ${threatBadge.bg}`}
        >
          <ThreatIcon className="w-3.5 h-3.5" />
          <span>{threatBadge.label}</span>
          {unacknowledgedAlertsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] animate-bounce">
              {unacknowledgedAlertsCount}
            </span>
          )}
        </div>

        {/* WebSocket Live Stream Status */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 text-xs font-mono">
          <div className={`w-2 h-2 rounded-full ${wsBadge.dot}`} />
          <span className={`${wsBadge.text} font-semibold`}>
            {wsBadge.label}
          </span>
          <span className="text-slate-500 text-[10px] border-l border-slate-800 pl-1.5">
            PKTS: {packetCount}
          </span>
        </div>

        {/* Digital Clock */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr || "--:--:--"}</span>
          <button
            onClick={() =>
              setTimeZoneMode((prev) => (prev === "IST" ? "UTC" : "IST"))
            }
            className="text-[10px] px-1 bg-slate-800 text-slate-400 hover:text-white rounded ml-1 transition"
            title="Toggle IST / UTC"
          >
            {timeZoneMode}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
          {/* Audio Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded border transition ${
              isMuted
                ? "bg-slate-800 text-slate-400 border-slate-700"
                : "bg-cyan-950/60 text-cyan-400 border-cyan-600/40 hover:bg-cyan-900/60"
            }`}
            title={isMuted ? "Unmute Audio Alarms" : "Mute Audio Alarms"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Refresh Data */}
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Force REST Sync"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>

          {/* Simulate Intrusion Button */}
          <button
            onClick={triggerSimulatedIntrusion}
            className="px-2.5 py-1 rounded bg-red-950/80 border border-red-500/70 text-red-300 hover:bg-red-900/90 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-[0_0_10px_rgba(239,68,68,0.2)]"
            title="Trigger Simulated Virtual Fence Intrusion Alert (Phase 2 Demo)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="hidden lg:inline">SIM INTRUSION</span>
            <span className="text-[9px] bg-red-800 text-white px-1 rounded">
              P2
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
