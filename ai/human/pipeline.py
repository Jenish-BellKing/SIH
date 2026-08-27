"""
IBVAP — Human Detection + ByteTrack Pipeline
Scenario A: pedestrian-road.mp4 → YOLO person detection → ByteTrack → analytics
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import cv2
from ultralytics import YOLO


class HumanPipeline:
    """
    Headless human detection pipeline.
    - Loads YOLOv8n (pretrained COCO).
    - Uses YOLO's built-in ByteTrack integration (classes=[0] = person).
    - Annotates video with bboxes, track IDs, confidence, and live analytics.
    - Returns per-frame detections in canonical schema.
    """

    PERSON_CLASS = 0

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        camera_id: str = "CAM-HUMAN-01",
        confidence_threshold: float = 0.35,
    ) -> None:
        print(f"[HumanPipeline] Loading YOLO model '{model_path}' …")
        self.model = YOLO(model_path)
        self.camera_id = camera_id
        self.conf_threshold = confidence_threshold

        # Analytics state — reset per video run
        self._reset_analytics()

    def _reset_analytics(self) -> None:
        self.all_tracks: dict = {}   # track_id → {first_seen, last_seen, confidences}
        self.peak_people: int = 0
        self._current_active: int = 0

    def process_video(
        self,
        input_path: str,
        output_dir: str,
    ) -> List[Dict[str, Any]]:
        """
        Process a video file end-to-end.

        Returns a list of ALL per-frame detection dicts (canonical schema).
        Also writes:
          - outputs/human/annotated.mp4
          - outputs/human/analytics.json
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
            f"[HumanPipeline] {input_path}: {width}x{height} @ {fps} FPS, "
            f"~{total_frames} frames"
        )

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(out_video_path, fourcc, fps, (width, height))

        frame_idx = 0
        all_detections: List[Dict[str, Any]] = []

        stream = self.model.track(
            source=input_path,
            classes=[self.PERSON_CLASS],
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

                for box, tid, conf in zip(boxes, track_ids, confs):
                    x1, y1, x2, y2 = map(int, box)
                    track_str = f"P{int(tid):03d}"
                    current_active.add(track_str)

                    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")

                    # Update per-track analytics
                    if track_str not in self.all_tracks:
                        self.all_tracks[track_str] = {
                            "first_seen": now_iso,
                            "last_seen": now_iso,
                            "confidences": [],
                            "frame_count": 0,
                        }
                    tr = self.all_tracks[track_str]
                    tr["last_seen"] = now_iso
                    tr["confidences"].append(float(conf))
                    tr["frame_count"] += 1

                    detection: Dict[str, Any] = {
                        "camera_id": self.camera_id,
                        "timestamp": now_iso,
                        "object_type": "person",
                        "track_id": track_str,
                        "confidence": round(float(conf), 2),
                        "bbox": [x1, y1, x2, y2],
                        "metadata": {},
                    }
                    all_detections.append(detection)

                    # Annotate frame
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 230, 60), 2)
                    label = f"Person {track_str} {conf:.2f}"
                    _put_label(frame, label, x1, y1, (0, 230, 60))

            # Analytics overlay
            self.peak_people = max(self.peak_people, len(current_active))
            self._current_active = len(current_active)
            overlay_text = (
                f"Active: {self._current_active} | "
                f"Peak: {self.peak_people} | "
                f"Unique: {len(self.all_tracks)}"
            )
            cv2.putText(
                frame, overlay_text, (15, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 0, 230), 2, cv2.LINE_AA,
            )

            writer.write(frame)

            if frame_idx % 100 == 0:
                print(
                    f"[HumanPipeline] Frame {frame_idx}/{total_frames} | "
                    f"Active: {self._current_active} | Unique: {len(self.all_tracks)}"
                )

        writer.release()

        # Build analytics summary
        all_confs = [
            c
            for tr in self.all_tracks.values()
            for c in tr["confidences"]
        ]
        avg_conf = round(sum(all_confs) / len(all_confs), 3) if all_confs else 0.0

        # Build per-track summary
        track_summary = {}
        for tid, info in self.all_tracks.items():
            tr_confs = info["confidences"]
            track_summary[tid] = {
                "first_seen": info["first_seen"],
                "last_seen": info["last_seen"],
                "avg_confidence": round(sum(tr_confs) / len(tr_confs), 2),
                "frame_count": info["frame_count"],
            }

        analytics = {
            "camera_id": self.camera_id,
            "source": input_path,
            "current_active_people": 0,  # 0 at end-of-video
            "unique_tracks": len(self.all_tracks),
            "peak_people": self.peak_people,
            "average_confidence": avg_conf,
            "total_frames_processed": frame_idx,
            "tracks": track_summary,
        }

        with open(out_json_path, "w") as f:
            json.dump(analytics, f, indent=2)

        print(
            f"[HumanPipeline] Done. Unique people: {len(self.all_tracks)}, "
            f"Peak: {self.peak_people}, Frames: {frame_idx}"
        )
        print(f"[HumanPipeline] Video → {out_video_path}")
        print(f"[HumanPipeline] Analytics → {out_json_path}")

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
    bg_y = max(y - 12, 0)
    cv2.putText(
        frame, text, (x, max(y - 4, 12)),
        cv2.FONT_HERSHEY_SIMPLEX, font_scale, color, 1, cv2.LINE_AA,
    )
