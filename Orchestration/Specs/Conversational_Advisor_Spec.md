# Product Spec: Tab 2 - Conversational Advisor (Redesign)
**Status:** DRAFT 🟠 (Backtrack)

## Goal
To provide a human-centric, interactive "Pit Partner" experience where racers can describe symptoms, ask "What if?" questions, and receive physics-backed setup advice through a natural chat interface.

## 1. Dialogue-First Interaction Model (The Socratic Loop)
The Advisor uses a state machine to drive the conversation: `symptom` → `clarifying` → `proposal` → `applied`.

- **Turn Type:**
  - `ai-question`: Clarifying questions to lock physics context ("Is it on power or off?").
  - `user-response`: Text/Voice input from the racer.
  - `ai-proposal`: The dual-fix card (Primary vs. Alternative).
  - `ai-confirmation`: Confirmation after a change is applied.

## 2. Institutional Memory Activation
Before generating a proposal, the system MUST query `setup_changes` for the current `track_id` and `profile_id`.
- **Logic:** "If a similar symptom was fixed previously with high effectiveness, prioritize and reference that fix in the chat."

## 3. The Proposal Card Interaction Model
ProposalCards are embedded singular components within a chat message.
- **Status Tracking:** `suggested` | `applied` | `reverted`.
- **Custom Value Input:** Allows the racer to override the suggested CST or measurement ("I'll try 115 instead").
- **Undo Slot:** Every applied proposal has a 1-click "Undo" button that reverts the Digital Twin and logs the reversion.

## 4. Physics Guardrails 2.0
- **Confidence Gate:** If `driver_confidence` (from Tab 1) is < 3, the AI will refuse to propose changes and suggest "More track time."
- **Isolation Rule:** Warn the user if they try to apply a second change in the same session without testing the first.

## Data Model
- Same as previous: writes to `setup_changes`.
- New: writes to `conversations` or `observations` to persist the chat history.
