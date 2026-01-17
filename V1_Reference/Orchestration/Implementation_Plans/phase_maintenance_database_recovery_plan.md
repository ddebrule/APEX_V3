# Database Recovery Plan

## Goal Description
The Railway database was deleted, breaking the application's persistence layer. This plan outlines the steps to provision a new database, configure the application to connect to it, and verify the restoration of the schema.

> [!WARNING]
> **Data Loss**: Deleting the database permanently erases all stored data (Racer Profiles, Sessions, etc.). This process will establish a fresh, empty database.

## User Review Required
- **Railway Credentials**: You must have access to the Railway dashboard to obtain the new connection string.
- **Local Environment**: If running locally, you must update your `.env` file manually.

## Recovery Steps

### 1. Provision New Database (Railway)
If you haven't already:
1. Open the Railway project.
2. Click **New** → **Database** → **Postgres**.
3. Wait for the service to deploy.

### 2. Configure Credentials
#### On Railway (Production)
1. Click the new **Postgres** service.
2. Go to the **Connect** tab.
3. Copy the **Postgres Connection URL** (starts with `postgresql://`).
4. Go to the **AGR-APEX-ADVISOR** (App) service.
5. Go to the **Variables** tab.
6. Update (or create) `DATABASE_URL` with the new connection string.
7. **Redeploy** the app (usually automatic after saving variable).

#### On Local Machine (Development)
1. Open `.env` in the project root.
2. Update `DATABASE_URL` with the new value.
3. Save the file.

### 3. Verification & Schema Initialization
The application is designed to auto-heal when connected to a fresh database.
- **Auto-Discovery**: `database.py` detects the valid `DATABASE_URL`.
- **Schema Init**: On startup, `database.py` runs `init_schema()`, executing `Execution/database/schema.sql` to recreate tables.
- **Status Check**: 
    - Watch the Application Logs in Railway.
    - Look for: `SUCCESS: Database schema initialized successfully`.

## Verification Plan

### Automated Verification
- **App Logs**: Check logs for "Database connected: True".
- **UI Feedback**: Open the live app; the connection indicator (if present) should show connected.

### Manual Verification
1. **Access App**: Navigate to the deployed URL.
2. **Create Data**: Create a "Default Racer" (or any racer) to test write persistence.
3. **Reload**: Refresh the page to ensure data persists.
