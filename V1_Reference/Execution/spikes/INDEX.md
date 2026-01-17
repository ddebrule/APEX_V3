# Phase 6.5.0 Spike Testing Suite - Index

**Status:** 🟢 READY TO EXECUTE
**Timebox:** 48 hours
**Gate:** Blocks Phases 6.5.1-6.5.3

---

## 📋 What's Included

### Test Harnesses (3 Spikes)

| File | Test | Duration | Command |
|------|------|----------|---------|
| `spike_timer.py` | UI Latency (st.fragment) | ~10 min | `streamlit run Execution/spikes/spike_timer.py` |
| `spike_vector_db.py` | Vector DB (pgvector) | ~2 min | `python Execution/spikes/spike_vector_db.py` |
| `spike_state_manager.py` | State Safety (Crash Test) | ~5 min | `streamlit run Execution/spikes/spike_state_manager.py` |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Comprehensive spike guide with all details |
| `SPIKE_QUICK_START.md` | TL;DR version with just the commands |
| `TESTING_CHECKLIST.md` | Step-by-step checklist for running tests |
| `INDEX.md` | This file (navigation) |
| `__init__.py` | Python module init |

### Results Tracking

| File | Purpose |
|------|---------|
| `../Implementation_Plans/phase_6_5_spike_results.md` | Document spike results & gate status |

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Read the quick summary
cat Execution/spikes/SPIKE_QUICK_START.md

# 2. Run all three spikes in parallel (3 terminal windows)
# Terminal 1:
streamlit run Execution/spikes/spike_timer.py

# Terminal 2:
python Execution/spikes/spike_vector_db.py

# Terminal 3:
streamlit run Execution/spikes/spike_state_manager.py

# 3. Perform tests (follow instructions in each spike)
# 4. Update results file
vim Orchestration/Implementation_Plans/phase_6_5_spike_results.md

# 5. Check gate status
cat Orchestration/Implementation_Plans/phase_6_5_spike_results.md
```

---

## 📖 Detailed Guides

### For Quick Execution
→ Start with: `SPIKE_QUICK_START.md`

### For Step-by-Step Testing
→ Start with: `TESTING_CHECKLIST.md`

### For Full Technical Details
→ Start with: `README.md`

### For Individual Spike Deep-Dive
→ Read spike file docstrings:
- `spike_timer.py` (lines 1-20)
- `spike_vector_db.py` (lines 1-20)
- `spike_state_manager.py` (lines 1-20)

---

## ✅ Spike Breakdown

### Spike 1: UI Latency (`spike_timer.py`)

**Question:** Can `st.fragment` achieve < 200ms click-to-update latency?

**Test:** Stopwatch component with isolated rerender
**Duration:** ~10 minutes (5 manual clicks)
**Pass Criteria:** Average < 200ms
**Fallback:** Pivot to React components (if fails)

**Key Points:**
- Tests Streamlit 1.39+ fragment capability
- Measures browser→Streamlit→browser round-trip
- No production code affected
- Results drive UI architecture decision

---

### Spike 2: Vector DB (`spike_vector_db.py`)

**Question:** Does Railway Postgres support the `pgvector` extension?

**Test:** Attempt to create extension via SQL
**Duration:** ~2 minutes (automated)
**Pass Criteria:** Extension created successfully
**Fallback:** Use ChromaDB on `/app/data` volume (if fails)

**Key Points:**
- Tests user permissions on Railway
- Safe: uses `IF NOT EXISTS` clause
- Non-destructive (reads schema, may create extension)
- Results drive vector storage architecture decision

---

### Spike 3: State Safety (`spike_state_manager.py`)

**Question:** Will the 3-second debounce protocol survive a browser crash?

**Test:** Enter data → Wait for auto-save → Kill tab → Reopen → Verify persistence
**Duration:** ~5 minutes (manual steps)
**Pass Criteria:** Data persists after crash
**Fallback:** Tighten debounce to 1s or use immediate saves (if fails)

**Key Points:**
- Tests debounce logic with simulated DB (file)
- Tests crash recovery mechanism
- Validates that UI doesn't freeze on keystroke
- Results drive state management architecture decision

---

## 🎯 Success Criteria Summary

| Spike | PASS | FAIL | What It Decides |
|-------|------|------|-----------------|
| **Spike 1** | < 200ms avg | > 200ms avg | Will st.fragment work? Or need React? |
| **Spike 2** | Extension created | Permission denied | Will use pgvector? Or ChromaDB? |
| **Spike 3** | Data persists | Data lost | Will debounce work? Or need tighter timing? |

---

## 📊 Gate Approval Flow

```
Phase 6.5.0 Spikes
├─ Spike 1 PASS? ──→ YES: Continue | NO: Apply Fallback 1
├─ Spike 2 PASS? ──→ YES: Continue | NO: Apply Fallback 2
├─ Spike 3 PASS? ──→ YES: Continue | NO: Apply Fallback 3
│
└─ ALL APPROVED? ──→ YES: 🟢 GATE APPROVED | NO: 🔴 GATE BLOCKED
    │
    └─ 🟢 APPROVED → Proceed to Phases 6.5.1-6.5.3
    └─ 🔴 BLOCKED → Fix failures, retest, or update plan
```

---

## 📝 Before You Run Spikes

- [ ] Streamlit updated: `pip install --upgrade streamlit>=1.39.0`
- [ ] psycopg2 installed: `pip install psycopg2-binary`
- [ ] `.env` file exists with `DATABASE_URL` (for Spike 2)
- [ ] 3 terminal windows ready
- [ ] Browser ready for manual testing
- [ ] Phone/stopwatch optional (Spike 1 app has built-in timer)

---

## 📁 File Structure

```
Execution/spikes/
├── __init__.py                          # Module init
├── spike_timer.py                       # Spike 1 test harness
├── spike_vector_db.py                   # Spike 2 test harness
├── spike_state_manager.py               # Spike 3 test harness
├── README.md                            # Full documentation
├── SPIKE_QUICK_START.md                 # TL;DR version
├── TESTING_CHECKLIST.md                 # Step-by-step checklist
├── INDEX.md                             # This file
│
└── .spike3_persistent_state.json        # (Generated by Spike 3)

Orchestration/Implementation_Plans/
└── phase_6_5_spike_results.md           # Results tracking & gate status
```

---

## 🔄 Post-Spike Workflow

1. **Run all spikes** (following TESTING_CHECKLIST.md)
2. **Record results** in `phase_6_5_spike_results.md`
3. **Review gate status:**
   - 🟢 All PASS? Proceed to Phase 6.5.1
   - 🔴 Any FAIL? Apply fallback strategy
4. **Update plan** if fallbacks triggered
5. **Communicate decision** to team

---

## 🆘 Troubleshooting

### Spike 1 Fails (> 200ms)
→ See `README.md` → "Spike 1: UI Latency" → "If It FAILS"

### Spike 2 Fails (pgvector unavailable)
→ See `README.md` → "Spike 2: Vector Database" → "If It FAILS"

### Spike 3 Fails (Data not recovered)
→ See `README.md` → "Spike 3: State Safety" → "If It FAILS"

### Streamlit Version Error
→ Run: `pip install --upgrade streamlit>=1.39.0`

### Database Connection Error
→ Check `DATABASE_URL` in `.env` and network connectivity

---

## 📞 Questions?

- **General Phase 6.5:** See `Orchestration/Implementation_Plans/phase_6_5_performance_core_plan.md`
- **Spike Details:** Read spike file docstrings (top of each .py file)
- **Testing Procedure:** See `TESTING_CHECKLIST.md`
- **Full Guide:** See `README.md`

---

## 🎬 Next Steps After Spikes

Once gate is approved (🟢):

1. **Phase 6.5.1:** Reactive UI Refactor (st.fragment implementation)
2. **Phase 6.5.2:** State Manager (debounce + auto-sync)
3. **Phase 6.5.3:** Vector Memory & MCP Integration (RAG + embeddings)

See: `phase_6_5_performance_core_plan.md` for full phase details

---

**Status:** 🟢 READY TO EXECUTE
**Gate Timebox:** 48 hours
**Next Phase Blocker:** Yes (all spikes must PASS or fallback approved)
