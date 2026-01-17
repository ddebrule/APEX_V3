# Agent OS Standard
**Version:** 1.0
**Source:** [Builder Methods Agent OS](https://github.com/buildermethods/agent-os)

## Philosophy
AI Agents drift. Without structure, they hallucinate, use wrong libraries, or forget the goal. Agent OS provides the **Context Structure** to keep the agent "on rails".

## The Context Structure (D.O.E. Mapping)

We execute Agent OS using the **3-Layer D.O.E. Framework**:

### 1. Directives/ (Layer 1: Context & Standards)
*   **Purpose:** The "Truth" of the project.
*   **Agent OS Equivalent:** `System Context`, `Product Context`.
*   **Content:**
    *   `Project_Manifest.txt`: The High-level vision.
    *   `Standards/`: Tech Stack, Design System.
    *   `Glossary.md`: Domain terms (e.g., "Camber", "Toe-in").

### 2. Orchestration/ (Layer 2: Specs & Plans)
*   **Purpose:** The "Instructions" for the current task.
*   **Agent OS Equivalent:** `Specs`, `Plans`.
*   **Content:**
    *   `Specs/`: The Design OS Specs (Visuals/Mockups).
    *   `Implementation_Plans/`: The detailed build tickets.

### 3. Execution/ (Layer 3: The Work)
*   **Purpose:** The "Output".
*   **Agent OS Equivalent:** `Source Code`.
*   **Content:**
    *   All functional code (Python, React, SQL).
    *   NO planning docs allowed here.

## The Golden Rule for Agents
**"Read Context First."**
Before creating any file or writing any code, the Agent MUST:
1.  Read `Directives/Project_Manifest.txt`.
2.  Read the relevant `Orchestration/Specs/` file.
3.  ONLY THEN write to `Execution/`.
