# Phase 4.4: Implementation Recommendations & Questions

**Date:** 2026-01-15
**Status:** 📋 Analysis Complete - Recommendations Ready

## Key Questions for Stakeholder Review

### 1. **Session State Management on Profile Switch**

**Question:** When a user switches profiles, should we:

**Option A: Clear ALL setup state** (Recommended)
```python
# On profile switch:
st.session_state.active_session_id = None
st.session_state.actual_setup = None
st.session_state.pending_changes = []
st.session_state.track_context = {}
st.session_state.messages = []
# ... all session-related state
```
**Pros:** Clean slate, no cross-profile contamination
**Cons:** Users lose unsaved work if they switch accidentally

**Option B: Save & Restore per profile** (More Complex)
```python
# On profile switch:
# 1. Save current profile's session state to st.session_state.profile_1_state
# 2. Load previous profile's state from st.session_state.profile_2_state
# 3. Restore to st.session_state
```
**Pros:** Users can switch between profiles without losing work
**Cons:** Complex session management, potential memory issues

**Option C: Warn user before clearing**
```python
if st.session_state.active_session_id:
    st.warning("You have an active session. Switch profiles?")
    if st.button("Clear Session & Switch"):
        # Clear state and switch
```
**Pros:** User aware of consequences
**Cons:** Extra confirmation step

**Recommendation:** **Option A + Option C** - Clear state but warn the user first (similar to Tab 1 message)

---

### 2. **Default Profile Selection Logic**

**Question:** For first-time users with no profiles, should we:

**Option A: Auto-create "Default Racer"** (Current behavior)
- Schema default creates "Default Racer" automatically
- User sees something immediately on startup
- Rationale: Follows current v1.8.x behavior

**Option B: Show onboarding wizard**
- Require user to create their profile name
- More personalized experience
- Could be deferred to Phase 5 (UX/Onboarding)

**Option C: Allow anonymous session first**
- Skip profile requirement initially
- Create profile later when user saves setup
- More friction-free onboarding

**Recommendation:** **Stick with Option A** - The "Default Racer" auto-creation is simple and consistent with current behavior. Can refactor to onboarding in Phase 5.

---

### 3. **Profile Display in Sidebar**

**Question:** How should profiles be displayed and organized?

**Option A: Simple dropdown**
```
📋 Current Racer: [Default Racer ★ ▼]
```
- Click dropdown → see all profiles
- Click profile name → switch
- Click star icon → set as default

**Option B: Card-based selector**
```
┌─────────────────────┐
│ Default Racer ★     │  ← Click to switch
│ email@example.com   │
│ Tekno, Associated   │  ← Vehicles
└─────────────────────┐
┌─────────────────────┐
│ Child Racer         │
│ child@example.com   │
│ Tekno NB48          │
└─────────────────────┐
```
- More visual, shows profile details
- More space-intensive
- Better for mobile experience

**Option C: Expandable section** (Recommended)
```
▼ Racer Profile
  ┌─────────────────────┐
  │ Default Racer ★     │
  │ 2 vehicles          │
  └─────────────────────┐
  ┌─────────────────────┐
  │ ➕ Create New       │
  └─────────────────────┐
```
- Familiar pattern (like current sidebar)
- No extra clicks
- Shows profile summary

**Recommendation:** **Option C** - Expandable with quick stats. Can show vehicle count or default status.

---

### 4. **Multi-Profile Permissions & Isolation**

**Question:** Should profiles be:

**Option A: Completely isolated** (Current plan)
- Each profile has own vehicles, sessions, setups
- No shared data between profiles
- Best security/privacy

**Option B: Shared vehicles/library** (Future Phase 4.2)
- Profiles can see each other's master library
- But keep sessions private
- Better for team coordination

**Option C: Configurable sharing**
- User can choose what's shared per profile
- More complex, deferred to Phase 4.2+

**Recommendation:** **Stay with Option A for Phase 4.4** - Simplicity first. Phase 4.2 (Team Management) can introduce sharing if needed.

---

### 5. **Database Migration Execution**

**Question:** How should the migration be deployed?

**Option A: Manual execution** (Current plan - safest)
```bash
psql $DATABASE_URL < migrations/add_is_default_column.sql
```
- Requires explicit user action
- Safest (no automatic surprises)
- Documented in deployment guide

**Option B: Auto-run on app startup**
```python
# In database.py
if db.is_connected:
    if not column_exists('racer_profiles', 'is_default'):
        run_migration('add_is_default_column.sql')
```
- Transparent to user
- Could fail silently
- Risky for production

**Option C: Flask-style migrations** (Overkill for now)
- Version control for migrations
- Track which migrations have run
- Complex setup

**Recommendation:** **Keep Option A** - Manual execution with clear documentation. Users should be aware of schema changes. Can add auto-detection in Phase 5.

---

### 6. **Backward Compatibility: get_or_create_default_profile()**

**Question:** Should we refactor or deprecate the existing function?

**Current Code in database.py:**
```python
def get_or_create_default_profile():
    """Fallback: creates profile if none exists."""
```

**Option A: Keep as-is** (No changes)
- Works with new is_default logic
- Doesn't break existing code
- Slight redundancy but harmless

**Option B: Refactor to use is_default**
```python
def get_or_create_default_profile():
    default = profile_service.get_default_profile()
    if default:
        return default['id']
    # Create default racer
    profile = profile_service.create_profile('Default Racer', ...)
    profile_service.set_default_profile(profile['id'])
    return profile['id']
```
- Uses new infrastructure
- More maintainable
- Requires testing

**Option C: Phase out gradually**
- Deprecate in Phase 4.4
- Remove in Phase 5
- Communicate clearly to team

**Recommendation:** **Option B** - Refactor it to use new methods. It's a small change and makes code more cohesive. Add comment: "Refactored for Phase 4.4 multi-racer support."

---

## Implementation Roadmap

### Immediate (Sprint 1 - Ready Now)
- ✅ Migration script created
- ✅ Schema updated
- ✅ Service methods implemented
- ⏳ **Next:** Deploy migration to Railway

### Short Term (Sprint 2 - UI Implementation)
```python
# sidebar.py changes (~50 lines):
1. Get list of profiles: profile_service.list_profiles()
2. Show dropdown with profile names
3. On change: switch_profile(profile_id)
   - Clear session state (with warning)
   - Reload racer_profile
   - st.rerun()
4. Add "Set as Default" button/star icon
5. Add "➕ New Racer" button

# dashboard.py changes (~5 lines):
1. Replace get_or_create_default_profile()
2. Use profile_service.get_default_profile()
3. Refactor get_or_create_default_profile() to use new methods
```

### Medium Term (Sprint 3 - Testing)
```python
# test_profile_service.py additions:
- test_get_default_profile()
- test_set_default_profile_unsets_others()
- test_list_profiles_shows_default()
- test_create_profile_first_becomes_default()

# test_sidebar.py additions:
- test_profile_switcher_shows_all_profiles()
- test_switch_clears_session_state()
- test_set_default_persists_on_restart()
```

---

## Risk & Mitigation

### Risk: Migration Fails on Production
**Probability:** Low (idempotent, tested locally)
**Impact:** High (app can't query default profile)
**Mitigation:**
- Test migration locally first
- Have rollback script ready
- Verify post-migration with count query

### Risk: Session State Bleeding Between Profiles
**Probability:** Medium (easy to miss edge cases)
**Impact:** High (data confusion)
**Mitigation:**
- Comprehensive state clearing on switch
- Add unit test for state isolation
- Clear st.session_state keys in allow list (not blacklist)

### Risk: User Loses Work on Profile Switch
**Probability:** High (if no warning)
**Impact:** Medium (frustration, data loss if unsaved)
**Mitigation:**
- Show warning if active_session_id exists
- Suggest "Save First" workflow
- Consider draft auto-save (Phase 4.3)

---

## Recommended Deployment Timeline

### Week 1: Migration & Testing
```bash
# Day 1: Prepare
- Review migration script
- Test on local database copy
- Create rollback plan

# Day 2: Execute
- Backup Railway PostgreSQL
- Execute migration
- Verify: SELECT COUNT(*) WHERE is_default = TRUE → 1

# Day 3: Verify
- Deploy updated code
- Test profile queries in app
- Smoke test: Start app, check session_state
```

### Week 2: UI Implementation
```bash
# Day 4-5: Sidebar
- Implement profile switcher
- Add set_default button
- Add warning on switch

# Day 6-7: Testing
- Manual testing of profile switch
- Test set_as_default persistence
- Test with 3+ profiles
```

### Week 3: Final Testing
```bash
# Day 8-9: Integration tests
- Add unit tests for profile methods
- Add sidebar integration tests
- Test on staging environment

# Day 10: Deployment
- Code review with team
- Deploy to production
- Monitor for issues
```

---

## Code Organization Notes

### What's already correct:
✅ Migration script location: `Execution/database/migrations/`
✅ Service method location: `Execution/services/profile_service.py`
✅ Schema location: `Execution/schema_v2.sql`

### What needs attention:
⏳ UI implementation should go in `Execution/components/sidebar.py`
⏳ Tests should go in `tests/test_profile_service.py`
⏳ Integration tests in `tests/test_sidebar.py` (new file)

---

## Success Criteria

Phase 4.4 is complete when:

- ✅ Migration deployed to Railway successfully
- ✅ Schema verified in production (is_default column exists, 1 default profile)
- ✅ `profile_service.get_default_profile()` returns correct profile
- ✅ `profile_service.set_default_profile()` switches default correctly
- ✅ Profile switcher dropdown in sidebar works
- ✅ "Set as Default" button persists selection
- ✅ Session state clears on profile switch (with warning)
- ✅ Unit tests pass (get_default, set_default, list_profiles)
- ✅ Integration tests pass (sidebar switcher, persistence)
- ✅ Documentation complete (deployment guide, user guide)

---

## Questions for You

1. **Session clearing:** Do you prefer Option A (clear all) or Option C (warn first)?
2. **Profile display:** Does Option C (expandable with stats) work for your UI?
3. **Timeline:** Can this be deployed in 2-3 weeks, or do you need it faster/slower?
4. **Testing:** Want comprehensive unit tests or minimal smoke tests?
5. **Documentation:** Should we create a user guide for multi-racer workflow?

---

**Co-Authored-By:** Claude Haiku 4.5 <noreply@anthropic.com>
