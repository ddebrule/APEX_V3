# Phase 6 Implementation Plan: Modular Refactor

**Goal:** Refactor `dashboard.py` (2,043 lines) into maintainable modules (Hub & Spoke architecture) with **Zero UI/UX Changes**.

## 1. Technical Architecture

### 1.1 The Orchestrator (`dashboard.py`)
Will be reduced to <250 lines.
**Responsibilities (Contract):**
1.  **Session Initialization**: Sole owner of `init_session_state()`.
2.  **App Config**: `st.set_page_config()`.
3.  **Navigation**: Renders `st.tabs` and calls `module.render()`.
4.  **Sidebar**: Imports and renders `components.sidebar`.

### 1.2 Module Structure
```text
Execution/
├── dashboard.py (Orchestrator)
├── tabs/
│   ├── __init__.py
│   ├── event_setup.py (Tab 1)
│   ├── setup_advisor.py (Tab 2)
│   ├── race_support.py (Tab 3)
│   ├── post_analysis.py (Tab 4)
│   └── setup_library.py (Tab 5)
├── components/
│   ├── __init__.py
│   └── sidebar.py (Extracted Profile & Global Settings)
└── utils/
    ├── __init__.py
    └── ui_helpers.py (Shared UI functions like detect_keywords)
```

### 1.3 Session State Contract
*Strict rules to prevent "mystery state".*
-   **Document**: Create `Orchestration/Architecture/session_state_contract.md`.
-   **Rule**: `dashboard.py` initializes ALL keys. Tabs assume keys check for existence only if they write new temp state.

### 1.4 Import Strategy
**Independent Imports** (User Decision).
-   Each tab module imports *only* what it needs (e.g., `from Execution.services.session_service import session_service`).
-   *Why:* Prevents circular dependencies and makes unit testing easier.
-   *Exception:* `Execution/utils/ui_helpers.py` for shared parsing logic.

## 2. Execution Plan

### Sprint 1: Infrastructure & The "State Owner" (Tab 1)
*Goal: Prove the core pattern.*
1.  **Fix Test Environment**: Ensure `pytest` passes (fix `PYTHONPATH`).
2.  **Scaffold**: Create directories `tabs/`, `components/`, `utils/`.
3.  **Create Contracts**: Write `session_state_contract.md`.
4.  **Extract Utils**: Move helper functions to `utils/ui_helpers.py`.
5.  **Extract Sidebar**: Move rendering logic to `components/sidebar.py`.
6.  **Extract Tab 1 (Event Setup)**:
    *   *Rationale:* It initializes data. Moving it first forces us to validate the `init_session_state()` pattern immediately.

### Sprint 2: Read-Only & Independent Tabs
*Goal: Rapid extraction of less coupled components.*
1.  **Extract Tab 3 (Race Support)**: Mostly read-only display.
2.  **Extract Tab 5 (Setup Library)**:
    *   **Refactor**: Extract the complex Staging Modal into `render_staging_modal()` function within the module.

### Sprint 3: The Complex Interaction Tabs
*Goal: Move Tabs with heavy AI/Callback logic.*
1.  **Extract Tab 4 (Post Analysis)**:
2.  **Extract Tab 2 (Setup Advisor)**:
3.  **Final Cleanup**: Remove all logic from `dashboard.py`. Verify size < 250 lines.

## 3. Verification Plan
*Regression Testing is Critical.*

1.  **Automated**: Run `pytest` after *every* file move.
2.  **Manual Parity Check**:
    *   Start App.
    *   Tab 1: Create Session (Verify State).
    *   Tab 2: Record Voice (Verify Callback).
    *   Sidebar: Change Racer Profile (Verify Persistence).
