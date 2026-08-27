"""
IBVAP — Human pipeline test script.
Usage:
    python scripts/test_human.py --input test-videos/humans/pedestrian-road.mp4
    python scripts/test_human.py --input test-videos/humans/pedestrian-road.mp4 --post-backend
"""
from __future__ import annotations
import argparse
import json
import os
import sys

# Ensure repo root is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run human detection + tracking on a video."
    )
    parser.add_argument("--input", required=True, help="Input video path")
    parser.add_argument(
        "--output-dir", default="outputs/human", help="Output directory"
    )
    parser.add_argument(
        "--model", default="yolov8n.pt", help="YOLO model path/name"
    )
    parser.add_argument(
        "--camera-id", default="CAM-HUMAN-01", help="Camera ID tag"
    )
    parser.add_argument(
        "--conf", type=float, default=0.35, help="Detection confidence threshold"
    )
    parser.add_argument(
        "--post-backend",
        action="store_true",
        help="POST unique track-level events to the running backend (localhost:8000)",
    )
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"[ERROR] Input video does not exist: {args.input}")
        sys.exit(1)

    from ai.human.pipeline import HumanPipeline

    pipeline = HumanPipeline(
        model_path=args.model,
        camera_id=args.camera_id,
        confidence_threshold=args.conf,
    )

    print(f"\n{'='*60}")
    print(f"IBVAP — Human Detection Pipeline")
    print(f"Input  : {args.input}")
    print(f"Output : {args.output_dir}")
    print(f"Model  : {args.model}")
    print(f"Camera : {args.camera_id}")
    print(f"{'='*60}\n")

    detections = pipeline.process_video(args.input, args.output_dir)

    print(f"\n[Result] Total frame-level detections: {len(detections)}")
    print(f"[Result] Unique track IDs: {len(pipeline.all_tracks)}")
    print(f"[Result] Peak simultaneous people: {pipeline.peak_people}")

    # Print first 3 sample detections
    if detections:
        print("\n[Sample detections (first 3)]:")
        for d in detections[:3]:
            print(f"  {json.dumps(d)}")

    # Optionally POST unique track events to backend
    if args.post_backend:
        _post_human_events_to_backend(pipeline, args.camera_id)

    print("\n[Done] Human pipeline completed successfully.")


def _post_human_events_to_backend(pipeline, camera_id: str) -> None:
    import requests
    from datetime import datetime, timezone

    base_url = "http://localhost:8000"
    print(f"\n[Backend] Posting {len(pipeline.all_tracks)} track events to {base_url}/events …")

    for track_id, info in pipeline.all_tracks.items():
        tr_confs = info["confidences"]
        avg_conf = sum(tr_confs) / len(tr_confs) if tr_confs else 0.0
        event = {
            "event_id": f"EVT-{track_id}-{camera_id}",
            "event_type": "HUMAN_DETECTION",
            "camera_id": camera_id,
            "timestamp": info.get("first_seen", datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")),
            "object_type": "person",
            "track_id": track_id,
            "confidence": round(avg_conf, 2),
            "severity": "INFO",
            "snapshot": None,
            "metadata": {
                "dwell_time_seconds": info.get("frame_count", 0),
                "first_seen": info.get("first_seen"),
                "last_seen": info.get("last_seen"),
            },
        }
        try:
            r = requests.post(f"{base_url}/events", json=event, timeout=5)
            print(f"  {track_id} → HTTP {r.status_code}")
        except Exception as exc:
            print(f"  {track_id} → FAILED: {exc}")


if __name__ == "__main__":
    main()
