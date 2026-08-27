"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera } from "@/types/camera";
import { useSurveillance } from "@/context/SurveillanceContext";
import { AIOverlayCanvas } from "./AIOverlayCanvas";
import { ANPREvent } from "@/types/detection";
import {
  Maximize2,
  Minimize2,
  Video,
  VideoOff,
  AlertTriangle,
  Radio,
  Eye,
  Sliders,
  Shield,
  Focus,
} from "lucide-react";

interface CameraCardProps {
  camera: Camera;
  isFocused?: boolean;
  onFocusToggle?: () => void;
}

export const CameraCard: React.FC<CameraCardProps> = ({
  camera,
  isFocused = false,
  onFocusToggle,
}) => {
  const { liveDetections, events } = useSurveillance();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 360 });

  // Layer Visibility State
  const [showBoxes, setShowBoxes] = useState(true);
  const [showTracks, setShowTracks] = useState(true);
  const [showANPR, setShowANPR] = useState(true);
  const [showFence, setShowFence] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // Resize observer to scale overlay canvas smoothly
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Fetch detections specific to this camera
  const cameraDetections =
    liveDetections[camera.camera_id]?.detections || [];

  // Check if camera has recent ANPR event
  const recentANPREvent = events.find(
    (e) => e.camera_id === camera.camera_id && e.event_type === "ANPR"
  );
  const anprData: ANPREvent | null = recentANPREvent
    ? {
        camera_id: camera.camera_id,
        event_type: "ANPR",
        vehicle_class:
          (recentANPREvent.metadata.vehicle_class as string) || "car",
        plate_number:
          (recentANPREvent.metadata.plate_number as string) || "TN30AB1234",
        confidence: recentANPREvent.confidence,
        timestamp: recentANPREvent.timestamp,
      }
    : null;

  const isOnline = camera.status === "online";
  const isWarning = camera.status === "warning";
  const isOffline = camera.status === "offline";

  return (
    <div
      className={`relative flex flex-col rounded-lg border bg-[#0b101a] overflow-hidden transition-all duration-200 shadow-lg ${
        isFocused
          ? "border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-500"
          : isWarning
          ? "border-amber-500/50"
          : isOffline
          ? "border-slate-800 opacity-80"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1624] border-b border-slate-800 text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline
                  ? "bg-emerald-400 animate-pulse"
                  : isWarning
                  ? "bg-amber-400 animate-ping"
                  : "bg-slate-600"
              }`}
            />
            <span className="font-bold text-slate-100">{camera.camera_id}</span>
          </div>

          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 truncate max-w-[140px]">
            {camera.name}
          </span>
          <span className="text-[10px] text-slate-500 hidden md:inline">
            ({camera.location})
          </span>
        </div>

        {/* Telemetry & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* FPS & Latency */}
          {isOnline && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
              <span className="text-cyan-400">{camera.fps || 29.8} FPS</span>
              <span>{camera.latency_ms || 42}ms</span>
            </div>
          )}

          {/* AI Layer Toggle Button */}
          <button
            onClick={() => setShowControls(!showControls)}
            className={`p-1 rounded transition ${
              showControls
                ? "bg-cyan-950 text-cyan-400 border border-cyan-700/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Toggle AI Overlays"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Focus / Maximize Button */}
          {onFocusToggle && (
            <button
              onClick={onFocusToggle}
              className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
              title={isFocused ? "Restore Grid View" : "Focus Camera View"}
            >
              {isFocused ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Layer Control Sub-Menu */}
      {showControls && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-1 bg-slate-950/90 border-b border-slate-800 text-[10px] font-mono text-slate-300">
          <span className="text-cyan-400 font-bold">OVERLAYS:</span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showBoxes}
              onChange={(e) => setShowBoxes(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500"
            />
            <span>BBoxes</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showTracks}
              onChange={(e) => setShowTracks(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500"
            />
            <span>Track IDs</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showANPR}
              onChange={(e) => setShowANPR(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500"
            />
            <span>ANPR Plate</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showFence}
              onChange={(e) => setShowFence(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500"
            />
            <span>Virtual Fence (P2)</span>
          </label>
        </div>
      )}

      {/* Video Viewport Container */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[220px] sm:min-h-[260px] bg-slate-950 overflow-hidden flex items-center justify-center select-none"
      >
        {isOffline ? (
          /* Offline Fallback State */
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <VideoOff className="w-10 h-10 mb-2 text-slate-600" />
            <p className="text-xs font-mono font-bold text-slate-400">
              SIGNAL CARRIER LOST
            </p>
            <p className="text-[10px] font-mono text-slate-600">
              RTSP STREAM UNREACHABLE // BOP-09
            </p>
          </div>
        ) : (
          /* Active Surveillance Canvas Feed */
          <>
            {/* Synthetic CCTV Grid & Surveillance Backdrop */}
            <div className="absolute inset-0 bg-[#060a12] flex items-center justify-center">
              {/* Tactical Radar Grid Background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(#06b6d4 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
                  backgroundSize: "20px 20px, 40px 40px, 40px 40px",
                }}
              />

              {/* Central Target Reticle */}
              <div className="w-24 h-24 rounded-full border border-cyan-500/20 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border border-dashed border-cyan-500/30" />
                <div className="w-1 h-1 bg-cyan-400 rounded-full" />
              </div>

              {/* Scanning Light Line */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-scanline" />
            </div>

            {/* AI Canvas Overlays (YOLO Persons, Vehicles, ANPR, Geo-Fence) */}
            <AIOverlayCanvas
              width={dimensions.width || 640}
              height={dimensions.height || 360}
              detections={cameraDetections}
              anprEvent={anprData}
              showBoundingBoxes={showBoxes}
              showTrackIds={showTracks}
              showConfidence={true}
              showANPR={showANPR}
              showVirtualFence={showFence}
              isThreatSector={camera.threat_level === "CRITICAL"}
            />

            {/* Live Feed Watermark Overlay */}
            <div className="absolute top-2 left-2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-red-400">REC</span>
              <span>{camera.source_type.toUpperCase()}</span>
            </div>

            {/* Active Track Counters Badge */}
            <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5 bg-black/70 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono text-cyan-300">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>
                TRACKS: {cameraDetections.length || camera.active_tracks || 0}
              </span>
            </div>

            {/* Outpost Location Badge */}
            <div className="absolute bottom-2 left-2 z-20 bg-black/70 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono text-slate-400">
              {camera.location}
            </div>
          </>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="px-3 py-1 bg-[#090d15] border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500 select-none">
        <span>SRC: {camera.source}</span>
        <span
          className={
            isOnline
              ? "text-emerald-400"
              : isWarning
              ? "text-amber-400"
              : "text-slate-500"
          }
        >
          {camera.status.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
