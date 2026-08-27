"use client";

import React, { useRef, useEffect } from "react";
import { HumanDetection, VehicleDetection, ANPREvent } from "@/types/detection";

interface AIOverlayCanvasProps {
  width: number;
  height: number;
  detections?: Array<HumanDetection | VehicleDetection>;
  anprEvent?: ANPREvent | null;
  showBoundingBoxes?: boolean;
  showTrackIds?: boolean;
  showConfidence?: boolean;
  showANPR?: boolean;
  showVirtualFence?: boolean;
  isThreatSector?: boolean;
}

export const AIOverlayCanvas: React.FC<AIOverlayCanvasProps> = ({
  width,
  height,
  detections = [],
  anprEvent = null,
  showBoundingBoxes = true,
  showTrackIds = true,
  showConfidence = true,
  showANPR = true,
  showVirtualFence = true,
  isThreatSector = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Coordinate scale factors (standard reference frame 1000x700 for mock bboxes)
    const refW = 1000;
    const refH = 700;
    const scaleX = width / refW;
    const scaleY = height / refH;

    // 1. Draw Virtual Restricted Perimeter Fence (Phase 2 Simulated Feature)
    if (showVirtualFence) {
      ctx.save();
      ctx.beginPath();
      // Sector Boundary Line
      ctx.moveTo(width * 0.1, height * 0.75);
      ctx.lineTo(width * 0.45, height * 0.65);
      ctx.lineTo(width * 0.9, height * 0.82);

      ctx.strokeStyle = isThreatSector
        ? "rgba(239, 68, 68, 0.85)"
        : "rgba(245, 158, 11, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();

      // Virtual Fence Label
      ctx.font = "bold 10px monospace";
      ctx.fillStyle = isThreatSector
        ? "rgba(239, 68, 68, 0.95)"
        : "rgba(245, 158, 11, 0.85)";
      ctx.fillText(
        isThreatSector
          ? "⚠ BREACH ZONE // RED PERIMETER [SIMULATED]"
          : "--- CALIBRATED VIRTUAL FENCE [SIMULATED] ---",
        width * 0.12,
        height * 0.73
      );
      ctx.restore();
    }

    // 2. Draw AI Detections (Person / Vehicle)
    if (showBoundingBoxes && detections.length > 0) {
      detections.forEach((det) => {
        const [x1, y1, x2, y2] = det.bbox;
        const bx = x1 * scaleX;
        const by = y1 * scaleY;
        const bw = (x2 - x1) * scaleX;
        const bh = (y2 - y1) * scaleY;

        const isPerson = det.object_type === "person";
        const themeColor = isPerson ? "#10B981" : "#06B6D4"; // Emerald for human, Cyan for vehicle
        const darkThemeBg = isPerson
          ? "rgba(6, 78, 59, 0.85)"
          : "rgba(12, 74, 110, 0.85)";

        ctx.save();

        // Draw Tactical HUD Corner Brackets
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2;
        const cornerLen = Math.min(16, bw * 0.25, bh * 0.25);

        // Top-Left Corner
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();

        // Top-Right Corner
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cornerLen);
        ctx.stroke();

        // Bottom-Left Corner
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - cornerLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cornerLen, by + bh);
        ctx.stroke();

        // Bottom-Right Corner
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cornerLen);
        ctx.stroke();

        // Subtle bounding box fill
        ctx.fillStyle = isPerson
          ? "rgba(16, 185, 129, 0.08)"
          : "rgba(6, 182, 212, 0.08)";
        ctx.fillRect(bx, by, bw, bh);

        // Header Label Tag
        const vehicleClass = (det as VehicleDetection).vehicle_class;
        const objLabel = isPerson
          ? "PERSON"
          : (vehicleClass || "VEHICLE").toUpperCase();
        const confPercent = Math.round(det.confidence * 100);
        const trackTag = showTrackIds && det.track_id ? ` [${det.track_id}]` : "";
        const confTag = showConfidence ? ` ${confPercent}%` : "";
        const fullLabel = `${objLabel}${trackTag}${confTag}`;

        ctx.font = "bold 11px monospace";
        const textMetrics = ctx.measureText(fullLabel);
        const tagPadding = 4;
        const tagW = textMetrics.width + tagPadding * 2;
        const tagH = 16;

        ctx.fillStyle = darkThemeBg;
        ctx.fillRect(bx, Math.max(0, by - tagH), tagW, tagH);

        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, Math.max(0, by - tagH), tagW, tagH);

        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(fullLabel, bx + tagPadding, Math.max(12, by - 4));

        // Center crosshair
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 1;
        const cx = bx + bw / 2;
        const cy = by + bh / 2;
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy);
        ctx.lineTo(cx + 4, cy);
        ctx.moveTo(cx, cy - 4);
        ctx.lineTo(cx, cy + 4);
        ctx.stroke();

        ctx.restore();
      });
    }

    // 3. Draw ANPR Number Plate Overlay Badge
    if (showANPR && anprEvent) {
      ctx.save();
      const px = width * 0.4;
      const py = height * 0.45;

      // License Plate Plate Box
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 2;
      ctx.fillRect(px, py, 170, 42);
      ctx.strokeRect(px, py, 170, 42);

      // Plate header
      ctx.fillStyle = "#F59E0B";
      ctx.font = "bold 9px monospace";
      ctx.fillText("ANPR OCR // VERIFIED", px + 8, py + 12);

      // Plate Number
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 15px monospace";
      ctx.fillText(anprEvent.plate_number, px + 8, py + 30);

      // Confidence badge
      ctx.fillStyle = "#10B981";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`${Math.round(anprEvent.confidence * 100)}%`, px + 130, py + 30);

      ctx.restore();
    }
  }, [
    width,
    height,
    detections,
    anprEvent,
    showBoundingBoxes,
    showTrackIds,
    showConfidence,
    showANPR,
    showVirtualFence,
    isThreatSector,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
};
