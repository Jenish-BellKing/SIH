# Video Generation Prompts & Test Scenarios
**Owned by:** Team 3 (Person A: Humans, Person B: Vehicles/ANPR)  
**Branch:** `team/video-testing`

---

## 1. Overview
This directory contains generation prompts, synthesis scripts, or recording instructions for creating controlled CCTV surveillance footage for testing the IBVAP AI perception engine.

## 2. Test Video Categories

### Human Scenarios (`test-videos/humans/`)
1. **Single Person Patrol:** Controlled baseline walking along border fence line.
2. **Multiple Crossing Entities:** 2-3 persons moving in intersecting paths to validate ByteTrack tracker ID stability.
3. **Occlusion Scenario:** Person walking behind a checkpoint booth/tree to test re-identification.

### Vehicle Scenarios (`test-videos/vehicles/`)
1. **Traffic Stream:** Mix of cars, SUVs, trucks, and motorcycles passing a camera checkpoint.
2. **Slow Approach:** Heavy cargo truck approaching border outpost gate.

### ANPR Scenarios (`test-videos/anpr/`)
1. **Clear Plate Daytime:** High-contrast front and rear number plates.
2. **Angled Checkpoint Halt:** Vehicle stopping at 30-degree camera viewing angle.
