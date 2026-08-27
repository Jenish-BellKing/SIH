"""
IBVAP — AI Detection Pipeline Runner
Team 1 (AI/ML) utility script.

Runs the YOLO + ByteTrack detection pipeline on selected test videos
and posts resulting events to the IBVAP backend API via POST /events.

Usage:
    # Run on a specific video
    python scripts/run_detection.py --video test-videos/humans/human_single.mp4 --mode human

    # Run on best video (selected by video_analyzer.py)
    python scripts/run_detection.py --auto --mode human
    python scripts/run_detection.py --auto --mode vehicle

    # Run on all available test videos
    python scripts/run_detection.py --all

Requirements (see ai/requirements.txt):
    pip install ultralytics opencv-python numpy requests

Environment variables:
    NEXT_PUBLIC_API_URL or API_URL — backend URL (default: http://localhost:8000)
    YOLO_MODEL_PATH               — path to YOLO model weights (default: models/yolov8n.pt)
    DETECTION_CONFIDENCE_THRESHOLD — minimum confidence (default: 0.50)

NOTE:
    AI model files (*.pt) are gitignored. Download yolov8n.pt:
        from ultralytics import YOLO
        YOLO("yolov8n.pt")  # auto-downloads on first use

    The ai/human/, ai/vehicle/, ai/anpr/ modules are scaffolds pending
    Team 1 implementation. This script uses Ultralytics directly as a
    stand-in until those modules are implemented.
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
OUTPUTS_DIR = REPO_ROOT / "outputs"
MODELS_DIR = REPO_ROOT / "models"
SELECTION_JSON = OUTPUTS_DIR / "video_selection.json"

# Backend URL from env
API_URL = os.getenv("NEXT_PUBLIC_API_URL") or os.getenv("API_URL") or "http://localhost:8000"
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH") or str(MODELS_DIR / "yolov8n.pt")
CONFIDENCE_THRESHOLD = float(os.getenv("DETECTION_CONFIDENCE_THRESHOLD", "0.50"))

# YOLO class IDs
PERSON_CLASS_ID = 0
VEHICLE_CLASS_IDS = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}


# ---------------------------------------------------------------------------
# Dependency checks
# ---------------------------------------------------------------------------

def check_dependencies() -> bool:
    ok = True
    try:
        import cv2  # noqa: F401
    except ImportError:
        print("[ERROR] opencv-python not installed: pip install opencv-python")
        ok = False
    try:
        from ultralytics import YOLO  # noqa: F401
    except ImportError:
        print("[ERROR] ultralytics not installed: pip install ultralytics")
        ok = False
    try:
        import requests  # noqa: F401
    except ImportError:
        print("[ERROR] requests not installed: pip install requests")
        ok = False
    return ok


# ---------------------------------------------------------------------------
# Backend health check
# ---------------------------------------------------------------------------

def check_backend() -> bool:
    import requests
    try:
        r = requests.get(f"{API_URL}/health", timeout=5)
        if r.status_code == 200:
            data = r.json()
            print(f"[OK] Backend healthy: {data.get('status')} v{data.get('version')}")
            return True
    except Exception as e:
        print(f"[WARN] Backend unreachable at {API_URL}: {e}")
    return False


# ---------------------------------------------------------------------------
# Event posting
# ---------------------------------------------------------------------------

def post_event(event: dict) -> bool:
    import requests
    try:
        r = requests.post(f"{API_URL}/events", json=event, timeout=10)
        if r.status_code == 201:
            return True
        print(f"[WARN] POST /events returned {r.status_code}: {r.text[:200]}")
        return False
    except Exception as e:
        print(f"[WARN] Failed to post event: {e}")
        return False


# ---------------------------------------------------------------------------
# Detection runner
# ---------------------------------------------------------------------------

def run_detection(video_path: Path, mode: str = "human") -> dict:
    """
    Run YOLO detection on a video file.
    mode: "human" | "vehicle" | "both"

    Returns:
        dict with detection counts, FPS, errors
    """
    if not check_dependencies():
        return {"error": "Missing dependencies"}

    import cv2
    from ultralytics import YOLO

    print(f"\n{'='*60}")
    print(f"IBVAP Detection Pipeline")
    print(f"  Video   : {video_path}")
    print(f"  Mode    : {mode}")
    print(f"  Model   : {YOLO_MODEL_PATH}")
    print(f"  API     : {API_URL}")
    print(f"  Conf    : {CONFIDENCE_THRESHOLD}")
    print(f"{'='*60}\n")

    if not video_path.exists():
        print(f"[ERROR] Video file not found: {video_path}")
        return {"error": "Video not found"}

    # Load model (downloads yolov8n.pt automatically if not present)
    try:
        model = YOLO(YOLO_MODEL_PATH)
        print(f"[OK] Loaded model: {YOLO_MODEL_PATH}")
    except Exception as e:
        print(f"[ERROR] Could not load YOLO model: {e}")
        print("  Try: from ultralytics import YOLO; YOLO('yolov8n.pt')")
        return {"error": str(e)}

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"[ERROR] Could not open video: {video_path}")
        return {"error": "Cannot open video"}

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    print(f"[INFO] Video: {total_frames} frames @ {video_fps:.1f} FPS")

    backend_available = check_backend()

    # Detection state
    track_counter = {"person": 0, "vehicle": 0}
    event_count = {"human": 0, "vehicle": 0, "anpr": 0}
    errors = []
    t_start = time.time()
    frame_idx = 0
    processed = 0

    # Process every Nth frame (for speed)
    FRAME_SKIP = max(1, int(video_fps / 10))  # ~10 inference frames per second

    # Determine which classes to detect
    target_classes = []
    if mode in ("human", "both"):
        target_classes.append(PERSON_CLASS_ID)
    if mode in ("vehicle", "both"):
        target_classes.extend(VEHICLE_CLASS_IDS.keys())

    print(f"[INFO] Processing every {FRAME_SKIP} frames (target classes: {target_classes})\n")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        if frame_idx % FRAME_SKIP != 0:
            continue

        processed += 1
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")

        try:
            results = model.track(
                frame,
                persist=True,
                conf=CONFIDENCE_THRESHOLD,
                classes=target_classes,
                verbose=False,
            )
        except Exception as e:
            errors.append(str(e))
            continue

        if not results or len(results) == 0:
            continue

        r = results[0]
        boxes = r.boxes

        if boxes is None:
            continue

        for box in boxes:
            cls_id = int(box.cls[0]) if box.cls is not None else -1
            conf = float(box.conf[0]) if box.conf is not None else 0.0
            track_id_raw = box.id[0] if box.id is not None else None
            xyxy = box.xyxy[0].tolist() if box.xyxy is not None else [0, 0, 0, 0]
            bbox = [int(x) for x in xyxy]

            if cls_id == PERSON_CLASS_ID and mode in ("human", "both"):
                track_counter["person"] += 1
                track_id = f"P{track_id_raw:03.0f}" if track_id_raw is not None else f"P{track_counter['person']:03d}"
                event = {
                    "event_type": "HUMAN_DETECTION",
                    "camera_id": "BOP-07",
                    "timestamp": now_iso,
                    "object_type": "person",
                    "track_id": track_id,
                    "confidence": round(conf, 4),
                    "severity": "INFO",
                    "snapshot": None,
                    "metadata": {"bbox": bbox},
                }
                if backend_available:
                    post_event(event)
                event_count["human"] += 1
                print(f"  [HUMAN] Frame {frame_idx} | Track {track_id} | Conf {conf:.2%} | BBox {bbox}")

            elif cls_id in VEHICLE_CLASS_IDS and mode in ("vehicle", "both"):
                vehicle_class = VEHICLE_CLASS_IDS[cls_id]
                track_counter["vehicle"] += 1
                track_id = f"V{track_id_raw:03.0f}" if track_id_raw is not None else f"V{track_counter['vehicle']:03d}"
                event = {
                    "event_type": "VEHICLE_DETECTION",
                    "camera_id": "BOP-03",
                    "timestamp": now_iso,
                    "object_type": "vehicle",
                    "track_id": track_id,
                    "confidence": round(conf, 4),
                    "severity": "INFO",
                    "snapshot": None,
                    "metadata": {"vehicle_class": vehicle_class, "bbox": bbox},
                }
                if backend_available:
                    post_event(event)
                event_count["vehicle"] += 1
                print(f"  [VEHICLE/{vehicle_class.upper()}] Frame {frame_idx} | Track {track_id} | Conf {conf:.2%}")

    cap.release()
    elapsed = time.time() - t_start
    inf_fps = processed / elapsed if elapsed > 0 else 0

    summary = {
        "video": str(video_path),
        "mode": mode,
        "frames_total": total_frames,
        "frames_processed": processed,
        "inference_fps": round(inf_fps, 2),
        "elapsed_seconds": round(elapsed, 2),
        "human_detections": event_count["human"],
        "vehicle_detections": event_count["vehicle"],
        "backend_connected": backend_available,
        "errors": errors[:10],
    }

    print(f"\n{'='*60}")
    print("DETECTION SUMMARY")
    print(f"  Frames processed : {processed}/{total_frames}")
    print(f"  Inference FPS    : {inf_fps:.1f}")
    print(f"  Human detections : {event_count['human']}")
    print(f"  Vehicle detections: {event_count['vehicle']}")
    print(f"  Backend connected: {backend_available}")
    if errors:
        print(f"  Errors ({len(errors)})     : {errors[0]}")
    print(f"{'='*60}\n")

    # Save result
    OUTPUTS_DIR.mkdir(exist_ok=True)
    result_path = OUTPUTS_DIR / f"detection_result_{int(time.time())}.json"
    with open(result_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Result saved: {result_path.relative_to(REPO_ROOT)}")

    return summary


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="IBVAP Detection Pipeline Runner")
    parser.add_argument("--video", type=str, help="Path to video file")
    parser.add_argument(
        "--mode",
        choices=["human", "vehicle", "both"],
        default="human",
        help="Detection mode (default: human)",
    )
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Auto-select video from outputs/video_selection.json",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Run on all available test videos",
    )
    args = parser.parse_args()

    if args.auto:
        if not SELECTION_JSON.exists():
            print("[ERROR] No video selection found. Run scripts/video_analyzer.py first.")
            sys.exit(1)
        with open(SELECTION_JSON) as f:
            sel = json.load(f)
        video_key = "human_detection_path" if args.mode in ("human", "both") else "vehicle_detection_path"
        video_path = REPO_ROOT / sel[video_key]
        run_detection(video_path, args.mode)

    elif args.all:
        for category, directory in {
            "humans": REPO_ROOT / "test-videos" / "humans",
            "vehicles": REPO_ROOT / "test-videos" / "vehicles",
        }.items():
            if not directory.exists():
                continue
            for path in sorted(directory.iterdir()):
                if path.suffix.lower() in {".mp4", ".avi", ".mov", ".mkv"}:
                    mode = "human" if category == "humans" else "vehicle"
                    run_detection(path, mode)

    elif args.video:
        video_path = Path(args.video)
        if not video_path.is_absolute():
            video_path = REPO_ROOT / args.video
        run_detection(video_path, args.mode)

    else:
        print("IBVAP Detection Runner")
        print("\nUsage:")
        print("  python scripts/run_detection.py --video test-videos/humans/example.mp4 --mode human")
        print("  python scripts/run_detection.py --auto --mode human")
        print("  python scripts/run_detection.py --all")
        print("\nNote: test-videos/ directories are currently empty.")
        print("Add video files and run scripts/video_analyzer.py first.")


if __name__ == "__main__":
    main()
