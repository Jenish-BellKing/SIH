"use client";

import React, { useState } from "react";
import { SystemEvent } from "@/types/event";
import { useSurveillance } from "@/context/SurveillanceContext";
import { EventFilters } from "./EventFilters";
import { EventDetailsModal } from "./EventDetailsModal";
import {
  ListTree,
  Eye,
  Camera as CameraIcon,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  Car,
  Users,
} from "lucide-react";
import {
  formatTimestamp,
  formatFullDateTime,
  getSeverityBadgeClass,
} from "@/lib/utils";

export const EventTable: React.FC = () => {
  const { events, cameras, selectedEvent, setSelectedEvent } =
    useSurveillance();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [selectedObjectType, setSelectedObjectType] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter events
  const filteredEvents = events.filter((evt) => {
    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const idMatch = evt.event_id.toLowerCase().includes(q);
      const trackMatch = evt.track_id?.toLowerCase().includes(q);
      const plateMatch = (evt.metadata?.plate_number as string)
        ?.toLowerCase()
        .includes(q);
      const camMatch = evt.camera_id.toLowerCase().includes(q);
      if (!idMatch && !trackMatch && !plateMatch && !camMatch) return false;
    }

    if (selectedCamera !== "ALL" && evt.camera_id !== selectedCamera) {
      return false;
    }
    if (selectedType !== "ALL" && evt.event_type !== selectedType) {
      return false;
    }
    if (selectedSeverity !== "ALL" && evt.severity !== selectedSeverity) {
      return false;
    }
    if (selectedObjectType !== "ALL" && evt.object_type !== selectedObjectType) {
      return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCamera("ALL");
    setSelectedType("ALL");
    setSelectedSeverity("ALL");
    setSelectedObjectType("ALL");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Event Filters Header */}
      <EventFilters
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        selectedCamera={selectedCamera}
        setSelectedCamera={(c) => {
          setSelectedCamera(c);
          setCurrentPage(1);
        }}
        selectedType={selectedType}
        setSelectedType={(t) => {
          setSelectedType(t);
          setCurrentPage(1);
        }}
        selectedSeverity={selectedSeverity}
        setSelectedSeverity={(s) => {
          setSelectedSeverity(s);
          setCurrentPage(1);
        }}
        selectedObjectType={selectedObjectType}
        setSelectedObjectType={(o) => {
          setSelectedObjectType(o);
          setCurrentPage(1);
        }}
        cameras={cameras}
        onReset={handleResetFilters}
      />

      {/* Table Container */}
      <div className="bg-[#0d131f] rounded-lg border border-slate-800 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#090e17] text-xs">
          <div className="flex items-center gap-2">
            <ListTree className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200 uppercase tracking-wide">
              EVENT FORENSIC LOGS ({filteredEvents.length} TOTAL)
            </span>
          </div>

          <span className="text-[11px] text-slate-400">
            Click any event row to open forensic analysis drawer
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">EVENT ID</th>
                <th className="py-2.5 px-3">TYPE</th>
                <th className="py-2.5 px-3">CAMERA</th>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">OBJECT / CLASS</th>
                <th className="py-2.5 px-3">TRACK ID</th>
                <th className="py-2.5 px-3">CONFIDENCE</th>
                <th className="py-2.5 px-3">SEVERITY</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 text-center text-slate-500 text-xs"
                  >
                    No surveillance events found matching selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((evt) => {
                  const severityStyle = getSeverityBadgeClass(evt.severity);
                  const isPerson = evt.object_type === "person";
                  const isANPR = evt.event_type === "ANPR";
                  const isIntrusion = evt.event_type === "INTRUSION";

                  return (
                    <tr
                      key={evt.event_id}
                      onClick={() => setSelectedEvent(evt)}
                      className="hover:bg-slate-900/60 transition cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 font-bold text-cyan-400 group-hover:text-cyan-300">
                        {evt.event_id}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isIntrusion
                              ? "text-red-400"
                              : isPerson
                              ? "text-emerald-400"
                              : isANPR
                              ? "text-amber-400"
                              : "text-blue-400"
                          }`}
                        >
                          {evt.event_type}
                          {evt.metadata?.simulated && (
                            <span className="text-[9px] bg-amber-950 text-amber-400 px-1 rounded border border-amber-800/50">
                              P2
                            </span>
                          )}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-300">
                        <span className="flex items-center gap-1">
                          <CameraIcon className="w-3 h-3 text-slate-500" />
                          <span>{evt.camera_id}</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-400">
                        {formatTimestamp(evt.timestamp)}
                      </td>

                      <td className="py-2.5 px-3 text-slate-200">
                        {isANPR ? (
                          <span className="font-bold text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50">
                            {(evt.metadata?.plate_number as string) || "PLATE"}
                          </span>
                        ) : (
                          <span className="capitalize">
                            {(evt.metadata?.vehicle_class as string) ||
                              evt.object_type}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-cyan-300">
                        {evt.track_id ? (
                          <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {evt.track_id}
                          </span>
                        ) : (
                          <span className="text-slate-600">--</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-300">
                        <span className="font-semibold text-emerald-400">
                          {Math.round(evt.confidence * 100)}%
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${severityStyle.bg} ${severityStyle.text} ${severityStyle.border}`}
                        >
                          {evt.severity}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-cyan-950 hover:text-cyan-300 text-slate-400 border border-slate-800 rounded text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Forensics</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#090e17] border-t border-slate-800 text-xs text-slate-400">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of{" "}
            {filteredEvents.length} events
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
              Page {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Forensic Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};
