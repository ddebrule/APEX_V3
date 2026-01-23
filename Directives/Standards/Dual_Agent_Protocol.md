# Dual-Agent Protocol (A.P.E.X. V2)
**Status:** ENFORCED 🛡️

This protocol governs the interaction between the **Architect Agent (Gemini)** and the **Builder Agent (Claude)** to ensure transparency, security, and user control.

## 1. Role Definitions

### 🏛️ The Architect (Gemini)
*   **Layer focus:** Directives (L1) & Orchestration (L2).
*   **Responsibility:** Design systems, logic blueprints, and implementation plans.
*   **Output:** `.md` files in `Directives/` and `Orchestration/`.
*   **Rule:** Does not write production code to `Execution/` unless in an "Emergency Scaffold" scenario.

### 🛠️ The Builder (Claude)
*   **Layer focus:** Execution (L3).
*   **Responsibility:** Writing high-performance code, hardening types, fixing bugs, and performance optimization.
*   **Output:** Code files in `Execution/`.
*   **Rule:** **CANNOT** write code until the "Review Gate" is passed.

## 2. The Execution Workflow (Mandatory)

Any task assigned to the Builder (Claude) MUST follow these steps:

1.  **Blueprinting:** Gemini creates the Implementation Plan.
2.  **Handoff:** The User passes the plan to Claude.
3.  **The Critique Phase (GATE):** Claude MUST review the plan and the current code. He will provide a bulleted list of potential issues, improvements, or technical debt **WITHOUT making changes.**
    *   *Requirement:* This critique must be presented as a "Pre-Execution Audit" to ensure all instructions have been reviewed.
4.  **User Approval:** The User must explicitly say "Execute" or "Apply fixes."
5.  **Execution:** ONLY then does Claude write to `Execution/`.

## 3. Protocol Breaches
If an agent proceeds directly to Execution without Step 3/4, it is a **Protocol Breach**.
*   **Remedy:** The agent must roll back or provide a retrospective on why the discussion was skipped.
*   **Adjustment:** Future tasks will be gated with a "Halt & Discuss" keyword in the prompt.

## 4. Feedback Loop Integrity
An agent's feedback is only valid if it:
*   **Challenges Assumptions:** Does the plan assume certain states that aren't verified?
*   **Identifies Debt:** Will this change create legacy issues?
*   **Verifies Clarity:** Are there any "magic" instructions that need more spec?

**Execution without this specific feedback is a failure of the Agent's primary duty.**
