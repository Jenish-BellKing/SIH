"""
IBVAP Backend Configuration
"""
import os
import time

# Startup time for uptime tracking
START_TIME = time.time()

# Database path
DB_PATH = os.environ.get("IBVAP_DB_PATH", "ibvap.db")

# Snapshot directory
SNAPSHOT_DIR = os.environ.get("IBVAP_SNAPSHOTS", "snapshots")

# Version
VERSION = "1.0.0"

# Camera IDs
CAMERA_HUMAN = "CAM-HUMAN-01"
CAMERA_VEHICLE = "CAM-VEHICLE-01"
