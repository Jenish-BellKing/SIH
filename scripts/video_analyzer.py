"""
IBVAP — Test Video Analyzer
Team 3 (Video Testing) utility script.

Scans all videos in test-videos/humans/, test-videos/vehicles/, test-videos/anpr/
and scores each for human detection suitability and vehicle detection suitability.

Usage:
    python scripts/video_analyzer.py

Requirements:
    pip install opencv-python numpy

Output:
    - Console table showing scores for each video
    - outputs/video_selection.json  (machine-readable selection result)

Scoring criteria:
    Human detection: resolution, duration, estimated object size, lighting proxy
    Vehicle detection: resolution, duration, estimated object size, lighting proxy

NOTE: Test video directories are currently empty.
Add .mp4 / .avi / .mov files to test-videos/humans/ or test-videos/vehicles/
and re-run this script.
"""

import json
import sys
from pathlib import Path

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("[WARN] opencv-python not installed. Install with: pip install opencv-python numpy")
    print("       Running in metadata-only mode.\n")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).parent.parent
TEST_VIDEO_DIRS = {
    "humans": REPO_ROOT / "test-videos" / "humans",
    "vehicles": REPO_ROOT / "test-videos" / "vehicles",
    "anpr": REPO_ROOT / "test-videos" / "anpr",
}
OUTPUT_DIR = REPO_ROOT / "outputs"
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

# ---------------------------------------------------------------------------
# Video metadata extraction
# ---------------------------------------------------------------------------


def get_video_metadata(path: Path) -> dict:
    """Extract metadata from a video file using OpenCV."""
    meta = {
        "filename": path.name,
        "path": str(path),
        "extension": path.suffix.lower(),
        "file_size_mb": round(path.stat().st_size / (1024 * 1024), 2),
        "duration_s": None,
        "fps": None,
        "frame_count": None,
        "width": None,
        "height": None,
        "resolution": None,
        "aspect_ratio": None,
    }

    if not CV2_AVAILABLE:
        return meta

    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        return meta

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    meta["fps"] = round(fps, 2) if fps > 0 else None
    meta["frame_count"] = frame_count
    meta["width"] = width
    meta["height"] = height
    meta["resolution"] = f"{width}x{height}"
    meta["duration_s"] = round(frame_count / fps, 2) if fps and fps > 0 else None

    if width and height and height > 0:
        from math import gcd
        g = gcd(width, height)
        meta["aspect_ratio"] = f"{width // g}:{height // g}"

    cap.release()
    return meta


def sample_frame_brightness(path: Path, frame_idx: int = None) -> float:
    """Sample a frame and return mean brightness (0-255). Returns -1 on failure."""
    if not CV2_AVAILABLE:
        return -1
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        return -1
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    target = frame_idx if frame_idx is not None else max(0, total // 3)
    cap.set(cv2.CAP_PROP_POS_FRAMES, target)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return -1
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return float(np.mean(gray))


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------


def score_for_human_detection(meta: dict, brightness: float) -> dict:
    """
    Score a video for human detection suitability.
    Returns a score (0-100) and a reason string.
    """
    score = 0
    reasons = []

    # Resolution quality (higher = better visibility)
    w = meta.get("width") or 0
    h = meta.get("height") or 0
    if w >= 1920 and h >= 1080:
        score += 25
        reasons.append("Full HD resolution")
    elif w >= 1280 and h >= 720:
        score += 20
        reasons.append("HD resolution")
    elif w >= 640 and h >= 480:
        score += 12
        reasons.append("SD resolution")
    else:
        score += 5
        reasons.append("Low resolution")

    # Duration (longer = more frames for tracking evaluation)
    dur = meta.get("duration_s") or 0
    if dur >= 30:
        score += 20
        reasons.append("Long duration (good for tracking eval)")
    elif dur >= 10:
        score += 15
        reasons.append("Medium duration")
    elif dur >= 3:
        score += 8
        reasons.append("Short clip")
    else:
        score += 2

    # FPS (higher fps = less motion blur)
    fps = meta.get("fps") or 0
    if fps >= 25:
        score += 20
        reasons.append("High FPS (low motion blur)")
    elif fps >= 15:
        score += 12
        reasons.append("Medium FPS")
    else:
        score += 5

    # Lighting (brightness proxy)
    if brightness >= 50 and brightness <= 200:
        score += 20
        reasons.append("Good lighting conditions")
    elif brightness > 200:
        score += 10
        reasons.append("Overexposed (may reduce detection accuracy)")
    elif brightness >= 20:
        score += 10
        reasons.append("Low light (may reduce accuracy)")
    else:
        score += 2
        reasons.append("Very dark — poor detection conditions")

    # Category bonus (if in humans/ directory, likely relevant)
    score += 15
    reasons.append("Video in humans/ category")

    return {"score": min(score, 100), "reason": "; ".join(reasons)}


def score_for_vehicle_detection(meta: dict, brightness: float) -> dict:
    """
    Score a video for vehicle detection suitability.
    Returns a score (0-100) and a reason string.
    """
    score = 0
    reasons = []

    w = meta.get("width") or 0
    h = meta.get("height") or 0
    if w >= 1920 and h >= 1080:
        score += 25
        reasons.append("Full HD resolution")
    elif w >= 1280 and h >= 720:
        score += 20
        reasons.append("HD resolution")
    elif w >= 640 and h >= 480:
        score += 12
        reasons.append("SD resolution")
    else:
        score += 5

    dur = meta.get("duration_s") or 0
    if dur >= 30:
        score += 20
        reasons.append("Long duration")
    elif dur >= 10:
        score += 15
        reasons.append("Medium duration")
    elif dur >= 3:
        score += 8
    else:
        score += 2

    fps = meta.get("fps") or 0
    if fps >= 25:
        score += 20
        reasons.append("High FPS")
    elif fps >= 15:
        score += 12
    else:
        score += 5

    if brightness >= 50 and brightness <= 200:
        score += 20
        reasons.append("Good lighting")
    elif brightness > 200:
        score += 10
    elif brightness >= 20:
        score += 10
    else:
        score += 2

    # Category bonus
    score += 15
    reasons.append("Video in vehicles/ or anpr/ category")

    return {"score": min(score, 100), "reason": "; ".join(reasons)}


# ---------------------------------------------------------------------------
# Main analysis
# ---------------------------------------------------------------------------


def analyze_all_videos() -> dict:
    results = []
    for category, directory in TEST_VIDEO_DIRS.items():
        if not directory.exists():
            continue
        for path in sorted(directory.iterdir()):
            if path.suffix.lower() not in VIDEO_EXTENSIONS:
                continue
            print(f"  Analyzing: {path.name} ({category})")
            meta = get_video_metadata(path)
            brightness = sample_frame_brightness(path)
            meta["brightness_estimate"] = round(brightness, 1) if brightness >= 0 else None
            meta["category"] = category

            h_score = score_for_human_detection(meta, brightness)
            v_score = score_for_vehicle_detection(meta, brightness)

            # Reweight vehicle score for vehicle/anpr categories
            if category in ("vehicles", "anpr"):
                v_score["score"] = min(v_score["score"] + 10, 100)
            if category == "humans":
                h_score["score"] = min(h_score["score"] + 10, 100)

            results.append({
                "file": path.name,
                "category": category,
                "path": str(path.relative_to(REPO_ROOT)),
                "metadata": meta,
                "human_score": h_score["score"],
                "vehicle_score": v_score["score"],
                "human_reason": h_score["reason"],
                "vehicle_reason": v_score["reason"],
            })

    return results


def print_report(results: list) -> None:
    if not results:
        print("\n" + "=" * 70)
        print("NO TEST VIDEOS FOUND")
        print("=" * 70)
        print("\nTest video directories are empty.")
        print("Add video files to:")
        for category, directory in TEST_VIDEO_DIRS.items():
            print(f"  {directory.relative_to(REPO_ROOT)}/")
        print("\nSupported formats: .mp4 .avi .mov .mkv .webm")
        print("\nAfter adding videos, re-run this script:")
        print("  python scripts/video_analyzer.py")
        return

    print("\n" + "=" * 90)
    print(f"{'FILE':<30} {'CATEGORY':<12} {'RESOLUTION':<12} {'FPS':<8} {'DUR(s)':<8} {'H-SCORE':<10} {'V-SCORE'}")
    print("=" * 90)
    for r in results:
        meta = r["metadata"]
        print(
            f"{r['file'][:29]:<30} {r['category']:<12} "
            f"{(meta.get('resolution') or 'N/A'):<12} "
            f"{(meta.get('fps') or 'N/A'):<8} "
            f"{(meta.get('duration_s') or 'N/A'):<8} "
            f"{r['human_score']:<10} {r['vehicle_score']}"
        )

    best_human = max(results, key=lambda r: r["human_score"])
    best_vehicle = max(results, key=lambda r: r["vehicle_score"])

    print("\n" + "=" * 70)
    print("SELECTION RESULTS")
    print("=" * 70)
    print(f"BEST_HUMAN_VIDEO  : {best_human['file']} (score={best_human['human_score']})")
    print(f"  Reason: {best_human['human_reason']}")
    print(f"\nBEST_VEHICLE_VIDEO: {best_vehicle['file']} (score={best_vehicle['vehicle_score']})")
    print(f"  Reason: {best_vehicle['vehicle_reason']}")


def save_selection(results: list) -> None:
    if not results:
        return
    OUTPUT_DIR.mkdir(exist_ok=True)
    best_human = max(results, key=lambda r: r["human_score"])
    best_vehicle = max(results, key=lambda r: r["vehicle_score"])

    selection = {
        "human_detection_video": best_human["file"],
        "human_detection_path": best_human["path"],
        "vehicle_detection_video": best_vehicle["file"],
        "vehicle_detection_path": best_vehicle["path"],
        "human_score": best_human["human_score"],
        "vehicle_score": best_vehicle["vehicle_score"],
        "human_reason": best_human["human_reason"],
        "vehicle_reason": best_vehicle["vehicle_reason"],
        "all_videos": results,
    }

    out_path = OUTPUT_DIR / "video_selection.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(selection, f, indent=2)
    print(f"\n[OK] Selection saved to: {out_path.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    print("IBVAP Video Analyzer")
    print(f"Scanning: {REPO_ROOT.name}/test-videos/")
    results = analyze_all_videos()
    print_report(results)
    save_selection(results)
    sys.exit(0)
