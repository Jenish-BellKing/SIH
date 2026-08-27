# IBVAP — Team Development Rules & Integration Guidelines
**Version:** 1.0.0  
**Status:** MANDATORY — Engineering Protocol for All Teams

---

## 1. Golden Rules of Development

1. **Never Develop Directly on `main`:** All work must take place on assigned team branches.
2. **Respect the Shared Contracts:** Schema files in `docs/` (`API_CONTRACT.md`, `DATA_SCHEMA.md`, `EVENT_SCHEMA.md`) are frozen. Never invent custom JSON fields or endpoints.
3. **Mock-First Frontend:** Team 2 must build UI against mock JSON datasets in `scripts/mock_data/` without waiting for AI pipelines.
4. **Headless AI Pipelines:** Team 1 AI scripts must be executable from the command line on video files and output valid standard JSON without depending on the frontend.
5. **No Secrets or Binary Bloat:** Never commit `.env` secrets, large `.mp4` video files (>50MB), or heavy model weights (`.pt`/`.onnx`). Use `scripts/` to download or place them locally.

---

## 2. Git Branching Strategy & Workflow

```
main (Production / Jury Demo Only)
  ▲
  │ (After full integration testing)
integration (Staging & Cross-Team Conflict Resolution)
  ▲                     ▲                      ▲
  │                     │                      │
team/ai-backend     team/frontend       team/video-testing
(Team 1)            (Team 2)            (Team 3)
```

### Branch Responsibilities
| Branch | Owner | Focus Area |
| :--- | :--- | :--- |
| `team/ai-backend` | Team 1 | YOLO detection, ByteTrack tracking, PaddleOCR ANPR, FastAPI backend, SQLite database, WebSocket server |
| `team/frontend` | Team 2 | Next.js Command Centre UI, Leaflet tactical map, Recharts, WebSocket consumer |
| `team/video-testing` | Team 3 | CCTV test videos, edge case scenarios, outputs evaluation, UI support |
| `integration` | All Teams | Staging branch to combine features and test end-to-end demo flow |
| `main` | Tech Lead | Stable, clean demo release |

### Branch Hygiene
- Do **NOT** delete team branches after merging into `integration`.
- Regularly pull/rebase latest updates from `integration` into your team branch.
- Resolve any merge conflicts inside `integration` before pushing to `main`.

---

## 3. Git Commit Conventions

All commit messages MUST follow the standard Conventional Commits format:
```
<type>: <short description in present tense>
```

### Allowed Types
- `feat:` A new feature or endpoint
- `fix:` A bug fix in AI, API, or UI
- `docs:` Documentation changes or schema updates
- `test:` Unit tests, mock tests, or video verification runs
- `refactor:` Code restructuring without changing behavior
- `data:` Addition of mock datasets or prompt definitions

### Approved Commit Examples
- `feat: initialize FastAPI backend with health and camera endpoints`
- `feat: implement ByteTrack persistent human tracking pipeline`
- `feat: integrate PaddleOCR for license plate number recognition`
- `feat: add Leaflet tactical map component with camera pins`
- `feat: establish real-time WebSocket connection for live bounding boxes`
- `fix: resolve coordinate bounding box scaling issue on resized video canvas`
- `docs: update DATA_SCHEMA with vehicle classification taxonomy`
- `data: add synthetic mock detection events for North Fence camera`

### Forbidden Commit Messages (DO NOT USE)
- ❌ `update`
- ❌ `changes`
- ❌ `final`
- ❌ `final2`
- ❌ `fixed stuff`
- ❌ `latest working version`

---

## 4. Integration Checkpoints & Milestones

| Checkpoint | Milestone Name | Acceptance Criteria |
| :--- | :--- | :--- |
| **CP 1** | **Repository & Contracts Ready** | Directory structure initialized, all docs frozen, mock data created, team branches verified. |
| **CP 2** | **Independent Component Baselines** | Team 2 dashboard renders mock data and tactical map; Team 1 AI scripts run headless on test clips; Team 3 delivers benchmark test videos. |
| **CP 3** | **Human Pipeline End-to-End** | Video -> YOLO + ByteTrack -> Backend Event Ingestion -> WebSocket -> Frontend Live Bounding Boxes. |
| **CP 4** | **Vehicle & ANPR Pipeline End-to-End** | Video -> Vehicle Classification + PaddleOCR -> Backend -> Event Timeline & Plate Display. |
| **CP 5** | **Complete Demo Freeze** | Full 15-step demo flow executed on `integration` branch without console errors, merged to `main`. |

---

## 5. Schema Change Request (SCR) Protocol

If an unforeseen technical limitation requires changing an API or data schema:
1. Discuss with leads from all affected teams (AI, Backend, Frontend).
2. Update the corresponding markdown file under `docs/`.
3. Commit the documentation change with message `docs: update <SCHEMA_NAME> contract for <REASON>`.
4. Update mock datasets in `scripts/mock_data/`.
5. Notify all team members before altering code implementation.

---

## 6. Real vs. Phase-2 Code Separation

- Keep all Phase-2 placeholder components clearly commented:
  ```python
  # PHASE-2 PLACEHOLDER: Simulated intrusion trigger
  is_phase_2_simulated = True
  ```
- In the frontend UI, clearly badge simulated elements as `[SIMULATION / PHASE 2]` to maintain complete transparency during jury evaluations.
