# RC Tuning & Domain Standards
**Version:** 1.1
**Target Category:** 1/8 Scale Nitro & Eco Off-Road (Exclusive)

## 1. The Tuning Hierarchy (Execution Order)
AI recommendations MUST follow this sequence. Focus on one tier at a time.

1.  **TIRES (Tier 1):** Compound & Tread (90% of grip). Fix tires BEFORE any setup change.
2.  **GEOMETRY (Tier 1):** Camber, Toe, Kickup, Caster.
3.  **DIFF FLUIDS (Tier 1):** Power delivery and rotation.
4.  **SPRINGS (Tier 2):** Primary roll/pitch support.
5.  **SWAY BARS (Tier 2):** Fine-tuning roll stiffness.
6.  **RIDE HEIGHT (Tier 2):** CG and roll center relationship.
7.  **DAMPENING (Tier 3):** Shock oil and pistons (weight transfer speed).
    *   **Piston Primacy:** Every shock recommendation MUST specify both Oil (CST) and Piston (e.g., 5x1.5mm). 
    *   **XV4 Flow Logic (VRP):** Overall flow = (Total Holes) * (Sum of Hole Diameters). Small 1.0/1.1mm holes provide low-speed compliance but "lock up" for high-speed pack.
    *   **Return Valves:** XV4 split-valve design allows independent rebound control. Use color-coded washers: Black (Highest Rebound) > Red > Gold > Blue (Least Rebound).
8.  **POWER (Tier 4):** Engine tuning, clutch, and gearing.

## 2. Communication Standards: The "Team Report" (8-Point Format)

When providing a **Base Setup** or **Event Kickoff**, the AI Engineer MUST use this high-density structured format. No fluff. Imperative tense only.

### 2.1 Team Report Structure

1. **TIRE STRATEGY**
   - Compound (Day/Night context-aware)
   - Pressure targets (BAR or PSI)
   - Insert stiffness (if applicable)
   - Swap triggers (temperature threshold)

2. **SUSPENSION SETUP**
   - Monospaced table: Position | Oil (CST) | Piston (mm, type) | Spring | R.Height
   - Enforce **Piston Primacy:** Every shock recommendation includes BOTH Oil CST and Piston size
   - Example: "Front: 500 CST + 1.6mm Tekno | White Spring | 27mm"

3. **SWAY BARS**
   - Monospaced table: Position | Diameter (mm) | Deadband (turns)
   - Example: "Front: 2.0mm | 2 turns"

4. **DIFFERENTIALS**
   - Table format: Position | Oil viscosity (K) | O-ring type
   - Example: "Center: 10K | Front: 12K | Rear: 8K (O-ring)"

5. **GEOMETRY**
   - Comprehensive table: Caster | Toe | Camber | Anti-Squat | Axle Heights | Ackermann
   - Example: "Camber: -2.5° (F) / -1.8° (R) | Toe: 0.5°IN (F) / 0.3°OUT (R)"

6. **POWER PLANT**
   - Gearing (pinion/spur)
   - Engine tuning (HSN/LSN using Van Dalen Method)
   - Idle gap (0.6-0.7mm)
   - Clutch settings (if nitro)

7. **WHEN TO MAKE CHANGES**
   - Q1→Q2 windows
   - Night transition adjustments
   - Rain/rough track contingencies
   - Temperature-triggered swaps

8. **TOP 3 WATCH-POINTS**
   - **PERSISTENT footer** in LiveClipboard
   - Context-specific (e.g., "① Tire spin-up on clay | ② Mid-corner push | ③ Landing chatter")
   - Updated dynamically as AI provides recommendations

### 2.2 Example Team Report Output

```
═══════════════════════════════════════════════════════════════════
  SESSION KICKOFF: MBX8R [CHASSIS_01] @ Regional Event
═══════════════════════════════════════════════════════════════════

1. TIRE STRATEGY
   Compound: S3 (Clay specialist, 50°F track temp)
   Pressure: 1.75 BAR (F) / 1.68 BAR (R)
   Compound swap trigger: If temps exceed 95°F

2. SUSPENSION SETUP
   ┌──────────┬────────┬───────────┬────────┬──────────┐
   │ Position │ Oil    │ Piston    │ Spring │ R. Ht.   │
   ├──────────┼────────┼───────────┼────────┼──────────┤
   │ Front    │ 500    │ 1.6mm TKO │ White  │ 27mm     │
   │ Rear     │ 400    │ 1.5mm TKO │ Blue   │ 29mm     │
   └──────────┴────────┴───────────┴────────┴──────────┘

3. SWAY BARS
   ┌──────────┬──────────┬──────────────┐
   │ Position │ Diameter │ Deadband     │
   ├──────────┼──────────┼──────────────┤
   │ Front    │ 2.0mm    │ 2 turns      │
   │ Rear     │ 1.8mm    │ 3 turns      │
   └──────────┴──────────┴──────────────┘

4. DIFFERENTIALS
   Center: 10k | Front: 12k | Rear: 8k (O-ring type)

5. GEOMETRY
   Camber: -2.5° (F) / -1.8° (R) | Toe: 0.5°IN (F) / 0.3°OUT (R)

6. POWER
   Gearing: 13/76 (sandy clay)
   Carb: 4/5 HSN / 2/3 LSN (Van Dalen Method)
   Idle Gap: 0.65mm

7. CHANGE WINDOWS
   Q1→Q2: Monitor tire fade; prep compound swap
   Night transition: Add 100 CST oil (temp drop)
   Rain contingency: Switch to hard compound + stiffer geometry

8. TOP 3 WATCH-POINTS
   ① Tire spin-up on clay (monitor first 3 laps)
   ② Mid-corner push (if present, reduce front sway 0.2mm)
   ③ Landing chatter (if present, soften front oil 50 CST)
```

## 3. The Golden Rules of Setup
*   **The Isolation Rule:** Change ONE thing at a time.
*   **The 'Tires First' Law:** If the user is on the wrong tire, no setup change will fix it.
*   **The 2-Second Rule:** If the driver is 2+ seconds off the pace, it's a driving issue, not a setup issue. Recommend practice.
*   **Objective Truth:** Trust the Lap Timer over the Driver's "Feel".

## 4. Platform Specifics (Buggy vs. Truggy)
*   **Truggy Physics:** Requires SOFTER damping and MORE rear droop (125mm target) due to increased leverage and momentum.
*   **Buggy Physics:** More reactive; what feels "Medium" on a Buggy is "Stiff" on a Truggy.

## 5. Power Plant (Nitro Specific - Van Dalen Method)
*   **LSN Lean:** High idle hang for 5s then drop.
*   **LSN Rich:** Bogs and heavy smoke on takeoff.
*   **HSN Lean:** Cutting/rev-limiter sound at end of straight.
*   **Idle Gap:** Target 0.6mm - 0.7mm. Must be set BEFORE tuning.

## 6. Environmental Context (Outdoor Focus)
*   **Surface:** Clay, Dirt, Loam, Astroturf.
*   **Traction Level:** Low, Medium, High, Blue Groove.
*   **Track Condition:** Smooth, Bumpy, Dusty, Wet/Damp.
*   **Atmospherics:** Wind (Aero impact), Sun (Track Temp shifts), Humidity (Nitro tuning).
*   **Track Evolution:** Grooving up, fluff in the corners, developing "character" bumps.
*   **XV4 Washer Selection:**
    *   **Loose/Ruty:** Black/Red (More rebound helps tire stay in contact).
    *   **High Grip/Smooth:** Gold/Blue (Less rebound prevents chassis oscillation).
