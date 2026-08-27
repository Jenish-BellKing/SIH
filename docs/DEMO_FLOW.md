# IBVAP — Master Demonstration Flow & Presentation Script
**Version:** 1.0.0  
**Target Audience:** SIH Jury & Technical Evaluators  
**Estimated Duration:** 7–10 Minutes

---

## 1. Demonstration Philosophy

The goal of this demonstration is to prove that IBVAP transforms standard video surveillance feeds into real-time, actionable intelligence using real computer vision models while presenting an enterprise-grade Command Centre interface.

---

## 2. Step-by-Step 15-Stage Presentation Flow

| Step # | Action / Screen | Visual Focus | Speaker Talking Points | Technical Validation |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Open IBVAP Command Centre** | Main dashboard landing page | *"Welcome to IBVAP — Intelligent Border Video Analytics Platform. We are viewing the unified Command Centre designed for border post commanders."* | UI loads with responsive dark theme, real-time clock, and connected status badge. |
| **2** | **Show Cameras & System Status** | Tactical Map & Camera Grid | *"Here we see all active border outpost (BOP) cameras mapped geographically along the border perimeter with live health telemetry."* | `GET /cameras` rendered on Leaflet map; statuses show `online` / `warning`. |
| **3** | **Open Human Analytics View** | Dedicated Human Surveillance tab | *"We navigate to the Human Surveillance stream for Sector 4 (North Fence)."* | Stream player initialized; WebSocket ready for detection bounding boxes. |
| **4** | **Play Controlled Human Video** | CCTV video playback window | *"We initiate playback of real-world surveillance footage showing multiple persons approaching the perimeter."* | Video feed starts playing smoothly. |
| **5** | **Show Real Human Detection** | Real-time green bounding boxes | *"Our Ultralytics YOLO inference model detects individual humans in real time with high confidence scores."* | Green bounding boxes overlaid with confidence percentage (e.g., `person 96%`). |
| **6** | **Show Persistent Tracking IDs** | Track IDs: `P023`, `P024` | *"Notice the persistent tracking IDs (e.g. P023). ByteTrack maintains identity continuity even across partial occlusions."* | Track ID labels remain steady across consecutive frames without flickering. |
| **7** | **Open Vehicle Analytics View** | Vehicle Surveillance tab | *"Next, we inspect the East Gate Checkpoint dedicated to vehicular traffic monitoring."* | Checkpoint camera feed and vehicle stats card activate. |
| **8** | **Play Controlled Vehicle Video** | Checkpoint video playback | *"We feed vehicle traffic footage through our dual detection and classification pipeline."* | Video stream starts. |
| **9** | **Show Vehicle Classification** | Bounding boxes with sub-classes | *"The AI accurately classifies vehicles into distinct categories: cars, trucks, motorcycles, and buses."* | Bounding boxes tagged with `car (94%)`, `truck (92%)`. |
| **10** | **Show Real ANPR Result** | License plate badge overlay | *"As the vehicle halts at the checkpoint, our PaddleOCR model isolates and extracts the license plate text in real time."* | Plate overlay shows `TN30AB1234` with 91% confidence. |
| **11** | **Show Event Timeline Entry** | Real-time Event Feed | *"Every verified detection is instantly logged into the persistent event timeline via our WebSocket streaming hub."* | New row appears at top of event list without page refresh. |
| **12** | **Trigger Simulated Intrusion Alert** | Red flashing alert banner | *"When an entity crosses a defined restricted perimeter, an immediate high-priority alert is broadcast to the commander."* | Alert banner flashes red with sound notification: `CRITICAL: Perimeter Breach`. |
| **13** | **Open Event Details Modal** | Drilldown dialog | *"Clicking on the alert brings up the full forensic card: snapshot preview, exact timestamp, camera ID, and metadata."* | Modal displays bounding box crop, snapshot image, and metadata JSON. |
| **14** | **Show Analytics Dashboard** | High-level metrics & Recharts | *"The executive analytics dashboard aggregates total detections, vehicle volume, peak hours, and threat distribution."* | Recharts bar & line charts render live data along with KPI metric cards. |
| **15** | **Clarify Phase 1 vs. Phase 2** | Roadmap slide / UI footer | *"To maintain technical integrity: Human detection, tracking, vehicle classification, and ANPR are 100% real AI inference today. Geometrical virtual fencing and behavioural loitering analytics are currently simulated and slated for Phase 2 implementation."* | Clear demarcation establishes credibility with technical judges. |

---

## 3. Pre-Demo Verification Checklist

- [ ] Backend FastAPI server running (`http://localhost:8000/health` returns `healthy`).
- [ ] Frontend Next.js app running (`http://localhost:3000`).
- [ ] WebSocket streaming verified (`/ws/analytics`).
- [ ] Test video files pre-loaded in `test-videos/humans/` and `test-videos/vehicles/`.
- [ ] Snapshots folder populated with sample JPEG evidence.
- [ ] Mock intrusion alert trigger verified and ready.
