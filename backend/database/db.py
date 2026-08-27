"""
IBVAP — SQLite persistence layer.
High-frequency live detections are NOT persisted here.
Only meaningful discrete events are stored.
"""
from __future__ import annotations
import json
import sqlite3
from typing import Any, Dict, List, Optional

from backend import config

DB_PATH = config.DB_PATH


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")  # better concurrent access
    return conn


def init_db() -> None:
    conn = get_db()
    cursor = conn.cursor()

    # Events table — stores meaningful AI events
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            event_id   TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            camera_id  TEXT NOT NULL,
            timestamp  TEXT NOT NULL,
            object_type TEXT,
            track_id   TEXT,
            confidence REAL,
            severity   TEXT,
            snapshot   TEXT,
            metadata   TEXT
        )
    """)

    # Analytics counters
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analytics (
            key   TEXT PRIMARY KEY,
            value INTEGER DEFAULT 0
        )
    """)

    # Cameras
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cameras (
            camera_id   TEXT PRIMARY KEY,
            name        TEXT,
            location    TEXT,
            status      TEXT,
            source_type TEXT,
            source      TEXT,
            latitude    REAL,
            longitude   REAL
        )
    """)

    # Seed analytics if empty
    cursor.execute("SELECT COUNT(*) FROM analytics")
    if cursor.fetchone()[0] == 0:
        for k in ("humans_detected", "vehicles_detected", "anpr_events", "critical_alerts"):
            cursor.execute("INSERT INTO analytics (key, value) VALUES (?, 0)", (k,))

    # Seed cameras if empty
    cursor.execute("SELECT COUNT(*) FROM cameras")
    if cursor.fetchone()[0] == 0:
        cameras = [
            (
                "CAM-HUMAN-01",
                "Human Detection Camera",
                "Prototype — Pedestrian Zone",
                "online",
                "video",
                "test-videos/humans/pedestrian-road.mp4",
                31.1048,
                77.1734,
            ),
            (
                "CAM-VEHICLE-01",
                "Vehicle & ANPR Camera",
                "Prototype — Vehicle Checkpoint",
                "online",
                "video",
                "test-videos/vehicles/vehicle-road.mp4",
                31.1082,
                77.1791,
            ),
        ]
        cursor.executemany(
            "INSERT INTO cameras VALUES (?,?,?,?,?,?,?,?)", cameras
        )

    conn.commit()
    conn.close()


def save_event(event_dict: Dict[str, Any]) -> None:
    conn = get_db()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO events
              (event_id, event_type, camera_id, timestamp, object_type,
               track_id, confidence, severity, snapshot, metadata)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            """,
            (
                event_dict["event_id"],
                event_dict["event_type"],
                event_dict["camera_id"],
                event_dict["timestamp"],
                event_dict.get("object_type"),
                event_dict.get("track_id"),
                event_dict.get("confidence"),
                event_dict.get("severity", "INFO"),
                event_dict.get("snapshot"),
                json.dumps(event_dict.get("metadata", {})),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def get_events(
    event_type: Optional[str] = None,
    camera_id: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict]:
    conn = get_db()
    try:
        query = "SELECT * FROM events WHERE 1=1"
        params: list = []
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)
        if camera_id:
            query += " AND camera_id = ?"
            params.append(camera_id)
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params += [limit, offset]
        rows = conn.execute(query, params).fetchall()
        result = []
        for row in rows:
            d = dict(row)
            d["metadata"] = json.loads(d["metadata"] or "{}")
            result.append(d)
        return result
    finally:
        conn.close()


def get_event_by_id(event_id: str) -> Optional[Dict]:
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM events WHERE event_id = ?", (event_id,)
        ).fetchone()
        if row:
            d = dict(row)
            d["metadata"] = json.loads(d["metadata"] or "{}")
            return d
        return None
    finally:
        conn.close()


def get_cameras(status: Optional[str] = None) -> List[Dict]:
    conn = get_db()
    try:
        if status:
            rows = conn.execute(
                "SELECT * FROM cameras WHERE status = ?", (status,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM cameras").fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def increment_statistic(key: str, amount: int = 1) -> None:
    conn = get_db()
    try:
        conn.execute(
            "UPDATE analytics SET value = value + ? WHERE key = ?", (amount, key)
        )
        conn.commit()
    finally:
        conn.close()


def get_analytics_summary() -> Dict:
    conn = get_db()
    try:
        stats = {
            row["key"]: row["value"]
            for row in conn.execute("SELECT * FROM analytics").fetchall()
        }
        stats["active_cameras"] = conn.execute(
            "SELECT COUNT(*) FROM cameras WHERE status = 'online'"
        ).fetchone()[0]
        stats["total_cameras"] = conn.execute(
            "SELECT COUNT(*) FROM cameras"
        ).fetchone()[0]
        return stats
    finally:
        conn.close()
