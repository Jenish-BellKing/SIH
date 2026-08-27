"""
IBVAP — Plate image preprocessor.
Converts a raw vehicle/plate crop into a form suitable for OCR.
"""
from __future__ import annotations
import cv2
import numpy as np


class Preprocessor:
    """
    Standard plate preprocessing pipeline:
    1. Resize to consistent height (64px) preserving aspect ratio
    2. Convert to grayscale
    3. Bilateral filter (denoise while preserving edges)
    4. Adaptive threshold (handles variable lighting)
    """

    TARGET_HEIGHT = 64

    def process(self, plate_crop: np.ndarray) -> np.ndarray:
        if plate_crop is None or plate_crop.size == 0:
            return plate_crop

        h, w = plate_crop.shape[:2]
        if h == 0 or w == 0:
            return plate_crop

        # Resize
        ratio = w / h
        new_h = self.TARGET_HEIGHT
        new_w = max(1, int(new_h * ratio))
        resized = cv2.resize(plate_crop, (new_w, new_h), interpolation=cv2.INTER_CUBIC)

        # Grayscale
        if len(resized.shape) == 3:
            gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        else:
            gray = resized

        # Bilateral filter
        filtered = cv2.bilateralFilter(gray, 11, 17, 17)

        # CLAHE contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
        enhanced = clahe.apply(filtered)

        return enhanced
