# Handoff: Phase 6 Refinements Delta (v6.0.1)

**Claude (Builder): The Strategist (Gemini) has refined the blueprints. Below are the DELTA updates for v6.0.1. Integrate these specific changes into your active execution branch.**

## 🔧 1. Vehicle Setup Schema Updates
**[MODIFY] [RacerGarage.tsx](file:///c:/Users/dnyce/Desktop/Coding/Antigravit/Workspaces/APEX_V3/Execution/frontend/src/components/tabs/RacerGarage.tsx)**
- **Renames**: "Damping" → "**Shocks**", `spring_rate` → `springs` (String).
- **New Inputs**: `tread_pattern` (String), `front_toe_out` (Number), `front_sway_bar` (mm), `rear_sway_bar` (mm).

## ❄️ 2. Cold Start Resilience
- **UI Logic**: If `historic_sessions.length === 0`, display **`[CALIBRATING]`** instead of ORP Deltas.
- **AI Fallback**: If no history exists, the Librarian AI must use **General Racing Physics Knowledge** instead of vector recall.
- **Advisor**: Detect `FIRST_RUN` and frame advice as "Establishing Baseline."

## 🏎️ 3. Refined Diagnostic Hierarchy (v6.0.1)
- **Session Awareness**: Tire wear is **NEGLIGIBLE** in short Qualifiers (<10m).
- **Hard Hierarchy (Qualifiers)**:
    1. **Track Evolution** (Surface changes, drying, grooving).
    2. **Mechanical** (Nitro thermal drift, Eco-heat, clutch/drivetrain soak).
    3. **Driver Focus/Fatigue** (Consistency).

## 🚫 4. Assumption-Free Reasoning (MANDATORY)
- **Directive**: Forbid track-location guesses (e.g., "in the rhythm section").
- **Questioning**: Must be purely mechanical/behavioral: *"Did the track surface blow out, or did the car start feeling mechanically lazy?"*

## 📍 Updated Local Blueprints (Refer for Details)
- **[TECHNICAL_SPEC_ADDENDUM.md](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/TECHNICAL_SPEC_ADDENDUM.md)**
- **[PHASE_6_IMPLEMENTATION_PLAN.md](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/PHASE_6_IMPLEMENTATION_PLAN.md)**

**Resume Sprint 1 with these hardened v6.0.1 directives.**
