# Visual Guide to the 5 Communication Issues

**Date:** 2026-01-14
**Format:** Diagrams, flowcharts, and visual comparisons
**Audience:** Visual learners

---

## Problem #1: Confidence Level (confidence_rating vs driver_confidence)

### What Should Happen (Correct)

```
┌─────────────────────────────────────────┐
│  User in Tab 1: Sets Confidence to 2/5  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   st.session_state.driver_confidence=2  │ ← Stored in shared whiteboard
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Tab 2 reads: driver_confidence = 2     │
│  → Confidence Gate REJECTS changes      │
│  → Says "Set confidence higher first"   │
└─────────────────────────────────────────┘
```

### What's Actually Happening (Wrong)

```
┌─────────────────────────────────────────┐
│  User in Tab 1: Sets Confidence to 2/5  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   st.session_state.driver_confidence=2  │ ← Written to whiteboard
└──────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Tab 2 looks for: confidence_rating  ❌          │
│  (This is the WRONG label!)                     │
│  Can't find it, uses default = 3                │
│  → Confidence Gate ALLOWS changes (wrong!)      │
│  → Says "Go ahead!" even though confidence=2   │
└─────────────────────────────────────────────────┘
```

### The Fix

```
Remove:  driver_confidence=st.session_state.get('confidence_rating', 3)
Replace: driver_confidence=st.session_state.get('driver_confidence', 3)
```

**Files to change:** `Execution/tabs/setup_advisor.py` (lines 100, 115)

---

## Problem #2: Experience Level Location

### What Should Happen (Correct)

```
┌──────────────────────────────────────────┐
│  User in Tab 1: Changes to "Sportsman"   │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  st.session_state.experience_level =     │
│  "Sportsman"                             │
│  ↑ Stored at SESSION STATE ROOT          │
└────────────────┬─────────────────────────┘
                 │
         ┌───────┴────────┬─────────┐
         │                │         │
         ▼                ▼         ▼
      Tab 1           Tab 2      Tab 4
   (can read/       (can read/   (can read/
    write)          write)       write)
```

### What's Actually Happening (Wrong)

```
┌──────────────────────────────────────────┐
│  User in Tab 1: Changes to "Sportsman"   │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  st.session_state.racer_profile = {          │
│      'experience_level': 'Sportsman'  ❌    │
│      ↑ Stored NESTED in profile, not root   │
│  }                                           │
└────────────────┬─────────────────────────────┘
                 │
         ┌───────┴────────┬─────────┐
         │                │         │
         ▼                ▼         ▼
      Tab 1           Tab 2      Tab 4
   (can read/       (tries to    (tries to
    write)          read)        read)
                      │            │
                      ▼            ▼
                   ❌ Wrong       ❌ Wrong
                   Location      Location
```

### The Fix

**Before:**
```python
experience_level = st.session_state.racer_profile.get('experience_level', 'Intermediate')
```

**After:**
```python
experience_level = st.session_state.get('experience_level', 'Intermediate')
```

**Files to change:**
- `Execution/tabs/event_setup.py` (line 146)
- `Execution/tabs/setup_advisor.py` (verify)
- `Execution/tabs/post_analysis.py` (verify)

---

## Problem #3: Scenario Logic Never Triggers

### What Should Happen (Correct)

```
User sets: "I have 2 practice rounds before main"
                    │
                    ▼
        Is 2 >= 3? NO
                    │
                    ▼
    st.session_state.scenario = "B" (Conservative)
                    │
                    ▼
        ┌───────────────────┐
        │ Tab 2 Engineer    │
        │ Scenario = "B"    │
        │ ✅ RESTRICT to:   │
        │ SO_F, SO_R,       │
        │ RH_F, RH_R,       │
        │ C_F, C_R only     │
        │ (safe changes)    │
        └───────────────────┘

User sets: "I have 5 practice rounds!"
                    │
                    ▼
        Is 5 >= 3? YES
                    │
                    ▼
    st.session_state.scenario = "A" (Aggressive)
                    │
                    ▼
        ┌──────────────────────┐
        │ Tab 2 Engineer       │
        │ Scenario = "A"       │
        │ ✅ ALLOW:            │
        │ All parameter types  │
        │ (risky OK)           │
        └──────────────────────┘
```

### What's Actually Happening (Wrong)

```
User sets: "I have 2 practice rounds before main"
                    │
                    ▼
    Tab 1 records: practice_rounds_scheduled = 2
                    │
                    ▼
            ❌ NO LOGIC TO SET SCENARIO
                    │
                    ▼
    st.session_state.scenario = "A" (default, never changes)
                    │
                    ▼
        ┌──────────────────────────┐
        │ Tab 2 Engineer           │
        │ Scenario = "A" (WRONG!)  │
        │ ❌ ALLOWS:               │
        │ All parameters           │
        │ (too aggressive!)        │
        └──────────────────────────┘
```

### The Fix

Add this logic in Tab 1, after user sets practice_rounds:

```python
if st.session_state.practice_rounds_scheduled >= 3:
    st.session_state.scenario = "A"  # Aggressive
else:
    st.session_state.scenario = "B"  # Conservative
```

**File to change:** `Execution/tabs/event_setup.py` (around line 175)

---

## Problem #4: Change History Never Recorded

### What Should Happen (Correct)

```
User accepts:      "Change Tires to Blue"
          │
          ▼
    Apply change:   actual_setup['Tread'] = 'Blue'
          │
          ▼
    Record change:  change_history.append({
                        'timestamp': '2026-01-14 14:23:45',
                        'parameter': 'Tread',
                        'old_value': 'Green',
                        'new_value': 'Blue',
                        'status': 'accepted'
                    })
          │
          ▼
    ┌──────────────────────────────────┐
    │ AI asks: "What changes so far?"  │
    │ Sees: Tread changed to Blue      │
    │ Suggests: "Let's try oils next"  │
    │ NOT: "Try Blue tires again"      │
    │ ✅ PREVENTS REDUNDANCY           │
    └──────────────────────────────────┘
```

### What's Actually Happening (Wrong)

```
User accepts:      "Change Tires to Blue"
          │
          ▼
    Apply change:   actual_setup['Tread'] = 'Blue'
          │
          ▼
    Record change:  ❌ NOTHING HAPPENS
          │
          ▼
    change_history stays empty: []
          │
          ▼
    ┌──────────────────────────────────┐
    │ AI asks: "What changes so far?"  │
    │ Sees: Nothing in history         │
    │ Suggests: "Try Blue tires!"      │
    │ User: "Didn't we just try that?" │
    │ ❌ REDUNDANT SUGGESTION           │
    └──────────────────────────────────┘
```

### The Fix

After applying a change, add:

```python
st.session_state.change_history.append({
    'timestamp': datetime.now().isoformat(),
    'parameter': parameter_key,
    'old_value': old_value,
    'new_value': new_value,
    'status': 'accepted'
})
```

**File to change:** `Execution/tabs/setup_advisor.py` (around line 225)

---

## Problem #5: Context Building Uses Mixed Names

### What Should Happen (Correct)

```
┌─────────────────────────────────┐
│  Building Engineer Context      │
├─────────────────────────────────┤
│  engineer_context = {           │
│    'scenario': "A",             │
│    'orp_score': 78,             │
│    'driver_confidence': 4,  ✅  │ ← Correct name
│    'experience_level': "Pro",   │
│    'change_history': [...]      │
│  }                              │
└─────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  Pass to: get_system_prompt()   │
│           (AI persona system)   │
│                                 │
│  Persona receives FULL context  │
│  with ALL values populated ✅   │
└─────────────────────────────────┘
```

### What's Actually Happening (Wrong)

```
┌──────────────────────────────────────┐
│  Building Engineer Context           │
├──────────────────────────────────────┤
│  engineer_context = {                │
│    'scenario': "A",                  │
│    'orp_score': 78,                  │
│    'driver_confidence': ???,    ❌   │ ← Trying to read
│    'experience_level': "Pro",        │   'confidence_rating'
│    'change_history': [...]           │   but it doesn't exist!
│  }                                   │
└──────────────────────────────────────┘
            │
            ▼ (with default/missing values)
┌──────────────────────────────────────┐
│  Pass to: get_system_prompt()        │
│           (AI persona system)        │
│                                      │
│  Persona receives INCOMPLETE context │
│  Missing or wrong confidence value ❌│
└──────────────────────────────────────┘
```

### The Fix

Ensure all context dict keys use the same names as dashboard initializes:

```python
# BEFORE (mixed names)
engineer_context = {
    'driver_confidence': st.session_state.get('confidence_rating', 3),  # ❌
}

# AFTER (consistent names)
engineer_context = {
    'driver_confidence': st.session_state.get('driver_confidence', 3),  # ✅
}
```

**File to change:** `Execution/tabs/setup_advisor.py` (around line 177)

---

## The Big Picture: How Data Should Flow

### Correct Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Shared Session State Whiteboard        │
│  (All tabs read from here, all updates visible to all)   │
│                                                           │
│  driver_confidence: 3 ────┬──────────────────┬──┐        │
│  experience_level: "Pro"  │                  │  │        │
│  scenario: "A"            │                  │  │        │
│  change_history: [...]    │                  │  │        │
└──────────────────────────┬───────────────────┼──┘        │
                           │                  │            │
                ┌──────────▼──┐    ┌─────────▼──────┐     │
                │   Tab 1     │    │    Tab 2       │     │
                │ (reads      │    │  (reads &      │     │
                │  from all)  │    │   writes)      │     │
                │             │    │                │     │
                │ Sets:       │    │ Sets:          │     │
                │ - scenario  │    │ - pending_     │     │
                │ - practice_ │    │   changes      │     │
                │   rounds    │    │ - messages     │     │
                └─────┬───────┘    └────────────────┘     │
                      │                                    │
                      └────────► Both visible everywhere ◄─┘
```

### Current Broken Flow

```
┌────────────────────────────────────────────┐
│  Dashboard writes: 'driver_confidence'     │
└──────────────┬─────────────────────────────┘
               │
               ▼
         Whiteboard:
    'driver_confidence': 3

    Tab 2 looks for:
    'confidence_rating'  ❌ NOT FOUND

    Uses default: 3 (wrong!)

    Change is "lost" in communication
```

---

## Summary: The Connection Problem

Think of it like a **misaligned electrical system**:

```
Power Source:  Generates "driver_confidence" signal
                       │
                       ▼
           Transmission: Sends on correct line
                       │
                       ▼
          PROBLEM: Consumer looking for wrong line
                       │
    "confidence_rating" (doesn't exist here)
    Should be looking at "driver_confidence"
                       │
                       ▼
          Consumer gets default signal (wrong value)
                       │
                       ▼
          Device malfunctions (AI behaves wrong)
```

---

## All 5 Problems on One Page

| # | Signal Sent | Signal Expected | Receiver | Result |
|---|---|---|---|---|
| 1 | `driver_confidence: 2` | `confidence_rating: ?` | Tab 2 | Not found, uses default 3 |
| 2 | `experience_level: "Pro"` at root | Looks in `racer_profile` nested | Tabs 1,2,4 | Reads old value, doesn't see changes |
| 3 | `scenario: "A"` (default) | Never set to "B" based on practice_rounds | Tab 2 Engineer | Constraints never activate |
| 4 | `change_history` stays empty | Never appended when change accepted | Persona system | Anti-redundancy doesn't work |
| 5 | `confidence_rating: ?` (missing) | `driver_confidence` expected in context | Persona prompt | Incomplete context data |

---

## After All Fixes Are Applied

```
┌──────────────────────────────────────────────────────┐
│        Session State (All Keys Aligned)              │
├──────────────────────────────────────────────────────┤
│ ✅ driver_confidence: 3  (consistent everywhere)     │
│ ✅ experience_level: "Pro" (root level)              │
│ ✅ scenario: "B" (auto-detected from practice_rounds)│
│ ✅ change_history: [change1, change2] (populated)   │
│ ✅ All other keys aligned                           │
└──────────────────────────────────────────────────────┘
            │              │              │
    ┌───────▼─────┐  ┌────▼────┐  ┌──────▼──┐
    │    Tab 1    │  │  Tab 2  │  │  Tab 3  │
    │ ✅ Reads    │  │ ✅      │  │ ✅      │
    │   correct   │  │ Receives│  │ No      │
    │   values    │  │ complete│  │ persona │
    │ ✅ Writes   │  │ context │  │ system  │
    │   to root   │  │ All     │  │         │
    │ ✅ Sets     │  │ signals │  │ Works   │
    │   scenario  │  │ aligned │  │ ✅      │
    └─────────────┘  └─────────┘  └─────────┘
            │              │              │
            └──────────────┴──────────────┘
                All features work correctly
```

---

*Visual Guide Complete*
*These diagrams explain the 5 problems visually*
*Reference this when implementing fixes*
