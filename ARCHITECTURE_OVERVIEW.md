# A.P.E.X. V3.1 - Architecture Overview

## How Everything Connects

### 1. Your Local Development Setup

```
Your Computer
├── Frontend Code (React/Next.js)
│   └── Runs on: localhost:3002
│   └── Location: Execution/frontend/
│   └── Files: TypeScript, React components, Tailwind CSS
│
└── GitHub Repository
    └── URL: https://github.com/ddebrule/APEX_V3.git
    └── Contains: All code files (frontend + directives)
```

**Local Development Workflow:**
```
1. You edit files in VS Code
2. npm run dev starts the app on localhost:3002
3. Changes appear immediately in browser
4. When happy, you run: git commit & git push
5. Your changes go to GitHub
```

---

### 2. Supabase Database (Backend)

```
Supabase Project (Cloud)
├── PostgreSQL Database
│   ├── Tables (after Master_Schema.sql):
│   │   ├── racer_profiles
│   │   ├── vehicles
│   │   ├── sessions
│   │   ├── setup_changes
│   │   ├── race_results
│   │   ├── setup_embeddings
│   │   └── classes
│   │
│   └── Security: Row-Level Security (RLS) policies
│
├── API Gateway (Auto-generated)
│   └── Provides REST endpoints for data access
│
└── Authentication
    └── Service role key (for admin operations)
    └── Anon key (for client app)
```

**Your Supabase Details:**
```
URL:     https://wlcpfzrcsujbiicqsrjt.supabase.co
Project: APEX_V3
```

---

### 3. How Frontend Connects to Database

#### Step 1: Environment Variables
```
Frontend/.env.local
│
├── NEXT_PUBLIC_SUPABASE_URL
│   └── Points to: https://wlcpfzrcsujbiicqsrjt.supabase.co
│
└── NEXT_PUBLIC_SUPABASE_ANON_KEY
    └── Authentication token for the React app
```

#### Step 2: Supabase Client Connection
```typescript
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

#### Step 3: API Queries
```typescript
// frontend/src/lib/queries.ts
export async function getAllRacers() {
  const { data, error } = await supabase
    .from('racer_profiles')
    .select('*');
  return data;
}
```

#### Step 4: Component Usage
```typescript
// frontend/src/components/sections/EventIdentity.tsx
const [racers, setRacers] = useState([]);

useEffect(() => {
  const data = await getAllRacers();  // Calls Supabase
  setRacers(data);  // Updates UI
}, []);
```

---

### 4. Data Flow Diagram

```
User clicks button in React App (localhost:3002)
           ↓
Component calls function from queries.ts
           ↓
Supabase client sends REST request to Supabase API
           ↓
Supabase checks RLS policies (who can access what?)
           ↓
PostgreSQL database processes query
           ↓
Data returns to React app as JSON
           ↓
Component updates state and re-renders UI
```

---

### 5. GitHub Connection

**What GitHub Stores:**
- ✅ All source code (frontend, backend directives)
- ✅ SQL schema files (Master_Schema.sql)
- ✅ Configuration files
- ❌ NOT the actual database data

**What GitHub Does NOT Store:**
- The live Supabase database content
- User data, sessions, or race results
- Environment variables (.env.local - this is local only)

**Why You Linked GitHub:**
- Deploy integration: Vercel can watch GitHub for changes
- Version control: Track code history
- Collaboration: Share code with team

---

### 6. Web Accessibility

#### During Development (What You're Doing Now)
```
Your Computer
└── npm run dev
    └── localhost:3002
        └── Only accessible from your computer
        └── Frontend + Supabase connected locally
```

#### For Web Deployment (Future - Not Yet)
```
GitHub Repository
    ↓
Vercel (or similar)
    ↓
https://apex-v3-production.vercel.app (or similar)
    ↓
Anyone with the URL can access
```

**To Deploy to Web:**
1. Push code to GitHub (done ✓)
2. Connect GitHub to Vercel
3. Vercel automatically builds and deploys
4. App runs on: vercel.app domain
5. Still connects to same Supabase database

---

### 7. Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL COMPUTER                       │
│                                                              │
│  ┌──────────────────┐           ┌──────────────────┐        │
│  │  VS Code Editor  │           │   Terminal/npm   │        │
│  │                  │           │                  │        │
│  │  Edit code here  │──────────→│  npm run dev     │        │
│  └──────────────────┘           │                  │        │
│                                 └────────┬─────────┘        │
│                                          │                   │
│                    ┌─────────────────────▼─────────────────┐ │
│                    │  React App (localhost:3002)           │ │
│                    │  ├─ EventIdentity.tsx                 │ │
│                    │  ├─ SessionLockSlider.tsx             │ │
│                    │  ├─ TrackIntelligence.tsx             │ │
│                    │  └─ [Your UI Components]              │ │
│                    └──────────┬──────────────────────────────┘ │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                    HTTP/HTTPS Requests
                                │
        ┌───────────────────────▼────────────────────────┐
        │     GITHUB REPOSITORY                          │
        │  https://github.com/ddebrule/APEX_V3.git      │
        │                                                │
        │  ├─ Execution/frontend/src/                   │
        │  ├─ Directives/Master_Schema.sql              │
        │  ├─ package.json, tsconfig.json               │
        │  └─ [Source code only - no data]              │
        └───────────────────────┬──────────────────────┘
                                │
                    ┌───────────▼────────────────┐
                    │   (Optional) Vercel       │
                    │   For web deployment      │
                    │   (Future - not yet)      │
                    └───────────────────────────┘
```

```
        ┌──────────────────────────────────────┐
        │   SUPABASE (Cloud - Singapore)       │
        │   https://supabase.co/               │
        │                                      │
        │  ┌─────────────────────────────────┐ │
        │  │  PostgreSQL Database            │ │
        │  │  wlcpfzrcsujbiicqsrjt          │ │
        │  │                                 │ │
        │  │  Tables (after Master_Schema):  │ │
        │  │  ├─ racer_profiles              │ │
        │  │  ├─ vehicles                    │ │
        │  │  ├─ classes                     │ │
        │  │  ├─ sessions                    │ │
        │  │  ├─ setup_changes               │ │
        │  │  ├─ race_results                │ │
        │  │  └─ setup_embeddings            │ │
        │  └─────────────────────────────────┘ │
        │                                      │
        │  ┌─────────────────────────────────┐ │
        │  │  REST API Gateway (Auto)        │ │
        │  │  /rest/v1/racer_profiles        │ │
        │  │  /rest/v1/vehicles              │ │
        │  │  /rest/v1/sessions              │ │
        │  └─────────────────────────────────┘ │
        │                                      │
        │  ┌─────────────────────────────────┐ │
        │  │  Authentication                 │ │
        │  │  - Service Role Key             │ │
        │  │  - Anon Key (public client)     │ │
        │  └─────────────────────────────────┘ │
        └──────────────────────────────────────┘
             ↑
             │
             └─ Connected via env variables
                NEXT_PUBLIC_SUPABASE_URL
                NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Step-by-Step: What Happens When You Create a Racer

### 1. User Action (Frontend)
```
User fills form in EventIdentity.tsx:
- Name: "John Smith"
- Email: "john@racing.io"
- Sponsors: "JConcepts"
User clicks "Save" button
```

### 2. Frontend Handler
```typescript
// EventIdentity.tsx - handleSaveRacer()
const racer = await createRacerProfile({
  name: "John Smith",
  email: "john@racing.io",
  sponsors: ["JConcepts"],
  is_default: true
});
```

### 3. API Call to Supabase
```typescript
// queries.ts - createRacerProfile()
const { data, error } = await supabase
  .from('racer_profiles')
  .insert([{
    name: "John Smith",
    email: "john@racing.io",
    sponsors: [{"brand": "JConcepts", "category": "..."}],
    is_default: true
  }])
  .select();
```

### 4. Supabase Processing
```
1. Checks env variables (valid client? ✓)
2. Checks RLS policies (allowed to insert? ✓)
3. Validates constraints (email format? ✓)
4. Generates UUID for new racer
5. Inserts into racer_profiles table
6. Returns new record with ID
```

### 5. Database State
```sql
-- racer_profiles table
| id                                   | name         | email              | sponsors              |
|--------------------------------------|--------------|--------------------|-----------------------|
| a1b2c3d4-e5f6-7890-abcd-ef1234567890 | John Smith   | john@racing.io     | [{"brand": "JConcepts"}] |
```

### 6. Response Back to Frontend
```typescript
// React state updates
setRacers([newRacer, ...racers]);
setSelectedRacer(newRacer);
// UI re-renders with new racer visible
```

---

## Current State Check

### ✅ What's Ready
- Frontend code: Complete (Phase 2.1 components built)
- GitHub repository: Connected and synced
- Supabase project: Created
- Environment variables: Configured

### 🔄 What's Next
- Run Master_Schema.sql in Supabase → Creates database tables
- Test frontend by creating a racer profile
- Start Phase 4: Build V3.1 Tab shells

### ❌ Not Yet
- Web deployment (Vercel integration)
- Production database backups
- Advanced RLS policies (using auth)

---

## To Actually Access via Web (Future)

When you're ready to share with others:

```
1. Deploy to Vercel
   - Connect GitHub to Vercel
   - Vercel auto-deploys on every push
   - Your app gets public URL

2. Set environment variables in Vercel
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

3. Your app is now public
   - URL: https://apex-v3-production.vercel.app
   - Anyone can access
   - Still uses same Supabase database

4. Supabase stays private
   - Only your Vercel app can write
   - RLS policies control access
   - Database runs in Supabase Singapore region
```

---

## Key Takeaway

**GitHub ≠ Database**

- GitHub = Code storage + version control
- Supabase = Live data + API + Authentication
- Vercel = Web hosting (future)

All three work together:
```
Write Code → Push to GitHub → Vercel deploys → App talks to Supabase
```

For now, you're just running locally:
```
Write Code → npm run dev → App talks to Supabase
```
