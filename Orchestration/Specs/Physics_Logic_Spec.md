# Physics Logic Spec: The AI Engineer Core

## 1. Centralized Logic Store
All physics-to-symptom mapping MUST reside in a single utility: `Execution/frontend/src/lib/physicsAdvisor.ts`.
This ensures a single source of truth for all persona interpretations.

## 2. Governing Principles (Weighted Matrix)
The AI weights fixes based on a **Dynamic Advantage Matrix**. These are not "Hard Rules" but "Preferred Weights" that the AI uses to calculate the best move for the racer.

| Part Category | Physics Impact | Why? |
| :--- | :--- | :--- |
| **Tires** | 100% | The literal point of contact. |
| **Damping (Oil)** | 85% | Controls the "Speed" of grip change. |
| **Springs** | 75% | Controls the "Magnitude" of roll/dive. |
| **Bars/Geo** | 65% | Tactical adjustments for side-bite. |

## 3. Decision Tree Logic (Scenario Awareness)
- **Scenario B Trigger:**
    - **Manual:** Toggle in `MissionControl.tsx`.
    - **Inferred:** Automatically forced if `session_type` is 'Main' (priority: risk mitigation).
- **If Scenario B (Conservative):** Bias towards Alternative fixes (Bars/Height).
- **If Practice Session:** Bias towards Primary fixes (Oil/Springs).

## 4. Dynamic Run Measurement (Tire Fatigue - Level 2)
- **Definition:** A "Run" is any session saved to the database.
- **Dynamic Thresholds (Surface-Based):**
    - **Loamy / Soft Dirt:** 10 Runs (Low wear, consistency is key).
    - **Hard Packed:** 6 Runs (Edge wear matters).
    - **Clay / Abrasive:** 3 Runs (High degradation).
- **Tracking:** The `physicsAdvisor.ts` must calculate the `runCount` from the audit trail and compare it against the threshold for the active `surface_type`.

## 4. Specific Symptom Mapping
| Symptom | Primary Fix (Ideal) | Alternative Fix (Fast) | Reasoning |
| :--- | :--- | :--- | :--- |
| **Oversteer (Entry)** | Increase Front Shock Oil | Soften Rear Spring | "Thicker front oil slows weight transfer to front tires." |
| **Understeer (Exit)** | Thicken Center Diff | Increase Rear Ride Height | "Thicker center diff increases pull on front tires." |
| **Bottoming Out** | Increase Shock Oil | Increase Ride Height | "Oil controls the speed; height adds mechanical room." |

## 5. Context-Aware Audit
- **Heat Map:** If Track Temp > 110°F, automatically boost recommended Shock Oil by +100 CST.
- **Tire Wear:** If Tires > 4 runs old, ignore all suspension symptoms and recommend NEW TIRES first.
