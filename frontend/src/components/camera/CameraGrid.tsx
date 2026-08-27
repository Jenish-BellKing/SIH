"use client";

import React, { useState } from "react";
import { useSurveillance } from "@/context/SurveillanceContext";
import { CameraCard } from "./CameraCard";
import {
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  Filter,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

export const CameraGrid: React.FC = () => {
  const { cameras, selectedCameraId, setSelectedCameraId } = useSurveillance();

  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [layoutMode, setLayoutMode] = useState<"2x2" | "3x2" | "single">("2x2");
  const [focusedCameraId, setFocusedCameraId] = useState<string | null>(null);

  // Filter cameras
  const filteredCameras = cameras.filter((cam) => {
    if (sectorFilter !== "ALL" && !cam.location.toLowerCase().includes(sectorFilter.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "ALL" && cam.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleFocusToggle = (cameraId: string) => {
    if (focusedCameraId === cameraId) {
      setFocusedCameraId(null);
      setLayoutMode("2x2");
    } else {
      setFocusedCameraId(cameraId);
      setLayoutMode("single");
      setSelectedCameraId(cameraId);
    }
  };

  const focusedCamera = cameras.find((c) => c.camera_id === focusedCameraId);

  return (
    <div className="space-y-4">
      {/* Top Filter & Layout Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0d131f] rounded-lg border border-slate-800 text-xs font-mono">
        {/* Sector & Status Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-200">SECTOR:</span>
          </div>

          <div className="flex items-center gap-1">
            {["ALL", "North", "East", "South", "West", "Depot"].map((sec) => (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={`px-2 py-1 rounded transition ${
                  sectorFilter === sec
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-700/50"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1 ml-2 border-l border-slate-800 pl-3">
            <span className="text-slate-400 font-bold">STATUS:</span>
            {["ALL", "online", "warning", "offline"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded capitalize transition ${
                  statusFilter === st
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-700/50"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Grid Switchers */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800">
          <button
            onClick={() => {
              setLayoutMode("2x2");
              setFocusedCameraId(null);
            }}
            className={`p-1.5 rounded transition ${
              layoutMode === "2x2"
                ? "bg-cyan-950 text-cyan-400 border border-cyan-700/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="2x2 Surveillance Wall"
          >
            <Grid2X2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setLayoutMode("3x2");
              setFocusedCameraId(null);
            }}
            className={`p-1.5 rounded transition ${
              layoutMode === "3x2"
                ? "bg-cyan-950 text-cyan-400 border border-cyan-700/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="3x2 Matrix (All Streams)"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Layouts */}
      {layoutMode === "single" && focusedCamera ? (
        /* Single Focused View with Forensic Sidebar */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <CameraCard
              camera={focusedCamera}
              isFocused={true}
              onFocusToggle={() => handleFocusToggle(focusedCamera.camera_id)}
            />
          </div>
          {/* Forensic Sidebar */}
          <div className="bg-[#0d131f] border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-cyan-400 uppercase">
                FORENSIC TELEMETRY
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                {focusedCamera.camera_id}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Stream Source:</span>
                <span className="text-slate-200">{focusedCamera.source_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location Post:</span>
                <span className="text-slate-200">{focusedCamera.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">FPS / Latency:</span>
                <span className="text-emerald-400">
                  {focusedCamera.fps || 29.8} FPS / {focusedCamera.latency_ms || 42}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Threat Status:</span>
                <span
                  className={
                    focusedCamera.threat_level === "CRITICAL"
                      ? "text-red-400 font-bold"
                      : "text-emerald-400"
                  }
                >
                  {focusedCamera.threat_level || "NORMAL"}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="font-bold text-slate-300 block mb-2">
                ACTIVE AI PIPELINES
              </span>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40">
                  <span>YOLOv8 Human Detector</span>
                  <span>96% AVG</span>
                </div>
                <div className="flex items-center justify-between text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/40">
                  <span>ByteTrack Multi-Object</span>
                  <span>ACTIVE</span>
                </div>
                <div className="flex items-center justify-between text-amber-300 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
                  <span>PaddleOCR ANPR Reader</span>
                  <span>STANDBY</span>
                </div>
                <div className="flex items-center justify-between text-purple-300 bg-purple-950/40 px-2 py-1 rounded border border-purple-800/40">
                  <span>Virtual Fencing (P2)</span>
                  <span>SIMULATED</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleFocusToggle(focusedCamera.camera_id)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold transition"
            >
              EXIT FOCUS VIEW
            </button>
          </div>
        </div>
      ) : (
        /* Multi-Camera Matrix View */
        <div
          className={`grid gap-4 ${
            layoutMode === "2x2"
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {filteredCameras.map((camera) => (
            <CameraCard
              key={camera.camera_id}
              camera={camera}
              onFocusToggle={() => handleFocusToggle(camera.camera_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
