# IBVAP — Frontend Command Centre
**Owned by:** Team 2 (Person A: Command Dashboard, Person B: Analytics/Map/WebSocket) & Team 3 (Post-video)  
**Branch:** `team/frontend`

---

## 1. Setup Instructions

The frontend is built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Leaflet**, and **Recharts**.

### Initialization Command (Run when initializing frontend workspace):
```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

### Install Required Frontend Dependencies:
```bash
npm install lucide-react leaflet react-leaflet recharts clsx tailwind-merge
npm install -D @types/leaflet
```

---

## 2. Shared Contracts & Mock Server

Before Team 1's backend is finalized, run against the mock server:
```bash
# Terminal 1: Run mock server from project root
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
