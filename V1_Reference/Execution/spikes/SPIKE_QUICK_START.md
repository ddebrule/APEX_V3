# Phase 6.5.0: Spike Testing - Quick Start

## TL;DR: Run These Commands

```bash
# Terminal 1: Spike 1 (UI Latency - ~10 min)
streamlit run Execution/spikes/spike_timer.py

# Terminal 2: Spike 2 (Vector DB - ~2 min)
python Execution/spikes/spike_vector_db.py

# Terminal 3: Spike 3 (State Safety - ~5 min)
streamlit run Execution/spikes/spike_state_manager.py
```

---

## Spike 1: UI Latency (spike_timer.py)

**What:** Test if `st.fragment` can respond in < 200ms

**How:**
1. Run command above
2. Click "▶️ Start/Stop" button 5 times
3. Record times shown
4. Calculate average

**Pass:** Average < 200ms ✅
**Fail:** Average > 200ms → Pivot to React

---

## Spike 2: Vector DB (spike_vector_db.py)

**What:** Test if Railway Postgres supports `pgvector`

**How:**
1. Set `DATABASE_URL` in `.env`
2. Run command above
3. Watch output

**Pass:** Extension created ✅
**Fail:** Permission denied → Use ChromaDB

---

## Spike 3: State Safety (spike_state_manager.py)

**What:** Test if 3-second debounce survives browser crash

**How:**
1. Run command above
2. Type "600" in Shock Oil field
3. Wait 4 seconds (watch countdown)
4. Kill browser tab (Ctrl+W)
5. Reopen app
6. Check if "600" persists

**Pass:** Value is "600" ✅
**Fail:** Value is "—" → Tighten debounce to 1s

---

## Track Results

After all spikes run, update:
```
Orchestration/Implementation_Plans/phase_6_5_spike_results.md
```

Each spike section has a table to fill in.

---

## Gate Approval

All 3 spikes must PASS (or have fallback approved) before:
- ✅ Phase 6.5.1 (Reactive UI Refactor)
- ✅ Phase 6.5.2 (State Manager)
- ✅ Phase 6.5.3 (Vector Memory & MCP)

---

## Full Details

See: `Execution/spikes/README.md`

---

**⏳ 48-Hour Timebox Starts Now**
