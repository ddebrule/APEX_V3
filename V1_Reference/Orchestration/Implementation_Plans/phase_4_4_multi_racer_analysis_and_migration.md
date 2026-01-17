# Phase 4.4: Multi-Racer Profile Management - Analysis & Migration Strategy

**Date:** 2026-01-15
**Status:** 🔧 In Progress - Infrastructure Ready
**Focus:** Database Migration, Service Layer, UI Preparation

## Executive Summary

Phase 4.4 enables the system to support multiple racer profiles with graceful migration of existing deployments. This document outlines:

1. **Migration Strategy** - How to safely add `is_default` column to existing deployments
2. **Database Updates** - Schema changes with backward compatibility
3. **Service Layer Changes** - New methods for default profile management
4. **Implementation Status** - What's been done and what's remaining

## Phase 4.4 Requirements Analysis

### From Original Plan (phase_4_4_multi_racer_management_plan.md)

**Goal:** Enable a user to manage multiple racers (self, child, teammate) from a single instance.

**Core Features:**
1. ✅ Database schema with `is_default` column
2. ✅ Profile switching via dropdown/selector
3. ✅ Create new racer profiles
4. ✅ Mark profile as default (auto-loads on startup)
5. ⏳ UI implementation in sidebar
6. ⏳ Session state clearing on profile switch
7. ⏳ Unit tests for multi-profile scenarios

## Database Migration Strategy

### Problem Statement
Existing deployments have `racer_profiles` table **without** the `is_default` column. We need to:
- Add the column safely without breaking existing data
- Ensure exactly one profile is marked as default
- Make the migration idempotent (safe to run multiple times)
- Provide clear migration path for both Railway (PostgreSQL) and local (CSV) environments

### Solution: Two-Tier Migration Approach

#### Tier 1: PostgreSQL (Production - Railway)
**Migration File:** `Execution/database/migrations/add_is_default_column.sql`

The migration script:
```sql
-- 1. Add column with DEFAULT FALSE (safe for existing rows)
ALTER TABLE racer_profiles
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- 2. Set 'Default Racer' as default if it exists and no default is set
UPDATE racer_profiles SET is_default = TRUE
WHERE id = (SELECT id FROM racer_profiles WHERE name = 'Default Racer' LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM racer_profiles WHERE is_default = TRUE);

-- 3. If no 'Default Racer', mark oldest profile as default
UPDATE racer_profiles SET is_default = TRUE
WHERE id = (SELECT id FROM racer_profiles ORDER BY created_at ASC LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM racer_profiles WHERE is_default = TRUE);

-- 4. Create partial index for efficient queries
CREATE INDEX IF NOT EXISTS idx_racer_profiles_is_default
ON racer_profiles(is_default) WHERE is_default = TRUE;
```

**Key Features:**
- ✅ `IF NOT EXISTS` clauses prevent errors if already applied
- ✅ Idempotent - safe to run multiple times
- ✅ No data loss - existing profiles retained with `is_default = FALSE`
- ✅ Auto-selects sensible default if none set
- ✅ Partial index optimizes `WHERE is_default = TRUE` queries

**Deployment Instructions:**
```bash
# For Railway users with PostgreSQL:
psql $DATABASE_URL < Execution/database/migrations/add_is_default_column.sql

# Or manually via Railway dashboard:
# 1. Open PostgreSQL console in Railway dashboard
# 2. Copy-paste script contents
# 3. Execute
```

#### Tier 2: Local Development (CSV Fallback)
The application auto-handles CSV environments:
- `profile_service.py` queries database first
- Falls back to CSV if not connected
- Default behavior when adding profiles via UI:
  - First profile created → automatically marked as default in database
  - Subsequent profiles → `is_default = FALSE` unless explicitly set

**No additional action needed** for local development.

## Schema Changes

### Original Schema (schema_v2.sql)
```sql
CREATE TABLE IF NOT EXISTS racer_profiles (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    sponsors TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Updated Schema (with Phase 4.4)
```sql
CREATE TABLE IF NOT EXISTS racer_profiles (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    sponsors TEXT[] DEFAULT '{}',

    -- NEW: Multi-Racer Management (Phase 4.4)
    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Index Added:**
```sql
CREATE INDEX IF NOT EXISTS idx_racer_profiles_is_default
ON racer_profiles(is_default) WHERE is_default = TRUE;
```

**Why This Index?**
- Partial index on `is_default = TRUE` queries
- Only one row matches (at most), so extremely fast
- Minimal storage overhead (indexes only TRUE rows)

## Service Layer Updates

### New Methods in profile_service.py

#### 1. `get_default_profile()`
```python
def get_default_profile(self):
    """Fetch the profile marked as default."""
    # Returns: dict (profile) or None
```

**Usage:**
```python
default = profile_service.get_default_profile()
if default:
    st.session_state.racer_profile = default
    st.session_state.profile_id = default['id']
```

**Called by:** `dashboard.py` at startup (replaces `get_or_create_default_profile()`)

#### 2. `set_default_profile(profile_id)`
```python
def set_default_profile(self, profile_id):
    """Set a profile as default, unsetting previous default."""
    # Returns: (bool success, str error_msg or None)
```

**Behavior:**
- Sets `is_default = FALSE` for all profiles
- Sets `is_default = TRUE` for target profile
- Atomic operation (both statements execute)

**Usage:**
```python
success, error = profile_service.set_default_profile(profile_id)
if success:
    st.success("Profile set as default!")
else:
    st.error(f"Error: {error}")
```

#### 3. `list_profiles()` - UPDATED
```python
def list_profiles(self):
    """List all racer profiles with default status."""
    # Returns: list of dicts with id, name, email, is_default
```

**Old Return Value:**
```python
[
    {'id': 1, 'name': 'Default Racer', 'email': '...'},
    {'id': 2, 'name': 'Child Racer', 'email': '...'}
]
```

**New Return Value:**
```python
[
    {'id': 1, 'name': 'Default Racer', 'email': '...', 'is_default': True},
    {'id': 2, 'name': 'Child Racer', 'email': '...', 'is_default': False}
]
```

**UI Benefit:** Can show star icon or badge next to default profile

## Implementation Status

### ✅ Completed
1. Migration script: `Execution/database/migrations/add_is_default_column.sql`
2. Schema update: `Execution/schema_v2.sql` with `is_default` column and index
3. Profile service: 3 new/updated methods for default profile management
4. Error handling: Duplicate vehicle constraint messages (Phase 4.4 adjacent fix)
5. Tab 1 UX: Clear messaging when no vehicles assigned

### ⏳ In Progress
1. Sidebar UI: Profile switcher dropdown (requires update to `sidebar.py`)
2. Session management: Clear state on profile switch
3. Unit tests: Profile listing, default switching, multi-profile scenarios

### 📋 Remaining for Production Rollout
1. Deploy migration to Railway PostgreSQL
2. Test profile switching in production
3. Verify default profile loads on app restart
4. Document multi-racer user workflows

## Migration Execution Plan

### Step 1: Pre-Migration Verification
```bash
# Check current racer_profiles table structure
psql $DATABASE_URL -c "\d racer_profiles"

# Should show: (no is_default column yet)
```

### Step 2: Apply Migration
```bash
# Via psql
psql $DATABASE_URL < Execution/database/migrations/add_is_default_column.sql

# Via Railway dashboard
# 1. Go to PostgreSQL tab
# 2. Open "Database" console
# 3. Run script
```

### Step 3: Post-Migration Verification
```bash
# Verify column was added
psql $DATABASE_URL -c "\d racer_profiles"

# Should show: is_default | boolean | default FALSE

# Verify default was set
psql $DATABASE_URL -c "SELECT id, name, is_default FROM racer_profiles;"

# Should show: at least one profile with is_default = TRUE
```

### Step 4: Code Deployment
```bash
# Push updated schema_v2.sql and profile_service.py
git add Execution/schema_v2.sql
git add Execution/services/profile_service.py
git add Execution/database/migrations/add_is_default_column.sql
git commit -m "feat: Add Phase 4.4 multi-racer profile infrastructure"
git push origin main

# Railway auto-deploys
```

## Backward Compatibility

### Existing Code (No Changes Required)
- `profile_service.get_profile()` - Works as before
- `profile_service.create_profile()` - Works as before (respects new schema)
- `profile_service.update_profile()` - Works as before
- `get_or_create_default_profile()` - Can be refactored but still works

### New Optional Features
- `get_default_profile()` - New, opt-in
- `set_default_profile()` - New, opt-in via UI
- `list_profiles()` - Enhanced with `is_default` field (backward compatible)

## Testing Strategy

### Unit Tests (test_profile_service.py)
```python
def test_get_default_profile():
    # Should return the profile with is_default=TRUE

def test_set_default_profile():
    # Should set one profile as default, unset others

def test_list_profiles_includes_default_status():
    # list_profiles() should include is_default in result

def test_create_profile_sets_default_if_first():
    # First profile created should be marked as default
```

### Integration Tests (sidebar.py)
```python
def test_profile_switcher_dropdown():
    # Should show all profiles
    # Default should be highlighted

def test_switch_profile_clears_session():
    # Switching profiles should clear setup state

def test_set_as_default_persists():
    # Restarting app should load new default
```

### Manual Testing Checklist
- [ ] Create second racer profile
- [ ] Verify dropdown shows both profiles
- [ ] Switch between profiles
- [ ] Click "Set as Default"
- [ ] Restart app
- [ ] Verify new default loads automatically
- [ ] Check PostgreSQL: `SELECT is_default FROM racer_profiles`

## Risk Assessment

### Low Risk ✅
- Migration is idempotent (safe to run multiple times)
- Column has DEFAULT FALSE (no null values possible)
- No data loss (existing profiles preserved)
- Index is partial (minimal storage impact)

### Medium Risk ⚠️
- Session state not cleared on profile switch (will be fixed in sidebar update)
- Migration not automatically applied to Railway
- Requires manual SQL execution in production

### Mitigation
1. **Manual migration safety:** Requires explicit execution by deployer
2. **CSV fallback:** Local development works without database
3. **Backward compatibility:** Old code continues to work

## File Summary

| File | Changes | Status |
|------|---------|--------|
| `Execution/schema_v2.sql` | Add `is_default` column + index | ✅ Done |
| `Execution/database/migrations/add_is_default_column.sql` | NEW migration script | ✅ Done |
| `Execution/services/profile_service.py` | Add 3 methods, update list_profiles | ✅ Done |
| `Execution/components/sidebar.py` | Profile switcher UI (pending) | ⏳ Planned |
| `tests/test_profile_service.py` | Profile tests (pending) | ⏳ Planned |
| `Execution/dashboard.py` | Use `get_default_profile()` (pending) | ⏳ Planned |

## Next Steps

1. **Immediate (Ready to Deploy):**
   - Run migration on Railway PostgreSQL
   - Test in production environment
   - Verify all profiles have is_default status

2. **Short Term (UI Implementation):**
   - Implement profile switcher in sidebar
   - Add "Set as Default" button/toggle
   - Add session state clearing on switch

3. **Medium Term (Testing):**
   - Add unit tests for new profile methods
   - Add integration tests for sidebar switcher
   - Add multi-profile scenario tests

4. **Long Term (Future Phases):**
   - Team management (Phase 4.2)
   - Pit wall communication with team profiles
   - Per-profile settings and preferences

## Deployment Checklist

- [ ] Review migration script with team
- [ ] Backup production database
- [ ] Execute migration: `psql $DATABASE_URL < migrations/add_is_default_column.sql`
- [ ] Verify: `SELECT COUNT(*) FROM racer_profiles WHERE is_default = TRUE` → should be 1
- [ ] Deploy code: `git push origin main`
- [ ] Test: Create new profile, set as default, restart app
- [ ] Monitor: Check logs for any profile-related errors

---

**Co-Authored-By:** Claude Haiku 4.5 <noreply@anthropic.com>
