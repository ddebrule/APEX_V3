# Handoff: Phase 6 - The A.P.E.X. Workspace (v6.0.1)

**Claude (Builder), the Strategist (Gemini) has finalized the blueprints for the A.P.E.X. Workspace. Your task is to execute this multi-part evolution from a "Monolithic Toggle" UI to a "Persona-Driven Workspace" centered on ORP.**

## 🎯 The Core Mission: ORP (Optimal Race Pace)
Every component you build must serve the ORP Mission.
- **Equation**: ORP = (Consistency * 0.6) + (Speed * 0.4).
- **Aesthetic**: Bloomberg Terminal High-Density. Use `JetBrains Mono` for all data.

---

## 🛠 Sprint 1: Intelligence Services & Stores
*Establish the logical backbone before touching the UI.*

1.  **[NEW] [ORPService.ts](file:///c:/Users/dnyce/Desktop/Coding/Antigravit/Workspaces/APEX_V3/Execution/frontend/src/lib/services/ORPService.ts)**: Implement the math for Coefficient of Variation (CoV) and Fade Factor.
2.  **[NEW] [LiveRCScraper.ts](file:///c:/Users/dnyce/Desktop/Coding/Antigravit/Workspaces/APEX_V3/Execution/frontend/src/lib/services/LiveRCScraper.ts)**: Create a service to scrape the LiveRC URL to extract lap tables.
3.  **[MODIFY] [missionControlStore.ts](file:///c:/Users/dnyce/Desktop/Coding/Antigravit/Workspaces/APEX_V3/Execution/frontend/src/stores/missionControlStore.ts)**:
    - Add `liveRcUrl: string` and `sessionTelemetry: LapData[]`.
    - Implement `calculateORP()` action.
4.  **[MODIFY] [advisorStore.ts](file:///c:/Users/dnyce/Desktop/Coding/Antigravit/Workspaces/APEX_V3/Execution/frontend/src/stores/advisorStore.ts)**:
    - Add `conversationLedger: Message[]` (Global history).
    - Add `sessionContext: Context` for the Debrief handoff.

---

## 🛠 Sprint 2: The Navigation Split (Strategy vs Control)
*Refactor the monolithic logic into focused journey stages.*

1.  **[MODIFY] [TabNav.tsx](file:///c:/Users/dnyce/Desktop/Coding/Antigravit/Workspaces/APEX_V3/Execution/frontend/src/components/layout/TabNav.tsx)**: Restore the 6-tab manifest naming.
2.  **[NEW] [RaceStrategy.tsx](file:///c:/Users/dnyce/Desktop/Coding/Antigravit/Workspaces/APEX_V3/Execution/frontend/src/components/tabs/RaceStrategy.tsx)**: 
    - Standalone Setup screen. 
    - Consolidate Track/Vehicle matrices.
    - Add the **LiveRC Feed URL** input field.
3.  **[NEW] [RaceControl.tsx](file:///c:/Users/dnyce/Desktop/Coding/Antigravit/Workspaces/APEX_V3/Execution/frontend/src/components/tabs/RaceControl.tsx)**:
    - Passive Monitoring mode.
    - Automated Telemetry display from the scraper.
    - **"Start Debrief"** button that triggers the Advisor handoff.

---

## 🛠 Sprint 3: The Data Lab (Performance Audit)
*The post-heat analytical powerhouse.*

1.  **[NEW] [PerformanceAudit.tsx](file:///c:/Users/dnyce/Desktop/Coding/Antigravit/Workspaces/APEX_V3/Execution/frontend/src/components/tabs/PerformanceAudit.tsx)**:
    - Side-by-side **ORP Delta** Comparison.
    - Trend charts for Consistency and Speed.
    - **The Scribe**: Mechanical feedback inputs.

---

## 🛠 Sprint 4: The Intelligence Vault (Librarian)
*Institutional Memory and AI Orchestration.*

1.  **[NEW] [TheVault.tsx](file:///c:/Users/dnyce/Desktop/Coding/Antigravit/Workspaces/APEX_V3/Execution/frontend/src/components/tabs/TheVault.tsx)**: 
    - **Session History** archival.
    - **Librarian AI** specialized Agent integration.
    - **Global Conversation Ledger** database table integration.

---

## 🏗️ Technical Specification Addendum
**[CRITICAL]** You must strictly follow the schema and logic defined in the **[TECHNICAL_SPEC_ADDENDUM.md](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/TECHNICAL_SPEC_ADDENDUM.md)**.

**You are cleared to begin Sprint 1. Perform your architectural audit and signal "Go" to start the Scraper implementation.**
