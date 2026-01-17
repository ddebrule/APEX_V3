# [Phase 5.1] Persona Restoration Implementation Plan

## Goal Description
Restore the distinct "Role-Based" personality architecture defined in `Project_Manifest.txt`. The application currently uses a single monolithic "Senior Engineer" persona. This plan will refactor the AI system to inject context-specific "Mindsets" (Strategist, Engineer, Spotter, Analyst, Librarian) based on the active tab, enforcing the newly defined `setup_logic.md`.

## User Review Required
> [!IMPORTANT]
> This change mainly affects the AI's "Voice" and "Focus". It does not change the underlying physics logic, but it enforces it more strictly.

## Proposed Changes

### 1. Refactor Prompts Module
Split the single `SYSTEM_PROMPT` into a dictionary or class-based structure that returns the correct prompt based on the requested "Persona Key".

#### [MODIFY] [prompts.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Execution/ai/prompts.py)
*   **Status:** File exists.
*   **Action:** Deprecate the single `SYSTEM_PROMPT` constant but MAINTAIN it as a fallback variable (assigned to the "Engineer" prompt) to ensure backward compatibility with existing tests.
*   **Action:** Create a helper function `build_prompt_context(session_state) -> dict` to extract pending changes and history, keeping `get_system_prompt` clean.
*   **Action:** Create `get_system_prompt(persona_key: str, context: dict) -> str` function.
*   **Action:** Implement the 5 new persona definitions from `Execution/ai/persona_prompts.md` as templates.
*   **Action:** Add logic to inject the "Input Context" dynamically (e.g., sticking the "Scenario" into the Engineer's system prompt).

### 2. Update Dashboard Orchestrator
The `dashboard.py` file must govern the "Handoff State". It needs to pass the correct context down to the tabs.

#### [MODIFY] [dashboard.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Execution/dashboard.py)
*   **Action:** Ensure `st.session_state` keys for "Scenario" and "Last Strategy" are globally available so Tab 2 (Engineer) can read what Tab 1 (Strategist) decided.

### 3. Update Individual Tabs
Each tab typically calls `anthropic.messages.create()`. We need to update these calls to use the specific persona for that tab.

#### [MODIFY] [setup_advisor.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Execution/tabs/setup_advisor.py)
*   **Action:** Update the `system` parameter in the API call to use `prompts.get_system_prompt("engineer")`.
*   **Action:** CRITICAL FIX: Wire the "APPLY" button to call `session_service.record_setup_change()` and `session_service.save_session_state()`. Currently, it only shows a success message without saving the data.
*   **Action:** Ensure the "Change Log" is appended to `st.session_state.change_history` for immediate context injection.

#### [MODIFY] [event_setup.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Execution/tabs/event_setup.py)
*   **Action:** (If AI features exist here) Update to use `prompts.get_system_prompt("strategist")`.

#### [MODIFY] [post_analysis.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Execution/tabs/post_analysis.py)
*   **Action:** Update to use `prompts.get_system_prompt("analyst")`.

### 4. Housekeeping & Cleanup
Remove unused dependencies identified during the investigation.

#### [MODIFY] [requirements.txt](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/requirements.txt)
*   **Action:** Remove `google-generativeai`.

## Verification Plan

### Automated Tests
*   **None for Prompts:** AI personality changes are hard to unit test deterministically.

### Testing & Rollout Strategy
*   **Order of Operations:** Implement and verify **Tab 1 (Strategist)** first. This sets the "Scenario" and "Event Context" that downstream tabs depend on. Once Tab 1 is verified, proceed to Tab 2 (Engineer).

### Manual Verification
1.  **The Strategist Check (Tab 1):**
    *   Go to Tab 1. Ask a question.
    *   *Verify:* The AI should speak about "Logistics" and "History", not "Pistons".
2.  **The Engineer Check (Tab 2):**
    *   Go to Tab 2. Say "The car is loose."
    *   *Verify:* The AI recommends a physics change and cites the hierarchy ("Tires first...").
    *   *Verify:* "APPLY" button saves the change (Check Pending Changes tab or History).
3.  **The Handoff Check:**
    *   In Tab 1, tell the Strategist: "We are doing Scenario B (Consistency)."
    *   Go to Tab 2. Ask for a risky geometry change.
    *   *Verify:* The Engineer should reject it or warn you, citing the "Scenario B" constraint.
4.  **Anti-Redundancy Check:**
    *   Apply a change. Refresh. Ask for it again.
    *   *Verify:* The AI says "We just changed that."
