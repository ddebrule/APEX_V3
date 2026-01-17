# Phase 6 Technical Implementation Plan: The 6-Tab Experience (v2.0)

**Version:** 2.0
**Status:** Approved for Execution
**Refactor Target:** `Execution/dashboard.py` (2,043 lines)

## 1. Technical Architecture & Contracts

### 1.1 Session State Contract
To prevent state pollution and ensure modularity, `dashboard.py` (The Orchestrator) is the **Sole Owner** of initialization. Tabs act as **Consumers**.

**Initialization Rule:**
The `dashboard.py` file must run an `init_session_state()` function *before* importing or rendering any tabs.

**State Registry (The Contract):**
| Key | Type | Owner (Writer) | Consumers (Readers) | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `racer_profile` | Dict | **dashboard.py** | All Tabs | User identity, fleet data, sponsors. |
| `active_session_id` | UUID | **Tab 1** (Mission Control) | All Tabs | The DB ID of the current event. |
| `actual_setup` | Dict | **Tab 1** / **Tab 6** | Tab 4, Tab 5 | The Digital Twin state (Current Chasis Config). |
| `track_context` | Dict | **Tab 1** | Tab 2, Tab 4 | Location, Surface, Traction metadata. |
| `weather_data` | Dict | **Tab 2** (Pit Lane) | Tab 4 | Real-time air/track temp & density altitude. |
| `symptom_log` | List | **Tab 3** (Driver Stand) | Tab 4 | Quick-input feedback (e.g., "Loose"). |
| `messages` | List | **Tab 4** (Engineer) | Tab 4 | Chat history for the AI advisor. |

### 1.2 The Orchestrator Pattern (`dashboard.py`)
The main file will be reduced to ~200 lines.
```python
# execution/dashboard.py structure
import streamlit as st
from execution.tabs import mission_control, pit_lane, driver_stand, engineer, scoreboard, garage

def init_state():
    if "racer_profile" not in st.session_state:
        # Load from DB or default
        st.session_state.racer_profile = ...

def main():
    st.set_page_config(...)
    init_state()
    render_sidebar()
    
    # Navigation
    tabs = st.tabs(["Mission Control", "Pit Lane", "Driver Stand", "Engineer", "Scoreboard", "Garage"])
    
    with tabs[0]: mission_control.render()
    with tabs[1]: pit_lane.render()
    with tabs[2]: driver_stand.render()
    with tabs[3]: engineer.render()
    with tabs[4]: scoreboard.render()
    with tabs[5]: garage.render()

if __name__ == "__main__":
    main()
```

### 1.3 Tab 3 (Driver Stand) Specification
**Goal:** High-speed, high-stress data entry. Touch-optimized.

**UI Layout:**
*   **Top:** Large "Record Voice Note" button (Mic Recorder).
*   **Middle:** 3x3 Grid of "Quick Symptom" Toggle Buttons.
    *   Row 1 (Handling): [LOOSE] [PUSH/TIGHT] [STABLE]
    *   Row 2 (Chassis): [BOTTOMING] [WASHBOARD] [ROLL]
    *   Row 3 (Engine): [BOGGING] [CUT-OUT] [SCREAMING]
*   **Bottom:** "Lap Feedback" Slider (1-5 scale) + "Save" button.

**Data Flow:**
*   Clicking [LOOSE] adds `{"timestamp": now, "type": "symptom", "value": "Loose"}` to `track_logs` immediately.
*   **No Auto-Save Wait:** These write directly to the persistent log to ensure data isn't lost if the browser sleeps.

### 1.5 Data Authority & Initialization Flow
*Critical Logic based on User Feedback:*

**1. The Starting State (Tab 1)**
*   **Default:** `actual_setup` auto-loads from "Shop Master" (`car_configs.csv`) for the selected vehicle.
*   **Overrides:** User can manually edit fields *before* "Start Session" (e.g., "I changed shocks last night").
*   **The Lock:** Clicking "Start Session" saves the current state as the **Session Baseline**.
    *   *Constraint:* AI recommendations use this Baseline as the starting point.

**2. The Digital Twin (Tab 6)**
*   **Role:** The *active* manual editor and reference viewer.
*   **Manual Tweaks:** If user changes a setting here (e.g., "Changed Tires"), it updates `actual_setup` immediately.
*   **Revert:** Add a "Revert to Session Baseline" button to undo mid-event chaos.

**3. Saving Back (The Loop)**
*   **Persistence:** At session end (Tab 5), user gets a prompt: "Update Shop Master with this setup?" (Yes/No/Select Fields).

---

## 2. Migration Map (Old -> New)

| Current UI Component | Current Location | NEW Location | Notes |
| :--- | :--- | :--- | :--- |
| **Session Setup Form** | Tab 1 (Event Setup) | **Tab 1 (Mission Control)** | Includes "Shop Master" auto-loader. |
| **Mechanical Inputs** | Tab 1 (Event Setup) | **Tab 1 (Baseline)** & **Tab 6 (Active)** | Rendered in BOTH. Tab 1 = Init, Tab 6 = Maintenance. |
| **Weather Widget** | Sidebar | **Tab 2 (Pit Lane)** | Promoted to main content. |
| **LiveRC Monitor** | Tab 3 (Race Support) | **Tab 2 (Pit Lane)** | Schedule belongs in "Pre-Race". |
| **Voice Recorder** | Tab 2 (Advisor) | **Tab 3 (Driver Stand)** | Input moves to dedicated tab. |
| **AI Chat** | Tab 2 (Advisor) | **Tab 4 (Engineer)** | - |
| **LiveRC Charts** | Tab 4 (Analysis) | **Tab 5 (Scoreboard)** | - |
| **Setup Library** | Tab 5 (Library) | **Tab 6 (Garage)** | - |

---

## 3. Execution Plan (3 Sprints)

### Sprint 1: Infrastructure & The "Bookends"
*Goal: Prove module system & fix test environment.*
1.  **Fix Test Environment (HIGH PRIORITY)**:
    *   Create/Fix `conftest.py` to ensure `Execution` module is in `PYTHONPATH`.
    *   Target: `pytest tests/` must pass before code moves.
2.  **Scaffold**: Create `Execution/tabs/__init__.py`.
3.  **Migrate Tab 6 (Garage)**:
    *   Move Setup Library.
    *   **NEW:** Implement "Active Setup" editor (Manual Tweaks).
4.  **Migrate Tab 5 (Scoreboard)**: Move Charts and X-Factor logic.
5.  **Refactor Dashboard**: Update `dashboard.py` to import these two new tabs.

### Sprint 2: Core Logic Migration
*Goal: Move state-heavy components.*
1.  **Migrate Tab 1 (Mission Control)**:
    *   Implement **Session State Contract**.
    *   **Logic update:** Auto-load Shop Master on vehicle select.
    *   **Logic update:** "Start Session" snapshots the baseline.
2.  **Migrate Tab 2 (Pit Lane)**: Move Weather and LiveRC Monitor.
3.  **Migrate Tab 4 (Engineer)**: Move AI Chat logic.

### Sprint 3: The New Features
*Goal: Build the missing pieces.*
1.  **Build Tab 3 (Driver Stand)**: Implement the new 3x3 Button Grid and Event Logging service.
2.  **Final Polish**: Rename tabs, remove legacy code from `dashboard.py`.

## 4. Import Strategy
**Rule:** No shared `common.py` import dumps.
 Each tab file must explicitly import the services it needs (e.g., `tabs/mission_control.py` imports `session_service`).
*Why?* Keeps dependencies clear and creates truly modular files that can be unit tested individually.

## Verification Plan
1.  **Unit Tests**: Fix `tests/` folder first. Then run `pytest` after each file move.
2.  **Manual Test**:
    *   Verify `st.session_state` persistency: Enter data in Tab 1, go to Tab 6, ensure data is visible.
    *   Verify Logging: Click button in Tab 3, verify entry appears in `track_logs.csv`.
