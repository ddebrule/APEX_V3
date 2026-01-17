# Phase 5 Sprint 3: AI Advisor Integration with ORP Context - Plan

**Status:** Planning Phase
**Duration Estimate:** 8-10 hours
**Target Completion:** Early January 2026
**Prerequisite:** Phase 5 Sprint 2 Complete (✅ 35/35 tests passing)

---

## Objective

Integrate ORP (Optimal Race Pace) context into the AI Advisor system so that:
- AI recommendations respect ORP confidence gates (score = 0 if confidence < 3)
- AI prioritizes consistency over raw speed based on ORP strategy
- Scenario A/B constraints are enforced in parameter recommendations
- ORP metrics inform strategy selection (Avant Garde vs Conservative)
- Dashboard displays ORP context alongside AI suggestions

---

## Current System Flow

### Tab 2 - Setup Advisor (Current State)

```
User Input (Voice/Text)
         ↓
prompts.get_tuning_prompt_with_memory()
         ↓
Claude AI (System Prompt + Event Context + Library)
         ↓
AI Response (5 sections + [PROPOSED_CHANGE])
         ↓
Dashboard displays response + parses [PROPOSED_CHANGE]
         ↓
User accepts/denies changes
```

### What's Missing

- ❌ No ORP confidence gate enforcement
- ❌ No ORP score inclusion in recommendations
- ❌ No Scenario A/B constraint awareness
- ❌ No consistency vs speed prioritization
- ❌ No lap-level data integration
- ❌ No feedback loop based on ORP results

---

## Sprint 3 Implementation Roadmap

### Task 1: Update Prompts to Include ORP Context (1-2 hours)

**File:** `Execution/ai/prompts.py`

**Changes:**

1. **Add ORP Context Section to SYSTEM_PROMPT:**
   - Insert ORP guardrails section
   - Define confidence gate rule: score < 3 → recommendation rejected
   - Define consistency priority: Sportsman prioritizes 80% consistency, Pro prioritizes 70% speed
   - Define Scenario A/B constraints

2. **Create `get_tuning_prompt_with_orp()` function:**
   ```python
   def get_tuning_prompt_with_orp(car, query, event_context, library,
                                   orp_context, experience_level,
                                   scenario, orp_score, confidence):
       """
       Enhanced prompt builder that injects ORP context.

       Args:
           car: Vehicle name
           query: User observation
           event_context: Current session context
           library: Technical library
           orp_context: Dict from RunLogsService.calculate_orp_from_session()
           experience_level: 'Sportsman', 'Intermediate', or 'Pro'
           scenario: 'A' (Avant Garde) or 'B' (Conservative)
           orp_score: 0-100 ORP score
           confidence: 1-5 driver confidence rating
       """
   ```

3. **Add ORP Section to Prompt:**
   ```
   <orp_context>
   Session ORP Score: 82.5
   Driver Confidence: 4/5
   Experience Level: Intermediate
   Strategy Scenario: A (Avant Garde - Risky parameters allowed)
   Consistency Metric: 4.2% (standard deviation)
   Fade Factor: 1.08 (last 5 laps / top 3 fastest - degradation detected)

   CONSTRAINTS:
   - If confidence < 3: REJECT all risky parameter changes
   - Scenario A allows: Pistons, Geometry, Arm Positions (radical changes)
   - Scenario B restricts to: Oils, Ride Height, Camber (conservative only)
   - Prioritize consistency (80%) over speed (20%) for Sportsman drivers
   - Prioritize speed (70%) over consistency (30%) for Pro drivers
   </orp_context>
   ```

---

### Task 2: Integrate ORP Data in Dashboard (1.5-2 hours)

**File:** `Execution/dashboard.py` (Tab 2 - Setup Advisor)

**Changes:**

1. **Import RunLogsService at top:**
   ```python
   from Execution.services.run_logs_service import RunLogsService
   ```

2. **Before calling AI, calculate ORP:**
   ```python
   run_logs_service = RunLogsService()

   # Get ORP metrics for current session
   orp_result = run_logs_service.calculate_orp_from_session(
       session_id=st.session_state.active_session_id,
       experience_level=st.session_state.racer_profile.get('experience_level', 'Intermediate'),
       driver_confidence=st.session_state.get('confidence_rating', 3)
   )

   # If ORP is unavailable (no laps yet), use placeholder
   if not orp_result:
       orp_result = {
           'orp_score': 50,  # Neutral starting point
           'status': 'insufficient_data',
           'consistency': 0,
           'fade': 1.0
       }
   ```

3. **Determine Scenario A/B:**
   ```python
   practice_rounds = st.session_state.get('practice_rounds', 0)
   qualifying_rounds = st.session_state.get('qualifying_rounds', 4)

   scenario = 'A' if practice_rounds >= 3 else 'B'
   ```

4. **Update prompt builder call:**
   ```python
   prompt_text = prompts.get_tuning_prompt_with_orp(
       car=active_car_adv,
       query=query,
       event_context=event_info,
       library=lib,
       orp_context=orp_result,
       experience_level=st.session_state.racer_profile.get('experience_level', 'Intermediate'),
       scenario=scenario,
       orp_score=orp_result.get('orp_score', 50),
       confidence=st.session_state.get('confidence_rating', 3)
   )
   ```

5. **Display ORP Status in UI:**
   ```python
   col_orp1, col_orp2, col_orp3 = st.columns(3)
   with col_orp1:
       st.metric("ORP Score", f"{orp_result.get('orp_score', 50):.1f}/100",
                 delta=f"{orp_result.get('consistency', 0):.1f}% consistency")
   with col_orp2:
       st.metric("Scenario", "A: Avant Garde" if scenario == 'A' else "B: Conservative")
   with col_orp3:
       st.metric("Confidence Gate", "✅ PASS" if st.session_state.get('confidence_rating', 3) >= 3 else "❌ REJECT")
   ```

---

### Task 3: Implement Confidence Gate Logic (1-1.5 hours)

**File:** `Execution/dashboard.py` (Tab 2 - Pending Changes Review)

**Current Flow (lines 637-700):**
```python
if st.session_state.pending_changes:
    st.divider()
    st.write("### 🚦 Pending AI Recommendations")
    # Shows proposed changes
    # User can accept/deny
```

**New Logic to Add:**

1. **Parse PROPOSED_CHANGE and extract parameter:**
   ```python
   def parse_proposed_change(change_str):
       """
       Parses "[PROPOSED_CHANGE] DF: 10000" into ('DF', 10000)
       """
       try:
           parts = change_str.split(':')
           param = parts[0].strip().split()[-1]  # Get last word (parameter key)
           value = parts[1].strip()
           return (param, value)
       except:
           return None, None
   ```

2. **Check confidence gate before displaying:**
   ```python
   confidence = st.session_state.get('confidence_rating', 3)

   if confidence < 3:
       st.error("🛑 **Confidence Gate REJECTED**\n\nDriver confidence is too low for setup changes. "
               "Complete more practice rounds to build confidence (confidence must be ≥3).")
       st.info("Current confidence: {} / 5".format(confidence))
   else:
       # Show pending changes as normal
   ```

3. **Check Scenario constraints:**
   ```python
   scenario = 'A' if st.session_state.get('practice_rounds', 0) >= 3 else 'B'
   param, value = parse_proposed_change(change_str)

   if scenario == 'B':
       # Conservative mode - only allow safe parameters
       SAFE_PARAMS = ['SO_F', 'SO_R', 'RH_F', 'RH_R', 'C_F', 'C_R', 'Tread', 'Compound']

       if param not in SAFE_PARAMS:
           st.warning(f"⚠️ **Scenario B Constraint**: '{param}' is a risky parameter. "
                     f"This scenario only allows conservative changes: {', '.join(SAFE_PARAMS)}")
   ```

---

### Task 4: Add ORP Score to AI Response Display (1 hour)

**File:** `Execution/dashboard.py` (Tab 2)

**After line 617 (st.markdown(reply)):**

```python
# Display ORP context summary with AI response
st.divider()
st.subheader("📊 ORP Analysis Context")

col_o1, col_o2, col_o3, col_o4 = st.columns(4)

with col_o1:
    st.metric(
        "ORP Score",
        f"{orp_result.get('orp_score', 50):.1f}",
        delta=f"{orp_result.get('consistency', 0):.1f}% consistency",
        delta_color="normal"
    )

with col_o2:
    st.metric(
        "Status",
        orp_result.get('status', 'calculated').replace('_', ' ').title()
    )

with col_o3:
    st.metric(
        "Fade Factor",
        f"{orp_result.get('fade', 1.0):.3f}",
        help="Last 5 avg / Top 3 fastest. >1.0 = degradation"
    )

with col_o4:
    confidence = st.session_state.get('confidence_rating', 3)
    gate_status = "✅ PASS" if confidence >= 3 else "❌ REJECT"
    st.metric("Confidence Gate", gate_status, delta=f"{confidence}/5")
```

---

### Task 5: Create RunLogsService Integration Test (1.5 hours)

**File:** Create `tests/test_sprint3_orp_advisor_integration.py`

**Tests to Include:**

1. **Test ORP Confidence Gate:**
   - Low confidence (1-2) → Reject all changes
   - Medium confidence (3) → Allow changes
   - High confidence (4-5) → Allow all changes

2. **Test Scenario A/B Constraint:**
   - Scenario A (3+ practice) → Allow risky params (Pistons, Geometry)
   - Scenario B (<3 practice) → Restrict to safe params (Oils, Ride Height)

3. **Test ORP Score Integration:**
   - ORP score <50 → Recommend conservative changes
   - ORP score >80 → Recommend fine-tuning changes
   - ORP score 50-80 → Balanced recommendations

4. **Test End-to-End Flow:**
   - Session created with practice_rounds = 2 (Scenario B)
   - Laps added via RunLogsService
   - ORP calculated
   - AI advisor receives ORP context
   - Recommendations respect Scenario B constraints

---

### Task 6: Update SYSTEM_PROMPT with ORP Guardrails (1 hour)

**File:** `Execution/ai/prompts.py`

**Add to SYSTEM_PROMPT after line 62:**

```python
<orp_integration>
OPTIMAL RACE PACE (ORP) PROTOCOL:
Your recommendations MUST align with the driver's ORP strategy and confidence level.

ORP CONFIDENCE GATE (CRITICAL):
- If driver_confidence < 3: REJECT all parameter recommendations
  Reasoning: Low confidence indicates insufficient practice. Changes too risky.
- If driver_confidence >= 3: Proceed with recommendations based on scenario

EXPERIENCE-LEVEL PRIORITIZATION:
- SPORTSMAN (80% consistency priority): Recommend changes that improve lap consistency
  Focus: Stability, repeatability, confidence building
- INTERMEDIATE (50/50): Balance speed and consistency
- PRO (70% speed priority): Recommend changes that improve pace
  Focus: Lap time reduction, performance optimization

SCENARIO A vs B CONSTRAINTS:
Scenario A (Avant Garde - Practice >= 3 rounds):
  ALLOWED: Piston changes, Shock Oil adjustments, Toe/Camber/Ride Height, differential oils
  DESCRIPTION: You have enough practice time to test risky changes. Favor optimization.

Scenario B (Conservative - Practice < 3 rounds):
  RESTRICTED TO: Ride Height, Camber, Shock Oils (conservative adjustments only)
  AVOID: Piston changes, geometry pivots, aggressive parameter modifications
  DESCRIPTION: Limited practice time. Recommend only safe, reversible changes.

ORP SCORE CONTEXT:
- Score 0-40: Car setup is inconsistent. Recommend stability-focused changes.
- Score 40-70: Car has balance issues. Recommend targeted pivots.
- Score 70-100: Car is optimized. Recommend only fine-tuning.

FADE FACTOR INTERPRETATION:
- Fade < 1.0: Driver improving throughout session (good confidence/momentum)
- Fade = 1.0: Driver maintaining pace (consistent performance)
- Fade > 1.0: Driver fatiguing or setup degrading (recommend hydration/setup check)
  Action: If fade > 1.1, prioritize setup stability over speed changes.

RECOMMENDATIONS MUST INCLUDE:
1. Current ORP score and what it tells us
2. How the recommended change aligns with driver's experience level
3. Why this change is appropriate for the current scenario (A or B)
4. Confidence in the recommendation based on practice data
</orp_integration>
```

---

## Implementation Order

### Week 1 (3-4 hours)
1. Update SYSTEM_PROMPT with ORP guardrails
2. Create `get_tuning_prompt_with_orp()` function
3. Integrate RunLogsService in dashboard Tab 2
4. Calculate and display ORP context before AI call

### Week 2 (3-4 hours)
1. Implement confidence gate logic in pending changes display
2. Add Scenario A/B constraint enforcement
3. Display ORP score context with AI response
4. Create integration tests

### Week 3 (1-2 hours)
1. End-to-end testing
2. Bug fixes and refinement
3. Documentation and commits

---

## Success Criteria

✅ AI recommendations respect confidence gate (< 3 → reject all changes)
✅ AI respects Scenario A/B constraints in parameter suggestions
✅ ORP score influences recommendation strategy
✅ Experience level affects consistency vs speed prioritization
✅ Fade factor informs change safety assessment
✅ Dashboard displays ORP context with AI response
✅ All recommendations include ORP rationale
✅ Integration tests passing (100% coverage)
✅ End-to-end flow tested: Session → Laps → ORP → AI → Constraints respected

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| AI doesn't respect constraints in prompt | Medium | High | Detailed prompt engineering with examples |
| ORP calculation delays AI response | Low | Medium | Cache ORP results in session state |
| Confidence gate too restrictive | Low | Low | Provide user feedback on why rejected |
| Scenario constraint breaks recommendations | Medium | Medium | Comprehensive integration tests |

---

## Files to Modify

| File | Changes | Effort |
|------|---------|--------|
| `Execution/ai/prompts.py` | Add ORP guardrails + new function | 1-2h |
| `Execution/dashboard.py` | Integrate ORP in Tab 2 + display | 2-3h |
| `tests/test_sprint3_*` | New integration tests | 1.5h |
| `Execution/services/run_logs_service.py` | No changes needed | 0h |
| `Execution/services/orp_service.py` | No changes needed | 0h |

**Total Effort:** 8-10 hours

---

## Definition of Done

- [ ] SYSTEM_PROMPT updated with ORP guardrails
- [ ] `get_tuning_prompt_with_orp()` function created and tested
- [ ] Dashboard Tab 2 displays ORP context metrics
- [ ] Confidence gate enforced in pending changes review
- [ ] Scenario A/B constraints visible to user
- [ ] AI recommendations include ORP rationale
- [ ] Integration tests passing (100%)
- [ ] End-to-end flow tested locally
- [ ] Changes committed and pushed
- [ ] Documentation updated

---

## Next Steps After Sprint 3

**Sprint 4 (4-6 hours):**
- Performance window visualization
- Fade indicator dashboard
- ORP score color coding
- Scenario compliance reporting

**Future Enhancements:**
- Historical ORP trends
- ORP-based setup package recommendations
- Confidence gate feedback (how to improve)
- Multi-session ORP progression tracking

---

**Status: Ready to begin implementation**
**Last Updated:** 2025-12-28
**Target Start:** Next work session
