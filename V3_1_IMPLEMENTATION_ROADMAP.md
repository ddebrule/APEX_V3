# A.P.E.X. V3.1 Implementation Roadmap

## Current Status: Backend Migration Ready

**Completed:**
- ✅ Phase 2.1 Mission Control Aesthetics (4 components refactored)
- ✅ Migration scripts created and committed to GitHub
- ✅ MIGRATION_INSTRUCTIONS.md ready for Supabase deployment

**Next Immediate Action:**
⚠️ **Apply Migration_1_1_0.sql to Supabase database** (see MIGRATION_INSTRUCTIONS.md)

---

## Phase Overview

### Phase 2.1: Mission Control Aesthetics (✅ COMPLETE)
**Status**: Deployed to main branch (commit 4ca8f57)

Implemented:
1. **EventIdentity.tsx** - Terminal-style fleet/vehicle selector
2. **SessionLockSlider.tsx** - Slide-to-deploy interaction (NEW)
3. **BaselineInitialization.tsx** - Integrated slider + session config
4. **TrackIntelligence.tsx** - Live data ticker with animations

These components use Phase 2.1 "logic engines" that will be re-homed into V3.1 shells.

### Phase 3: V3.1 Backend Migration (🔄 IN PROGRESS)
**Current Task**: Apply schema upgrades to Supabase

What's new:
- `sponsors` JSONB on racer_profiles (for AI recommendations)
- `classes` table (for vehicle classification)
- `class_id` foreign key on vehicles (vehicle→class mapping)
- Performance indexes on new relationships
- RLS policies on classes table

### Phase 4: V3.1 Frontend Shells (🔜 READY TO START)
**Strategy**: Controlled Integration (Option C)
- Build new V29/V31 UI shells
- Plug existing Phase 2.1 logic engines into new shells
- Do NOT rewrite working logic, just re-home it

---

## V3.1 Tab Structure

### Tab 1: Paddock Ops (was Mission Control)
**Reuses**: EventIdentity.tsx (existing)
- Racer profile selector
- Vehicle selector
- Session status

**New Elements**: Class Registry sidebar

**File**: `frontend/src/components/tabs/PaddockOps.tsx` (refactor from MissionControl)

---

### Tab 2: Unified Race Control (NEW - was split Setup/Active)
**Purpose**: Single-page state machine merging setup (BLUE) and active (RED) modes

**Reuses**:
- SessionLockSlider logic (BLUE→RED transition)
- TrackIntelligence logic (live data display)

**New Elements**:
- 16-parameter Track Context Matrix (BLUE mode)
- 9-point Vehicle Technical Matrix (BLUE mode)
- Class Registry (BLUE mode)
- Red vs Blue state machine (switching modes on slider deployment)

**File**: `frontend/src/components/tabs/UnifiedRaceControl.tsx`

**Design Reference**: `Directives/mockup_v29_complete_unified_command.html`

---

### Tab 3: AI Advisor (was Setup Advisor)
**Purpose**: Command chat interface for Socratic loop + tactical directives

**Reuses**:
- Socratic loop state machine (from advisorStore)
- ChatMessage, ProposalCard, ProposalCardsContainer components

**New Elements**:
- Command chat interface (high-density)
- AI avatar (RED) vs User avatar (Dark) bubbles
- Voice input microphone button (GREEN glow)
- Persistent context deck sidebar
- Dynamic Configuration list
- Vehicle context dropdown
- Tactical directives right rail
- Sponsor-based filtering

**File**: `frontend/src/components/tabs/AIAdvisor.tsx`

**Design Reference**: `Directives/mockup_v31_ai_advisor_complete.html`

---

## Implementation Sequence

### Step 1: Database Migration (THIS WEEK)
```
1. Open Supabase SQL Editor
2. Copy Migration_1_1_0.sql
3. Paste and Run
4. Verify schema changes
5. Test with sample data (optional)
```

**Checkpoint**: All three schema additions visible in Supabase

---

### Step 2: Tab Navigation Update (After DB Migration)
Files to modify:
- `frontend/src/components/common/TabNav.tsx` - Add new tab labels
- `frontend/src/app/page.tsx` - Update imports

Changes:
```
Old Tabs: Mission Control | Setup Advisor | Battery | Signal | Sync
New Tabs: Paddock Ops | Race Control | AI Advisor | Battery | Signal | Sync
```

---

### Step 3: Build Paddock Ops (After Tab Nav Update)
**File**: `frontend/src/components/tabs/PaddockOps.tsx`

This is mostly a refactoring of MissionControl → rename and wire up new Class Registry sidebar.

**Steps**:
1. Copy MissionControl.tsx → PaddockOps.tsx
2. Keep EventIdentity.tsx (no changes needed)
3. Add Class Registry sidebar showing vehicle classes
4. Update store references (rename mission_control selectors to paddock_ops if needed)

**Estimated**: 1-2 changes only

---

### Step 4: Build Unified Race Control (After Paddock Ops)
**File**: `frontend/src/components/tabs/UnifiedRaceControl.tsx`

**Architecture**:
```
UnifiedRaceControl (state machine: mode = BLUE | RED)
├── BLUE Mode (Setup)
│   ├── Track Context Matrix (16 parameters)
│   ├── Vehicle Technical Matrix (9 points)
│   ├── Class Registry
│   └── SessionLockSlider (drag to transition to RED)
└── RED Mode (Active)
    ├── TrackIntelligence (live ticker + data grid)
    └── Setup Changes Feed
```

**Reused Components**:
- `SessionLockSlider.tsx` - handles BLUE→RED transition
- `TrackIntelligence.tsx` - handles live data display in RED mode

**New Components to Create**:
- `TrackContextMatrix.tsx` - 16-parameter display
- `VehicleTechnicalMatrix.tsx` - 9-point display
- `ClassRegistry.tsx` - class assignment UI

**Design Reference**: Read `mockup_v29_complete_unified_command.html` for layout

---

### Step 5: Build AI Advisor (Final)
**File**: `frontend/src/components/tabs/AIAdvisor.tsx`

**Architecture**:
```
AIAdvisor (command chat + persistent context)
├── Left Sidebar: Context Deck
│   ├── Dynamic Configuration
│   └── Vehicle Context Dropdown
├── Center: Command Chat
│   ├── Message Stream (AI avatar RED, User avatar Dark)
│   ├── Voice Input Button (GREEN)
│   └── Chat Input
└── Right Sidebar: Tactical Directives
    ├── Symptom Buttons
    └── Sponsor-based Recommendations
```

**Reused Components**:
- `ChatMessage.tsx` - message rendering
- `ProposalCard.tsx` - proposal display
- `advisorStore.ts` - Socratic loop state machine

**New UI Elements**:
- Avatar system (RED/Dark/GREEN)
- Voice button with glow animation
- Context deck cards
- Tactical directive buttons

**Design Reference**: Read `mockup_v31_ai_advisor_complete.html` for layout

---

## Testing Checklist

After each phase:

- [ ] Navigation between tabs works
- [ ] State persists when switching tabs
- [ ] Phase 2.1 logic engines function identically in new shells
- [ ] Session initialization (BLUE→RED transition) works
- [ ] Live data ticker updates in RED mode
- [ ] Chat history persists in AI Advisor
- [ ] No console errors
- [ ] Mobile responsive (if applicable)

---

## Design Files to Reference

Located in `Directives/`:

1. **mockup_v29_complete_unified_command.html**
   - V3.1 Unified Race Control mockup
   - Shows BLUE (setup) and RED (active) modes
   - Reference for Tab 2 layout

2. **mockup_v31_ai_advisor_complete.html**
   - V3.1 AI Advisor mockup
   - Shows command chat + context deck + tactical directives
   - Reference for Tab 3 layout

Open these in your browser to see exact visual layout and component placement.

---

## Key Design Principles

### Red vs Blue Logic
- **BLUE** (#2196F3) = Pre-session controls (setup mode)
- **RED** (#E53935) = Active session controls
- **GREEN** (#4CAF50) = Positive signals (ready, microphone)
- **AMBER** (#FFC107) = Config/warning

### Terminal Aesthetics
- Font: JetBrains Mono (monospace)
- Base size: 9px for labels, xs for values
- Indicators: Diamond ◆, Prompt ›
- High-density layout (minimal whitespace)
- Glassmorphism: rgba(255, 255, 255, 0.02) backgrounds

### Component Reuse (Controlled Integration)
- Don't rewrite SessionLockSlider - use existing
- Don't rewrite TrackIntelligence - use existing
- Don't rewrite Socratic loop - use existing advisorStore
- Wrap them in new shells that match V29/V31 designs

---

## Database Schema Summary (After Migration)

```sql
racer_profiles
├── id (UUID)
├── name (TEXT)
├── email (TEXT)
├── sponsors (JSONB) ← NEW
├── is_default (BOOLEAN)
├── created_at, updated_at

classes ← NEW TABLE
├── id (UUID)
├── profile_id (FK → racer_profiles)
├── name (TEXT)
├── created_at

vehicles
├── id (UUID)
├── profile_id (FK → racer_profiles)
├── class_id (FK → classes) ← NEW
├── brand, model (TEXT)
├── transponder, baseline_setup, created_at, updated_at

sessions
├── id (UUID)
├── profile_id, vehicle_id (FKs)
├── event_name, session_type, track_context
├── actual_setup, pit_notes, status
├── created_at, updated_at

setup_changes
├── id (UUID)
├── session_id (FK)
├── parameter, old_value, new_value
├── ai_reasoning, driver_feedback, status
├── created_at

race_results, setup_embeddings
└── (unchanged from v1.0)
```

---

## Critical Notes

1. **Do NOT rewrite Phase 2.1 logic**
   - SessionLockSlider works, don't touch it
   - TrackIntelligence works, don't touch it
   - Just integrate into new Tab 2 layout

2. **Apply migration BEFORE frontend work**
   - Classes table must exist before UI tries to reference class_id
   - Sponsors field must exist before AI filtering

3. **Test after each phase**
   - Use npm run dev to test locally
   - Verify no console errors
   - Check Supabase tables in SQL Editor

4. **Commit incrementally**
   - One phase per commit
   - Include testing verification in commit message
   - Reference issue/PR if applicable

---

## Questions or Blockers?

If you encounter:
- Supabase connection errors: Check .env.local NEXT_PUBLIC_SUPABASE_* variables
- Migration syntax errors: Review Migration_1_1_0.sql for PostgreSQL compatibility
- Type errors in frontend: Check TypeScript types against new schema fields
- Component prop mismatches: Reference existing Phase 2.1 components for patterns

Contact architect if:
- Migration fails (non-idempotent error)
- Need to clarify Tab 2/Tab 3 layouts
- Sponsor filtering logic unclear
- Red vs Blue state transitions unclear

---

**Last Updated**: 2026-01-17
**Status**: Ready for database migration
**Next Milestone**: Schema verification in Supabase
