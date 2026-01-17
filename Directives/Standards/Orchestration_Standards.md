# APEX V2 Orchestration Standards
**Version:** 1.0
**Status:** ENFORCED 🛡️

## 1. Directory Structure

Orchestration is split into two distinct areas to separate "What to build" from "How to build it."

### 📂 Orchestration/Specs/ (The "What")
*   Contains design documents, UI mockups, and functional requirements.
*   **Naming:** `[Feature_Name]_spec.md` (e.g., `pit_lane_spec.md`)

### 📂 Orchestration/Implementation_Plans/ (The "How")
*   Contains the granular technical tickets for the agents.
*   **Naming:** `P[Phase]_[Feature_Name]_plan.md` (e.g., `P3_Pit_Lane_plan.md`)
*   **Archiving:** Once a phase is 100% complete and verified, move the plan to `Implementation_Plans/Archive/`.

## 2. Plan Templates

Every Implementation Plan must follow this structure:
1.  **Status Block:** Current state (Draft, Approved, Executing, Done).
2.  **Context:** Link to the relevant Spec file in `Orchestration/Specs/`.
3.  **Instruction Set:** Granular, file-by-file changes for the Builder (Claude).
4.  **Verification Checkpoints:** Exact steps to prove it works.

## 3. The "Brain" Sync
The `brain/` directory (Gemini's internal workspace) will reflect the high-level roadmap (`task.md`), while the `Orchestration/` folder in the project root serves as the shared source of truth for both Agents and the User.
