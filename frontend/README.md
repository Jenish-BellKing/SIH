# IBVAP — Frontend Command Centre
**Owned by:** Team 2 (Person A: Command Dashboard, Person B: Analytics/Map/WebSocket) & Team 3 (Post-video)  
**Branch:** `team/frontend`

---

## 1. Setup & Execution Instructions

The frontend is built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Leaflet**, and **Recharts**.

### Start Development Server:
```bash
cd frontend
npm run dev
```
Dashboard available at `http://localhost:3000`.

### Build for Production:
```bash
npm run build
npm run start
```

---

## 2. Shared Contracts & Mock Server

The frontend is fully mock-first and can run in **Standalone Mode** (built-in simulation streamer) or connected to the Python mock server:

```bash
# Optional: Run mock server from project root
python scripts/mock_server.py
```
- REST API: `http://localhost:8000`
- WebSocket: `ws://localhost:8000/ws/analytics`
- Mock JSON data: `scripts/mock_data/`

---

## 3. Strict Development Rules
- Adhere strictly to types in `docs/DATA_SCHEMA.md` and `docs/EVENT_SCHEMA.md`.
- Clearly badge simulated features (Intrusion, historical trends) as `[SIMULATION / PHASE 2]`.
- Do not modify API routes or field names.
