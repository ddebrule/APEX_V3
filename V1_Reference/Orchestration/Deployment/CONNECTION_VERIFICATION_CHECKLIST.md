# Railway DATABASE Connection Verification Checklist

## Status: PostgreSQL is Healthy ✅
Your database logs show:
- ✅ PostgreSQL 17.7 started successfully
- ✅ Recovery completed from previous crash
- ✅ Database ready to accept connections
- ✅ Listening on port 5432

## Next: Verify DATABASE_URL is Set

### Checklist Items

#### 1. Environment Variable Set in Postgres Plugin
- [ ] Open Railway Dashboard → APEX-AGR-SYSTEM project
- [ ] Click **Postgres** plugin
- [ ] Go to **Variables** tab
- [ ] Verify `DATABASE_URL` field is NOT blank
- [ ] Value should look like: `postgresql://postgres:PASSWORD@switchyard.proxy.rlwy.net:PORT/railway`

**Current Status: ?** (User to verify)

#### 2. App Auto-Redeployed After Setting DATABASE_URL
- [ ] Go to **AGR-APEX-ADVISOR** app plugin
- [ ] Click **Deployments** tab
- [ ] Look for a new deployment that started after setting DATABASE_URL
- [ ] Status should show "Success" (green)

**How to trigger manually if needed:**
1. Click the three dots (**...**) menu
2. Select **Redeploy**
3. Wait 30-60 seconds for deployment to complete

#### 3. Verify Connection in App Logs
- [ ] Click on the successful deployment
- [ ] Click **View Logs** or **Deployment Logs**
- [ ] Look for these success indicators:

```
🔧 Database module loading...
📦 Creating database singleton...
Database connected: True              ← This is the key line
🔄 Importing migration manager...
   ✅ Migration manager imported
🚀 Running pending migrations...
✅ Database schema initialized successfully
```

**If you see "Database connected: False":**
- DATABASE_URL is still blank or incorrect
- Go back to Step 1 and verify the variable is set

#### 4. Verify Tables Created in Database
- [ ] Go to **Postgres** plugin
- [ ] Click **Data** tab (or browse tables)
- [ ] You should see these tables:
  - [ ] `racer_profiles`
  - [ ] `vehicles`
  - [ ] `car_configs`
  - [ ] `sessions`
  - [ ] `setup_changes`
  - [ ] `master_library`
  - [ ] `track_logs`
  - [ ] `theory_documents`
  - [ ] `run_logs`
  - [ ] `x_factor_audits`
  - [ ] `race_results`
  - [ ] (and others)

**If no tables appear:**
- Check app logs for schema initialization errors
- Verify DATABASE_URL is set correctly
- Check that app successfully deployed after setting DATABASE_URL

#### 5. Test App Connection
- [ ] Go to your AGR-APEX-ADVISOR app URL
- [ ] App should load with 5-tab dashboard
- [ ] Create a test racer profile or event
- [ ] Refresh the page - data should persist

**If app shows CSV fallback mode:**
- This means DATABASE_URL is still not connected
- Go back to Step 1 and verify

#### 6. Connection Arrow Should Be Green
- [ ] In Railway project view, look at the connection diagram
- [ ] Arrow from **AGR-APEX-ADVISOR** → **Postgres** should be **green**
- [ ] (Previously it was grey because DATABASE_URL was missing)

## Troubleshooting Guide

### Problem: DATABASE_URL Still Blank
**Solution:**
1. Copy the connection string from **Postgres → Connect** tab
2. Paste it into **Postgres → Variables → DATABASE_URL**
3. Make sure there are no extra spaces or line breaks
4. Click **Save**
5. Wait 30 seconds for auto-redeploy

### Problem: App Still Says "Database not connected"
**Check:**
1. Is DATABASE_URL in Postgres Variables (not just app environment)?
2. Has the app redeployed? (Check Deployments tab)
3. Do the logs show the initialization?

**If logs don't show initialization:**
- Manually redeploy the app
- Or push a new commit to GitHub (triggers auto-deploy)

### Problem: Schema Initialization Takes Too Long
**This is normal:**
- First deployment with new DATABASE_URL may take longer
- Schema.sql has 300+ SQL statements to execute
- pgvector extension gracefully fails if not available (this is fine)
- All "already exists" warnings are expected and safe to ignore

### Problem: Connection String Has Special Characters
**Solution:**
If your password contains special characters (like `@`, `%`, `#`), you may need URL encoding:
- `@` → `%40`
- `%` → `%25`
- `#` → `%23`
- Example: `postgresql://postgres:pass%40word@host:port/db`

However, Railway usually handles this automatically - try the raw string first.

## After Connection is Verified

### Option 1: Seed Test Data (Recommended)
```bash
python Execution/seed_test_profiles.py
```

This creates test racer profiles:
- Default Racer
- Max Verstappen
- Lewis Hamilton
- Lando Norris

With test vehicles and sponsors for each.

### Option 2: Just Use the App
- App is ready to use immediately after connection
- Create profiles manually through the UI
- Data will persist to PostgreSQL

## What's Happening Behind the Scenes

When the app starts with DATABASE_URL set:

1. `database.py` imports and loads environment variables
2. Creates connection pool to PostgreSQL
3. Sets `db.is_connected = True`
4. Calls migration manager with verbose logging
5. Migration manager checks if `racer_profiles` table exists
6. If not, calls `db.init_schema()` which:
   - Reads `schema.sql` file
   - Splits it into individual SQL statements
   - Executes each statement
   - Gracefully handles "already exists" errors
   - Catches pgvector errors and continues
   - Creates all 10+ tables and indexes
7. All initialization happens on first startup (30-60 seconds)
8. Subsequent app restarts connect to existing tables instantly

## Success Indicators

You'll know everything is working when:
1. ✅ App logs show "Database connected: True"
2. ✅ Schema initialization messages appear in logs
3. ✅ Tables exist in Postgres → Data tab
4. ✅ Connection arrow is green in Railway project view
5. ✅ App loads the full 5-tab dashboard
6. ✅ Data persists when you refresh the page
7. ✅ No "CSV fallback mode" messages in logs

## References

- **Schema File**: `Execution/database/schema.sql`
- **Connection Code**: `Execution/database/database.py`
- **Migration Code**: `Execution/database/migrations/migration_manager.py`
- **Setup Guide**: `RAILWAY_DATABASE_URL_SETUP.md` (in this folder)

## Next Step

Please verify each checklist item above and let me know:
1. What is the current value of `DATABASE_URL` in Postgres Variables?
2. Has the app redeployed? (Check Deployments tab for timestamp)
3. What do the app logs show? (Especially the "Database connected: True/False" line)
4. Do the tables exist in Postgres → Data tab?
