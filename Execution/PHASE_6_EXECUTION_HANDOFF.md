# Handoff: Phase 6 - The A.P.E.X. Workspace (Execution)

**Claude (Builder), the Strategist (Gemini) has finalized the blueprints for the A.P.E.X. Workspace. Your task is to execute this multi-part evolution from a "Monolithic Toggle" UI to a "Persona-Driven Workspace" centered on ORP.**

## 🎯 The Core Mission: ORP (Optimal Race Pace)
Every component you build must serve the ORP Mission.
- **Equation**: ORP = (Consistency * 0.6) + (Speed * 0.4).
- **Aesthetic**: Bloomberg Terminal High-Density. Use `JetBrains Mono` for all data.

---

## 🛠 Sprint 1: Intelligence Services & Stores
*Establish the logical backbone before touching the UI.*

1.  **[NEW] ORPService.ts**: Implement the math for Coefficient of Variation (CoV) and Fade Factor.
2.  **[NEW] LiveRCScraper.ts**: Create a service to scrape the LiveRC URL (provided in Strategy) to extract lap tables.
3.  **[MODIFY] missionControlStore.ts**:
    - Add `liveRcUrl: string` and `sessionTelemetry: LapData[]`.
    - Implement `calculateORP()` action.
4.  **[MODIFY] advisorStore.ts**:
    - Add `conversationLedger: Message[]` (Global history).
    - Add `sessionContext: Context` for the Debrief handoff.

> [!NOTE]
> The **VehicleSetup** and **HistoricSession** types have already been implemented in `database.ts` to ensure type safety for Sprint 1.

---

## 🛠 Sprint 2: The Navigation Split (Strategy vs Control)
*Refactor the monolithic logic into focused journey stages.*

1.  **[MODIFY] TabNav.tsx**: Restore the 6-tab manifest naming (Garage, Strategy, Control, Advisor, Audit, Vault).
2.  **[NEW] RaceStrategy.tsx**: 
    - Standalone Setup screen. 
    - Consolidate Track/Vehicle matrices.
    - Add the **LiveRC Feed URL** input field.
3.  **[NEW] RaceControl.tsx**:
    - Passive Monitoring mode.
    - Automated Telemetry display from the scraper.
    - **"Start Debrief"** button that triggers the Advisor handoff.

---

## 🛠 Sprint 3: The Data Lab (Performance Audit)
*The post-heat analytical powerhouse.*

1.  **[NEW] PerformanceAudit.tsx**:
    - Side-by-side **ORP Delta** Comparison (Session A vs Session B).
    - Trend charts for Consistency and Speed.
    - **The Scribe**: Mechanical feedback inputs that feed the Advisor.

---

## 🛠 Sprint 4: The Intelligence Vault (Librarian)
*Institutional Memory and AI Orchestration.*

1.  **[NEW] TheVault.tsx**:
    - **Session History**: All closed sessions move here, freeing up the Garage for identity management.
    - **Librarian AI**: A specialized Agent for semantic search.
    - **Context Handshake**: Logic to allow the Librarian to "Push to Advisor," prepending historical wins to the active Advisor stream.
    - **Global Conversation Ledger**: Database table tracking all human-AI dialogue history across all sessions and personas.

---

## 📋 Neutral Debrief Protocol (Strict)
When the Advisor initiates a debrief after a data injection:
- **FORBIDDEN**: "Did the tires fade?" (Assumptions).
- **MANDATORY**: "ORP dropped from 90% to 70% at Lap 10. How did the car feel?" (Diagnostic inquiry).

---

## 🏗️ Technical Specification Addendum
**[CRITICAL]** You must strictly follow the schema and logic defined in the **[TECHNICAL_SPEC_ADDENDUM.md](file:///C:/Users/dnyce/.gemini/antigravity/brain/cd690687-8ca4-45b3-8fd2-d70b7713448b/technical_spec_addendum.md)** which has been hardened to address:
1.  **Scraper Error Recovery**: Fallback to `stale` status if data is missing or URL fails.
2.  **Global Top 5 Math**: Mandatory pre-calculation logic for SpeedScore normalization.
3.  **Fade Factor Bounds**: Null check for heats < 6 laps to prevent runtime errors.
4.  **Librarian Trigger**: Systematic handshake between Vault and Advisor during "struggles."
5.  **Refined Setup Model**: Use `springs` (not `spring_rate`), `front_sway_bar`, `rear_sway_bar`, `tread_pattern`, and `front_toe_out`. "Damping" is renamed to "Shocks".

**You are cleared to begin Sprint 1. Perform your architectural audit and signal "Go" to start the Scraper implementation.**
