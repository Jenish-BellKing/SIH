# IBVAP — Team 1 AI + Backend: Setup & Usage

## Quick Start

### 1. Install dependencies

```bash
pip install -r ai/requirements.txt
pip install -r backend/requirements.txt
```

### 2. Run the backend

```bash
python scripts/run_backend.py
# Server: http://localhost:8000
# Docs:   http://localhost:8000/docs
# WS:     ws://localhost:8000/ws/analytics
```

### 3. Run human detection pipeline (Scenario A)

```bash
python scripts/test_human.py --input test-videos/humans/pedestrian-road.mp4
# Output: outputs/human/annotated.mp4 + analytics.json
```

### 4. Run vehicle + ANPR pipeline (Scenario B)

```bash
python scripts/test_vehicle.py --input test-videos/vehicles/vehicle-road.mp4
# Output: outputs/vehicle/annotated.mp4 + analytics.json
```

### 5. Run with backend integration (post events)

```bash
# Start backend first, then in a second terminal:
python scripts/test_human.py --input test-videos/humans/pedestrian-road.mp4 --post-backend
python scripts/test_vehicle.py --input test-videos/vehicles/vehicle-road.mp4 --post-backend
```

### 6. Run tests

```bash
python -m pytest tests/ -v
# 30 tests: 18 backend + 12 ANPR unit tests
```

---

## API Endpoints

| Method | Path | Description |
|:---|:---|:---|
| GET | `/health` | Service health check |
| GET | `/cameras` | List prototype cameras |
| GET | `/analytics/summary` | Aggregated detection counts |
| GET | `/events` | Paginated/filterable event log |
| GET | `/events/{id}` | Single event detail |
| POST | `/events` | Ingest event from AI pipeline |
| GET | `/alerts` | HIGH/CRITICAL events |
| WS | `/ws/analytics` | Live detection + event stream |

---

## Architecture

```
AI Pipelines (headless scripts)
        │
        ▼
  EventService (backend/services/)
        │
   ┌────┴────┐
   ▼         ▼
SQLite    WebSocket ──→ Frontend (Team 2)
```

- **No inference in API routes**
- **No frame-level DB writes** (only meaningful aggregated events)
- **Cameras:** CAM-HUMAN-01 (pedestrian), CAM-VEHICLE-01 (vehicles+ANPR)

## ANPR Notes

ANPR uses temporal aggregation — a plate is confirmed only after ≥3 consistent
OCR reads above 50% confidence with ≥60% majority agreement. Single-frame reads
are NEVER reported as confirmed plates.

If the test video has low plate resolution, motion blur, or unrealistic synthetic
plate text, ANPR will correctly return null rather than fabricate a result.
