"""
IBVAP — ANPR Temporal Aggregator.
Accumulates OCR observations per track and returns a stable plate
only when sufficient consistent evidence is gathered.

ANPR Reliability Rule:
  Never trust a single frame's OCR read.
  Aggregate across multiple frames per track.
  Return None if result is uncertain.
"""
from __future__ import annotations
from collections import Counter, defaultdict
from typing import Dict, List, Optional, Set, Tuple


class PlateAggregator:
    """
    Per-track plate buffer with configurable reliability thresholds.

    Parameters
    ----------
    min_observations : int
        Minimum number of high-confidence OCR reads before emitting a result.
    conf_threshold : float
        Minimum per-frame OCR confidence to count as an observation.
    majority_ratio : float
        Fraction of observations that must agree on the same text.
    """

    def __init__(
        self,
        min_observations: int = 3,
        conf_threshold: float = 0.50,
        majority_ratio: float = 0.60,
    ) -> None:
        self.min_observations = min_observations
        self.conf_threshold = conf_threshold
        self.majority_ratio = majority_ratio

        # track_id → [(text, conf), …]
        self._observations: Dict[str, List[Tuple[str, float]]] = defaultdict(list)
        # Tracks for which a stable plate has already been emitted (no re-emit)
        self._emitted: Set[str] = set()

    def add_observation(
        self,
        track_id: str,
        plate_text: str,
        conf: float,
    ) -> Optional[Tuple[str, float]]:
        """
        Add one OCR observation for a track.

        Returns (plate_text, avg_conf) if a stable result can now be emitted,
        None otherwise. Once emitted for a track, returns None for all future calls.
        """
        if track_id in self._emitted:
            return None  # Already locked — do not re-emit

        if conf >= self.conf_threshold and len(plate_text) >= 4:
            self._observations[track_id].append((plate_text, conf))

        return self._evaluate(track_id)

    def _evaluate(self, track_id: str) -> Optional[Tuple[str, float]]:
        obs = self._observations[track_id]
        if len(obs) < self.min_observations:
            return None

        counter = Counter(text for text, _ in obs)
        most_common_text, count = counter.most_common(1)[0]

        if count / len(obs) >= self.majority_ratio:
            # Lock and compute average confidence for the winning text
            matching_confs = [c for t, c in obs if t == most_common_text]
            avg_conf = sum(matching_confs) / len(matching_confs)
            self._emitted.add(track_id)
            return most_common_text, round(avg_conf, 3)

        return None

    def get_all_emitted(self) -> Dict[str, str]:
        """Return {track_id: plate_text} for all locked plates."""
        result = {}
        for tid in self._emitted:
            obs = self._observations[tid]
            counter = Counter(t for t, _ in obs)
            result[tid] = counter.most_common(1)[0][0]
        return result

    def reset_track(self, track_id: str) -> None:
        """Clear observations for a track (e.g., re-entry after long absence)."""
        self._observations.pop(track_id, None)
        self._emitted.discard(track_id)
