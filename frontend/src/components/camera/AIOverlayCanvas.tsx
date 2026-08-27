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
    if (!canvas || width <= 0 || height <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas completely
    ctx.clearRect(0, 0, width, height);

    // Standard coordinate normalization
    // All detection coordinates are based on 1000x700 normalized coordinate system
    const refW = 1000;
    const refH = 700;
    const scaleX = width / refW;
    const scaleY = height / refH;

    // 1. Draw Calibrated Virtual Boundary / Perimeter Line
    if (showVirtualFence) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(width * 0.05, height * 0.72);
      ctx.lineTo(width * 0.48, height * 0.62);
      ctx.lineTo(width * 0.95, height * 0.80);

      ctx.strokeStyle = isThreatSector
        ? "rgba(239, 68, 68, 0.75)"
        : "rgba(245, 158, 11, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.stroke();

      // Virtual Line Indicator Label
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = isThreatSector
        ? "rgba(239, 68, 68, 0.9)"
        : "rgba(245, 158, 11, 0.8)";
      ctx.fillText(
        isThreatSector
          ? "⚠ RESTRICTED RED LINE [BREACH ACTIVE]"
          : "--- CALIBRATED VIRTUAL PERIMETER ---",
        width * 0.08,
        height * 0.70
      );
      ctx.restore();
    }

    // 2. Draw Precision YOLO AI Detections
    if (showBoundingBoxes && detections && detections.length > 0) {
      detections.forEach((det) => {
        if (!det.bbox || det.bbox.length < 4) return;
        const [x1, y1, x2, y2] = det.bbox;

        // Compute canvas coordinates
        const bx = Math.max(0, Math.min(width - 10, x1 * scaleX));
        const by = Math.max(0, Math.min(height - 10, y1 * scaleY));
        const bw = Math.max(15, Math.min(width - bx, (x2 - x1) * scaleX));
        const bh = Math.max(15, Math.min(height - by, (y2 - y1) * scaleY));

        const isPerson = det.object_type === "person";
        const vehicleClass = (det as VehicleDetection).vehicle_class || "car";

        // Color coding: Emerald for Persons, Cyan for Cars, Amber for Trucks/Buses
        const themeColor = isPerson
          ? "#10B981"
          : vehicleClass === "truck" || vehicleClass === "bus"
          ? "#F59E0B"
          : "#06B6D4";

        const bgBadgeColor = isPerson
          ? "rgba(6, 78, 59, 0.9)"
          : vehicleClass === "truck" || vehicleClass === "bus"
          ? "rgba(120, 53, 15, 0.9)"
          : "rgba(12, 74, 110, 0.9)";

        ctx.save();

        // High-tech Tactical Corner Brackets
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2;
        const cornerLen = Math.min(14, bw * 0.28, bh * 0.28);

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cornerLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - cornerLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cornerLen, by + bh);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cornerLen);
        ctx.stroke();

        // Box border outline
        ctx.strokeStyle = isPerson
          ? "rgba(16, 185, 129, 0.4)"
          : "rgba(6, 182, 212, 0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);

        // Semi-transparent target fill
        ctx.fillStyle = isPerson
          ? "rgba(16, 185, 129, 0.08)"
          : "rgba(6, 182, 212, 0.08)";
        ctx.fillRect(bx, by, bw, bh);

        // Object Label Tag
        const objLabel = isPerson ? "PERSON" : vehicleClass.toUpperCase();
        const confPercent = Math.round(det.confidence * 100);
        const trackTag = showTrackIds && det.track_id ? ` #${det.track_id}` : "";
        const confTag = showConfidence ? ` ${confPercent}%` : "";
        const fullLabel = `${objLabel}${trackTag}${confTag}`;

        ctx.font = "bold 10px monospace";
        const textMetrics = ctx.measureText(fullLabel);
        const tagPadding = 4;
        const tagW = textMetrics.width + tagPadding * 2;
        const tagH = 15;
        const tagY = Math.max(tagH, by);

        // Label Background Badge
        ctx.fillStyle = bgBadgeColor;
        ctx.fillRect(bx, tagY - tagH, tagW, tagH);

        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, tagY - tagH, tagW, tagH);

        // Text
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(fullLabel, bx + tagPadding, tagY - 4);

        // Center Target Crosshair
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 1;
        const cx = bx + bw / 2;
        const cy = by + bh / 2;
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy);
        ctx.lineTo(cx + 3, cy);
        ctx.moveTo(cx, cy - 3);
        ctx.lineTo(cx, cy + 3);
        ctx.stroke();

        ctx.restore();
      });
    }

    // 3. Draw ANPR Number Plate Overlay Badge
    if (showANPR && anprEvent && anprEvent.plate_number) {
      ctx.save();
      const px = width * 0.35;
      const py = height * 0.65;
      const pw = Math.min(220, width * 0.45);
      const ph = 38;

      ctx.fillStyle = "rgba(10, 15, 26, 0.92)";
      ctx.fillRect(px, py, pw, ph);

      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, py, pw, ph);

      // Plate Label
      ctx.fillStyle = "#F59E0B";
      ctx.font = "bold 9px monospace";
      ctx.fillText("ANPR OCR // VERIFIED", px + 8, py + 12);

      // Plate Text
      ctx.fillStyle = "#FDE68A";
      ctx.font = "bold 13px monospace";
      ctx.fillText(anprEvent.plate_number, px + 8, py + 29);

      // Confidence badge
      ctx.fillStyle = "#10B981";
      ctx.font = "bold 10px monospace";
      ctx.fillText(
        `${Math.round(anprEvent.confidence * 100)}%`,
        px + pw - 38,
        py + 29
      );

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
