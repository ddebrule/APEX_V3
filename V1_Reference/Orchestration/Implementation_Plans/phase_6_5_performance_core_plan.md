# Phase 6.5: The Performance Core Strategy (Validating V2.0)
*System-Wide Optimization & Intelligence Architecture*

## 1. Goal Description
The A.P.E.X. system has grown from a simple calculator to a complex "Digital Race Engineer". To support "Institutional Memory" (Phase 2.5) and the future "6-Tab Vision", we must optimize the core architecture.
The goal of **Phase 6.5** is to transition from a "Streamlit-Bound" application to a "State-Driven" architecture, enabling sub-second response times, deep contextual memory, and mobile-native responsiveness.

## 2. The "Front-to-Back" Optimization Strategy

### 2.1 Front-End: Responsive Harmony (UX)
*Optimization:*
*   **Partial Re-rendering:** Implement `st.fragment` (Streamlit 1.39.0 confirmed) for high-frequency components (Stopwatch, Tire Temp Input) to prevent full-page reloads.
*   **Mobile-Native Context:** Use `st.container` with custom CSS media queries to reflow the "Control Array" (Suspension inputs) into efficient single-column views on mobile.
*   **Lazy Loading:** Defer loading of heavy assets (Charts, Library Images) until the tab is actually active.

### 2.2 Middle-Tier: The State-Driven Core (Architecture)
*Optimization:*
*   **State Manager Pattern:** Introduce a dedicated `StateManager` class that wraps `st.session_state`.
*   **Sync Logic (The Debounce Protocol):**
    *   *The Problem:* Blocking saves on every keystroke freezes the UI.
    *   *The Fix:* A "Dirty Bit" Debouncer.
    *   `Value Change` -> `Update Session State (Instant)` -> `Mark Dirty Flag` -> `Async Timer (3s)` -> `IF Dirty: Write to DB`.
*   **Service Layer Isolation:** Ensure ALL business logic resides in `Execution/services/`, accepting pure data objects.

### 2.3 Back-End: Vectorized Institutional Memory (Intelligence)
*Optimization:*
*   **Local Vector Store (RAG):**
    *   *Plan A:* `CREATE EXTENSION vector;` on Railway Postgres (Preferred).
    *   *Plan B:* `ChromaDB` running locally on Railway volume `/app/data` (Fallback).
*   **Cost Analysis:**
    *   *Volume:* ~500 tokens per setup sheet. 100 sessions = 50k tokens.
    *   *Embedding Cost:* OpenAI `text-embedding-3-small` is ~$0.00002 / 1k tokens.
    *   *Total Estimated Cost:* < $0.05 / month.

## 3. Implementation Roadmap

### Phase 6.5.0: The Technical Spike (Timebox: 48 Hours)
*Gate: Phases 6.5.1 - 6.5.3 are BLOCKED until these pass.*

#### **Spike 1: UI Latency (`st.fragment`)**
*   **Test:** Built `spike_timer.py` with a 100ms stopwatch.
*   **Success Matrix:**
    *   ✅ **Pass:** Stopwatch click-to-update is < 200ms.
    *   ❌ **Fail:** Latency > 200ms or visual flickering persists.
*   **Fallback:** If Fail -> Pivot to **Custom React Components** (higher complexity, guaranteed speed).

#### **Spike 2: Vector Capability**
*   **Test:** Run `CREATE EXTENSION vector;` on Railway Prod DB.
*   **Success Matrix:**
    *   ✅ **Pass:** SQL command succeeds. Use `pgvector`.
    *   ❌ **Fail:** Permission denied.
*   **Fallback:** If Fail -> Use **ChromaDB** persisted to Railway `/app/data` volume.

#### **Spike 3: State Safety (The "Crash Test")**
*   **Test:** Prototype `StateManager` with 3s debounce.
*   **Protocol:**
    1.  Enter data ("Shock Oil: 600").
    2.  Wait 4 seconds (Allow debounce to fire).
    3.  **KILL BROWSER TAB** (Simulate crash).
    4.  Reopen App.
*   **Success Matrix:**
    *   ✅ **Pass:** "Shock Oil" reads "600".
    *   ❌ **Fail:** "Shock Oil" reverts to previous value.
*   **Fallback:** If Fail -> Tighten debounce to 1s or implement `on_change` immediate hooks for critical fields.

### Phase 6.5.1: The Reactive UI Refactor
*   [ ] Audit `dashboard.py` and Tabs for `st.fragment` candidates.
*   [ ] Implement "Stopwatch" and "Counter" isolated re-renders.

### Phase 6.5.2: The State Manager
*   [ ] Create `Execution/core/state_manager.py`.
*   [ ] Refactor `init_session_state()` to use the Manager.
*   [ ] Implement `@state_observer` decorators for auto-saving.

### Phase 6.5.3: Vector Memory & MCP Integration
*   [ ] Design `Directives/rag_architecture.md`.
*   [ ] Install `pgvector` or `chromadb` (depending on Spike 2 result).
*   [ ] Build `MemoryService` to index **historic** sessions.
*   [ ] **MCP Upgrade:** Expose `MemoryService` via `Execution/ai/mcp_server.py` so external Agents can query the "Institutional Memory".

## 4. User Review Required
> [!IMPORTANT]
> **Timeline:** Spikes are estimated to take 1-2 days.
> **Scope:** This phase touches CORE architecture. No new features will be built until stability is proven.

## 5. Success Metrics
*   **Latency**: Tab switching < 200ms.
*   **Retention**: Zero data loss after 3s debounce window.
*   **Recall**: AI retrieves correct historic setup context.
