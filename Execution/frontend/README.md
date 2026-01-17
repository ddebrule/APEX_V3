# A.P.E.X. V3 - Mission Control Dashboard

Bloomberg Terminal for RC Racing - Tab 1 Frontend

## Project Structure

```
src/
├── app/                 # Next.js 15 app directory
├── components/
│   ├── common/          # Reusable UI components
│   ├── sections/        # Tab 1 sections
│   └── tabs/            # Dashboard tabs
├── lib/
│   ├── queries.ts       # Supabase queries
│   └── supabase.ts      # Client initialization
├── stores/              # Zustand state management
└── types/               # TypeScript definitions
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

3. Run development server:
```bash
npm run dev
```

Visit http://localhost:3000

## Sections (Tab 1)

### Event Identity
- Racer profile selection
- Vehicle selection
- Transponder assignment

### Track Intelligence
- Track name and location
- Traction and surface conditions
- Real-time temperature monitoring

### Institutional Memory
- Historical session data
- AI librarian insights
- Previous setup recommendations

### Baseline Initialization
- Event name input
- Session type selection (practice/qualifier/main)
- Initialize racing session (creates active session)

## Technologies

- **Framework:** Next.js 15 (React 18)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **State:** Zustand
- **Type Safety:** TypeScript
- **Client:** @supabase/supabase-js

## Development

### Type Checking
```bash
npm run type-check
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## Database Schema Integration

This dashboard connects to the hardened Master Schema with:
- Type-safe queries via `src/lib/queries.ts`
- Zustand store for state management
- Real-time ready (can upgrade to Supabase realtime)

## Next Phases

- Tab 2: Setup Advisor
- Tab 3: Race Support
- Tab 4: Live Telemetry
- Tab 5: Post Analysis
- Tab 6: Setup Library
