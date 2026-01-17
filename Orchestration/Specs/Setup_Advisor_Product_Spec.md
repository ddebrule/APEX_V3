# Product Spec: Tab 2 - Setup Advisor
**Status:** DRAFT 🟢

## Goal
To provide the racer with a physics-driven "Prescription" to solve specific chassis handling issues, offering both an "Ideal" fix and a "Resource-Friendly" alternative.

## User Journey
1. **Symptom Entry:** Racer selects a handling issue (e.g., "Oversteer on Corner Entry").
2. **Context Audit:** AI checks active session data (Track, Temp, Tires).
3. **Prescription Generation:** AI presents two distinct fix options.
4. **Implementation:** Racer "Accepts" one, which creates a `setup_changes` entry in the DB.

## Features
- **Smart Symptom Picker:** Filtered list of issues (Entry/Apex/Exit phases).
- **Dual-Option Logic:** 
    - **Primary:** High impact, may require bench time/parts.
    - **Alternative:** Lower impact, fast turnaround (Trackside fix).
- **Physics Engine Integration:** Direct mapping from `advisor.md` logic.
- **Feedback Loop:** Encourages the racer to rate the fix after the next run.

## Data Model (Schema V1.1.0)
- Writes to `setup_changes` table.
- Reads from `sessions` (Track Identity) and `vehicles` (Current Config).
