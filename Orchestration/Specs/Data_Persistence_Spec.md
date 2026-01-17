# Tech Spec: Data Persistence & State Management

## Overview
Ensuring zero data loss in high-stress, potentially offline-prone racing environments (Pit Lanes).

## 1. The 10-Second Debounce Protocol
- **Mechanism:** All inputs in the UI go to a local session state first.
- **Trigger:** A timer waits for 10 seconds of "input silence" before pushing to Supabase.
- **UI Feedback:** A small "Sync" icon in the header (Signal Green = Saved, Amber = Pending).

## 2. "Lock Config" Mechanism
To prevent accidental data corruption:
1. **Draft State:** While in the Shop/Pit, racers can modify the "Actual Setup" (Digital Twin).
2. **Promotion:** Before a heat starts, the racer must "Lock Config".
3. **Immutability:** Once locked, setup changes are logged as `setup_changes` table entries rather than direct overwrites, preserving the "Change History".

## 3. Disaster Recovery
- **Local Mirror:** Keep a copy of the active session in browser `localStorage`.
- **Handshake:** On app load, if `local_state` != `db_state`, prompt the user: "Unsaved local changes found. Restore or Discard?"

## 4. Supabase Integration
- **Row Level Security (RLS):** Ensure racers can only read/write their own profiles and sessions.
- **Real-time Listeners:** Use Supabase's Real-time subscriptions to keep the "Pit Lane" (Tab 2) and "Driver Stand" (Tab 3) in sync across multiple devices (e.g., Tablet on Pit Wall, Phone on Stand).
