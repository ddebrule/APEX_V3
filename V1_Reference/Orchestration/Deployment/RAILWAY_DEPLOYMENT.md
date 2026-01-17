# Railway Deployment Guide for APEX-AGR-SYSTEM

This guide walks you through deploying your APEX-AGR-SYSTEM to Railway with PostgreSQL database support.

## Prerequisites

- Railway account connected to GitHub (✅ You have this)
- GitHub repository: `ddebrule/AGR-APEX-SYSTEM` (✅ You have this)
- API keys for Anthropic and OpenAI

## Step 1: Add PostgreSQL Database to Railway

1. **Log into Railway**: Go to [railway.app](https://railway.app)

2. **Find Your Project**: Navigate to your APEX-AGR-SYSTEM project

3. **Add PostgreSQL**:
   - Click **"+ New"** button
   - Select **"Database"**
   - Choose **"PostgreSQL"**
   - Railway will automatically create a PostgreSQL database

4. **Note**: Railway automatically creates a `DATABASE_URL` environment variable and makes it available to your app. No manual configuration needed!

## Step 2: Set Environment Variables

In your Railway project dashboard:

1. Click on your **web service** (not the database)
2. Go to **"Variables"** tab
3. Add these environment variables:

```
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
```

**Note**: `DATABASE_URL` is automatically set by Railway when you add PostgreSQL.

Optional (for email features):
```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Step 3: Deploy from GitHub

Railway should automatically deploy when you push to GitHub. If not:

1. In Railway dashboard, click your service
2. Go to **"Settings"** tab
3. Under **"Source"**, ensure it's connected to your GitHub repo
4. Under **"Deploy"**, click **"Deploy Now"**

## Step 4: Initialize Database Schema

After your first deployment, you need to initialize the database:

### Option A: Run Migration Script (Recommended)

1. In Railway dashboard, click your web service
2. Go to **"Settings"** tab
3. Scroll to **"One-off Commands"** or use the Railway CLI

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the migration script
railway run python Execution/migrate_to_database.py
```

This will:
- Create all database tables
- Import your existing CSV data
- Set up the default user profile

### Option B: Manual Database Initialization

If you can't use the CLI:

1. In Railway dashboard, go to your **PostgreSQL service**
2. Click **"Data"** tab
3. Click **"Query"** button
4. Copy and paste the contents of `Execution/schema.sql`
5. Click **"Execute"**

Then manually add your test data or wait for the app to create it automatically.

## Step 5: Verify Deployment

1. **Open Your App**: Railway provides a URL (e.g., `your-app.up.railway.app`)

2. **Check Connection**:
   - Look for the message: "✅ Database connection pool established" in Railway logs
   - If you see "ℹ️  No DATABASE_URL found - using CSV mode", the database isn't connected properly

3. **Test Functionality**:
   - Create a test vehicle in the Racer Profile sidebar
   - Add a setup to the Master Library (Tab 5)
   - Verify it persists after refreshing the page

## Step 6: Migration from CSV to Database

Once you've confirmed the database is working on Railway:

### Local Testing First

1. **Set DATABASE_URL locally** (get this from Railway dashboard > PostgreSQL > Connect):
   ```bash
   # Add to your .env file
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

2. **Run migration**:
   ```bash
   cd Execution
   python migrate_to_database.py
   ```

3. **Test locally**:
   ```bash
   streamlit run dashboard.py
   ```

4. **Verify** all your existing data appears correctly

### Then Deploy to Railway

1. **Commit changes** (without CSV data):
   ```bash
   git add .
   git commit -m "feat: migrate to PostgreSQL database for multi-user support"
   git push origin main
   ```

2. **Railway auto-deploys** from GitHub

3. **Run migration on Railway** (using Railway CLI as shown in Step 4)

## Troubleshooting

### "Database not connected"

**Check**:
- PostgreSQL service is running in Railway
- `DATABASE_URL` environment variable exists (Railway dashboard > Service > Variables)
- Both services are in the same Railway project

**Fix**:
- Restart your web service: Railway dashboard > Service > Settings > Restart

### "Module not found: psycopg2"

**Check**: `requirements.txt` includes `psycopg2-binary`

**Fix**:
```bash
# Add to requirements.txt if missing
echo "psycopg2-binary" >> requirements.txt
git add requirements.txt
git commit -m "fix: add psycopg2-binary dependency"
git push
```

### Data Not Persisting

**Check**:
- Logs show database connected (not CSV fallback mode)
- Migration script ran successfully

**Fix**:
- Re-run migration script
- Check PostgreSQL service logs for errors

### Railway Build Fails

**Check**:
- All files committed to GitHub
- `requirements.txt` is complete
- `Procfile` exists with correct command

**Fix**:
```bash
# Verify Procfile
cat Procfile
# Should show: web: streamlit run execution/dashboard.py --server.port $PORT --server.address 0.0.0.0
```

## Architecture Overview

```
┌─────────────────────────────────────┐
│  Your GitHub Repository             │
│  (ddebrule/AGR-APEX-SYSTEM)        │
└──────────────┬──────────────────────┘
               │ Auto-deploy on push
               ↓
┌─────────────────────────────────────┐
│  Railway Project                    │
│  ┌─────────────────────────────┐   │
│  │  Web Service                │   │
│  │  - Streamlit Dashboard      │   │
│  │  - Runs on Railway servers  │   │
│  │  - Public URL assigned      │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│             │ DATABASE_URL          │
│             ↓                       │
│  ┌─────────────────────────────┐   │
│  │  PostgreSQL Database        │   │
│  │  - User profiles            │   │
│  │  - Vehicle configs          │   │
│  │  - Master library           │   │
│  │  - Persistent storage       │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Cost Expectations

**Railway Free Tier**:
- $5 of usage per month (usually sufficient for personal projects)
- Includes PostgreSQL database
- Sleeps after inactivity (wakes up when accessed)

**If you exceed free tier**:
- Pay-as-you-go pricing
- Typical personal usage: $5-15/month
- Monitor usage in Railway dashboard

## Next Steps After Deployment

1. **Test from mobile device** (phone/tablet at the track)
2. **Verify data persistence** across sessions and restarts
3. **Add more vehicles** to your fleet
4. **Import pro setups** to the Master Library
5. **Consider adding authentication** for true multi-user support (future phase)

## Support

If you encounter issues:

1. **Check Railway logs**: Dashboard > Service > Deployments > View Logs
2. **Check database logs**: Dashboard > PostgreSQL > Logs
3. **Review this guide** for missed steps
4. **Check GitHub repo**: Ensure latest code is pushed

## Files Added for Database Support

- `Execution/database.py` - Database connection manager
- `Execution/config_service.py` - Car configs database service
- `Execution/library_service.py` - Master library database service (updated)
- `Execution/schema.sql` - PostgreSQL database schema
- `Execution/migrate_to_database.py` - CSV to database migration script
- `RAILWAY_DEPLOYMENT.md` - This guide

All services automatically fall back to CSV mode if database isn't available, so you can still develop locally without PostgreSQL.
