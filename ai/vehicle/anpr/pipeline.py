"""
IBVAP — ANPR Pipeline (Plate Detect → Preprocess → OCR → Aggregate).
Operates on vehicle CROPS only — never on full frames.
"""
from __future__ import annotations
from typing import Optional, Tuple

import numpy as np

from .plate_detector import PlateDetector
from .preprocessor import Preprocessor
from .ocr import OCREngine
from .aggregator import PlateAggregator


class ANPRPipeline:
    """
    Complete ANPR pipeline per vehicle track.

    Usage:
        pipeline = ANPRPipeline()
        # call every sampled frame:
        result = pipeline.process_vehicle_crop(track_id, crop)
        # result is (plate_text, conf) when stable, otherwise None
    """

    def __init__(
        self,
        min_observations: int = 3,
        conf_threshold: float = 0.50,
        majority_ratio: float = 0.60,
    ) -> None:
        self.detector = PlateDetector()
        self.preprocessor = Preprocessor()
        self.ocr = OCREngine(gpu=False)
        self.aggregator = PlateAggregator(
            min_observations=min_observations,
            conf_threshold=conf_threshold,
            majority_ratio=majority_ratio,
        )

    def process_vehicle_crop(
        self,
        track_id: str,
        vehicle_crop: np.ndarray,
    ) -> Optional[Tuple[str, float]]:
        """
        Feed one vehicle crop for a given track.
        Returns (plate_text, conf) once stable, or None.
        Never returns fabricated text.
        """
        if vehicle_crop is None or vehicle_crop.size == 0:
            return None

        # Step 1: Detect plate regions within the crop
        plate_rects = self.detector.detect(vehicle_crop)
        if not plate_rects:
            return None

        # Step 2: Take the largest plate region by area
        plate_rects_sorted = sorted(
            plate_rects, key=lambda r: r[2] * r[3], reverse=True
        )
        px, py, pw, ph = plate_rects_sorted[0]

        h_crop, w_crop = vehicle_crop.shape[:2]
        plate_crop = vehicle_crop[
            max(0, py) : min(h_crop, py + ph),
            max(0, px) : min(w_crop, px + pw),
        ]

        if plate_crop.size == 0:
            return None

        # Step 3: Preprocess
        processed = self.preprocessor.process(plate_crop)
        if processed is None or processed.size == 0:
            return None

        # Step 4: OCR
        text, conf = self.ocr.read_plate(processed)
        if not text:
            return None

        # Step 5: Temporal aggregation — return only when stable
        return self.aggregator.add_observation(track_id, text, conf)

    def get_all_confirmed_plates(self):
        """Return all confirmed plates across all tracks."""
        return self.aggregator.get_all_emitted()
