# Phase 5 Sprint 2 Part 2: UI Implementation Guide

**Status:** In Progress
**Focus:** Adding ORP context inputs to Tab 1 and Racer Profile
**Time Estimate:** 2-3 hours

---

## Overview

Sprint 2 Part 2 requires UI changes to capture experience level, driving style, and practice/qualifying round counts. These are needed for ORP calculations.

---

## Task 1: Session Service Update ✅

**File:** `Execution/services/session_service.py`
**Status:** COMPLETED

Updated `create_session()` to accept:
- `practice_rounds: int` (0-5+)
- `qualifying_rounds: int` (1-6)

These are passed from Tab 1 UI when user locks the event setup.

---

## Task 2: Add Tab 1 UI Inputs

**File:** `Execution/dashboard.py`
**Location:** Tab 1 - "Event Setup"
**Current Line Count:** ~1695 lines

### 2.1 Find Tab 1 Code

Search for: `st.header("Event Setup")` or `"Tab 1"` or similar marker

Tab 1 currently collects:
- Session name
- Session type (Practice, Qualifying, Main, Club Race)
- Track information
- Surface conditions
- Vehicle selection

### 2.2 Add ORP Inputs (After Surface Condition)

Add these Streamlit inputs to Tab 1:

```python
# === ORP STRATEGY INPUTS (NEW) ===
st.subheader("Race Schedule (for ORP Strategy)")

col1, col2 = st.columns(2)
with col1:
    practice_rounds = st.number_input(
        "Practice Rounds",
        min_value=0,
        max_value=10,
        value=0,
        step=1,
        help="Number of practice heats (0 = no practice, 3+ = Avant Garde unlocked)"
    )

with col2:
    qualifying_rounds = st.number_input(
        "Qualifying Rounds",
        min_value=0,
        max_value=6,
        value=4,
        step=1,
        help="Number of qualifying heats"
    )

# Display strategy info
strategy = orp_service.get_strategy_for_scenario(
    experience_level=st.session_state.get('racer_profile', {}).get('experience_level', 'Intermediate'),
    practice_rounds=practice_rounds,
    qualifying_rounds=qualifying_rounds
)

if strategy:
    scenario = "A: Avant Garde" if strategy['scenario'] == "A" else "B: Conservative"
    st.info(f"📊 **Scenario {scenario}** - {strategy['description']}")
    st.caption(f"Allowed Parameters: {', '.join(strategy['allowed_parameters'][:3])}...")
```

### 2.3 Update Session Creation

When user clicks "Lock Setup" button, pass the new fields:

**Find the "Lock Setup" button code** and update the session_data dict:

```python
session_data = {
    # ... existing fields ...
    'practice_rounds': practice_rounds,  # NEW
    'qualifying_rounds': qualifying_rounds,  # NEW
}
```

### 2.4 Import ORP Service at Top

Add to dashboard imports:
```python
from Execution.services.orp_service import ORPService

orp_service = ORPService()
```

---

## Task 3: Extend Racer Profile Sidebar

**File:** `Execution/dashboard.py`
**Location:** Sidebar - "Racer Profile" section

### 3.1 Find Racer Profile Code

Search for: `st.sidebar.header("Racer Profile")` or similar

Current profile fields:
- Name
- Email
- Social media (Facebook, Instagram)
- Transponder
- Sponsors

### 3.2 Add ORP Profile Fields

Add after existing profile fields:

```python
# === ORP PROFILE FIELDS (NEW) ===
st.sidebar.subheader("Performance Profile")

experience_level = st.sidebar.selectbox(
    "Experience Level",
    options=["Sportsman", "Intermediate", "Pro"],
    index=1,  # Default to Intermediate
    help="Affects ORP weighting and AI recommendations"
)

driving_style = st.sidebar.text_input(
    "Driving Style Notes",
    value="",
    max_chars=255,
    placeholder="e.g., 'Prefers smooth lines' or 'Likes rotation'",
    help="Your preferred approach (optional)"
)
```

### 3.3 Save to Racer Profile

When updating racer profile (after "Save Profile" button), include:

```python
racer_profile_data = {
    # ... existing fields ...
    'experience_level': experience_level,  # NEW
    'driving_style': driving_style,  # NEW
}
```

**Note:** The actual database save happens via the racer profile service.
Look for calls to `profile_service.save_profile()` or similar.

---

## Task 4: CSV Schema Update

**File:** `Execution/data/car_configs.csv` and `Execution/data/track_logs.csv`

### 4.1 Session CSV Files

If using CSV fallback (no PostgreSQL), create:
**File:** `Execution/data/sessions.csv`

Headers:
```csv
session_id,profile_id,vehicle_id,session_name,session_type,track_name,track_size,traction,surface_type,surface_condition,practice_rounds,qualifying_rounds,start_date,status
```

Example row:
```csv
sess-001,prof-001,veh-001,Thunder Alley Practice,Practice,Thunder Alley,Medium,Medium,Dry,Smooth,2,0,2025-12-28,active
```

### 4.2 Racer Profiles CSV

If using CSV fallback, update:
**File:** `Execution/data/racer_profiles.csv`

Add columns:
```csv
experience_level,driving_style
```

---

## Task 5: Integration & Testing

### 5.1 Test Flow

1. **User opens app → Tab 1**
   - Should see "Race Schedule" section with practice/qualifying inputs
   - Should see Scenario detection and strategy info

2. **User selects experience level in sidebar**
   - Should update display
   - Should affect ORP calculations

3. **User enters practice/qualifying rounds**
   - Scenario should change (A or B)
   - Allowed parameters should update

4. **User clicks "Lock Setup"**
   - practice_rounds and qualifying_rounds saved to session
   - SessionService.create_session() called with new fields

5. **Later: LiveRC sync happens**
   - Laps imported
   - ORP calculated with user's profile settings
   - Score displayed to user

### 5.2 Test Data

Use existing test data or create new:

```python
# For testing Tab 1
test_practice = 3  # Should trigger Scenario A
test_qualifying = 4
test_experience = "Sportsman"
test_style = "Conservative"
```

---

## Integration Points Summary

| Component | Change | File |
|-----------|--------|------|
| Session Service | Accept practice/qualifying rounds | session_service.py ✅ |
| Tab 1 UI | Add practice/qualifying inputs | dashboard.py |
| Tab 1 UI | Display ORP Scenario | dashboard.py |
| Profile Sidebar | Add experience_level dropdown | dashboard.py |
| Profile Sidebar | Add driving_style text input | dashboard.py |
| Database | Schema migration ready | 001_add_orp_fields.sql |
| Database | Run logs service ready | run_logs_service.py ✅ |
| CSV Fallback | Create sessions.csv | data/ folder |

---

## Implementation Checklist

### Dashboard Updates
- [ ] Find Tab 1 "Event Setup" section
- [ ] Add practice/qualifying round inputs (st.number_input)
- [ ] Import orp_service at top
- [ ] Add ORP scenario display (st.info)
- [ ] Update session_data dict with new fields
- [ ] Test: practice rounds change scenario display

### Racer Profile Updates
- [ ] Find sidebar "Racer Profile" section
- [ ] Add experience_level selectbox
- [ ] Add driving_style text input
- [ ] Update profile save to include new fields
- [ ] Test: experience level persists across sessions

### CSV Fallback
- [ ] Create sessions.csv in Execution/data/
- [ ] Create racer_profiles.csv updates (if not exists)
- [ ] Verify CSV format matches schema

### Testing
- [ ] Tab 1: Change practice_rounds, verify Scenario changes
- [ ] Tab 1: Change qualifying_rounds, verify updates
- [ ] Sidebar: Change experience_level, verify persists
- [ ] Lock session: Verify practice_rounds saved
- [ ] End-to-end: ORP calculates with correct profile

---

## Common Issues & Solutions

### Issue: "Module has no attribute 'get_strategy_for_scenario'"
**Solution:** Verify orp_service import and that ORPService class has the method

### Issue: Session creation fails
**Solution:** Check SessionService.create_session() received practice/qualifying in session_data dict

### Issue: Inputs don't show in Tab 1
**Solution:** Verify location in code - should be after surface condition, before "Lock Setup" button

### Issue: CSV fallback not working
**Solution:** Ensure sessions.csv exists with correct headers before running without database

---

## Code References

**ORP Service Methods to Use:**
```python
from Execution.services.orp_service import ORPService

orp_svc = ORPService()

# Get strategy for display
strategy = orp_svc.get_strategy_for_scenario(
    experience_level="Sportsman",
    practice_rounds=2,
    qualifying_rounds=4
)

# Will return:
# {
#   'scenario': 'B',
#   'mode': 'tune_dont_pivot',
#   'description': 'Limited Practice - Conservative approach',
#   'allowed_parameters': ['oils', 'ride_height', 'camber', ...],
#   'practice_rounds': 2,
#   'qualifying_rounds': 4
# }
```

---

## Success Criteria

✅ User can select practice/qualifying rounds in Tab 1
✅ Scenario A/B detection works dynamically
✅ User can set experience level in profile sidebar
✅ Settings persist across sessions
✅ ORP service receives correct context for calculations
✅ Database migration ready for execution
✅ CSV fallback working for local development

---

## Next Steps (After Part 2 Complete)

1. ✅ Commit all changes
2. ✅ Execute database migration: `001_add_orp_fields.sql`
3. → Sprint 3: AI Advisor Integration
   - Update prompts.py with ORP context
   - Add confidence gate logic
   - AI respects Scenario A/B mode

---

## Estimated Time Breakdown

- Tab 1 inputs: 45 minutes
- Sidebar inputs: 30 minutes
- Testing & debugging: 45 minutes
- **Total: 2 hours** (well within 2-3 hour estimate)

---

**Status: Ready for implementation**
See sprint_2_part_2_summary.md after completion for final results.
