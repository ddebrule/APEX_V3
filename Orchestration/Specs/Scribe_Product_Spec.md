# Product Spec: Tab 3 - Scribe & Observations
**Status:** DRAFT 🟢

## Goal
To capture qualitative racer feedback during or after a session, providing a prioritized "Observation Log" that feeds the AI's internal institutional memory.

## User Journey
1. **Note Capture:** Racer types or dictates an observation (e.g., "Car felt floaty in the mid-corner").
2. **Signal Detection:** The system scans the note for keywords (e.g., "Floaty", "Bottoming", "Loose").
3. **Prioritization:** Key signals are highlighted and tagged for the **Analyst** and **Advisor** to review.
4. **Historical Anchor:** Notes are anchored to the specific session ID and timestamped.

## Features
- **Precision Manual Trigger:** optimized for dictation (Big button start/stop).
- **Keyword Visualizer:** Real-time highlighting of recognized tuning terms.
- **Observation Feed:** A chronological list of notes for the current session.
- **Signal Tagging:** Automatically categorizes notes (e.g., #Handling, #Tires, #Power).

## Data Model (Schema V1.1.0)
- Writes to `setup_changes` (if note leads to a change) or a new `observations` table (to be scaffolded).
- Currently anchored to `sessions.id`.
