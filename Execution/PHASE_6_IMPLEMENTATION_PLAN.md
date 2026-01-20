# Phase 6 Implementation Plan: The A.P.E.X. Workspace (v6.0.1)

## Goal Description
Phase 6 transforms A.P.E.X. into a fully automated analytical partner. We are solving the "Diagnostic Gap" by implementing a **LiveRC Web-Scraper** that feeds performance data directly into the **AI Advisor**.

The racer no longer has to "inform" the Advisor—the Advisor (The Engineer) proactively initiates a **Debrief** after reviewing the telemetry and applied setup, closing the loop on the **ORP (Optimal Race Pace)** mission.

## The A.P.E.X. Journey (Phase 6 Architecture)

| Tab | Role | Phase 6 Action |
| :--- | :--- | :--- |
| **1. Racer Garage** | Identity | **Maintain** |
| **2. Race Strategy** | Logistics | **NEW:** **LiveRC Scraper URL** input field. |
| **3. Race Control** | Monitoring | **MERGED:** Monitoring + Performance Audit. Live ORP Trend Charts. |
| **4. AI Advisor** | The Engineer | **NEW:** **Data-Driven Debrief**. Auto-ingests Scraper data + Current Setup. |
| **5. The Vault** | Intelligence | **NEW:** Session Archive, Conversation Ledger, & **Librarian AI**. |

## Proposed Changes

### 1. Intelligence Services (The Scraper & ORP)
- **[NEW] [LiveRCScraper.ts](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/frontend/src/lib/services/LiveRCScraper.ts)**: Implements server-side scraping of the LiveRC feed URL to extract lap counts, best laps, and consistency data.
- **[NEW] [ORPService.ts](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/frontend/src/lib/services/ORPService.ts)**: Calculates ORP, CoV, and Fade factor from scraped telemetry.

### 2. The Debrief Handoff (The "Gap" Fix)
- **[MODIFY] [RaceControl.tsx](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/frontend/src/components/tabs/RaceControl.tsx)**: Add a high-visibility **"Debrief with Engineer"** action.
- **[MODIFY] [advisorStore.ts](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/frontend/src/stores/advisorStore.ts)**: Implement a `loadSessionContext()` action that prepares the Advisor with:
    - Scraped Performance Data (ORP/Consistency)
    - Applied Mechanical Setup (from database)
    - Environmental Context (from Race Strategy)
- **[MODIFY] [AIAdvisor.tsx](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/frontend/src/components/tabs/AIAdvisor.tsx)**: 
    - **Neutral Analytical Persona**: Forbid the AI from making assumptions (e.g., "tires faded"). 
    - **Data-First Opening**: The AI must present objective telemetry first: *"I've reconciled the LiveRC data. ORP was stable at 92% until Lap 8, then drifted to 74%. How did the car feel during that final window?"*
    - **Multi-Factor Socratic Loop**: Pivot the dialogue to explore mechanical, environmental, or human factors (focus/fatigue) based on the racer's response.

### 3. The Knowledge Vault (The Librarian)
- **[NEW] [TheVault.tsx](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/frontend/src/components/tabs/TheVault.tsx)**: 
    - **Librarian AI**: Handles semantic history recall.
    - **Conversation Ledger**: Universal table for all human-AI dialogue logs.

### 4. Vehicle Setup Refinement (UI Logic)
- **[MODIFY] [RacerGarage.tsx](file:///c:/Users/dnyce/Desktop/Coding/Antigravit/Workspaces/APEX_V3/Execution/frontend/src/components/tabs/RacerGarage.tsx)**:
    - **Rename**: "Damping" → "**Shocks**".
    - **Rename**: `spring_rate` → `springs` (Manufacturer-specific strings, e.g., "Blue", "1.6mm").
    - **New Inputs**: Add `tread_pattern`, `front_toe_out`, `front_sway_bar`, and `rear_sway_bar` (mm).
- **[NEW] Cold Start Resilience**:
    - **Audit Tab**: If no history exists, display `[CALIBRATING]` instead of deltas.
    - **AI Advisor**: Detect new profiles and frame advice around "Establishing Baseline".
    - **Librarian AI**: Implement a "General Knowledge Fallback" when vector search yields no local results.

## Technical Implementation Guidelines
For precise specifications on the Scraper Contract, ORP Formulas, `sessionContext`, and **Cold Start Protocols**, refer to the **[Technical Specification Addendum](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/TECHNICAL_SPEC_ADDENDUM.md)**. 

> [!IMPORTANT]
> The setup model has been refined to include specific parameters like `springs`, `front_sway_bar`, `rear_sway_bar`, `tread_pattern`, and `front_toe_out`. All new parameters should be added to the flat `VehicleSetup` Record.

## Verification Plan

### Automated Tests
- **Scraper Validation**: Verify the scraper correctly parses lap tables from mock LiveRC HTML.
- **Context Injection**: Ensure the Advisor's initial prompt correctly includes the ORP score from the store.

### Manual Verification
- **End-to-End Flow**: Paste LiveRC URL in Strategy → Monitor in Race Control → Click "Debrief" → Verify Advisor starts with a data-driven question.
