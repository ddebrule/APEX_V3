# Quick Test Checklist: Conversational Advisor

**Time to complete:** 10-15 minutes for basic smoke test

---

## 🚀 5-Minute Smoke Test

Copy-paste these checks in browser console:

```javascript
// 1. Check store is accessible
const store = useAdvisorStore?.()
console.log('Store exists:', !!store)

// 2. Check initial state
console.log('Initial phase:', store.conversationPhase) // Should be 'symptom'
console.log('Chat messages:', store.chatMessages.length) // Should be 0

// 3. Check session context loaded
const { selectedSession, selectedVehicle } = useMissionControlStore?.()
console.log('Session loaded:', !!selectedSession)
console.log('Vehicle loaded:', !!selectedVehicle)

// 4. Trigger Socratic loop
store.initiateSocraticLoop('Oversteer (Entry)', {
  trackTemp: 75,
  scenarioB: false,
  sessionType: 'practice',
  surfaceType: 'hard_packed'
})

// 5. Check state changed
console.log('Phase after initiate:', store.conversationPhase) // Should be 'clarifying'
console.log('Messages after initiate:', store.chatMessages.length) // Should be 2
console.log('Questions:', store.clarifyingQuestions)
```

**Expected console output:**
```
Store exists: true
Initial phase: symptom
Chat messages: 0
Session loaded: true
Vehicle loaded: true
Phase after initiate: clarifying
Messages after initiate: 2
Questions: [ 'Is the oversteer...', 'Does it get worse...' ]
```

---

## ✅ Manual Test Cases (Organized by Feature)

### Feature 1: UI Rendering
- [ ] Advisor Tab loads without errors
- [ ] Symptom selector buttons visible (6 primary + "More")
- [ ] Chat feed height is reasonable (~400px)
- [ ] Session header shows event name, vehicle, surface

### Feature 2: Socratic Loop
- [ ] Click symptom → AI asks question
- [ ] Question appears in chat with "🤖 Advisor" label
- [ ] Input field shows below question
- [ ] Type response → click SEND → response appears
- [ ] Second question appears (if exists for that symptom)
- [ ] Chat auto-scrolls to show new messages

### Feature 3: Proposal Generation
- [ ] After answering all questions, proposals appear
- [ ] Primary card (green border) shows
- [ ] Alternative card (blue border) shows
- [ ] Each card shows: fix name, reasoning, impact %, timing
- [ ] "APPLY" button is clickable
- [ ] "CUSTOM" button is clickable

### Feature 4: Custom Value Override
- [ ] Click "CUSTOM" button → input field appears
- [ ] Type custom value (e.g., "115 CST")
- [ ] Click "OK" → proposal applies with custom value
- [ ] Confirmation shows custom value: "✅ Applied: ... (custom: 115 CST)"

### Feature 5: Proposal Application
- [ ] Click "APPLY" → Button shows "⏳ Applying..."
- [ ] After 1-2 seconds, confirmation appears
- [ ] Confirmation says: "✅ Applied: [Fix Name]"
- [ ] Status bar shows "APPLIED"
- [ ] Chat scrolls to show confirmation

### Feature 6: Guardrails
- [ ] **Confidence < 3:** AI says "recommend track time" instead of proposing
- [ ] **Tire change required:** Red banner shown, AI rejects proposals
- [ ] **Scenario B (Main race):** Only shows safe proposals (Oil, Height, Camber)

### Feature 7: Undo/Revert
- [ ] Click "Undo" button after proposal applied
- [ ] Confirmation: "⏮️ Reverted: Last change has been undone"
- [ ] Can select new symptom again

### Feature 8: Institutional Memory
- [ ] Apply a proposal for "Oversteer (Entry)"
- [ ] Select "Oversteer (Entry)" again
- [ ] Before proposals, see: "📚 Institutional Memory: Last time we saw..."

---

## 🧪 Quick Database Check

After applying a proposal, run in SQL:

```sql
-- Check if proposal was written to DB
SELECT
  id,
  parameter,
  new_value,
  status,
  ai_reasoning
FROM setup_changes
WHERE session_id = '[YOUR_SESSION_ID]'
ORDER BY created_at DESC
LIMIT 1;

-- Expected result:
-- id: [UUID]
-- parameter: "Increase Front Shock Oil" (or other fix name)
-- new_value: null (or custom value if override)
-- status: "pending"
-- ai_reasoning: "[Physics explanation]"
```

---

## 🔥 Common Issues & Quick Fixes

### Issue: "No active session"
**Fix:** Go to Mission Control Tab, select a session first

### Issue: Chat feed not scrolling
**Fix:** Reload page, check browser console for JS errors

### Issue: Questions not appearing
**Fix:** Check store has `clarifyingQuestions` array with items
```javascript
console.log(useAdvisorStore().clarifyingQuestions)
```

### Issue: Proposals not showing
**Fix:** Check store has `currentPrescription` set
```javascript
console.log(useAdvisorStore().currentPrescription)
```

### Issue: DB write fails silently
**Fix:** Check network tab for failed API calls
```javascript
// In console:
await useAdvisorStore().applyProposal('primary', undefined, {
  session_id: 'test-session'
})
// Should error in console if fails
```

### Issue: Confidence gate not working
**Fix:** Ensure `driverConfidence` is passed from Mission Control
```javascript
console.log(useMissionControlStore().driverConfidence)
```

---

## 📋 Test Matrix: By Symptom Type

Test each symptom to verify question variety:

| Symptom | Expected Q1 | Expected Q2 |
|---------|------------|------------|
| Oversteer (Entry) | "turn-in or partway?" | "brakes deeper?" |
| Understeer (Exit) | "power or rotation?" | "push even when..." |
| Bottoming Out | "entry/apex/accel?" | "clunk or gradual?" |
| Bumpy Track | "grip or harsh?" | "one end or both?" |
| Loose / Traction | "power/off/both?" | "front or rear?" |
| Tire Fade | "gradually or sudden?" | "all 4 or one?" |

---

## ✨ Success Criteria

**All tests pass if:**

✅ Initialization completes without errors
✅ Each symptom triggers 1-2 clarifying questions
✅ User can answer questions via input field
✅ Proposals appear after clarifying phase
✅ Both Primary and Alternative cards render
✅ Custom value override works
✅ Apply button writes to database
✅ Confirmation message shows
✅ Chat auto-scrolls to latest message
✅ Confidence gate < 3 blocks proposals
✅ Tire fatigue gate blocks proposals
✅ Undo button reverts changes
✅ Institutional memory suggests past fixes

---

## 🎯 Next Steps If All Tests Pass

1. ✅ **Code review** – Have team review implementation
2. ✅ **Deploy to staging** – Test in staging environment
3. ✅ **User acceptance test** – Have RC racers test
4. ✅ **Monitor metrics** – Track proposal acceptance rates
5. ✅ **Deploy to production** – Full release

---

## 📞 Support

**For detailed test procedures:** See `TESTING_GUIDE.md`

**For implementation details:** See `IMPLEMENTATION_NOTES.md`

**For architecture questions:** See `CONVERSATIONAL_ADVISOR_COMPLETE.md`

---

**Status:** Ready to test | **Estimated time:** 15 minutes
