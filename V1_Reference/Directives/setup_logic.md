# A.P.E.X. Setup Logic & Tuning Directives
*The "Laws of Physics" for the Agentic System.*

## 1. The Tuning Hierarchy (The Golden Rule)
**Principle:** Not all adjustments are created equal. Focusing on the wrong adjustments first wastes track time.
**Enforcement:** The AI must strictly recommend changes in this order.

### Tier 1: Grip (The Foundation)
*Highest Impact. Never compromise for "feel".*
1.  **Tires**: Compound & Tread. (90% of the equation).
2.  **Camber**: Controls contact patch shape.
3.  **Diff Fluids**: Controls power delivery and rotation.

### Tier 2: Balance (Steady-State)
*Controls how the chassis holds its attitude.*
4.  **Springs**: Primary roll/pitch support.
5.  **Sway Bars**: Fine-tuning roll stiffness.
6.  **Ride Height**: CG and roll center relationship.

### Tier 3: Transient Response (Feel)
*Controls how quickly the car takes a set. Used to fix "Driver Confidence".*
7.  **Dampening (Shocks)**: Pistons & Oil. Controls weight transfer speed.
8.  **Geometry**: Toe, Caster, Ackermann, Hinge Pins.
9.  **Brake Bias**: Generic rotation aid.

### Tier 4: Power (The Engine)
*Only tune after chassis is compliant.*
10. **Engine/Clutch**: Optimization of the power plant.

---

## 2. The Golden Rules of Setup
**Directives for the AI:**

1.  **Baseline Protocol:** NEVER start from scratch. Always load the "Shop Master" or a "Proven Reference" first.
2.  **Isolation Rule:** Change **ONE** thing at a time. If the user suggests two changes, the AI must push back and ask for the priority.
3.  **Mechanical Health Check:** Before complex tuning, verify:
    *   Arms/Drivetrain move freely?
    *   Tires glued properly?
    *   Foams intact?
4.  **The "Tires First" Law:** If the user is on the wrong tire, NO setup change will fix it. Stop the analysis and fix the tire.
5.  **Objective vs. Subjective:** Trust the Lap Timer over the Driver's "Feel". If the car feels "sketchy" but is faster, do not change it unless consistency suffers (See ORP Protocol).
6.  **The 2-Second Rule:** If the driver is 2+ seconds off the pace, it is a DRIVING issue, not a SETUP issue. Recommend practice, not clicker changes.
7.  **Temperature Rule:** Setup travels well. Only adjust shock oils for temp (Hot = Thicker, Cold = Thinner).
8.  **The Redundancy Protocol:** If a change is ACCEPTED or currently PENDING, do not recommend it again. Assume the car has that setup. Only revisit if environmental conditions (Temp/Grip) shift significantly.

---

## 3. Decision Logic (If This, Then That)

| Symptom | Primary Check/Action |
| :--- | :--- |
| **Inconsistent Handling** | Check Mechanical Health first, then Tire Wear. |
| **Car feels "off" but Fast** | Trust the times. Do not change. |
| **Car feels Great but Slow** | Driver Issue. Focus on lines/braking points. |
| **Setup works at Track A but not B** | Setup is not optimized. Return to Baseline. |
| **"Loose" (Oversteer)** | Thicken Front Diff / Soften Rear Spring / Thicken Front Sway Bar. |
| **"Push" (Understeer)** | Thicken Center Diff / Stiffen Rear Spring / Thicken Rear Sway Bar. |

---

## 4. Platform Specifics: Truggy vs. Buggy

### Truggy Special Rules
Truggies are heavier (~4.5kg vs 3.5kg) and have longer arms/larger tires.
*   **Damping Physics:** Requires **SOFTER** damping than buggies to handle the momentum and leverage.
*   **Droop:** Requires **MORE** rear droop (125mm target) to handle jump landings without "packing up".
*   **Contrast:** What feels "Medium" on a Buggy feels "Stiff" on a Truggy by comparison.

---

## 5. The Van Dalen Engine Tuning Method
**Objective:** Stable idle, crisp throttle, reliable performance.
**Constraint:** Must be done on a WARM engine.

### Factory Baselines (REDS 721/723)
*   **HSN:** 3.75 turns out
*   **LSN:** 5.25 turns out
*   **Idle Gap:** 0.6 - 0.7mm (*Critical: Set BEFORE tuning*)

### The "Three Blips" Test
1.  Rev... Rev... Rev... (Listen to the return)
2.  **Tune HSN First:** Clean transition/top end.
3.  **Tune LSN Second:** Stable idle, no loading up.
4.  **The Sound:**
    *   **Rich:** Bogs, smoke, hits "rev limiter" early.
    *   **Lean:** High idle hang, "thin" sound, hesitation.

---

## 6. Hybrid Parsing Protocol
To ensure 100% data fidelity for the Master Chassis Library:
1.  **Stage 1 (Precision):** Automated AcroForm extraction from fillable PDFs.
2.  **Stage 2 (Vision):** AI-driven OCR for photos/scans (Fallback).
3.  **Validation:** All data must map to the A.P.E.X. internal 24-parameter schema.
