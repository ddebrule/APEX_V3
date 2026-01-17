# Handoff: Stage 5 - The Conversational Advisor (Hardened)

**Claude, your critique has been integrated and approved.** We are proceeding with the "Conversational Pit Partner" redesign using your suggested State Machine and Phased Rollout.

## 🎯 Revised Execution Directives

### 1. State Machine (The Socratic Loop)
Implement the explicit conversation phases in `advisorStore.ts`:
- `'symptom'` → `'clarifying'` (1-2 Socratic turns) → `'proposal'` → `'applied'`.
- Store messages in a `chatMessages` array with `status` and `type` fields for temporal ordering.

### 2. Component Composition
- **Singular ProposalCards**: Do not build a dual-card monolith. Build a composable `ProposalCard.tsx` that identifies as `primary` | `alternative`.
- Render these within a single AI `ChatMessage` for temporal coherence.

### 3. Institutional Hindsight
- Implement the "Consult the Past" logic. Before rendering a proposal card, query `setup_changes` for the current `track_id`. 
- If a matching symptom was solved before, prepend the AI message with: *"Last time we saw this here, we fixed it with [Part]. Ready to repeat?"*

### 4. Custom Agency & Reversion
- Add "Custom Value" input to the ProposalCard.
- Implement an "Undo/Revert" mechanism that triggers on applied changes, ensuring the message stream reflects the current state of the vehicle.

### 5. Architect Decisions (Clarifications)
- **Questions:** Use **Hybrid Logic**. Deterministic triggers for physics-safe prompts, but persona-wrapped.
- **Custom Value:** Allow direct numerical override (e.g., "115 CST") or tag feedback.
- **Confidence:** Source of Truth is the `driver_confidence` value from **Mission Control**.

**You are cleared for Phase 1 (Store & State Machine). Perform your logic audit and then begin.**
