"use client";

import React, { useState } from "react";
import { useSurveillance } from "@/context/SurveillanceContext";
import { TacticalHeader } from "@/components/layout/TacticalHeader";
import { NavigationBar, ActiveTab } from "@/components/layout/NavigationBar";
import { ThreatAlertBanner } from "@/components/layout/ThreatAlertBanner";
import { CameraCard } from "@/components/camera/CameraCard";
import { CameraGrid } from "@/components/camera/CameraGrid";
import { AlertPanel } from "@/components/alert/AlertPanel";
import { AlertCard } from "@/components/alert/AlertCard";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { MetricCard } from "@/components/analytics/MetricCard";
import { EventTable } from "@/components/events/EventTable";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { TacticalMap } from "@/components/map/TacticalMap";
import { SystemStatusPanel } from "@/components/system/SystemStatusPanel";
import {
  Users,
  Car,
  FileText,
  Flame,
  Video,
  ListTree,
  MapPin,
  Maximize2,
  ExternalLink,
  Shield,
  Activity,
  Radio,
  Sparkles,
} from "lucide-react";
import { formatTimestamp } from "@/lib/utils";

export default function CommandCentrePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("command");
  const {
    cameras,
    events,
    alerts,
    analyticsSummary,
    selectedEvent,
    setSelectedEvent,
    setSelectedCameraId,
  } = useSurveillance();

  const handleViewEvent = (eventId: string) => {
    const found = events.find((e) => e.event_id === eventId);
    if (found) {
      setSelectedEvent(found);
    }
  };

  const handleSelectCameraFromMap = (cameraId: string) => {
    setSelectedCameraId(cameraId);
    setActiveTab("cameras");
  };

  // Primary 4 surveillance cameras for 2x2 live overview
  const commandCameras = cameras.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-[#080b11] text-slate-100 font-mono">
      {/* Tactical Top Header */}
      <TacticalHeader />

      {/* Navigation Sub-Header */}
      <NavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Flashing Threat Banner (when critical unacknowledged alerts exist) */}
      <ThreatAlertBanner onViewEvent={handleViewEvent} />

      {/* Main Mission Control Content Area */}
      <main className="flex-1 p-3 sm:p-4 md:p-5 max-w-[1700px] w-full mx-auto">
        {/* VIEW 1: UNIFIED COMMAND CENTRE DASHBOARD */}
        {activeTab === "command" && (
          <div className="space-y-4">
            {/* Top Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard
                title="Humans"
                value={analyticsSummary.humans_detected}
                subtitle="ByteTrack"
                icon={Users}
                color="emerald"
              />
              <MetricCard
                title="Vehicles"
                value={analyticsSummary.vehicles_detected}
                subtitle="Classified"
                icon={Car}
                color="cyan"
              />
              <MetricCard
                title="ANPR Plates"
                value={analyticsSummary.anpr_events}
                subtitle="Verified"
                icon={FileText}
                color="amber"
              />
              <MetricCard
                title="Threat Alerts"
                value={analyticsSummary.critical_alerts}
                subtitle="Unacknowledged"
                icon={Flame}
                color="red"
                isSimulated={true}
              />
              <MetricCard
                title="Active Nodes"
                value={`${analyticsSummary.active_cameras}/${analyticsSummary.total_cameras}`}
                subtitle="Cameras Online"
                icon={Video}
                color="blue"
              />
              <MetricCard
                title="AI Frame Rate"
                value="29.8 FPS"
                subtitle="Latency 42ms"
                icon={Activity}
                color="purple"
              />
            </div>

            {/* Main Command Wall: 2x2 Multi-Camera Matrix + Live Event Feed Sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              {/* 2x2 Live Surveillance Wall */}
              <div className="xl:col-span-3 space-y-3">
                <div className="flex items-center justify-between px-3 py-2 bg-[#0d131f] rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-slate-100 uppercase tracking-wide">
                      PRIMARY BORDER SURVEILLANCE MATRIX (2x2 LIVE WALL)
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      LIVE AI OVERLAY
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveTab("cameras")}
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold flex items-center gap-1 transition"
                  >
                    <span>All Feeds & Controls</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {commandCameras.map((camera) => (
                    <CameraCard
                      key={camera.camera_id}
                      camera={camera}
                      onFocusToggle={() => {
                        setSelectedCameraId(camera.camera_id);
                        setActiveTab("cameras");
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Right Sidebar: Real-Time Event Ticker & Threat Queue */}
              <div className="space-y-4">
                {/* Real-time Threat Queue */}
                <div className="bg-[#0d131f] rounded-lg border border-slate-800 p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-red-400">
                      <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                      <span>LIVE THREAT QUEUE</span>
                    </div>
                    <button
                      onClick={() => setActiveTab("alerts")}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    {alerts.slice(0, 3).map((alt) => (
                      <AlertCard
                        key={alt.alert_id}
                        alert={alt}
                        onViewEvent={handleViewEvent}
                      />
                    ))}
                  </div>
                </div>

                {/* Real-time Event Stream Ticker */}
                <div className="bg-[#0d131f] rounded-lg border border-slate-800 p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-400">
                      <ListTree className="w-4 h-4" />
                      <span>PERCEPTION FEED TICKER</span>
                    </div>
                    <button
                      onClick={() => setActiveTab("events")}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      History
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin text-[11px]">
                    {events.slice(0, 7).map((evt) => (
                      <div
                        key={evt.event_id}
                        onClick={() => setSelectedEvent(evt)}
                        className="p-2 rounded bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900 transition cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold text-[10px] ${
                                evt.event_type === "INTRUSION"
                                  ? "text-red-400"
                                  : evt.object_type === "person"
                                  ? "text-emerald-400"
                                  : evt.event_type === "ANPR"
                                  ? "text-amber-400"
                                  : "text-cyan-400"
                              }`}
                            >
                              {evt.event_type}
                            </span>
                            <span className="text-slate-500">
                              {evt.camera_id}
                            </span>
                          </div>
                          <div className="text-slate-300 text-[10px]">
                            {evt.metadata?.plate_number ? (
                              <span className="text-amber-300 font-bold">
                                {evt.metadata.plate_number as string}
                              </span>
                            ) : evt.track_id ? (
                              <span>Track: {evt.track_id}</span>
                            ) : (
                              <span>{evt.object_type}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">
                            {formatTimestamp(evt.timestamp)}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            {Math.round(evt.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DEDICATED CAMERA MONITORING */}
        {activeTab === "cameras" && <CameraGrid />}

        {/* VIEW 3: THREAT ALERTS */}
        {activeTab === "alerts" && (
          <AlertPanel onViewEvent={handleViewEvent} />
        )}

        {/* VIEW 4: AI ANALYTICS & TRENDS */}
        {activeTab === "analytics" && <AnalyticsDashboard />}

        {/* VIEW 5: EVENT FORENSICS & TIMELINE */}
        {activeTab === "events" && <EventTable />}

        {/* VIEW 6: TACTICAL GIS MAP */}
        {activeTab === "map" && (
          <TacticalMap onSelectCamera={handleSelectCameraFromMap} />
        )}

        {/* VIEW 7: SYSTEM STATUS & TELEMETRY */}
        {activeTab === "system" && <SystemStatusPanel />}
      </main>

      {/* Global Forensic Detail Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Tactical Footer */}
      <footer className="border-t border-slate-800 bg-[#090d16] px-4 py-2 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2 select-none font-mono">
        <div>
          <span>IBVAP COMMAND SURVEILLANCE v1.0.0 • </span>
          <span className="text-cyan-400">TEAM 2 (FRONTEND)</span>
          <span> | TARGET REPO: SIH / BRANCH: team/frontend</span>
        </div>
        <div className="flex items-center gap-3">
          <span>AI MODELS: YOLOv8 + BYTETRACK + PADDLEOCR</span>
          <span>•</span>
          <span className="text-amber-400">[PHASE 2 VIRTUAL FENCE: SIMULATED]</span>
        </div>
      </footer>
    </div>
  );
}
