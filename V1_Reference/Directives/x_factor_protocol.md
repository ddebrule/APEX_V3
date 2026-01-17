# Directive: The X-Factor Protocol (Performance Audit)

## 1. Mission
The X-Factor Protocol is the "black box" of the AGR APEX system. Its purpose is to transform subjective driver "feel" into objective, searchable performance data. It ensures that every setup change is validated by a result, preventing "setup drift" and building the Institutional Memory.

## 2. Trigger Events
The Protocol must be initiated immediately following the conclusion of any active session (Practice, Qualifying, or Main).
- **Automated**: Triggered when LiveRC results are fetched for the current racer.
- **Manual**: Triggered when the user clicks "End Session" or "Log Run".

## 3. The Audit State Machine

### State 1: Mechanical Validation (The 1-5 Rating)
The system prompts the driver for a **numeric rating (1-5)** of the specific mechanical changes made prior to the run.
- **Prompt**: "That change - rate it 1 to 5?"
- **Constraint**: Must accept voice or numeric keypad input.

### State 2: Contextual Diagnostics (The Branching)
The system branches its inquiry based on the rating:
- **[1 - 2] FAILURE (Negative Drift)**
    - **Goal**: Identify why the car became worse.
    - **Prompt**: "Identify the primary symptom: Front-end wash, Rear-end loose, Stability (bumpy), or Rotation (tight)?"
    - **Tagging**: Mark setup change as `STATUS:FAILURE` + `IMPACT:NEGATIVE`.
- **[4 - 5] SUCCESS (Positive Progression)**
    - **Goal**: Identify the specific gain.
    - **Prompt**: "Where did it help most: Corner Entry, Corner Exit, Jumping/Landing, or Consistency?"
    - **Tagging**: Mark setup change as `STATUS:SUCCESS` + `IMPACT:POSITIVE`.
- **[3] NEUTRAL (Zero Delta)**
    - **Goal**: Move on quickly.
    - **Prompt**: "No significant change? (Confirming zero delta)."
    - **Tagging**: Mark setup change as `STATUS:NEUTRAL` + `IMPACT:NONE`.

### State 3: The "X-Factor" Observation (Open Feedback)
Regardless of the rating, the system allows for a final open-mic observation prefixing it with the current **Best Lap** telemetry.
- **Prompt**: "Final observation for the binder?"
- **Logic**: Scribe processes audio, filtering for the "Note" or "Log" wake words to highlight priority insights.

## 4. Data Retention & Handoff
- **Storage**: All audit data must be committed to `track_logs.csv` associated with the specific `VehicleID` and `SessionID`.
- **Institutional Memory**: Accepted changes with a rating of 4-5 are promoted to "Proven Successes" for this track/condition. Accepted changes with a rating of 1-2 are flagged as "Avoid in these conditions."
