# Railway DATABASE_URL Setup Guide

## Problem
The `DATABASE_URL` environment variable in your Postgres plugin is blank, which prevents the AGR-APEX-ADVISOR app from connecting to the database.

## Solution: Set DATABASE_URL in Railway Postgres Variables

### Step 1: Access Postgres Plugin Variables
1. Open [Railway Dashboard](https://railway.app/dashboard)
2. Go to your project: **APEX-AGR-SYSTEM**
3. Click on the **Postgres** plugin (the database icon)
4. Go to the **Variables** tab (not Settings)
5. You should see the `DATABASE_URL` variable is blank or missing

### Step 2: Get the Connection String
Railway provides the connection credentials in one of two places:

**Option A: From Postgres Plugin Connect Tab** (Recommended)
1. Click the **Postgres** plugin
2. Go to the **Connect** tab
3. Look for the "Postgres CLI" section
4. Copy the connection string that looks like:
   ```
   postgresql://postgres:PASSWORD@switchyard.proxy.rlwy.net:PORT/railway
   ```

**Option B: From Environment Tab**
1. Click the **Postgres** plugin
2. Look for an "Environment" or "Variables" section
3. You should see `DATABASE_URL` listed (may be blank or partially filled)

### Step 3: Set the DATABASE_URL Variable
1. In the **Postgres Variables** tab, click the `DATABASE_URL` field
2. Clear any existing value
3. Paste the full connection string from Step 2
   - Format: `postgresql://postgres:PASSWORD@host:port/railway`
   - Example: `postgresql://postgres:LERoLoHcNmsAbVnupvekzDHTPFbXKVFF@switchyard.proxy.rlwy.net:48577/railway`
4. Click **Save** or press Enter

### Step 4: Verify Connection
1. Go to the **AGR-APEX-ADVISOR** app plugin
2. Click **Deployments** tab
3. You should see a new deployment starting (Railway auto-redeploys when environment variables change)
4. Wait 30-60 seconds for deployment to complete
5. Once deployed, click **View Logs**
6. Look for these success messages:
   ```
   🔧 Database module loading...
   📦 Creating database singleton...
   Database connected: True
   🚀 Running pending migrations...
   ✅ Database schema initialized successfully
   ```

### Step 5: Verify Tables Created
1. Go back to the **Postgres** plugin
2. Click on **Data** or **Database** tab
3. You should now see these tables:
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

### Step 6: Test the App
1. Open your app URL
2. You should see the APEX dashboard load
3. The app should now persist data to the database

## Troubleshooting

### Issue: DATABASE_URL Still Blank After Save
- **Solution**: Refresh the Railway page and check the Variables tab again
- If still blank, try copying the connection string again from the Connect tab

### Issue: App Still Says "Database not connected"
- **Check**:
  1. Is the environment variable showing the correct DATABASE_URL in App Variables?
  2. Has the app redeployed? (Check Deployments tab)
  3. Are there any connection error messages in the logs?

### Issue: "already exists" Warnings in Logs
- **This is normal** - the schema has `IF NOT EXISTS` clauses, so it's safe to re-run
- Tables are being created correctly

### Issue: No New Deployment After Setting DATABASE_URL
- **Solution**:
  1. Go to AGR-APEX-ADVISOR app
  2. Click **Redeploy** button manually
  3. Or push a new commit to GitHub (auto-triggers deploy)

## Next Steps

After DATABASE_URL is set and database is connected:

1. **Seed test data** (optional):
   ```bash
   python Execution/seed_test_profiles.py
   ```

2. **Monitor logs** for any other errors:
   - Check app logs regularly during development
   - Database initialization logs show at app startup

3. **Access the app**:
   - Open the Railway app URL
   - Should load the 5-tab Streamlit dashboard
   - Data now persists to PostgreSQL

## Reference

- **Database Connection Format**: `postgresql://user:password@host:port/database`
- **Railway Environment**: Variables are accessible to all plugins in the project
- **Auto-deploy**: Railway redeploys automatically when environment variables change
- **Schema**: Defined in `Execution/database/schema.sql`
- **Auto-init**: Database schema initializes automatically on first app startup

## Questions?

If `DATABASE_URL` is still not working:
1. Double-check the password has no special characters that need URL encoding
2. Verify the host, port, and database name are correct
3. Check that Postgres plugin is "Running" (green status)
4. Review `Execution/database/database.py` for connection pool settings
