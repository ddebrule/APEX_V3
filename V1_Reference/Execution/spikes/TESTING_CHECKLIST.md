# Phase 6.5.0 Spike Testing Checklist

Use this checklist to ensure all spikes are run properly and results are documented.

---

## Pre-Test Setup

- [ ] All spikes downloaded/created in `Execution/spikes/`
- [ ] `.env` file has `DATABASE_URL` set (for Spike 2)
- [ ] Streamlit updated to 1.39.0+ (`pip install --upgrade streamlit`)
- [ ] psycopg2 installed (`pip install psycopg2-binary`)
- [ ] Have 3 terminal windows ready (one per spike)
- [ ] Phone/watch available to time Spike 1 clicks (or use built-in timer)

---

## Spike 1: UI Latency Test

### Before Running
- [ ] Terminal window open and ready
- [ ] No other Streamlit apps running on default port 8501
- [ ] Phone or stopwatch ready for manual timing (optional - app has built-in timer)

### Running the Test
- [ ] Run: `streamlit run Execution/spikes/spike_timer.py`
- [ ] App loads in browser (usually `http://localhost:8501`)
- [ ] Click "▶️ Start/Stop" button (starts timer)
- [ ] Click again immediately (stops timer)
- [ ] Note the elapsed milliseconds shown
- [ ] Repeat 5 times, recording each result

### Test Results
- [ ] Trial 1 elapsed time: _____ ms
- [ ] Trial 2 elapsed time: _____ ms
- [ ] Trial 3 elapsed time: _____ ms
- [ ] Trial 4 elapsed time: _____ ms
- [ ] Trial 5 elapsed time: _____ ms
- [ ] **Average latency: _____ ms**

### Decision
- [ ] Average < 200ms → **✅ PASS** (Proceed with st.fragment)
- [ ] Average 200-500ms → **⚠️ CAUTION** (Acceptable but marginal)
- [ ] Average > 500ms → **❌ FAIL** (Pivot to React components)

### Post-Test
- [ ] Screenshot or copy results to clipboard
- [ ] Update `phase_6_5_spike_results.md` → Spike 1 section
- [ ] Shut down Streamlit (Ctrl+C)

---

## Spike 2: Vector Database Test

### Before Running
- [ ] `.env` file has `DATABASE_URL` set
- [ ] Can access Railway dashboard (if using Railway DB)
- [ ] Terminal window open and ready

### Running the Test
- [ ] Run: `python Execution/spikes/spike_vector_db.py`
- [ ] Script starts executing (should take < 1 minute)
- [ ] Watch output for connection status
- [ ] Watch for extension creation result

### Expected Output
- [ ] ✅ "Connected to Postgres successfully"
- [ ] ✅ "SUCCESS: pgvector extension is supported!" OR
- [ ] ❌ "FAILED: [error message]"
- [ ] Final status shown: PASS / FAIL / ERROR

### Decision
- [ ] Output shows PASS → **✅ PASS** (Use pgvector)
- [ ] Output shows FAIL (Permission denied) → **❌ FAIL** (Use ChromaDB)
- [ ] Output shows FAIL (Not found) → **❌ FAIL** (Use ChromaDB)
- [ ] Connection error → **⚠️ ERROR** (Retry with correct DATABASE_URL)

### Post-Test
- [ ] Copy output to text file
- [ ] Update `phase_6_5_spike_results.md` → Spike 2 section
- [ ] Record extension availability result

---

## Spike 3: State Safety (Crash Test)

### Before Running
- [ ] Fresh browser tab or incognito window ready
- [ ] Terminal window open and ready
- [ ] Browser developer tools closed (cleaner test)
- [ ] Keyboard ready for Ctrl+W (to kill tab)

### Running the Test - Step by Step

#### Step 1: Start App
- [ ] Run: `streamlit run Execution/spikes/spike_state_manager.py`
- [ ] App loads in browser
- [ ] See input fields: "Shock Oil (CST)" and "Tire Compound"

#### Step 2: Enter Data
- [ ] Click in "Shock Oil (CST)" field
- [ ] Type: `600`
- [ ] See text input update immediately (no freeze) ✓

#### Step 3: Watch Debounce
- [ ] Look at "Debounce Status" section
- [ ] Should show "⏳ Dirty (X.Xs until save)" countdown
- [ ] Watch countdown go from ~3s down to 0s
- [ ] When countdown reaches 0, look for "💾 Saved!" message

#### Step 4: Simulate Browser Crash
- [ ] **WAIT 4 SECONDS** (ensure save completed)
- [ ] Confirm you see "💾 Saved!" message
- [ ] Press **Ctrl+W** (Windows) or **Cmd+W** (Mac) to kill browser tab
- [ ] Tab closes completely

#### Step 5: Reopen App
- [ ] Open terminal with spike_state_manager.py still running
- [ ] Open browser to `http://localhost:8501` (or press Up arrow if cmd still visible)
- [ ] App should reload
- [ ] Wait for "Shock Oil (CST)" field to populate

#### Step 6: Verify Recovery
- [ ] Check "Shock Oil (CST)" field
- [ ] **Expected:** Shows "600"
- [ ] **Actual:** Shows ___________

### Test Result
- [ ] Value is "600" → **✅ PASS** (Data survived crash)
- [ ] Value is "—" → **❌ FAIL** (Data was lost)
- [ ] Value is something else → **⚠️ ERROR** (Unexpected)

### Post-Test
- [ ] Take screenshot of recovered value
- [ ] Update `phase_6_5_spike_results.md` → Spike 3 section
- [ ] If FAIL, record notes about timing/behavior

---

## Results Documentation

### After All Spikes Complete

1. [ ] Open `Orchestration/Implementation_Plans/phase_6_5_spike_results.md`
2. [ ] Update each spike section:
   - [ ] Spike 1: Average latency, PASS/FAIL/CAUTION
   - [ ] Spike 2: Extension result, PASS/FAIL/ERROR
   - [ ] Spike 3: Recovery result, PASS/FAIL/ERROR

3. [ ] Fill in Summary Table:
   - [ ] Status column for each spike
   - [ ] Result column (actual measured value)
   - [ ] Decision column (PASS/FAIL/etc)

4. [ ] Review Decision Matrix:
   - [ ] If all PASS: Gate → **APPROVED**
   - [ ] If any FAIL: Apply fallback strategy & document
   - [ ] If any ERROR: Troubleshoot & rerun

5. [ ] Update Gate Status:
   - [ ] 🟢 **APPROVED** (Proceed to Phases 6.5.1-6.5.3)
   - [ ] 🔴 **BLOCKED** (Fallback in progress)
   - [ ] 🟡 **RETRY NEEDED** (Spike error, need retest)

---

## Fallback Strategies

### If Spike 1 FAILS (> 200ms latency)
- [ ] Document actual average latency
- [ ] Note: React component integration required
- [ ] Escalate timeline impact (React integration is complex)
- [ ] Consider: Can we optimize Streamlit instead?

### If Spike 2 FAILS (pgvector unavailable)
- [ ] Document error message
- [ ] Switch Phase 6.5.3 to ChromaDB plan
- [ ] Update implementation plan to use `/app/data` volume
- [ ] No timeline impact (ChromaDB is ready)

### If Spike 3 FAILS (Data not recovered)
- [ ] Document exact behavior (when/where data was lost)
- [ ] Options:
  - [ ] Tighten debounce from 3s → 1s
  - [ ] Implement immediate saves for critical fields
  - [ ] Use transaction log for better recovery
- [ ] Rerun Spike 3 after adjustment

---

## Sign-Off

Once all spikes are complete and documented:

**Tested By:** __________________ **Date:** __________

**All Spikes PASS or Fallback Approved:** YES / NO

**Gate Status:** 🟢 APPROVED / 🔴 BLOCKED / 🟡 RETRY

**Authorized to Proceed to Phase 6.5.1-6.5.3:** YES / NO

---

## Timeline Tracking

- [ ] Spike 1 started: _____ (time)
- [ ] Spike 2 started: _____ (time)
- [ ] Spike 3 started: _____ (time)
- [ ] All spikes completed: _____ (time)
- [ ] Results documented: _____ (time)
- [ ] Gate decision made: _____ (time)

**Total Time to Complete Spikes:** _____ hours

---

## Notes & Observations

Use this section to record any issues, anomalies, or interesting findings:

```
[Spike 1 Notes]


[Spike 2 Notes]


[Spike 3 Notes]


[General Observations]

```

---

**Next: Review & update `phase_6_5_spike_results.md` with final results**
