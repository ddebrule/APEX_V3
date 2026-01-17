# ⚡ QUICK START GUIDE - A.P.E.X. V3

## Phase 1: Database Deployment (5 minutes)

### Step 1: Deploy Schema to Supabase
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Create a **New Query**
4. Copy the entire contents of `Directives/Master_Schema.sql`
5. Paste into the SQL Editor
6. Click **Run** (or Cmd+Enter)

**Expected Result:**
```
✓ CREATE EXTENSION
✓ CREATE TYPE (3x)
✓ CREATE TABLE (6x)
✓ CREATE INDEX (9x)
✓ CREATE TRIGGER (3x)
✓ ALTER TABLE (6x)
```

---

## Phase 2: Frontend Setup (10 minutes)

### Step 2: Navigate to Frontend Directory
```bash
cd "Execution/frontend"
```

### Step 3: Copy Environment Template
```bash
cp .env.local.example .env.local
```

### Step 4: Add Supabase Credentials
Edit `.env.local` and paste your credentials from the main `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://wlcpfzrcsujbiicqsrjt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Install Dependencies
```bash
npm install
```

### Step 6: Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
> apex-mission-control@3.0.0 dev
  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.3s
```

---

## Phase 3: Seed Test Data (Optional - 5 minutes)

### Create Test Racer Profile

1. Go to Supabase SQL Editor
2. Create new query:
```sql
INSERT INTO racer_profiles (name, email, is_default, sponsors)
VALUES
  ('Test Racer', 'racer@apex.local', true, ARRAY['Sponsor A']),
  ('Dev Racer 2', 'dev2@apex.local', false, ARRAY['Sponsor B', 'Sponsor C']);
```

3. Execute, then verify:
```sql
SELECT id, name, email FROM racer_profiles;
```

### Create Test Vehicles

```sql
INSERT INTO vehicles (profile_id, brand, model, transponder, baseline_setup)
SELECT
  id,
  'Tekno',
  'EB48 2.2',
  'TX7784',
  '{"suspension": "stock", "tires": "green", "gear_ratio": 3.73}'::jsonb
FROM racer_profiles
WHERE email = 'racer@apex.local';
```

---

## Phase 4: Test Tab 1 Dashboard

### Open http://localhost:3000

You should see:

1. **Top Navigation**
   - A.P.E.X. V3 branding
   - Status indicators (Battery/Signal/Sync)

2. **Event Identity Section**
   - Racer dropdown (populated from DB)
   - Vehicle selector (loads based on racer)
   - Transponder display

3. **Track Intelligence Section**
   - Track fields (ready for input)
   - Traction and surface status

4. **Institutional Memory Section**
   - Historical session data (empty on first run)

5. **Baseline Initialization**
   - Event name input
   - Track name input
   - Session type selector
   - "INIT RACING SESSION" button

### Try It:
1. Select a racer from dropdown
2. Select a vehicle
3. Enter event name: "Test Event"
4. Enter track name: "SDRC"
5. Click "INIT RACING SESSION"
6. Session becomes ACTIVE and shows in header

---

## Available Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler

# Dependencies
npm install              # Install packages
npm update               # Update packages
```

---

## Project Structure Reference

```
Execution/frontend/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   ├── lib/              # Utilities & queries
│   ├── stores/           # Zustand state
│   └── types/            # TypeScript definitions
├── public/               # Static assets (create if needed)
└── node_modules/         # Dependencies
```

---

## Troubleshooting

### "Cannot find supabase module"
```bash
npm install @supabase/supabase-js
```

### "Port 3000 already in use"
```bash
npm run dev -- -p 3001  # Use port 3001 instead
```

### "Database connection refused"
- Check `.env.local` credentials
- Verify Supabase URL is correct
- Ensure schema was deployed successfully

### "No racers appearing in dropdown"
- Seed test data (see Phase 3)
- Or create profiles in Supabase dashboard

---

## Next Steps (Architect)

- [ ] Design Tab 2 (Setup Advisor)
- [ ] Design Tab 3 (Live Telemetry)
- [ ] Implement AI inference hooks
- [ ] Add real-time subscriptions
- [ ] Integrate PDF export for checklists

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `.env.local` | Supabase credentials (DO NOT commit) |
| `src/lib/queries.ts` | All database operations |
| `src/stores/missionControlStore.ts` | Global state management |
| `src/components/tabs/MissionControl.tsx` | Main dashboard layout |
| `Directives/Master_Schema.sql` | Database schema |

---

## System Status

```
✓ Database: Ready (schema v1.1.0)
✓ Frontend: Ready (Next.js 15)
✓ API: Ready (Supabase SDK)
✓ State: Ready (Zustand)
✓ Types: Ready (TypeScript strict)
✓ Design: Ready (Bloomberg Terminal style)

→ Status: LAUNCH READY
```

---

**Questions?** Check `Execution/frontend/README.md` for detailed docs.
**Issues?** Verify environment variables and database connection.
**Next phase?** Architect designs Tab 2, Builder scaffolds it.

🚀 **MISSION CONTROL OPERATIONAL**
