# Fresh PostgreSQL Database Setup for Railway

## Step 1: Delete the Stuck Database

### In Railway Dashboard:
1. Go to your **APEX-AGR-SYSTEM** project
2. Click on the **Postgres** plugin (the stuck one)
3. Click the **Settings** tab
4. Scroll to the bottom and look for **"Remove"** or **"Delete"** button
5. Confirm the deletion (it will ask for confirmation)
6. Wait for it to be removed (30-60 seconds)

### Verify Deletion:
- The Postgres plugin should disappear from your project view
- The connection arrow from AGR-APEX-ADVISOR to Postgres should disappear
- The arrow should turn grey/red temporarily

## Step 2: Create a New PostgreSQL Database

### In Railway Dashboard:
1. Go to **APEX-AGR-SYSTEM** project
2. Click **+ Add** button (top right or in project view)
3. Select **Database** from the menu
4. Choose **PostgreSQL** from the options
5. Click **Deploy** (it will take 2-3 minutes to start)

### Wait for Startup:
- Status should go from "Building" → "Deploying" → "Running" (green)
- You should see connection arrow appear between AGR-APEX-ADVISOR and Postgres

## Step 3: Get the Connection String

### Method A: From Connect Tab (Once Available)
1. Click the new **Postgres** plugin
2. Go to **Connect** tab
3. Look for **"Postgres CLI"** section
4. Copy the connection string that looks like:
   ```
   postgresql://postgres:PASSWORD@host:port/railway
   ```

### Method B: From Variables Tab
1. Click the new **Postgres** plugin
2. Go to **Variables** tab
3. Look for an auto-generated `DATABASE_URL` variable
4. If it's empty, paste your connection string from Method A

## Step 4: Set DATABASE_URL Environment Variable

### Important: Set It in Postgres Variables
1. Click **Postgres** plugin
2. Go to **Variables** tab
3. Create or update `DATABASE_URL` variable
4. Paste the full connection string
5. Click **Save**

### Do NOT set it in:
- ❌ AGR-APEX-ADVISOR app variables (Railroad will handle this automatically)
- ✅ Only in Postgres plugin variables

## Step 5: Wait for Auto-Redeploy

### What Happens Automatically:
1. When you set DATABASE_URL in Postgres variables, Railway shares it with connected apps
2. AGR-APEX-ADVISOR app will redeploy automatically
3. You should see new deployment in app's Deployments tab

### If It Doesn't Redeploy:
1. Go to AGR-APEX-ADVISOR app
2. Click the **three dots** (**...**) menu
3. Select **Redeploy**
4. Wait 60 seconds for deployment to complete

## Step 6: Verify Connection in App Logs

### Check App Logs:
1. Go to **AGR-APEX-ADVISOR** app
2. Click **Deployments** tab
3. Find the most recent deployment (should have timestamp ~1 minute ago)
4. Click **View Logs**
5. Look for these success messages:

```
🔧 Database module loading...
📦 Creating database singleton...
Database connected: True              ← KEY LINE
🔄 Importing migration manager...
   ✅ Migration manager imported
🚀 Running pending migrations...
📊 Database tables not found. Initializing schema...
✅ Database schema initialized successfully

SUCCESS: Database schema initialized successfully
  Executed 150+ SQL statements
✅ All migrations applied successfully
```

**If you see "Database connected: False":**
- Go back to Step 4 and verify DATABASE_URL is set
- Make sure there are no extra spaces or line breaks
- Try redeploying the app manually

## Step 7: Verify Tables in Database

### Check Created Tables:
1. Click **Postgres** plugin
2. Go to **Data** tab
3. You should see tables:
   - `racer_profiles`
   - `vehicles`
   - `car_configs`
   - `sessions`
   - `setup_changes`
   - `master_library`
   - `track_logs`
   - `theory_documents`
   - `run_logs`
   - (and others)

**If no tables appear:**
- Check app logs for errors (Step 6)
- Verify DATABASE_URL is still set in Postgres Variables
- Check that app deployment completed successfully

## Step 8: Test the Application

### Open Your App:
1. Go to your **AGR-APEX-ADVISOR** app
2. Click **View Deployment** or go to app URL
3. Should see the 5-tab Streamlit dashboard load
4. Create a test racer profile
5. Refresh the page - profile should still be there (data persisted to PostgreSQL)

## Success Indicators

✅ All of these should be true:
- [ ] Postgres plugin shows "Running" (green status)
- [ ] Connection arrow is green between app and database
- [ ] App logs show "Database connected: True"
- [ ] App logs show "✅ Database schema initialized successfully"
- [ ] Tables exist in Postgres → Data tab
- [ ] App loads 5-tab dashboard
- [ ] Data persists when you refresh the page

## Troubleshooting Fresh Setup

### Issue: Postgres Stuck in "Deploying" State
- This shouldn't happen with fresh database, but if it does:
  - Delete and try again
  - Or wait 5 minutes before trying again

### Issue: App Logs Show "Database not connected"
- Verify DATABASE_URL is in **Postgres Variables** (not app variables)
- Make sure the connection string is complete and has no typos
- Manually redeploy the app

### Issue: Connection String Won't Copy from Connect Tab
- Refresh the Railway page
- Try again
- Or manually construct it: `postgresql://postgres:PASSWORD@host:port/railway`

### Issue: Schema Initialization Hangs
- Check app logs for the current status
- If logs show nothing for 2 minutes, the app may have crashed
- Manually redeploy and check logs again

## Timeline

Typical fresh setup timeline:
- Delete old database: 30 seconds
- Create new database: 2-3 minutes
- Get connection string: 1 minute
- Set DATABASE_URL: 1 minute
- App auto-redeployment: 1-2 minutes
- Schema initialization: 30-60 seconds
- **Total: ~7-10 minutes**

## Next Steps After Success

### Option 1: Seed Test Data
```bash
python Execution/seed_test_profiles.py
```
This creates test racer profiles (Max Verstappen, Lewis Hamilton, etc.)

### Option 2: Just Start Using
- App is immediately ready to use
- Create profiles manually through the UI
- Data persists to PostgreSQL

## Reference Files

- **Database Schema**: `Execution/database/schema.sql`
- **Connection Code**: `Execution/database/database.py`
- **Migration Code**: `Execution/database/migrations/migration_manager.py`

## Key Points to Remember

1. **Set DATABASE_URL in Postgres Variables**, not app variables
2. **Railway auto-redeploys** the app when you set environment variables
3. **First deployment takes longer** (60-90 seconds) while schema initializes
4. **pgvector is optional** - it gracefully fails if not available
5. **All "already exists" warnings are safe** - the schema has IF NOT EXISTS clauses
