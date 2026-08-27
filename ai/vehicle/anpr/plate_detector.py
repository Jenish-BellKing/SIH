"""
IBVAP — License Plate Detector using OpenCV Haar Cascade.
Operates on vehicle crops, not full frames.
"""
from __future__ import annotations
import os
import urllib.request
from typing import List, Tuple

import cv2
import numpy as np


HAAR_URL = (
    "https://raw.githubusercontent.com/opencv/opencv/master/"
    "data/haarcascades/haarcascade_russian_plate_number.xml"
)
HAAR_LOCAL = "haarcascade_russian_plate_number.xml"


class PlateDetector:
    """
    Haar-cascade license plate detector.
    Used on CROPPED vehicle regions only — never on full frames.
    """

    def __init__(self, cascade_path: str = HAAR_LOCAL) -> None:
        self._cascade: cv2.CascadeClassifier | None = None
        if cascade_path and os.path.exists(cascade_path):
            self._cascade = cv2.CascadeClassifier(cascade_path)
            if self._cascade.empty():
                print("[PlateDetector] Cascade loaded but empty — disabling.")
                self._cascade = None

        self._enabled = self._cascade is not None
        if not self._enabled:
            print("[PlateDetector] WARNING: cascade unavailable; "
                  "will use bottom-third heuristic.")

    def detect(self, vehicle_crop: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect plate regions within a vehicle crop.
        Returns list of (x, y, w, h) tuples within the crop coordinate system.
        """
        if vehicle_crop is None or vehicle_crop.size == 0:
            return []

        if not self._enabled:
            # Fallback: assume plate is in the bottom-third of the vehicle crop
            h, w = vehicle_crop.shape[:2]
            return [(0, h * 2 // 3, w, h // 3)]

        gray = cv2.cvtColor(vehicle_crop, cv2.COLOR_BGR2GRAY)
        plates = self._cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=3,
            minSize=(30, 10),
        )
        if not isinstance(plates, np.ndarray) or len(plates) == 0:
            return []
        return [tuple(map(int, p)) for p in plates]
