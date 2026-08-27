# IBVAP — Intelligent Border Video Analytics Platform

[![Status](https://img.shields.io/badge/Status-Initialized-success.svg)](#)
[![Phase](https://img.shields.io/badge/Phase-1%20Prototype-blue.svg)](#)
[![Python](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.10+-3776AB.svg?logo=python)](#)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%20%7C%20TypeScript%20%7C%20Tailwind-black.svg?logo=next.js)](#)
[![AI/ML](https://img.shields.io/badge/AI-YOLOv8%20%7C%20ByteTrack%20%7C%20PaddleOCR-00FFFF.svg)](#)

---

## 1. Project Overview

**IBVAP** is an AI-powered surveillance and analytics platform designed to augment existing border CCTV infrastructure into an active, real-time threat detection and situational awareness Command Centre.

```
CCTV Feeds
    │
    ▼
Video Ingestion ──► AI Perception (YOLOv8) ──► Tracking (ByteTrack) ──► Rules Engine
                                                                            │
                                                                            ▼
Command Centre ◄── WebSocket Broadcast ◄── FastAPI / SQLite ◄── Events Generation
(Next.js / Map)
```

---

## 2. Shared Source of Truth (Frozen Contracts)

All 3 engineering teams must strictly adhere to the shared specifications before creating code:

| Document | Purpose & Description |
| :--- | :--- |
| **[`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)** | Master REST endpoints, status codes, query parameters, and WebSocket channel definition. |
| **[`docs/DATA_SCHEMA.md`](docs/DATA_SCHEMA.md)** | Immutable JSON data schemas for Cameras, Human/Vehicle Detections, ANPR, and Summary KPIs. |
| **[`docs/EVENT_SCHEMA.md`](docs/EVENT_SCHEMA.md)** | Universal Event Envelope format, severity matrix, and WebSocket frame structures. |
| **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** | End-to-end system design, pipeline topology, tech stack decisions, and anti-complexity rules. |
| **[`docs/DEVELOPMENT_RULES.md`](docs/DEVELOPMENT_RULES.md)** | Git commit conventions (`feat:`, `fix:`), team boundaries, and Schema Change Request (SCR) process. |
| **[`docs/DEMO_FLOW.md`](docs/DEMO_FLOW.md)** | Master 15-step demonstration script and evaluation checklist for jury presentation. |

---

## 3. Real AI vs. Simulated Features (Phase 1 vs. Phase 2)

To maintain engineering integrity, features are clearly partitioned:

### Real AI in Phase 1 (Genuine Implementation)
- **Human Detection:** Ultralytics YOLOv8 inference on person class.
- **Human Tracking:** ByteTrack multi-object tracking with persistent IDs (`P001`, `P023`).
- **Vehicle Detection & Classification:** YOLO classification into cars, trucks, motorcycles, buses.
- **ANPR (Plate Recognition):** License plate localization + PaddleOCR character extraction.

### Simulated / UI Placeholders in Phase 1 (Explicitly Labeled)
- **Intrusion Detection / Virtual Fence:** Simulated alert broadcast labeled as `[SIMULATION / PHASE 2]`.
- **Historical Analytics & Health Graphs:** Seeded trend metrics and telemetry.
- **Multi-Camera Threat Aggregation:** Heuristic score simulation.

### Phase 2 Roadmap
- True mathematical virtual line crossing & polygonal boundary ray-casting.
- Behavioural analytics (loitering timer, erratic movement, crawling).
- Cross-camera facial recognition & re-identification.
- Infrared / Thermal contrast enhancement filters.

---

## 4. Multi-Team Structure & Branch Ownership

| Team | Branch | Assigned Scope | Directory Ownership |
| :--- | :--- | :--- | :--- |
| **Team 1: AI/ML + Backend** | `team/ai-backend` | • Person A: Human Detection & Tracking<br>• Person B: Vehicle Detection, ANPR, FastAPI & SQLite | `ai/`, `backend/`, `models/`, `scripts/` |
| **Team 2: Frontend** | `team/frontend` | • Person A: Command Centre Dashboard<br>• Person B: Map View, Analytics, WebSocket client | `frontend/` |
| **Team 3: Video Testing** | `team/video-testing` | • Person A: Human test video benchmark<br>• Person B: Vehicle/ANPR test videos<br>*(Transitions to frontend after testing)* | `test-videos/`, `outputs/`, `video-generation-prompts/` |
| **Integration Staging** | `integration` | Cross-team integration and conflict resolution | Entire repository |
| **Production / Demo** | `main` | Final tested release branch | Protected |

---

## 5. Repository Directory Layout

```
SIH/
├── backend/
│   ├── app/
│   │   ├── api/             # REST route handlers
│   │   ├── schemas/         # Pydantic validation models
│   │   ├── models/          # SQLite database entities
│   │   ├── database/        # DB engine & session
│   │   ├── services/        # Business logic & event ingestion
│   │   ├── websocket/       # Connection manager & live broadcast hub
│   │   └── core/            # Config & security settings
│   ├── main.py              # FastAPI server entrypoint
│   └── requirements.txt     # Backend dependencies
│
├── ai/
│   ├── human/               # YOLO human detector + ByteTrack
│   ├── vehicle/             # Vehicle detector & classifier
│   ├── anpr/                # PaddleOCR plate extraction
│   ├── common/              # Bounding box utilities & frame extraction
│   └── requirements.txt     # AI perception dependencies
│
├── frontend/                # Next.js Command Centre application
├── models/                  # YOLO model storage (*.pt gitignored)
├── test-videos/
│   ├── humans/              # Controlled human video clips
│   ├── vehicles/            # Traffic video clips
│   └── anpr/                # License plate footage
├── outputs/                 # Annotated video outputs & benchmark logs
├── snapshots/               # Event snapshot image storage
├── scripts/
│   ├── mock_data/           # Schema-compliant mock JSON files
│   └── mock_server.py       # Instant mock backend for Frontend team
├── video-generation-prompts/# Synthesis prompts & test scenario definitions
├── docs/                    # Master shared contracts & specifications
├── .env.example             # Environment configuration template
├── .gitignore               # Strict ignore rules (no secrets/binaries)
├── docker-compose.yml       # Local container orchestrator
└── README.md
```

---

## 6. Quick Start Guide

### Option A: Frontend Development (Mock-First Mode)
Team 2 can start developing the dashboard immediately against the mock server:
```bash
# 1. Start the zero-dependency Mock Server (port 8000)
python scripts/mock_server.py

# 2. In a separate terminal, initialize and run Frontend (port 3000)
cd frontend
npm install
npm run dev
```

### Option B: Backend Development
```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Run FastAPI backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Option C: AI Pipeline Development
```bash
# Install AI requirements
pip install -r ai/requirements.txt
```

---

## 7. Integration & Contribution Protocol

1. Checkout your team's assigned branch (`git checkout team/ai-backend` / `team/frontend` / `team/video-testing`).
2. Commit with conventional prefixes (`feat:`, `fix:`, `docs:`, `test:`).
3. Do NOT commit video files or `.env` files.
4. When features are ready, merge into `integration` for end-to-end testing before merging to `main`.
