"use client";

import React, { useState } from "react";
import { SystemEvent } from "@/types/event";
import {
  X,
  Camera as CameraIcon,
  Clock,
  Shield,
  FileCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  Layers,
} from "lucide-react";
import {
  formatFullDateTime,
  formatTimestamp,
  getSeverityBadgeClass,
} from "@/lib/utils";

interface EventDetailsModalProps {
  event: SystemEvent | null;
  onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const severityStyle = getSeverityBadgeClass(event.severity);
  const metadataJson = JSON.stringify(event.metadata, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPerson = event.object_type === "person";
  const isVehicle = event.object_type === "vehicle";
  const isANPR = event.event_type === "ANPR";
  const isIntrusion = event.event_type === "INTRUSION";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none font-mono">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0d131f] border border-slate-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] text-xs text-slate-300 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#090e17] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-0.5 rounded border text-[11px] font-bold uppercase ${severityStyle.bg} ${severityStyle.text} ${severityStyle.border}`}
            >
              {event.severity}
            </span>
            <h3 className="font-extrabold text-sm text-slate-100 tracking-wide">
              EVENT FORENSIC CARD: {event.event_id}
            </h3>
            {event.metadata?.simulated && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/60">
                SIMULATED [P2]
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 flex-1">
          {/* Snapshot Evidence Section */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Visual Evidence Snapshot
            </span>
            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              {/* Synthetic Camera Backdrop with Target BBox highlight */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(#06b6d4 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
                  backgroundSize: "20px 20px, 40px 40px, 40px 40px",
                }}
              />

              {/* Target BBox Overlay Visual */}
              <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
                <div
                  className={`p-6 rounded border-2 border-dashed ${
                    isIntrusion
                      ? "border-red-500 bg-red-950/20"
                      : isPerson
                      ? "border-emerald-500 bg-emerald-950/20"
                      : isANPR
                      ? "border-amber-500 bg-amber-950/20"
                      : "border-cyan-500 bg-cyan-950/20"
                  } mb-3`}
                >
                  <Cpu
                    className={`w-8 h-8 mx-auto mb-2 ${
                      isIntrusion
                        ? "text-red-400"
                        : isPerson
                        ? "text-emerald-400"
                        : isANPR
                        ? "text-amber-400"
                        : "text-cyan-400"
                    }`}
                  />
                  <span className="font-bold text-slate-100 text-sm block">
                    {event.event_type}
                  </span>
                  {event.metadata?.plate_number && (
                    <span className="inline-block mt-1 font-bold text-amber-300 text-sm px-2 py-0.5 bg-slate-950 border border-amber-500/50 rounded">
                      {event.metadata.plate_number as string}
                    </span>
                  )}
                  {event.track_id && (
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Persistent Track: {event.track_id}
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-500">
                  CAMERA: {event.camera_id} • INFERENCE CONFIDENCE:{" "}
                  {Math.round(event.confidence * 100)}%
                </div>
              </div>

              {/* Forensic Tag */}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/80 border border-slate-800 text-[10px] text-cyan-300">
                FRAME SNAPSHOT // EVIDENCE HASH: #{event.event_id.replace("EVT-", "0x")}
              </div>
            </div>
          </div>

          {/* Primary Metadata Key-Value Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-2.5 bg-slate-900/90 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">CAMERA SOURCE</span>
              <span className="font-bold text-slate-200">{event.camera_id}</span>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">TIMESTAMP (UTC)</span>
              <span className="font-bold text-slate-200 truncate block">
                {formatTimestamp(event.timestamp)}
              </span>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">TRACK ID</span>
              <span className="font-bold text-cyan-400">
                {event.track_id || "N/A"}
              </span>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">AI CONFIDENCE</span>
              <span className="font-bold text-emerald-400">
                {Math.round(event.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Raw Metadata JSON Inspector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                Raw Metadata Payload
              </span>
              <button
                onClick={handleCopyJson}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 flex items-center gap-1 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-cyan-400" />
                    <span>COPY JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto max-h-[160px] scrollbar-thin">
              {metadataJson}
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-[#090e17] sticky bottom-0 z-10">
          <span className="text-[11px] text-slate-500">
            Recorded: {formatFullDateTime(event.timestamp)}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded font-bold transition"
            >
              Export JSON
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
