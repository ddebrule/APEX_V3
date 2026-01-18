# Database Setup Correction

## Issue Found
Your Supabase database is **empty** (no tables exist yet). The migration script assumes existing tables, so it failed.

**Error:** `relation "racer_profiles" does not exist`

## Solution: Use Master_Schema.sql Instead

You need to run the **full schema creation script** first, not the migration.

### Steps to Fix

**1. Go to Supabase SQL Editor**
   - https://app.supabase.com/
   - Select APEX_V3 project
   - Click **SQL Editor** → **New Query**

**2. Copy the Full Master Schema**
   - Open: `Directives/Master_Schema.sql`
   - Copy **ALL content**

**3. Paste and Run in Supabase**
   - Paste into SQL Editor
   - Click **Run** button

**4. You should see:**
   ```
   Success. No rows returned
   ```

### What This Creates

Master_Schema.sql creates the complete database structure:

✅ PostgreSQL extensions (vector)
✅ ENUM types (session_type, change_status, session_status)
✅ Tables:
   - racer_profiles (with sponsors JSONB field)
   - classes (NEW - for vehicle classification)
   - vehicles (with class_id foreign key)
   - sessions
   - setup_changes
   - race_results
   - setup_embeddings

✅ Indexes (for performance)
✅ RLS policies (security scaffolding)
✅ Automatic updated_at triggers

### Verification (Optional)

After running, verify in a new SQL query:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- classes
- race_results
- racer_profiles
- sessions
- setup_changes
- setup_embeddings
- vehicles

### Timeline Clarification

**Phase 3 was:** Create migration scripts ✓
**What we're actually doing now:** Initial database setup (tables don't exist yet)
**What you'll do:** Run Master_Schema.sql once to create everything

After this:
- Database is fully initialized with V3.1 structure
- Phase 2.1 components continue to work
- Ready to build V3.1 Tab shells (Phase 4)

### Next Steps After Schema Creation

1. ✅ Run Master_Schema.sql (THIS STEP - do this now)
2. ✅ Verify tables exist (run verification query above)
3. 🔜 Restart npm run dev server (if running)
4. 🔜 Test Mission Control page loads
5. 🔜 Create test racer profile (data initialization)
6. 🔜 Begin Phase 4 (V3.1 Tab shells)

---

**Files to Reference:**
- `Directives/Master_Schema.sql` - The schema to run
- This file - Instructions for what went wrong and how to fix it
