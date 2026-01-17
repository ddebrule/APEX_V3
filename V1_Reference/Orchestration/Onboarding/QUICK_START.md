# APEX-AGR-SYSTEM Quick Start Guide

## For You (No Coding Experience)

This guide gives you the exact steps to deploy your system to the web.

## Step 1: Commit Changes to GitHub (Do This First!)

Open a terminal in your project folder and run:

```bash
git add .
git commit -m "feat: add PostgreSQL database support for multi-user deployment"
git push origin main
```

**This pushes all the new database code to GitHub.**

## Step 2: Set Up Railway Database

1. Go to https://railway.app and log in
2. Find your APEX-AGR-SYSTEM project
3. Click **"+ New"**
4. Select **"Database"**
5. Choose **"PostgreSQL"**
6. Wait for it to finish creating (about 30 seconds)

**That's it! Railway automatically connects it to your app.**

## Step 3: Set Environment Variables

1. In Railway, click your **web service** (not the database)
2. Click **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these two variables:

```
ANTHROPIC_API_KEY = your_anthropic_key_here
OPENAI_API_KEY = your_openai_key_here
```

5. Click **"Deploy"** (Railway will restart your app)

## Step 4: Initialize the Database

You need to run the migration script once to set up the database tables and import your existing data.

### Option A: Use Railway CLI (Recommended)

1. **Install Railway CLI**:
   - Windows: Download from https://docs.railway.app/develop/cli
   - Mac: `brew install railway`

2. **Login and link**:
   ```bash
   railway login
   railway link
   ```
   (Follow prompts to select your project)

3. **Run migration**:
   ```bash
   railway run python Execution/migrate_to_database.py
   ```

You should see:
```
✅ Database connected successfully
🔧 Initializing database schema...
✅ Schema initialized
📦 Migrating car configs...
✅ Migrated: NB48 2.2 Buggy
✅ Migrated: NT48 2.2 Truggy
...
✅ Migration completed!
```

### Option B: Can't Install CLI?

Ask someone to help you run the migration, or:
1. Wait for the app to deploy
2. Open it and test - it will create tables automatically on first use
3. Your existing CSV data won't import automatically, but you can recreate it manually

## Step 5: Test Your App

1. **Find your app URL**:
   - Railway dashboard → Your service → "Settings" → Look for "Domains"
   - It looks like: `your-app.up.railway.app`

2. **Open it on your computer** and test:
   - Can you see the dashboard?
   - Go to sidebar, add a test vehicle
   - Go to Tab 5, check if your library appears
   - Refresh the page - does the vehicle still exist?

3. **Open it on your phone**:
   - Same URL
   - Test voice input
   - Test all tabs work

## Step 6: Verify Data Persists

This is the most important test:

1. Add a new vehicle setup
2. **Restart your Railway service**: Dashboard → Service → Settings → **"Restart"**
3. Wait for it to come back online (about 30 seconds)
4. Open the app again
5. **Your data should still be there!**

If it is → ✅ **SUCCESS! Database is working!**

If not → Check Railway logs for errors (see Troubleshooting below)

## That's It!

Your system is now deployed and accessible from anywhere. You can:
- Access it from your phone at the track
- Access it from any device with internet
- Data persists forever (no more lost setups!)

---

## Troubleshooting

### "Database not connected" in logs

**Fix**:
1. Make sure PostgreSQL service is running (Railway dashboard)
2. Make sure both services are in the same Railway project
3. Try restarting the web service

### App won't load / Shows error

**Check Railway logs**:
1. Railway dashboard → Your service → "Deployments"
2. Click latest deployment
3. Click "View Logs"
4. Look for red error messages

**Common issues**:
- Missing environment variables (check you added both API keys)
- Build failed (check GitHub push succeeded)
- Database connection failed (check PostgreSQL service exists)

### Data disappeared after restart

This means the database isn't connected properly. Check:
1. Railway logs show "✅ Database connection pool established"
2. Not "ℹ️ No DATABASE_URL found - using CSV mode"

If it says CSV mode:
- PostgreSQL service might not be linked
- Restart both services
- Check they're in same Railway project

### Migration script failed

Error messages will tell you what's wrong. Common issues:
- Database doesn't exist yet (add PostgreSQL service first)
- Tables already exist (safe to ignore, or drop tables and re-run)
- Connection timeout (check internet connection)

### Railway asking for payment

**Railway free tier**: $5/month credit, usually enough for personal projects.

If you're exceeding it:
- Check usage in Railway dashboard
- You might have multiple deployments running (delete old ones)
- Consider upgrading to Hobby plan ($5/month) if needed

---

## Important Files (For Future Reference)

- `RAILWAY_DEPLOYMENT.md` - Detailed deployment guide
- `DATABASE_MIGRATION_SUMMARY.md` - What changed and why
- `CLAUDE.md` - Full system documentation
- `Execution/schema.sql` - Database structure
- `Execution/migrate_to_database.py` - Migration script

---

## Next Steps (After Successful Deployment)

1. **Use it at the track!** That's what it's for.
2. **Collect feedback**: Note what works and what doesn't.
3. **Add more setups**: Build your Master Library.
4. **Consider authentication**: If you want true multi-user (talk to a developer).

---

## Getting Help

If something doesn't work:

1. Check Railway logs (see Troubleshooting above)
2. Review [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for detailed steps
3. Check Railway documentation: https://docs.railway.app/
4. Ask in Railway Discord: https://discord.gg/railway

---

## Commands Cheat Sheet

```bash
# Push changes to GitHub
git add .
git commit -m "your message"
git push origin main

# Railway CLI commands
railway login              # Login to Railway
railway link               # Link to your project
railway run COMMAND        # Run a command on Railway
railway logs               # View logs

# Run migration locally (for testing)
export DATABASE_URL="your_database_url_from_railway"
python Execution/migrate_to_database.py

# Test app locally
streamlit run Execution/dashboard.py
```

---

**You're all set! 🏎️ Go racing!**
