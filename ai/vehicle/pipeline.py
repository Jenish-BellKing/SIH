"""
IBVAP — Vehicle Detection + Classification + ByteTrack + ANPR Pipeline
Scenario B: vehicle-road.mp4 → YOLO detection → classification → tracking → ANPR
"""
from __future__ import annotations

import json
import os
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import cv2
from ultralytics import YOLO


# COCO class IDs → vehicle_class name (as per DATA_SCHEMA.md)
VEHICLE_CLASS_MAP: Dict[int, str] = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}


class VehiclePipeline:
    """
    Vehicle detection + classification + tracking + ANPR pipeline.
    Uses YOLOv8n COCO pretrained — no fine-tuning required for prototype.
    """

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        camera_id: str = "CAM-VEHICLE-01",
        confidence_threshold: float = 0.35,
        anpr_enabled: bool = True,
        anpr_sample_every_n_frames: int = 5,
    ) -> None:
        print(f"[VehiclePipeline] Loading YOLO model '{model_path}' …")
        self.model = YOLO(model_path)
        self.camera_id = camera_id
        self.conf_threshold = confidence_threshold
        self.anpr_enabled = anpr_enabled
        self.anpr_sample_every = anpr_sample_every_n_frames

        if anpr_enabled:
            from ai.vehicle.anpr.pipeline import ANPRPipeline
            self.anpr: Optional[Any] = ANPRPipeline()
            print("[VehiclePipeline] ANPR pipeline initialized.")
        else:
            self.anpr = None

        self._reset_analytics()

    def _reset_analytics(self) -> None:
        # track_id → analytics
        self.all_tracks: Dict[str, Dict] = {}
        self.class_counts: Dict[str, int] = {
            "car": 0, "motorcycle": 0, "bus": 0, "truck": 0
        }
        self.peak_vehicles: int = 0
        self.anpr_count: int = 0
        self._anpr_results: Dict[str, Tuple[str, float]] = {}  # track→(plate, conf)

    def process_video(
        self, input_path: str, output_dir: str
    ) -> List[Dict[str, Any]]:
        """
        Process a video file end-to-end.
        Returns all per-frame detection dicts (canonical schema).
        Writes:
          - outputs/vehicle/annotated.mp4
          - outputs/vehicle/analytics.json
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Video not found: {input_path}")

        os.makedirs(output_dir, exist_ok=True)
        out_video_path = os.path.join(output_dir, "annotated.mp4")
        out_json_path = os.path.join(output_dir, "analytics.json")

        self._reset_analytics()

        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video: {input_path}")

        fps = max(1, int(cap.get(cv2.CAP_PROP_FPS)))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()

        print(
            f"[VehiclePipeline] {input_path}: {width}x{height} @ {fps} FPS, "
            f"~{total_frames} frames"
        )

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(out_video_path, fourcc, fps, (width, height))

        frame_idx = 0
        all_detections: List[Dict[str, Any]] = []

        stream = self.model.track(
            source=input_path,
            classes=list(VEHICLE_CLASS_MAP.keys()),
            tracker="bytetrack.yaml",
            conf=self.conf_threshold,
            stream=True,
            verbose=False,
        )

        for results in stream:
            frame_idx += 1
            frame = results.orig_img.copy()
            current_active: set = set()

            if results.boxes is not None and results.boxes.id is not None:
                boxes = results.boxes.xyxy.cpu().numpy()
                track_ids = results.boxes.id.int().cpu().numpy()
                confs = results.boxes.conf.cpu().numpy()
                classes = results.boxes.cls.int().cpu().numpy()

                for box, tid, conf, cls_id in zip(boxes, track_ids, confs, classes):
                    x1, y1, x2, y2 = map(int, box)
                    vehicle_class = VEHICLE_CLASS_MAP.get(int(cls_id), "car")
                    track_str = f"V{int(tid):03d}"
                    current_active.add(track_str)
                    now_iso = datetime.now(timezone.utc).strftime(
                        "%Y-%m-%dT%H:%M:%S"
                    )

                    # Update track analytics
                    if track_str not in self.all_tracks:
                        self.all_tracks[track_str] = {
                            "vehicle_class": vehicle_class,
                            "first_seen": now_iso,
                            "last_seen": now_iso,
                            "confidences": [],
                            "frame_count": 0,
                        }
                        self.class_counts[vehicle_class] = (
                            self.class_counts.get(vehicle_class, 0) + 1
                        )
                    tr = self.all_tracks[track_str]
                    tr["last_seen"] = now_iso
                    tr["confidences"].append(float(conf))
                    tr["frame_count"] += 1

                    metadata: Dict[str, Any] = {"vehicle_class": vehicle_class}

                    # ANPR — sample every N frames
                    if (
                        self.anpr is not None
                        and frame_idx % self.anpr_sample_every == 0
                        and track_str not in self._anpr_results
                    ):
                        h_frame, w_frame = frame.shape[:2]
                        crop = frame[
                            max(0, y1) : min(h_frame, y2),
                            max(0, x1) : min(w_frame, x2),
                        ]
                        if crop.size > 0:
                            try:
                                anpr_result = self.anpr.process_vehicle_crop(
                                    track_str, crop
                                )
                                if anpr_result is not None:
                                    plate_text, p_conf = anpr_result
                                    self._anpr_results[track_str] = (
                                        plate_text,
                                        round(p_conf, 2),
                                    )
                                    self.anpr_count += 1
                                    print(
                                        f"[ANPR] Track {track_str}: plate={plate_text} "
                                        f"conf={p_conf:.2f}"
                                    )
                            except Exception as exc:
                                print(f"[ANPR] Error for {track_str}: {exc}")

                    # Attach stable ANPR result to metadata if available
                    if track_str in self._anpr_results:
                        pl, pc = self._anpr_results[track_str]
                        metadata["plate"] = {"number": pl, "confidence": pc}
                        # Draw plate on frame
                        cv2.putText(
                            frame,
                            pl,
                            (x1, min(y2 + 22, height - 5)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.8,
                            (0, 255, 255),
                            2,
                            cv2.LINE_AA,
                        )

                    detection: Dict[str, Any] = {
                        "camera_id": self.camera_id,
                        "timestamp": now_iso,
                        "object_type": "vehicle",
                        "track_id": track_str,
                        "confidence": round(float(conf), 2),
                        "bbox": [x1, y1, x2, y2],
                        "metadata": metadata,
                    }
                    all_detections.append(detection)

                    # Annotate frame
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 100, 0), 2)
                    label = f"{vehicle_class} {track_str} {conf:.2f}"
                    _put_label(frame, label, x1, y1, (255, 200, 0))

            # Analytics overlay
            self.peak_vehicles = max(self.peak_vehicles, len(current_active))
            overlay = (
                f"Veh: {len(current_active)} | "
                f"Peak: {self.peak_vehicles} | "
                f"Unique: {len(self.all_tracks)} | "
                f"ANPR: {self.anpr_count}"
            )
            cv2.putText(
                frame, overlay, (15, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 200, 255), 2, cv2.LINE_AA,
            )

            writer.write(frame)

            if frame_idx % 100 == 0:
                print(
                    f"[VehiclePipeline] Frame {frame_idx}/{total_frames} | "
                    f"Active: {len(current_active)} | Unique: {len(self.all_tracks)}"
                )

        writer.release()

        # Build analytics JSON
        all_confs = [
            c
            for tr in self.all_tracks.values()
            for c in tr["confidences"]
        ]
        avg_conf = round(sum(all_confs) / len(all_confs), 3) if all_confs else 0.0

        track_summary = {}
        for tid, info in self.all_tracks.items():
            tr_confs = info["confidences"]
            plate = self._anpr_results.get(tid)
            track_summary[tid] = {
                "vehicle_class": info["vehicle_class"],
                "first_seen": info["first_seen"],
                "last_seen": info["last_seen"],
                "avg_confidence": round(sum(tr_confs) / len(tr_confs), 2),
                "frame_count": info["frame_count"],
                "plate": plate[0] if plate else None,
                "plate_confidence": plate[1] if plate else None,
            }

        analytics = {
            "camera_id": self.camera_id,
            "source": input_path,
            "current_vehicles": 0,
            "unique_vehicles_tracks": len(self.all_tracks),
            "peak_vehicles": self.peak_vehicles,
            "cars": self.class_counts["car"],
            "motorcycles": self.class_counts["motorcycle"],
            "buses": self.class_counts["bus"],
            "trucks": self.class_counts["truck"],
            "average_confidence": avg_conf,
            "anpr_detections": self.anpr_count,
            "total_frames_processed": frame_idx,
            "tracks": track_summary,
        }

        with open(out_json_path, "w") as f:
            json.dump(analytics, f, indent=2)

        print(
            f"[VehiclePipeline] Done. Unique vehicles: {len(self.all_tracks)}, "
            f"Peak: {self.peak_vehicles}, ANPR: {self.anpr_count}, Frames: {frame_idx}"
        )
        print(f"[VehiclePipeline] Video → {out_video_path}")
        print(f"[VehiclePipeline] Analytics → {out_json_path}")

        return all_detections


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _put_label(
    frame,
    text: str,
    x: int,
    y: int,
    color: Tuple,
    font_scale: float = 0.5,
) -> None:
    cv2.putText(
        frame, text, (x, max(y - 4, 12)),
        cv2.FONT_HERSHEY_SIMPLEX, font_scale, color, 1, cv2.LINE_AA,
    )
