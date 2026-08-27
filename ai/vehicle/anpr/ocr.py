"""
IBVAP — OCR Engine for license plates.
Uses EasyOCR (CPU-compatible, no CUDA required for prototype).

Why EasyOCR over PaddleOCR?
- Simpler Windows installation (no paddle/paddlepaddle dependency)
- Robust English alphanumeric recognition
- Well-maintained Python package

PaddleOCR is documented as an alternative in docs/ARCHITECTURE.md
but has complex Windows/Python 3.10 installation constraints.
"""
from __future__ import annotations
import re
from typing import Optional, Tuple

import numpy as np


class OCREngine:
    """
    EasyOCR-based plate reader.
    Initialized lazily to avoid slow startup when ANPR is sampled infrequently.
    """

    # Minimum character count for a plausible plate
    MIN_CHARS = 4
    # Maximum character count (most plates ≤ 10 chars)
    MAX_CHARS = 12

    def __init__(self, gpu: bool = False) -> None:
        self._gpu = gpu
        self._reader = None  # lazy init

    def _ensure_reader(self) -> None:
        if self._reader is None:
            import easyocr
            print("[OCR] Initializing EasyOCR (first call) …")
            self._reader = easyocr.Reader(["en"], gpu=self._gpu, verbose=False)
            print("[OCR] EasyOCR ready.")

    def read_plate(
        self, plate_img: np.ndarray
    ) -> Tuple[Optional[str], float]:
        """
        Attempt to read text from a preprocessed plate image.
        Returns (cleaned_text, confidence) or (None, 0.0) if unreadable.
        """
        if plate_img is None or plate_img.size == 0:
            return None, 0.0

        try:
            self._ensure_reader()
            results = self._reader.readtext(plate_img, detail=1)
        except Exception as exc:
            print(f"[OCR] read error: {exc}")
            return None, 0.0

        if not results:
            return None, 0.0

        # Combine all text spans and pick highest-confidence non-empty result
        results_sorted = sorted(results, key=lambda x: x[2], reverse=True)
        for _, text, conf in results_sorted:
            clean = _clean_plate_text(text)
            if self.MIN_CHARS <= len(clean) <= self.MAX_CHARS:
                return clean, float(conf)

        return None, 0.0


def _clean_plate_text(text: str) -> str:
    """Remove everything except uppercase letters and digits."""
    return re.sub(r"[^A-Z0-9]", "", text.upper().strip())
