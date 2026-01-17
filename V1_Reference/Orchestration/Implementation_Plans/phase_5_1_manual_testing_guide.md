# Phase 5.1 Manual Testing Guide

**Purpose:** Verify that the 5-persona AI system is functioning correctly with proper context injection and safety gates.

**Prerequisites:**
- Application running: `streamlit run Execution/dashboard.py`
- ANTHROPIC_API_KEY configured in `.env` or Streamlit secrets
- At least one vehicle in your racer profile (e.g., "Tekno NB48 2.2")

---

## Test 1: The Strategist Check (Tab 1)

**Purpose:** Verify Tab 1 session state initialization and Scenario determination logic.

**Steps:**

1. Open the app and navigate to **Tab 1: Event Setup**
2. Fill in the form:
   - Event Name: "Test Event"
   - Track Name: "Thunder Alley"
   - Traction: "High"
   - Type: "Dry"
   - Surface: "Smooth"
   - **Practice Rounds: Set to 2** (this will trigger Scenario B)
   - Qualifying Rounds: 4

3. Observe the "Step 2: Race Schedule" section
4. Look at the "📊 Scenario [A/B]" info box

**Expected Outcome:**
- ✅ Scenario should show: **"B: Conservative"** (because 2 < 3 practice rounds)
- ✅ Description mentions "Limited practice time"
- ✅ Allowed parameters show only: SO_F, SO_R, RH_F, RH_R, C_F, C_R

**If different:**
- Check that `practice_rounds >= 3` returns Scenario A
- Verify the ORPService.get_strategy_for_scenario() logic in Execution/services/orp_service.py

---

## Test 2: The Engineer Check (Tab 2)

**Purpose:** Verify Engineer persona receives context injection and ORP metrics display correctly.

**Steps:**

1. Complete a session lock in Tab 1 (Practice Rounds: 5, to get Scenario A)
2. Navigate to **Tab 2: Setup Advisor**
3. In the status box at the top, you should see 4 metric cards:
   - **ORP Score** (numeric)
   - **Scenario** (should show "A: Avant Garde")
   - **Confidence Gate** (should show "✅ PASS" or "❌ REJECT")
   - **Fade Factor** (numeric, should show ">1.0 = degrading" tooltip)

4. Ask the AI: "The car is loose."

5. Watch for the response and look for:
   - Physics-based diagnosis
   - A `[PROPOSED_CHANGE]` block at the end
   - Reference to the tuning hierarchy ("Tires first...")

**Expected Outcome:**
- ✅ ORP metrics display with actual values
- ✅ Confidence Gate shows ✅ PASS (default confidence is 3/5)
- ✅ Scenario shows "A: Avant Garde"
- ✅ AI response uses Engineer persona voice (precise, physics-based)
- ✅ Recommendation ends with `[PROPOSED_CHANGE]` block

**If different:**
- Check that `setup_advisor.py` line 198 uses `prompts.get_system_prompt("engineer", engineer_context)`
- Verify `engineer_context` dict is properly populated with ORP metrics
- Check browser console for any Python errors in Streamlit

---

## Test 3: The Handoff Check (Scenario B Constraint)

**Purpose:** Verify that Scenario B constraints prevent forbidden parameter recommendations.

**Steps:**

1. Go back to **Tab 1: Event Setup**
2. In browser console or by restarting, start a NEW session with:
   - Practice Rounds: **1** (< 3, triggers Scenario B)
   - Qualifying Rounds: 4

3. Confirm session lock (should show "Scenario B: Conservative")

4. Navigate to **Tab 2: Setup Advisor**

5. Observe:
   - Scenario card shows: **"B: Conservative"**
   - Confidence Gate shows: ✅ PASS

6. Ask the AI: "Can we increase the front diff to 3000?"

**Expected Outcome:**
- ✅ AI response should include: "DF (Front Diff) is **not allowed in Scenario B**"
- ✅ AI suggests an **alternative** from allowed list: SO_F, SO_R, RH_F, RH_R, C_F, C_R
- ✅ Example: "Instead, let's adjust RH_F (front ride height) to improve stability."

**If different:**
- Check `prompts.py` lines 662-665 for Scenario B constraint list
- Verify the Engineer persona injects scenario into context (line 616: `scenario = context.get('scenario', 'A')`)
- Check that setup_advisor.py passes scenario in `engineer_context` dict (line 167)

---

## Test 4: The Confidence Gate Check

**Purpose:** Verify that low confidence levels prevent recommendations.

**Steps:**

1. Go to **Tab 1**, start a new session with:
   - Practice Rounds: 3
   - Qualifying Rounds: 4

2. Navigate to **Tab 2: Setup Advisor**

3. Manually lower the confidence in your setup:
   - In browser DevTools, open the application's session state and manually set:
     ```python
     st.session_state.driver_confidence = 2  # Below the gate threshold
     ```
   - Or find the confidence slider if it exists in the UI and set it to 2/5

4. Ask the AI: "Can you recommend a setup change?"

**Expected Outcome:**
- ✅ Confidence Gate shows: **"❌ REJECT"** (confidence < 3)
- ✅ AI response: "Setup changes are **not recommended with confidence < 3**. Complete more practice to build confidence before attempting modifications."
- ✅ AI does NOT provide any setup recommendations

**If different:**
- Check that `driver_confidence < 3` is being checked in the Engineer persona (prompts.py line 658)
- Verify setup_advisor.py passes `driver_confidence` in context (line 171)
- Ensure the REJECT message matches expectations

---

## Test 5: Anti-Redundancy Check (Change History)

**Purpose:** Verify that the AI doesn't re-suggest changes that were just applied.

**Steps:**

1. Start a session in Tab 1 with Practice Rounds: 3+

2. Navigate to **Tab 2: Setup Advisor**

3. Ask the AI: "Increase the front shock oil from 350 to 400 CST"

4. Watch for a `[PROPOSED_CHANGE]` response block like:
   ```
   [PROPOSED_CHANGE] SO_F: 400
   ```

5. Immediately (same session) ask again: "Should we increase the front shock oil?"

**Expected Outcome:**
- ✅ AI response on second question includes: "We just changed SO_F to 400 CST"
- ✅ AI does NOT recommend the same change again
- ✅ AI suggests an alternative or asks to evaluate the first change's effect

**If different:**
- Check that `change_history` is being populated in session_state
- Verify setup_advisor.py passes `change_history` to Engineer persona (line 173)
- Check prompts.py lines 638-644 for the change history injection

**Note:** This test requires the APPLY button functionality to actually record changes to `st.session_state.change_history`. If the APPLY button doesn't save changes, this test will not work yet.

---

## Test 6: The Analyst Check (Tab 4)

**Purpose:** Verify Analyst persona generates reports using the correct voice.

**Steps:**

1. Complete a full session:
   - Tab 1: Lock a session with event name and vehicle
   - Tab 2: Ask some setup questions and note the responses
   - Tab 3: Optionally monitor LiveRC (can skip)
   - Tab 4: Navigate to Post Event Analysis

2. In the **"🎯 Session Closeout & X-Factor Audit"** section:
   - Click **"Begin Session Closeout"**
   - Rate performance (e.g., 3 = no change)
   - Continue through the rating steps
   - Add an observation (text or voice)
   - Click **"Complete Audit & Close Session"**

3. After session closes, scroll down to **"🏁 Conclusion & Reports"** section

4. Select a **Report Format** (e.g., "Sponsor Email")

5. Click **"📝 GENERATE AI RACE REPORT"**

**Expected Outcome:**
- ✅ Report generates with Analyst persona voice (data-driven, skeptical)
- ✅ Report includes:
  - Setup changes applied
  - Performance analysis
  - Baseline comparison
  - Lessons extracted
- ✅ Report does NOT sound like engineering recommendations (no "we should increase diff oil")
- ✅ Report focuses on facts and analysis

**If different:**
- Check that post_analysis.py line 351 uses `prompts.get_system_prompt("analyst", analyst_context)`
- Verify `analyst_context` dict is properly populated (lines 343-348)
- Check that `prompts.get_report_prompt()` still exists (used at line 340)

---

## Test 7: Session State Verification

**Purpose:** Verify all new session state keys are initialized correctly.

**Steps:**

1. Open the app (Tab 1)

2. Open browser DevTools → Console

3. Type this JavaScript to inspect Streamlit's session state:
   ```javascript
   // Note: This depends on Streamlit's internal structure and may vary
   console.log(window.streamlitState)
   ```

4. Or, in your Python code, add a debug display in dashboard.py:
   ```python
   st.write("### Debug: Session State (Phase 5.1)")
   st.json({
       "scenario": st.session_state.get("scenario"),
       "driver_confidence": st.session_state.get("driver_confidence"),
       "experience_level": st.session_state.get("experience_level"),
       "change_history": st.session_state.get("change_history"),
   })
   ```

**Expected Outcome:**
- ✅ `scenario`: "A" (default)
- ✅ `driver_confidence`: 3 (default)
- ✅ `experience_level`: "Intermediate" (default)
- ✅ `change_history`: [] (empty list)
- ✅ All 4 keys exist from app startup

---

## Troubleshooting

### Issue: "Unknown persona_key" error

**Cause:** `get_system_prompt()` is being called with an invalid persona name.

**Solution:**
- Check that persona_key is one of: "strategist", "engineer", "spotter", "analyst", "librarian"
- Verify case sensitivity (should be lowercase)
- Check prompts.py lines 503-514 for the router logic

### Issue: Confidence Gate not working

**Cause:** `driver_confidence` is not being set or read correctly.

**Solution:**
- Verify dashboard.py initializes it (line 107-108)
- Check setup_advisor.py sets it from context (line 171)
- Ensure prompts.py checks it (line 614, line 658)

### Issue: Scenario not switching between A/B

**Cause:** `practice_rounds` vs `practice_rounds_scheduled` confusion.

**Solution:**
- Verify dashboard.py initializes `practice_rounds` (line 95-96) for backwards compatibility
- Verify dashboard.py initializes `practice_rounds_scheduled` (line 99-100) for new system
- Check setup_advisor.py uses correct key (line 109: `st.session_state.get('practice_rounds', 0)`)

### Issue: Change history not preventing redundant recommendations

**Cause:** `change_history` list is not being populated when changes are applied.

**Solution:**
- Verify setup_advisor.py has an APPLY button that records changes
- Check that the APPLY button calls something like:
  ```python
  st.session_state.change_history.append({
      'timestamp': datetime.now(),
      'parameter': param_name,
      'old_value': old_value,
      'new_value': new_value,
      'persona_key': 'engineer'
  })
  ```
- If APPLY button doesn't exist yet, that's a Phase 5.2 task

---

## Success Criteria Summary

| Test | Criterion | Status |
|------|-----------|--------|
| Test 1: Strategist | Scenario logic works (A/B based on practice rounds) | ⏳ To Test |
| Test 2: Engineer | ORP context displays, Engineer persona responds | ⏳ To Test |
| Test 3: Handoff | Scenario B constraints prevent forbidden parameters | ⏳ To Test |
| Test 4: Confidence Gate | Low confidence (< 3) triggers rejection | ⏳ To Test |
| Test 5: Anti-Redundancy | Change history prevents re-suggestions | ⏳ To Test |
| Test 6: Analyst | Report generation uses Analyst voice | ⏳ To Test |
| Test 7: Session State | All 4 keys initialized with correct defaults | ⏳ To Test |

---

## Reporting Results

When you complete testing, update this document with ✅ (pass), ⚠️ (partial), or ❌ (fail) for each test, and provide any issues found in the "Troubleshooting" section.

**Once all tests pass, Phase 5.1 is complete and ready for production deployment.**

---

*Testing Guide - Phase 5.1 Persona Restoration*
*Version 1.0 | 2026-01-14*
