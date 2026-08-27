"""
IBVAP — ANPR Unit Tests
Tests: aggregator, preprocessor, OCR interface (mocked)
Run: python -m pytest tests/test_anpr.py -v
"""
from __future__ import annotations
import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ai.vehicle.anpr.aggregator import PlateAggregator
from ai.vehicle.anpr.preprocessor import Preprocessor


# --------------------------------------------------------------------------- #
# Aggregator Tests
# --------------------------------------------------------------------------- #
class TestPlateAggregator:
    def test_no_result_below_min_observations(self):
        agg = PlateAggregator(min_observations=3, conf_threshold=0.5)
        result = agg.add_observation("V001", "TN38AB1234", 0.85)
        assert result is None  # only 1 obs

    def test_no_result_two_observations(self):
        agg = PlateAggregator(min_observations=3, conf_threshold=0.5)
        agg.add_observation("V001", "TN38AB1234", 0.85)
        result = agg.add_observation("V001", "TN38AB1234", 0.90)
        assert result is None  # only 2 obs

    def test_stable_result_after_min_observations(self):
        agg = PlateAggregator(min_observations=3, conf_threshold=0.5)
        agg.add_observation("V001", "TN38AB1234", 0.85)
        agg.add_observation("V001", "TN38AB1234", 0.90)
        result = agg.add_observation("V001", "TN38AB1234", 0.88)
        assert result is not None
        text, conf = result
        assert text == "TN38AB1234"
        assert 0.0 < conf <= 1.0

    def test_no_emit_below_conf_threshold(self):
        agg = PlateAggregator(min_observations=2, conf_threshold=0.8)
        agg.add_observation("V002", "DL01AB9999", 0.4)  # below threshold
        result = agg.add_observation("V002", "DL01AB9999", 0.5)  # still below
        assert result is None

    def test_no_re_emit_after_stable(self):
        agg = PlateAggregator(min_observations=3, conf_threshold=0.5)
        agg.add_observation("V003", "MH12CD5678", 0.9)
        agg.add_observation("V003", "MH12CD5678", 0.9)
        first = agg.add_observation("V003", "MH12CD5678", 0.9)
        assert first is not None
        # All subsequent calls should return None
        for _ in range(5):
            r = agg.add_observation("V003", "MH12CD5678", 0.9)
            assert r is None

    def test_noisy_observations_consensus(self):
        agg = PlateAggregator(min_observations=3, conf_threshold=0.5, majority_ratio=0.6)
        agg.add_observation("V004", "TN38AB1234", 0.9)
        agg.add_observation("V004", "TN38AB1234", 0.85)
        
        # 3rd observation triggers majority: (TN38AB1234 has 2 out of 3 = 66% > 60%)
        result = agg.add_observation("V004", "TN3BAB1234", 0.7)  # one noise read
        
        assert result is not None
        text, _ = result
        assert text == "TN38AB1234"


    def test_unreadable_plate_returns_none(self):
        agg = PlateAggregator(min_observations=3, conf_threshold=0.8)
        # All observations below threshold — never emits
        for _ in range(10):
            r = agg.add_observation("V005", "JUNK", 0.3)
            assert r is None

    def test_get_all_emitted(self):
        agg = PlateAggregator(min_observations=2, conf_threshold=0.5)
        agg.add_observation("V006", "KA01MN0001", 0.9)
        agg.add_observation("V006", "KA01MN0001", 0.85)
        emitted = agg.get_all_emitted()
        assert "V006" in emitted
        assert emitted["V006"] == "KA01MN0001"

    def test_reset_track(self):
        agg = PlateAggregator(min_observations=2, conf_threshold=0.5)
        agg.add_observation("V007", "GJ01AB1234", 0.9)
        agg.add_observation("V007", "GJ01AB1234", 0.9)
        agg.reset_track("V007")
        # After reset, must collect from scratch
        r = agg.add_observation("V007", "GJ01AB1234", 0.9)
        assert r is None  # only 1 obs after reset


# --------------------------------------------------------------------------- #
# Preprocessor Tests
# --------------------------------------------------------------------------- #
class TestPreprocessor:
    def test_preprocess_bgr_image(self):
        prep = Preprocessor()
        img = np.zeros((30, 100, 3), dtype=np.uint8)
        result = prep.process(img)
        assert result is not None
        assert result.ndim == 2  # grayscale output
        assert result.shape[0] == Preprocessor.TARGET_HEIGHT

    def test_preprocess_preserves_aspect_ratio(self):
        prep = Preprocessor()
        img = np.zeros((20, 80, 3), dtype=np.uint8)  # aspect ratio 4:1
        result = prep.process(img)
        h, w = result.shape[:2]
        assert h == Preprocessor.TARGET_HEIGHT
        expected_w = Preprocessor.TARGET_HEIGHT * 4
        assert abs(w - expected_w) <= 2  # allow 1-2px rounding

    def test_preprocess_empty_returns_empty(self):
        prep = Preprocessor()
        empty = np.array([])
        result = prep.process(empty)
        # Should not crash — returns the original
        assert result is not None
