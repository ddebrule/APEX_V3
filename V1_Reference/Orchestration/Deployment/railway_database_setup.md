# Railway PostgreSQL Database Setup Guide

Complete step-by-step guide to set up Railway PostgreSQL for A.P.E.X. with schema_v2.

## Prerequisites

- Railway account (free tier available at https://railway.app)
- GitHub repository linked to Railway
- `psql` command-line tool (PostgreSQL client) OR use Railway web interface
- Environment variables configured

## Step 1: Create Railway Project and PostgreSQL Add-on

1. **Login to Railway**: https://railway.app
2. **Create New Project**: Click "+ New Project"
3. **Add PostgreSQL Database**:
   - Select "Databases" → "PostgreSQL"
   - Wait for deployment (usually 1-2 minutes)
4. **Copy Connection String**:
   - Click on the PostgreSQL service
   - Go to "Variables" tab
   - Copy `DATABASE_URL` value (should look like `postgresql://user:pass@host:port/railway`)

## Step 2: Set Environment Variables

### Option A: In Railway Dashboard
1. Go to your A.P.E.X. Streamlit service (if deployed)
2. Click "Variables"
3. Add your secrets:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/railway
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   ```

### Option B: Local .env file (for testing)
1. Create/edit `.env` file in project root:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/railway
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   ```
2. DO NOT commit `.env` to git (already in `.gitignore`)

## Step 3: Initialize Database Schema

### Option A: Using Python Script (Recommended)

1. **Install psycopg2 if not already installed**:
   ```bash
   pip install psycopg2-binary
   ```

2. **Set DATABASE_URL in your shell**:

   **Windows (PowerShell)**:
   ```powershell
   $env:DATABASE_URL="postgresql://user:pass@host:port/railway"
   python Execution/initialize_database.py
   ```

   **Windows (Command Prompt)**:
   ```cmd
   set DATABASE_URL=postgresql://user:pass@host:port/railway
   python Execution/initialize_database.py
   ```

   **Mac/Linux**:
   ```bash
   export DATABASE_URL="postgresql://user:pass@host:port/railway"
   python Execution/initialize_database.py
   ```

3. **Expected output**:
   ```
   SUCCESS: Database schema initialized successfully
   Created: racer_profiles table
   Created: vehicles table
   Created: sessions table
   ... (more tables)
   ```

### Option B: Using psql CLI

1. **Connect to Railway PostgreSQL**:
   ```bash
   psql postgresql://user:pass@host:port/railway
   ```

2. **Run schema file**:
   ```bash
   psql postgresql://user:pass@host:port/railway < Execution/schema_v2.sql
   ```

### Option C: Using Railway Web Terminal

1. Go to Railway PostgreSQL service
2. Click "Shell" tab
3. Paste contents of `Execution/schema_v2.sql` and execute

## Step 4: Populate Test Data

Once schema is initialized:

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:port/railway"  # Mac/Linux
# or
set DATABASE_URL=postgresql://user:pass@host:port/railway       # Windows

# Run seed script
python Execution/seed_test_profiles.py
```

**Expected output**:
```
Created profile 'Default Racer' (ID: 1)
  Added vehicle: Tekno NB48 2.2 (transponder: TR-001)
  Added vehicle: Tekno NT48 2.2 (transponder: TR-002)
Created profile 'Max Verstappen' (ID: 2)
  Added vehicle: Associated RC8B4 (transponder: MV-001)
  Added vehicle: Tekno NB48 2.2 (transponder: MV-002)
... (more profiles)
Seed complete!
```

## Step 5: Deploy to Railway

### Option A: Automatic Deployment (GitHub Integration)

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure Railway database setup"
   git push origin main
   ```

2. **Railway auto-deploys** when it detects changes

3. **Environment variables already set** from Step 2

### Option B: Manual Deployment

1. **Create Railway service** from your GitHub repo
2. **Set environment variables** (DATABASE_URL, API keys)
3. **Railway runs `streamlit run Execution/dashboard.py`** automatically

## Step 6: Verify Database Connection

### In Streamlit App

1. Open your app: https://your-railway-app.up.railway.app (or local: http://localhost:8501)
2. App should display message: **"SUCCESS: Database connection pool established"** in terminal
3. Sidebar should show "Default Racer" profile with vehicles

### Via Command Line

```bash
python -c "from Execution.database.database import db; print(f'Connected: {db.is_connected}')"
```

Should output: `Connected: True`

## Step 7: Create New Profiles

1. Open Streamlit app
2. Expand "📝 Edit Profile" in sidebar
3. Change Name to your racer name
4. Add sponsors using data editor (click + button)
5. Add vehicles with:
   - Brand (Tekno, Associated, Mugen, Xray, etc.)
   - Model (NB48 2.2, RC8B4, MBX8, etc.)
   - Nickname (Race Buggy, Main, Backup, etc.)
   - Transponder (your transponder number)
6. Click **"💾 Save Profile"**
7. Refresh page → **data persists!**

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` is set correctly
- Verify Railway PostgreSQL is running
- Check IP allowlist (Railway allows all by default)

### "Column does not exist" error
- Schema wasn't initialized properly
- Run `Execution/initialize_database.py` again
- Or manually execute `Execution/schema_v2.sql`

### "UNIQUE constraint violation"
- Profile/vehicle with that brand+model already exists
- Edit the existing one instead of creating new

### Seed script fails
- Database not connected: set `DATABASE_URL`
- Schema not initialized: run step 3 first
- Check psycopg2-binary is installed: `pip install psycopg2-binary`

## Schema Overview (schema_v2.sql)

```
racer_profiles
├── id (SERIAL PRIMARY KEY)
├── name VARCHAR
├── email VARCHAR
├── facebook VARCHAR
├── instagram VARCHAR
├── sponsors TEXT[] (array of sponsor names)
└── vehicles (FK to vehicles table)

vehicles
├── id (SERIAL PRIMARY KEY)
├── profile_id (FK to racer_profiles)
├── brand VARCHAR (Tekno, Associated, etc.)
├── model VARCHAR (NB48 2.2, RC8B4, etc.)
├── nickname VARCHAR (optional, e.g., "Race Buggy")
├── transponder VARCHAR (per-car transponder number)
└── baseline_setup JSONB (future use)
```

## Next Steps

- **Profile Switching** (Phase 4.2): Add dropdown to switch between profiles
- **Multi-Driver Sync** (Phase 4.2): Share profiles across team members
- **Cloud Storage** (Phase 5): Store baseline setups and race results

## Support

- Railway docs: https://docs.railway.app
- PostgreSQL docs: https://www.postgresql.org/docs
- A.P.E.X. issues: https://github.com/ddebrule/AGR-APEX-SYSTEM/issues
