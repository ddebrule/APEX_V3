# Phase 5 Implementation Plan: Optimal Race Pace (ORP) Engine

> **Executive Summary:** Implement the "System Brain" that prioritizes consistency over raw speed. Transforms the AI from a passive advisor to a strategic Race Engineer.

## Project Scope
- [ ] **Data Layer (Critical Update)**: Upgrade `liverc_harvester.py` to drill down into "View Laps" for granular data (needed for Fade Factor).
- [ ] **Logic Layer**: `orp_service.py` to calculate ORP Scores (0-100).
- [ ] **Strategy Layer**: Determine "Discovery Window" based on Practice/Quals.
- [ ] **Schema Layer**: Migration for Driver Profile and Session settings.

## Core Design Principles
1.  **Consistency is King**: The equation penalizes variance (Standard Deviation).
2.  **Driver Confidence Gate**: Valid setups MUST have >3/5 confidence rating (Source: `x_factor_audits.rating`).
3.  **Context-Aware Strategy**: The advice changes based on *Time Remaining* (Quals left).
4.  **Data Integrity**: Fallback to CSV for local dev; LiveRC scraping for extraction.

## Sprint Breakdown

### Sprint 1: Data Harvesting & Metric Engine (8-10 hours)
*Deliverable: The ability to see "The Fade".*
- [ ] **Harvester Upgrade**: Modify `liverc_harvester.py` to follow "View Laps" links and parse individual lap times.
- [ ] **Schema Migration (Critical)**: Create `run_logs` table (id, session_id, heat_name, lap_number, lap_time, confidence_rating).
- [ ] **Service**: `orp_service.py`
    - `calculate_consistency(laps)` -> Std Dev.
    - `calculate_fade(laps)` -> (Avg Last 5 / Avg Top 3).
- [ ] **Local Dev Strategy**: Create `orp_metrics.csv` to simulate lap data for logic testing without live scrapping.

### Sprint 2: Database & Schema Migration (4-6 hours)
*Deliverable: Storing the Context.*
- [ ] **Schema Migration**:
    - `racer_profiles` table: Add `experience_level`, `driving_style`.
    - `sessions` table: Add `practice_rounds`, `qualifying_rounds`.
- [ ] **UI Updates (Tab 1)**: Inputs for Practice/Qualifying rounds.
- [ ] **UI Updates (Profile)**: Dropdowns for Exp/Style.

### Sprint 3: The Advisor Integration (8-10 hours)
*Deliverable: The AI speaks "ORP".*
- [ ] **Avant Garde Definition**:
    - *Safe Parameters*: Oils, Ride Height, Camber (Standard Advice).
    - *Avant Garde Parameters*: Pistons, Geometry, Arm Positions (Only rec if ORP > 85).
- [ ] **Prompts**: Update `prompts.py` to inject Profile Bias (e.g., "You are coaching a Sportsman. Prioritize Stability.").
- [ ] **Logic**: Hard-coded rule: `If x_factor_audits.rating < 3, REJECT setup`.

### Sprint 4: Visualization & Polish (4-6 hours)
*Deliverable: Strategic Dashboards.*
- [ ] **Performance Window Plot**: Scatter Plot (X=Run Number, Y=ORP Score) to show session evolution.
- [ ] **Fade Visualizer**: Line chart overlaying "First 3 Laps" average vs "Last 3 Laps" average.
- [ ] **Dashboard Color Coding**: 
    - ORP > 85: Green (Unlock Avant Garde).
    - ORP < 70: Red (Focus on Stability).

## Technical Architecture

### LiveRC Data Strategy
- **Extraction**: On-Demand (User clicks "Refresh LiveRC" in Tab 4).
- **Storage**: `run_logs` table stores granular lap data. `race_results` stores high-level summary (Pos, Best, Avg).

### Schema Decision
- **Durable Context**: `experience_level` -> `racer_profiles` (Applies to all events).
- **Event Context**: `practice_rounds` -> `sessions` (Specific to this weekend).
- **Lap Data**: `run_logs` table (New).

### Verification Plan
- **Harvester Test**: Verify `get_lap_times()` returns list of floats from a valid LiveRC URL.
- **Scenario Test**: 
    - Input: Sportsman, 0 Practice.
    - Expectation: AI suggests "Safe Baseline", rejects "Avant Garde" changes.
