/**
 * IBVAP Alert Schema
 * Strict adherence to docs/API_CONTRACT.md Section 3.5 & EVENT_SCHEMA.md
 */

import { EventSeverity } from "./event";

export interface Alert {
  alert_id: string;
  event_id?: string;
  alert_title?: string;
  title?: string;
  camera_id: string;
  timestamp: string;
  severity: EventSeverity;
  is_phase_2_simulated: boolean;
  description?: string;
  message?: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
}
