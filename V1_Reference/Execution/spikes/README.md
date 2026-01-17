# Phase 6.5.0: Spike Testing Suite

This directory contains isolated spike tests for validating the Phase 6.5 architecture before proceeding to full implementation.

## Overview

The three spikes test critical assumptions:

1. **Spike 1: UI Latency** — Can `st.fragment` achieve < 200ms responsiveness?
2. **Spike 2: Vector DB** — Does Railway Postgres support `pgvector`?
3. **Spike 3: State Safety** — Will 3s debounce protocol survive a browser crash?

**Gate:** All spikes must PASS before Phases 6.5.1-6.5.3 are authorized.

---

## Quick Start

### Prerequisites

```bash
# Ensure dependencies installed
pip install streamlit psycopg2-binary python-dotenv
```

### Run All Spikes

```bash
# Terminal 1: Spike 1 (UI Latency)
streamlit run Execution/spikes/spike_timer.py

# Terminal 2: Spike 2 (Vector DB)
python Execution/spikes/spike_vector_db.py

# Terminal 3: Spike 3 (State Safety)
streamlit run Execution/spikes/spike_state_manager.py
```

---

## Detailed Spike Guides

### Spike 1: UI Latency Test

**File:** `spike_timer.py`
**Run:** `streamlit run Execution/spikes/spike_timer.py`
**Duration:** ~10 minutes
**Impact on Production:** NONE (isolated app)

#### Test Protocol

1. Open the Streamlit app (runs on `http://localhost:8501` by default)
2. Click the **"▶️ Start/Stop"** button
3. Immediately click again to stop
4. Note the elapsed time displayed
5. Repeat 5 times, recording each result
6. Calculate average

#### Success Criteria

| Result | Status | Decision |
|--------|--------|----------|
| **< 200ms** | ✅ PASS | Proceed with Phase 6.5.1 |
| **200-500ms** | ⚠️ CAUTION | Acceptable but marginal |
| **> 500ms** | ❌ FAIL | Pivot to React components |

#### What's Being Tested

- `st.fragment` isolated rerender performance
- Browser-to-Streamlit latency (click to UI update)
- Visual responsiveness without full-page reload

#### Expected Results

With Streamlit 1.39+ on modern hardware:
- **Good:** 50-150ms per click (fragment is efficient)
- **Fair:** 150-300ms (acceptable for complex components)
- **Poor:** > 300ms (indicates Streamlit overhead too high)

#### If It FAILS

If average latency > 200ms:
1. Note the exact average latency
2. Document in `phase_6_5_spike_results.md`
3. **Fallback:** Phase 6.5.1 shifts to React component integration
4. This increases complexity but guarantees < 100ms latency

---

### Spike 2: Vector Database Test

**File:** `spike_vector_db.py`
**Run:** `python Execution/spikes/spike_vector_db.py`
**Duration:** ~2 minutes
**Impact on Production:** MINIMAL (read-only + non-destructive extension)

#### Prerequisites

1. Set `DATABASE_URL` in your `.env` file
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```

2. (For local testing) Create a test database, or use Railway staging DB

#### Test Protocol

1. Run the script: `python Execution/spikes/spike_vector_db.py`
2. Script will:
   - Parse `DATABASE_URL`
   - Connect to Postgres
   - Attempt `CREATE EXTENSION IF NOT EXISTS vector;`
   - Report success/failure

#### Success Criteria

| Result | Status | Decision |
|--------|--------|----------|
| **Extension created** | ✅ PASS | Use pgvector (Plan A) |
| **Permission denied** | ❌ FAIL | Use ChromaDB (Plan B) |
| **Extension unavailable** | ❌ FAIL | Use ChromaDB (Plan B) |
| **Connection error** | ⚠️ ERROR | Check DATABASE_URL, retry |

#### What's Being Tested

- Railway Postgres permissions (can user create extensions?)
- Postgres version (has `pgvector` available?)
- Network connectivity to production DB

#### If It FAILS

If extension creation fails:
1. Check Postgres version: `SELECT version();`
2. Check user permissions: `\du` in psql
3. **Fallback:** Phase 6.5.3 switches to ChromaDB
4. ChromaDB persisted to `/app/data` volume (still on Railway)

#### If It PASSES

1. Document result in `phase_6_5_spike_results.md`
2. Phase 6.5.3 will add `pgvector` to schema
3. Implement embeddings directly in Postgres

---

### Spike 3: State Safety (Crash Test)

**File:** `spike_state_manager.py`
**Run:** `streamlit run Execution/spikes/spike_state_manager.py`
**Duration:** ~5 minutes (manual steps)
**Impact on Production:** NONE (isolated app, file-based storage)

#### Test Protocol

1. **Start the app:** `streamlit run Execution/spikes/spike_state_manager.py`
2. **Enter data:** Type "600" in the "Shock Oil (CST)" field
3. **Watch debounce:** Notice the "⏳ Dirty (X.Xs until save)" countdown
4. **Wait 4 seconds:** Let the app auto-save (will show "💾 Saved!")
5. **Kill the browser tab:** Ctrl+W (Windows) or Cmd+W (Mac) to close
6. **Reopen the app:** Run the same command again
7. **Verify recovery:** Check if "Shock Oil" still displays "600"

#### Success Criteria

| Result | Status | Decision |
|--------|--------|----------|
| **Value persists as "600"** | ✅ PASS | Proceed with Phase 6.5.2 |
| **Value reverts to "—"** | ❌ FAIL | Tighten debounce to 1s |
| **App crashes** | ⚠️ ERROR | Check logs, debug |

#### What's Being Tested

- **Dirty bit pattern:** Instant UI update, deferred save
- **Debounce logic:** 3-second timer between changes
- **Crash recovery:** Can app restore from saved state?
- **Persistence layer:** Does save actually write to disk?

#### Expected Behavior

1. **Type "600"** → Instantly displays in input field (no freeze)
2. **Wait 4s** → Auto-save triggers, shows "💾 Saved!" message
3. **Kill tab** → Session dies, but file was already saved
4. **Reopen app** → Loads persisted state from file, displays "600"

#### If It FAILS

If value doesn't persist:
1. Check file system: Is `.spike3_persistent_state.json` being created?
2. Check timing: Did you wait at least 4 seconds before killing?
3. Check storage: Is `/Execution/spikes/` writable?
4. **Fallback:** Tighten debounce from 3s → 1s, or use immediate saves for critical fields

#### File Location

- Persistent state file: `Execution/spikes/.spike3_persistent_state.json`
- Check its contents to verify what was saved

---

## Troubleshooting

### Common Issues

#### Spike 1: Streamlit Version Error

**Error:** `AttributeError: module 'streamlit' has no attribute 'fragment'`

**Cause:** Streamlit version < 1.37

**Fix:**
```bash
pip install --upgrade streamlit>=1.39.0
```

#### Spike 2: Connection Refused

**Error:** `psycopg2.OperationalError: could not connect to server`

**Cause:** DATABASE_URL invalid or server unreachable

**Fix:**
1. Verify `DATABASE_URL` in `.env`
2. Check network connectivity to Railway
3. For local testing, skip this spike (non-blocking)

#### Spike 3: Permission Denied

**Error:** `PermissionError: [Errno 13] Permission denied: '.spike3_persistent_state.json'`

**Cause:** `/Execution/spikes/` directory not writable

**Fix:**
```bash
chmod 755 Execution/spikes/
```

---

## Results Tracking

After running each spike, update: **`Orchestration/Implementation_Plans/phase_6_5_spike_results.md`**

### Template

```markdown
## Spike 1: UI Latency

- **Result:** PASS / FAIL / ERROR
- **Average Latency:** XXms
- **Trials:** [list of times]
- **Notes:** [observations]
```

---

## Timeline

- **Spike 1:** ~10 minutes (manual clicking)
- **Spike 2:** ~2 minutes (automated test)
- **Spike 3:** ~5 minutes (manual crash test)
- **Total:** ~30 minutes active testing
- **48-Hour Gate:** Allows for retry/debugging

---

## Gate Approval

Once all spikes are documented:

1. Review results in `phase_6_5_spike_results.md`
2. **ALL PASS?** → Proceed to Phases 6.5.1-6.5.3
3. **ANY FAIL?** → Apply fallback, document decision, retry if needed
4. **Update plan:** Record final gate status in results doc

---

## Files

| File | Purpose |
|------|---------|
| `spike_timer.py` | UI latency test with st.fragment |
| `spike_vector_db.py` | pgvector extension availability test |
| `spike_state_manager.py` | State safety & crash recovery test |
| `README.md` | This file (instructions) |
| `.spike3_persistent_state.json` | (Generated by Spike 3) Persistent state file |

---

## Questions?

- **General:** See `Orchestration/Implementation_Plans/phase_6_5_performance_core_plan.md`
- **Spike 1 Details:** Review `spike_timer.py` docstring
- **Spike 2 Details:** Review `spike_vector_db.py` docstring
- **Spike 3 Details:** Review `spike_state_manager.py` docstring

---

**Gate Status:** 🔴 BLOCKED (awaiting spike execution)
**Next Phase:** Phases 6.5.1-6.5.3 (pending spike approval)
