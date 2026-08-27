"use client";

import React, { useEffect, useState } from "react";
import { useSurveillance } from "@/context/SurveillanceContext";
import dynamic from "next/dynamic";
import {
  MapPin,
  Camera as CameraIcon,
  Video,
  AlertTriangle,
  Flame,
  Radio,
  Layers,
  Crosshair,
  Compass,
} from "lucide-react";
import { formatCoordinates } from "@/lib/utils";

// Dynamically import Leaflet components to avoid SSR window errors
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false }
);

export const TacticalMap: React.FC<{
  onSelectCamera?: (cameraId: string) => void;
}> = ({ onSelectCamera }) => {
  const { cameras, alerts, selectedCameraId, setSelectedCameraId } =
    useSurveillance();
  const [mounted, setMounted] = useState(false);
  const [leafletLib, setLeafletLib] = useState<typeof import("leaflet") | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
    import("leaflet").then((L) => {
      setLeafletLib(L);
    });
  }, []);

  // Center around border outpost coordinates (Simulated Indo-Tibetan border region approx 31.1048, 77.1734)
  const defaultCenter: [number, number] = [31.1048, 77.1734];

  // Geofence Sector Polygons (Simulated Tactical Geofence Coordinates)
  const northSectorPolygon: [number, number][] = [
    [31.103, 77.168],
    [31.109, 77.171],
    [31.107, 77.179],
    [31.101, 77.175],
  ];

  const eastGatePolygon: [number, number][] = [
    [31.106, 77.177],
    [31.111, 77.181],
    [31.108, 77.185],
    [31.104, 77.18],
  ];

  const createCustomIcon = (
    status: string,
    isAlert: boolean,
    cameraId: string
  ) => {
    if (!leafletLib) return undefined;

    const isCritical = isAlert || status === "alert";
    const isOnline = status === "online";
    const isWarning = status === "warning";

    const color = isCritical
      ? "#EF4444"
      : isWarning
      ? "#F59E0B"
      : isOnline
      ? "#10B981"
      : "#64748B";

    const pulseClass = isCritical
      ? "animate-ping opacity-75"
      : isOnline
      ? "animate-pulse"
      : "";

    const html = `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div class="${pulseClass}" style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${color}; opacity: 0.3;"></div>
        <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: #0D131F; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${color}66;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
        </div>
        <div style="position: absolute; bottom: -14px; background: rgba(13,19,31,0.9); border: 1px solid ${color}; color: #FFF; font-family: monospace; font-size: 9px; font-weight: bold; padding: 1px 3px; border-radius: 3px; white-space: nowrap;">
          ${cameraId}
        </div>
      </div>
    `;

    return leafletLib.divIcon({
      className: "custom-tactical-pin",
      html: html,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });
  };

  return (
    <div className="relative w-full h-[600px] lg:h-[680px] bg-[#070a10] rounded-lg border border-slate-800 overflow-hidden font-mono text-xs shadow-xl flex flex-col">
      {/* Tactical Map Header HUD */}
      <div className="absolute top-3 left-3 z-[400] bg-[#0d131f]/90 backdrop-blur border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 shadow-2xl max-w-xs select-none">
        <div className="flex items-center gap-2 mb-1">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider">
            BORDER GIS RADAR
          </span>
          <span className="text-[9px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
            LEAFLET C2
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Geospatial sensor telemetry • Sector 4 North / East Outposts
        </p>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-800 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Online Stream</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-300">Warning State</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-400 font-bold">Threat Alert</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-400">Offline Post</span>
          </div>
        </div>
      </div>

      {/* Radar Sweep Effect Overlay */}
      <div className="absolute top-4 right-4 z-[400] bg-[#0d131f]/90 backdrop-blur border border-slate-700/80 rounded-lg p-2 text-center text-[10px] text-cyan-400 flex items-center gap-2 select-none">
        <div className="relative w-5 h-5 rounded-full border border-cyan-500/40 flex items-center justify-center overflow-hidden">
          <div className="w-full h-0.5 bg-cyan-400 absolute origin-left animate-radar-sweep" />
        </div>
        <span>RADAR SCAN: ACTIVE</span>
      </div>

      {/* Main Map Container */}
      {!mounted ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          Initializing Geospatial Tactical Engine...
        </div>
      ) : (
        <MapContainer
          center={defaultCenter}
          zoom={14}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
        >
          {/* Dark Tactical CartoDB Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> dark_all'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          {/* Sector Geofences (Polygons) */}
          <Polygon
            positions={northSectorPolygon}
            pathOptions={{
              color: "#EF4444",
              fillColor: "#EF4444",
              fillOpacity: 0.1,
              weight: 1.5,
              dashArray: "4, 6",
            }}
          />
          <Polygon
            positions={eastGatePolygon}
            pathOptions={{
              color: "#06B6D4",
              fillColor: "#06B6D4",
              fillOpacity: 0.08,
              weight: 1.5,
            }}
          />

          {/* Camera Marker Beacons */}
          {cameras.map((cam) => {
            if (!cam.latitude || !cam.longitude) return null;
            const hasAlert = alerts.some(
              (a) =>
                a.camera_id === cam.camera_id &&
                !a.acknowledged &&
                a.severity === "CRITICAL"
            );

            const icon = createCustomIcon(cam.status, hasAlert, cam.camera_id);

            return (
              <Marker
                key={cam.camera_id}
                position={[cam.latitude, cam.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setSelectedCameraId(cam.camera_id);
                    if (onSelectCamera) onSelectCamera(cam.camera_id);
                  },
                }}
              >
                <Popup>
                  <div className="p-1 font-mono text-xs text-slate-200">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-1">
                      <span className="font-bold text-cyan-400">
                        {cam.camera_id}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          cam.status === "online"
                            ? "bg-emerald-950 text-emerald-400"
                            : cam.status === "warning"
                            ? "bg-amber-950 text-amber-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {cam.status}
                      </span>
                    </div>

                    <div className="text-slate-300 font-semibold mb-1">
                      {cam.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mb-2">
                      {cam.location}
                    </div>

                    <div className="text-[10px] text-slate-400 space-y-0.5 mb-2">
                      <div>
                        GPS: {formatCoordinates(cam.latitude, cam.longitude)}
                      </div>
                      <div>FPS / Latency: {cam.fps || 29.8} FPS / {cam.latency_ms || 42}ms</div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCameraId(cam.camera_id);
                        if (onSelectCamera) onSelectCamera(cam.camera_id);
                      }}
                      className="w-full py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded text-[10px] transition"
                    >
                      OPEN SURVEILLANCE FEED
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}

      {/* Footer Readout */}
      <div className="p-2 bg-[#090e17] border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between z-[400]">
        <span>MAP ENGINE: LEAFLET GIS • RADAR DATUM: WGS84</span>
        <span>
          MONITORED OUTPOSTS: {cameras.filter((c) => c.latitude).length} NODES
        </span>
      </div>
    </div>
  );
};
