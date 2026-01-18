# Database Verification & Testing

## Status: ✅ Master_Schema.sql Successfully Executed

The database schema has been created in Supabase. Now let's verify everything is working.

---

## Step 1: Verify Tables Exist (Quick Check)

Run this query in Supabase SQL Editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Result - You should see 7 tables:**
- classes
- race_results
- racer_profiles
- sessions
- setup_changes
- setup_embeddings
- vehicles

---

## Step 2: Verify Table Structure (Detailed Check)

### Check racer_profiles has sponsors field:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'racer_profiles'
ORDER BY ordinal_position;
```

**Expected columns:**
- id (uuid)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
- name (text)
- email (text)
- sponsors (jsonb) ← NEW
- is_default (boolean)

### Check vehicles has class_id field:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;
```

**Expected columns:**
- id (uuid)
- profile_id (uuid)
- class_id (uuid) ← NEW
- created_at (timestamp)
- updated_at (timestamp)
- brand (text)
- model (text)
- transponder (text)
- baseline_setup (jsonb)

### Check classes table exists:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'classes'
ORDER BY ordinal_position;
```

**Expected columns:**
- id (uuid)
- profile_id (uuid) - foreign key to racer_profiles
- name (text)
- created_at (timestamp)

---

## Step 3: Verify Indexes

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**Expected indexes (should see at least these):**
- idx_vehicles_profile_id (on vehicles table)
- idx_sessions_profile_id (on sessions table)
- idx_sessions_vehicle_id (on sessions table)
- idx_setup_changes_session_id (on setup_changes table)
- idx_race_results_session_id (on race_results table)
- idx_setup_embeddings_session_id (on setup_embeddings table)
- idx_sessions_status (on sessions table)
- idx_sessions_profile_status (on sessions table)
- idx_setup_changes_created_at (on setup_changes table)
- idx_classes_profile_id (on classes table)
- idx_vehicles_class_id (on vehicles table)

---

## Step 4: Test Frontend Connection

### Option A: Create Test Data Manually (in Supabase)

Run this in Supabase SQL Editor to create a test racer:

```sql
INSERT INTO racer_profiles (name, email, sponsors, is_default)
VALUES (
  'Test Racer',
  'test@racing.io',
  '[{"brand": "JConcepts", "category": "Tires"}, {"brand": "Castle", "category": "Motor"}]',
  true
);
```

Expected response: `1 row inserted`

### Option B: Test via Frontend (Better)

1. Keep `npm run dev` running (localhost:3002)
2. Refresh your browser (Ctrl+F5)
3. Go to Mission Control tab
4. You should see "○ NO TRACK DATA" message (no errors)
5. Try to create a new racer profile:
   - Click the "[+] Add" button in "Fleet Configuration"
   - Fill in: Name = "John Smith", Email = "john@smith.io"
   - Click "Save"
6. If successful: New racer appears in dropdown and no console errors

---

## Step 5: Verify Enum Types

```sql
SELECT enum_range(NULL::session_type_enum);
SELECT enum_range(NULL::change_status_enum);
SELECT enum_range(NULL::session_status_enum);
```

**Expected results:**
- session_type_enum: (practice,qualifier,main)
- change_status_enum: (pending,accepted,denied,reversed)
- session_status_enum: (draft,active,archived)

---

## Step 6: Check for Errors or Issues

Look for these in browser console (F12 → Console tab):

### ✅ What's OK:
- "No active session or vehicle selected" - This is normal
- Loading messages - This is fine

### ❌ What's NOT OK:
- "relation does not exist" - Tables didn't create
- "permission denied" - Auth issue with Supabase keys
- Network errors - Check internet connection
- 401/403 errors - Check NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

---

## Step 7: Verify RLS Policies Are Active

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('racer_profiles', 'vehicles', 'sessions', 'classes')
ORDER BY tablename, policyname;
```

**Expected result:**
You should see policies are enabled (scaffolded for future use). Initially they might be empty or show system policies - this is fine. We'll implement specific policies later.

---

## Database Ready Checklist

Check off each item:

- [ ] 7 tables exist (classes, race_results, racer_profiles, sessions, setup_changes, setup_embeddings, vehicles)
- [ ] racer_profiles has sponsors JSONB column
- [ ] vehicles has class_id UUID column
- [ ] classes table exists and links to racer_profiles
- [ ] All indexes are created
- [ ] No console errors when accessing localhost:3002
- [ ] Can view Mission Control page without errors
- [ ] (Optional) Successfully created test racer profile

---

## What This Means

✅ **Backend is ready!**
- Database schema: Complete
- Tables: Created
- Relationships: Configured
- Indexes: Optimized
- Security framework: In place

✅ **Frontend is ready!**
- Phase 2.1 components: Built (EventIdentity, SessionLockSlider, TrackIntelligence)
- Connected to Supabase via env variables
- Can now fetch and save data

🔄 **Next Phase:**
- Build V3.1 Tab 1 (Racer Garage)
- Build V3.1 Tab 2 (Unified Race Control)
- Build V3.1 Tab 3 (AI Advisor)

---

## If Something's Wrong

### Error: "relation does not exist"
- Your Master_Schema.sql didn't fully execute
- Solution: Check Supabase SQL Editor for error messages, try running again

### Error: "permission denied"
- Your ANON_KEY doesn't have permission
- Solution: Use Service Role Key or check RLS policies

### Error: "Cannot POST to Supabase"
- Env variables not set correctly
- Solution: Check `frontend/.env.local` has both NEXT_PUBLIC_SUPABASE_* variables

### Error: "Network error"
- Supabase is unreachable
- Solution: Check internet, verify Supabase status page

### Tables created but console still shows errors
- RLS policies blocking access
- Solution: Temporarily disable RLS (dangerous in production, OK for testing):
  ```sql
  ALTER TABLE racer_profiles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
  ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
  ALTER TABLE setup_changes DISABLE ROW LEVEL SECURITY;
  ALTER TABLE race_results DISABLE ROW LEVEL SECURITY;
  ALTER TABLE setup_embeddings DISABLE ROW LEVEL SECURITY;
  ```

---

## Next Steps After Verification

Once all checks pass:

1. **Create test data** (optional but helpful)
2. **Restart frontend** (`npm run dev` if not running)
3. **Test creating a racer** (via UI, not Supabase)
4. **Begin Phase 4** - Build V3.1 tab shells

---

## Questions or Issues?

Reference files:
- `ARCHITECTURE_OVERVIEW.md` - How everything connects
- `V3_1_IMPLEMENTATION_ROADMAP.md` - Full implementation plan
- `NEXT_STEPS.txt` - Quick reference
- `Master_Schema.sql` - The schema that was just created
