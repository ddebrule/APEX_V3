# Audit Quick Reference Guide

**Date:** 2026-01-14
**Status:** COMPLETE
**Audience:** Developers who need to understand and fix the issues

---

## TL;DR - The 5 Problems

| # | Problem | Where | Fix | Impact |
|---|---------|-------|-----|--------|
| 1 | `confidence_rating` vs `driver_confidence` mismatch | setup_advisor.py line 100, 115 | Rename to use `driver_confidence` everywhere | **CRITICAL** - Confidence Gate broken |
| 2 | `experience_level` in wrong location | event_setup.py line 146 reads from `racer_profile`, not `session_state` | Update Tab 1 to write to `session_state.experience_level` | **CRITICAL** - Changes don't persist |
| 3 | Scenario logic never triggers | event_setup.py - missing if/else for Scenario A/B | Add: `if practice_rounds_scheduled < 3: scenario = "B"` | **CRITICAL** - Scenario B constraints never activate |
| 4 | `change_history` never written | setup_advisor.py - appends never happen | Add append logic when changes accepted | **CRITICAL** - Anti-redundancy fails |
| 5 | Context building inconsistent | setup_advisor.py line 100 vs 177 | Standardize key names in context dict | **HIGH** - Persona missing data |

---

## Priority 1: Confidence Level (15 minutes to fix)

### Files to Change
- `Execution/tabs/setup_advisor.py`

### What's Wrong
```python
# Line 100 - WRONG
driver_confidence=st.session_state.get('confidence_rating', 3)

# Line 115 - ALSO WRONG
confidence = st.session_state.get('confidence_rating', 3)
```

Dashboard initializes as `driver_confidence` but Tab 2 reads `confidence_rating`.

### What to Change
Replace all instances of `confidence_rating` with `driver_confidence` in setup_advisor.py:
```python
# BEFORE
driver_confidence=st.session_state.get('confidence_rating', 3)

# AFTER
driver_confidence=st.session_state.get('driver_confidence', 3)
```

### Verify
After fixing, check:
- [ ] `st.session_state.driver_confidence` is readable in Tab 2
- [ ] Confidence Gate logic activates when < 3
- [ ] Changing confidence in UI persists

---

## Priority 2: Experience Level (10 minutes to fix)

### Files to Change
- `Execution/tabs/event_setup.py`
- `Execution/tabs/setup_advisor.py` (verify)
- `Execution/tabs/post_analysis.py` (verify)

### What's Wrong
```python
# event_setup.py line 146 - WRONG LOCATION
experience_level = st.session_state.racer_profile.get('experience_level', 'Intermediate')

# Should be
experience_level = st.session_state.get('experience_level', 'Intermediate')
```

Changes to experience_level in Tab 1 don't update the session state root, so other tabs never see them.

### What to Change
1. Update reads to use session_state root:
```python
# BEFORE
experience_level = st.session_state.racer_profile.get('experience_level', 'Intermediate')

# AFTER
experience_level = st.session_state.get('experience_level', 'Intermediate')
```

2. When user changes experience level in Tab 1, update session state:
```python
# After user selects new experience level
st.session_state.experience_level = selected_level
```

### Verify
After fixing, check:
- [ ] Tab 1 reads from `st.session_state.experience_level`
- [ ] Tab 1 writes to `st.session_state.experience_level` when changed
- [ ] Tab 2 reads from `st.session_state.experience_level`
- [ ] Changing experience persists across tabs

---

## Priority 3: Scenario Auto-Detection (10 minutes to fix)

### Files to Change
- `Execution/tabs/event_setup.py`

### What's Wrong
Scenario is initialized as "A" (aggressive) and never changes to "B" (conservative), even when practice rounds < 3.

### What to Change
In event_setup.py, after user sets practice_rounds, add:

```python
# After user inputs practice_rounds_scheduled
if st.session_state.practice_rounds_scheduled >= 3:
    st.session_state.scenario = "A"  # Aggressive (aggressive testing allowed)
else:
    st.session_state.scenario = "B"  # Conservative (only safe changes)

st.info(f"📋 Scenario: {st.session_state.scenario} mode ({'Aggressive' if st.session_state.scenario == 'A' else 'Conservative'})")
```

### Where to Add It
In event_setup.py, around line 175 (after practice rounds are set), before the session is created.

### Verify
After fixing, check:
- [ ] With 2 practice rounds: scenario = "B"
- [ ] With 3+ practice rounds: scenario = "A"
- [ ] Changing practice rounds updates scenario immediately
- [ ] Tab 2 reads updated scenario value

---

## Priority 4: Change History Recording (15 minutes to fix)

### Files to Change
- `Execution/tabs/setup_advisor.py`

### What's Wrong
When a user accepts a setup recommendation, the change is applied but never recorded to `change_history`.

### What to Change
Find where `actual_setup` is updated (around line 225 in setup_advisor.py), and add:

```python
from datetime import datetime

# When a change is accepted by user
if accept_button:
    # Apply the change
    st.session_state.actual_setup[parameter_key] = new_value

    # RECORD IT in change_history
    st.session_state.change_history.append({
        'timestamp': datetime.now().isoformat(),
        'parameter': parameter_key,
        'old_value': old_value,
        'new_value': new_value,
        'status': 'accepted'
    })

    st.success(f"✅ Changed {parameter_key} to {new_value}")
```

### Verify
After fixing, check:
- [ ] Each accepted change is recorded in `change_history`
- [ ] Timestamp is recorded
- [ ] Parameter name, old value, new value are recorded
- [ ] Engineer persona checks history before suggesting changes (anti-redundancy)
- [ ] Trying to suggest same change twice fails (history check)

---

## Priority 5: Context Building Consistency (10 minutes to fix)

### Files to Change
- `Execution/tabs/setup_advisor.py` (around lines 170-180)

### What's Wrong
Multiple references to confidence use different key names:
```python
# Line 100
driver_confidence=st.session_state.get('confidence_rating', 3)  # ❌ WRONG

# Line 177 (in context dict)
'driver_confidence': st.session_state.get('driver_confidence', 3)  # ✅ RIGHT
```

### What to Change
After Priority 1 is fixed (confidence_rating → driver_confidence), verify the context dict uses consistent names:

```python
# BEFORE (mixed names)
engineer_context = {
    'scenario': scenario,
    'orp_score': orp_score,
    'consistency_pct': orp_context.get('consistency', 0),
    'fade_factor': orp_context.get('fade', 1.0),
    'driver_confidence': st.session_state.get('confidence_rating', 3),  # ❌ WRONG
    'experience_level': experience_level,
    'change_history': st.session_state.get('change_history', [])
}

# AFTER (consistent names)
engineer_context = {
    'scenario': scenario,
    'orp_score': orp_score,
    'consistency_pct': orp_context.get('consistency', 0),
    'fade_factor': orp_context.get('fade', 1.0),
    'driver_confidence': st.session_state.get('driver_confidence', 3),  # ✅ RIGHT
    'experience_level': experience_level,
    'change_history': st.session_state.get('change_history', [])
}
```

### Verify
After fixing, check:
- [ ] All context dict keys match what personas expect
- [ ] No "confidence_rating" references remain
- [ ] Engineer prompt receives full context with all values populated

---

## Testing Checklist

After making all 5 Priority fixes, test:

### Tab 1 (Event Setup)
- [ ] Set practice rounds to 2 → scenario becomes "B"
- [ ] Set practice rounds to 5 → scenario becomes "A"
- [ ] Change experience level → value persists to other tabs
- [ ] Start a session successfully

### Tab 2 (Setup Advisor)
- [ ] Set confidence to 1 → AI rejects recommendations (Confidence Gate)
- [ ] Set confidence to 4 → AI allows recommendations
- [ ] With Scenario B (2 practice rounds) → AI only suggests SO_F, SO_R, RH_F, RH_R, C_F, C_R
- [ ] With Scenario A (5 practice rounds) → AI suggests all parameter types
- [ ] Accept a change → it appears in change_history
- [ ] Accept same change again → AI suggests alternative instead of repeating

### Tab 3 (Race Support)
- [ ] No changes needed, verify works as-is

### Tab 4 (Post Event Analysis)
- [ ] Verify it reads experience_level from correct location
- [ ] Verify it builds context correctly

### Tab 5 (Setup Library)
- [ ] No changes needed, verify works as-is

---

## Validation Steps

### Step 1: Verify Key Names
Run this check across all files:
```bash
grep -r "confidence_rating" Execution/tabs/  # Should return 0 results
grep -r "driver_confidence" Execution/tabs/  # Should return multiple results
```

### Step 2: Verify Experience Level Reads
```bash
grep -r "racer_profile.get('experience_level" Execution/tabs/  # Should return 0 results
grep -r "st.session_state.get.*experience_level" Execution/tabs/  # Should return multiple
```

### Step 3: Verify Scenario Logic
Check event_setup.py for:
```python
if st.session_state.practice_rounds_scheduled >= 3:
    st.session_state.scenario = "A"
else:
    st.session_state.scenario = "B"
```

### Step 4: Verify Change History
Check setup_advisor.py for `change_history.append()` calls when changes are accepted.

### Step 5: Test in App
- [ ] Run `streamlit run Execution/dashboard.py`
- [ ] Test each scenario above
- [ ] Check browser console for errors
- [ ] Verify persona responses match expected behavior

---

## Files Summary

### Must Change
- `Execution/tabs/setup_advisor.py` (Priorities 1, 4, 5)
- `Execution/tabs/event_setup.py` (Priorities 2, 3)

### Should Verify
- `Execution/tabs/post_analysis.py` (confirm reads correct keys)
- `Execution/ai/prompts.py` (confirm expects correct context keys)
- `Execution/services/run_logs_service.py` (confirm uses correct key names)

### No Changes Needed
- `Execution/dashboard.py` (already correct)
- `Execution/tabs/race_support.py` (no persona system)
- `Execution/tabs/setup_library.py` (no persona system)
- All services/ (they receive context dicts, don't access session_state)

---

## Commit Strategy

After fixing all 5 priorities, create one commit:

```bash
git add Execution/tabs/setup_advisor.py Execution/tabs/event_setup.py
git commit -m "fix: Resolve session state contract violations (Priorities 1-5)

Fixes 5 critical session state contract mismatches from Phase 6 refactor:

1. Confidence level: Rename all confidence_rating → driver_confidence
2. Experience level: Update event_setup.py to read/write from session_state root
3. Scenario logic: Add auto-detection based on practice_rounds_scheduled
4. Change history: Add recording when changes are accepted
5. Context building: Standardize key names in engineer_context dict

All fixes verified against persona_prompts.md and prompts.py expectations.

Fixes:
- Confidence Gate now activates when driver_confidence < 3
- Scenario B constraints apply with < 3 practice rounds
- Changes persist across tabs
- AI checks history to avoid redundant recommendations
- Persona system receives complete context"
```

---

## Time Estimate
- Priority 1 (Confidence): 15 min
- Priority 2 (Experience): 10 min
- Priority 3 (Scenario): 10 min
- Priority 4 (History): 15 min
- Priority 5 (Context): 10 min
- **Testing:** 20 min
- **TOTAL:** ~80 minutes (~1.5 hours)

---

## Rollback Plan
If something breaks:
```bash
git revert HEAD  # Undo last commit
```

But these are straightforward fixes, unlikely to cause issues.

---

## Related Documentation
- `COMPLETE_CODEBASE_AUDIT_COMMUNICATION_ISSUES.md` - Full technical audit
- `PLAIN_ENGLISH_EXPLANATION.md` - Non-technical explanation
- `Orchestration/Architecture/session_state_contract.md` - Session state reference (should be created)

---

*Quick Reference Guide for Audit Issues*
*Use this to fix the 5 critical problems in ~1.5 hours*
