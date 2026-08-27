"""
IBVAP — Vehicle + ANPR pipeline test script.
Usage:
    python scripts/test_vehicle.py --input test-videos/vehicles/vehicle-road.mp4
    python scripts/test_vehicle.py --input test-videos/vehicles/vehicle-road.mp4 --post-backend
    python scripts/test_vehicle.py --input test-videos/vehicles/vehicle-road.mp4 --no-anpr
"""
from __future__ import annotations
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run vehicle detection + classification + tracking + ANPR."
    )
    parser.add_argument("--input", required=True, help="Input video path")
    parser.add_argument(
        "--output-dir", default="outputs/vehicle", help="Output directory"
    )
    parser.add_argument("--model", default="yolov8n.pt", help="YOLO model")
    parser.add_argument("--camera-id", default="CAM-VEHICLE-01")
    parser.add_argument("--conf", type=float, default=0.35)
    parser.add_argument(
        "--no-anpr", action="store_true", help="Disable ANPR for faster processing"
    )
    parser.add_argument(
        "--anpr-sample", type=int, default=5,
        help="Run ANPR every N frames (default: 5)"
    )
    parser.add_argument(
        "--post-backend",
        action="store_true",
        help="POST events to localhost:8000",
    )
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"[ERROR] Input video does not exist: {args.input}")
        sys.exit(1)

    from ai.vehicle.pipeline import VehiclePipeline

    pipeline = VehiclePipeline(
        model_path=args.model,
        camera_id=args.camera_id,
        confidence_threshold=args.conf,
        anpr_enabled=not args.no_anpr,
        anpr_sample_every_n_frames=args.anpr_sample,
    )

    print(f"\n{'='*60}")
    print(f"IBVAP — Vehicle Detection + ANPR Pipeline")
    print(f"Input  : {args.input}")
    print(f"Output : {args.output_dir}")
    print(f"Model  : {args.model}")
    print(f"Camera : {args.camera_id}")
    print(f"ANPR   : {'enabled (every %d frames)' % args.anpr_sample if not args.no_anpr else 'disabled'}")
    print(f"{'='*60}\n")

    detections = pipeline.process_video(args.input, args.output_dir)

    print(f"\n[Result] Total frame-level detections: {len(detections)}")
    print(f"[Result] Unique vehicle tracks: {len(pipeline.all_tracks)}")
    print(f"[Result] Peak simultaneous vehicles: {pipeline.peak_vehicles}")
    print(f"[Result] ANPR confirmed plates: {pipeline.anpr_count}")
    print(f"[Result] Class breakdown: {pipeline.class_counts}")

    if pipeline._anpr_results:
        print("\n[ANPR Results]:")
        for track_id, (plate, conf) in pipeline._anpr_results.items():
            print(f"  {track_id}: {plate} (conf={conf:.2f})")
    elif not args.no_anpr:
        print("\n[ANPR] No confirmed plates. Possible reasons:")
        print("  - Video may not have visible/readable license plates")
        print("  - Plates may be too small, blurry, or outside camera angle")
        print("  - OCR confidence threshold not met across ≥3 frames")

    if detections:
        print("\n[Sample detections (first 3)]:")
        for d in detections[:3]:
            print(f"  {json.dumps(d)}")

    if args.post_backend:
        _post_vehicle_events_to_backend(pipeline, args.camera_id)

    print("\n[Done] Vehicle pipeline completed successfully.")


def _post_vehicle_events_to_backend(pipeline, camera_id: str) -> None:
    import requests
    from datetime import datetime, timezone

    base_url = "http://localhost:8000"
    print(f"\n[Backend] Posting events to {base_url} …")

    for track_id, info in pipeline.all_tracks.items():
        tr_confs = info["confidences"]
        avg_conf = sum(tr_confs) / len(tr_confs) if tr_confs else 0.0
        plate_tuple = pipeline._anpr_results.get(track_id)

        metadata = {"vehicle_class": info["vehicle_class"]}
        if plate_tuple:
            metadata["plate_number"] = plate_tuple[0]
            metadata["plate_confidence"] = plate_tuple[1]

        event_type = "ANPR" if plate_tuple else "VEHICLE_DETECTION"
        event = {
            "event_id": f"EVT-{track_id}-{camera_id}",
            "event_type": event_type,
            "camera_id": camera_id,
            "timestamp": info.get(
                "first_seen",
                datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"),
            ),
            "object_type": "vehicle",
            "track_id": track_id,
            "confidence": round(avg_conf, 2),
            "severity": "MEDIUM" if plate_tuple else "INFO",
            "snapshot": None,
            "metadata": metadata,
        }
        try:
            r = requests.post(f"{base_url}/events", json=event, timeout=5)
            print(f"  {track_id} ({event_type}) → HTTP {r.status_code}")
        except Exception as exc:
            print(f"  {track_id} → FAILED: {exc}")


if __name__ == "__main__":
    main()
