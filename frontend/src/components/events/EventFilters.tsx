"use client";

import React from "react";
import {
  Search,
  Filter,
  Camera as CameraIcon,
  RotateCcw,
} from "lucide-react";
import { Camera } from "@/types/camera";

interface EventFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCamera: string;
  setSelectedCamera: (cam: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedSeverity: string;
  setSelectedSeverity: (sev: string) => void;
  selectedObjectType: string;
  setSelectedObjectType: (obj: string) => void;
  cameras: Camera[];
  onReset: () => void;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCamera,
  setSelectedCamera,
  selectedType,
  setSelectedType,
  selectedSeverity,
  setSelectedSeverity,
  selectedObjectType,
  setSelectedObjectType,
  cameras,
  onReset,
}) => {
  return (
    <div className="p-3.5 bg-[#0d131f] rounded-lg border border-slate-800 font-mono text-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Event ID, Track ID (e.g. P023), Plate (e.g. TN30AB1234)..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Reset Filter Button */}
        <button
          onClick={onReset}
          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded flex items-center gap-1 transition"
          title="Reset all filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>

      {/* Dropdown Filters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
        {/* Camera Selector */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">
            ORIGIN CAMERA:
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Cameras</option>
            {cameras.map((cam) => (
              <option key={cam.camera_id} value={cam.camera_id}>
                {cam.camera_id} — {cam.name}
              </option>
            ))}
          </select>
        </div>

        {/* Event Type Selector */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">
            EVENT TYPE:
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Types</option>
            <option value="HUMAN_DETECTION">HUMAN_DETECTION</option>
            <option value="VEHICLE_DETECTION">VEHICLE_DETECTION</option>
            <option value="ANPR">ANPR (License Plate)</option>
            <option value="INTRUSION">INTRUSION (Virtual Fence)</option>
          </select>
        </div>

        {/* Severity Selector */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">
            SEVERITY TIER:
          </label>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="INFO">INFO</option>
          </select>
        </div>

        {/* Object Class Selector */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">
            OBJECT CLASS:
          </label>
          <select
            value={selectedObjectType}
            onChange={(e) => setSelectedObjectType(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Objects</option>
            <option value="person">Person</option>
            <option value="vehicle">Vehicle</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>
    </div>
  );
};
