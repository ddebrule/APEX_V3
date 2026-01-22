# Claude Handoff: A.P.E.X. V3.2 — EXECUTION CRITIQUE

**Status:** REVIEW PHASE
**Date:** 2026-01-21
**Context:** C.A.S.H. Protocol Implementation Analysis

---

## EXECUTIVE SUMMARY

The V3.2 handoff is **architecturally sound** but contains **critical execution gaps** between the strategic directive and current codebase state. The 6-tab reorder is trivial; the **LiveClipboard integration and physics layer cohesion** require substantial work. Primary blockers are:

1. **LiveClipboard.tsx doesn't exist** — right-rail setup widget is incomplete
2. **AIAdvisor.tsx lacks Piston Primacy integration** — shock recommendations missing oil/piston pairs
3. **Setup_IQ cascading to database** — insertSetupChange() calls unimplemented
4. **TheVault.tsx lacks monospaced table architecture** — historical data visualization incomplete
5. **Physics layer (physicsAdvisor.ts) missing XV4 return valve logic** — VRP split-valve patterns not encoded

---

## SECTION 1: NAVIGATION REORDER (TabNav.tsx)

### Current State
```
1. RACER GARAGE (garage)
2. RACE STRATEGY (strategy)
3. RACE CONTROL (control)
4. SETUP_IQ (advisor)
5. DATA & ANALYSIS (audit)
6. THE VAULT (vault)
```

### Required Reorder
```
1. RACER GARAGE → Identity
2. RACE STRATEGY → The Plan
3. SETUP_IQ → The Engineering
4. RACE CONTROL → The Action
5. DATA & ANALYSIS → The Audit
6. THE VAULT → The Archive
```

### Status: ✅ IMPLEMENTATION-READY
- **File:** [TabNav.tsx:15-22](Execution/frontend/src/components/common/TabNav.tsx#L15-L22)
- **Work:** Reorder TABS array to place `advisor` before `control`
- **Risk:** None — UI only, no state mutations

---

## SECTION 2: SETUP_IQ LiveClipboard Integration

### Current State
[AIAdvisor.tsx](Execution/frontend/src/components/tabs/AIAdvisor.tsx) has:
- ✅ Left sidebar: Context deck (vehicles, telemetry, setup params)
- ✅ Center: Chat feed with tactical directives
- ✅ Right sidebar: Tactical directives (hardcoded)
- ❌ **Missing: LiveClipboard logic for CST value capture**

### Required Implementation

#### 2.1 Component Architecture
```
AIAdvisor.tsx (parent)
├── ContextDeck (left)
├── ChatArea (center)
└── LiveClipboard (RIGHT SIDEBAR) [NEW]
    ├── Setup Change Parser
    ├── Checkbox State
    └── Top 3 Watch-points (persistent)
```

#### 2.2 LiveClipboard Responsibilities
1. **Parse AI recommendations** from chat messages (destructive pattern)
   - Look for: "7k oil", "1.6mm piston", "Blue spring", "+2.5mm ride height"
   - Extract to key-value pairs: `{ type: 'Shock Oil', value: '7k', position: 'Front' }`

2. **Display in right rail** (monospaced table format)
   ```
   ┌────────────────────────────────────────┐
   │ ◆ LIVE CLIPBOARD                       │
   ├────────────────────────────────────────┤
   │ CHANGE  │ CURRENT  │ PROPOSED │ STATUS │
   ├─────────┼──────────┼──────────┼────────┤
   │ F. OIL  │ 450 CST  │ 500 CST  │ ☐      │
   │ F. PISTON │ 1.5mm │ 1.6mm    │ ☐      │
   │ R. SPRING │ Blue  │ Purple   │ ☐      │
   └────────────────────────────────────────┘
   ```

3. **Checkbox trigger** → insertSetupChange() database call
   - When user checks box: `INSERT INTO setup_changes (vehicle_id, change_type, proposed_value, timestamp)`

4. **Top 3 Watch-points** (bottom of widget)
   - Sticky footer: "◆ KEEP AN EYE ON: (1) Tire spin-up, (2) Mid-corner push, (3) Landing chatter"

#### 2.3 Database Schema Required
```sql
CREATE TABLE setup_changes (
  id UUID PRIMARY KEY,
  vehicle_id UUID,
  session_id UUID,
  change_type VARCHAR (e.g., "Shock Oil"),
  position VARCHAR (e.g., "Front"),
  current_value VARCHAR,
  proposed_value VARCHAR,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP,
  orp_delta FLOAT,
  created_at TIMESTAMP
);
```

#### 2.4 Execution Blockers
- **Query function missing:** `insertSetupChange()` not in `@/lib/queries`
- **Parser missing:** No regex/NLP pattern to extract "7k oil" from chat
- **Store missing:** No setup_changes state in advisorStore

### Status: ❌ BLOCKED — Requires LiveClipboard.tsx creation

---

## SECTION 3: TheVault.tsx Monospaced Table

### Current State
[TheVault.tsx](Execution/frontend/src/components/tabs/TheVault.tsx) provides:
- ✅ Session history sidebar
- ✅ Librarian AI semantic search
- ✅ Conversation ledger
- ❌ **No monospaced table for closed session history**

### Required Implementation

#### 3.1 Table Specification
```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ DATE         │ EVENT        │ TRACK        │ VEHICLE      │ FINAL NOTES  │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ 2026-01-15   │ Regional #2  │ Clay Loop    │ MBX8R [01]   │ 3rd place... │
│ 2026-01-10   │ Practice Day │ Hard Pack    │ MBX8T [04]   │ Loose mid... │
│ 2026-01-05   │ Qualifier Q2 │ Mixed Dirt   │ MBX8R [01]   │ Bottoming... │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

**Font:** JetBrains Mono, 11px, line-height 1.6

#### 3.2 Data Fetch Query
```typescript
// Required in @/lib/queries
export async function getClosedSessionsByProfile(profileId: string) {
  // Fetch from sessions table WHERE profile_id = ? AND status = 'closed'
  // Return: Array<{ date, event_name, track_name, vehicle_name, final_notes }>
}
```

#### 3.3 Remove from RacerGarage
- Currently, RacerGarage may display historical sessions
- **Action:** Audit RacerGarage.tsx, remove any "Previous Sessions" or "History" table
- **Rationale:** Single source of truth (TheVault only)

#### 3.4 Integration
- TheVault becomes the **Librarian's search anchor**
- Sessions table feeds into vector embeddings for "similar issue" matching
- Right-click on closed session → "Push to Advisor" for context re-injection

### Status: 🟡 PARTIAL — Table structure exists, query needs implementation

---

## SECTION 4: Expert Physics Layer

### 4.1 Piston Primacy (Oil + Piston Pairing)

**Current State:** [physicsAdvisor.ts:81-140](Execution/frontend/src/lib/physicsAdvisor.ts#L81-L140)

**Issue:** SYMPTOM_LIBRARY recommendations specify Oil CST but omit Piston specifications.

**Example (BEFORE):**
```typescript
'Oversteer (Entry)': {
  primary: {
    name: 'Increase Front Shock Oil',
    category: 'Shock Oil',
    physicsImpact: 80,
    executionSpeed: 'low',
    timingMinutes: 15,
    reasoning: 'Thicker front oil slows weight transfer...',
  },
  // ❌ NO PISTON DATA
}
```

**Example (AFTER):**
```typescript
'Oversteer (Entry)': {
  primary: {
    name: 'Increase Front Shock Oil to 500 CST + 1.6mm Piston',
    category: 'Shock Oil',
    physicsImpact: 80,
    executionSpeed: 'low',
    timingMinutes: 15,
    oilCST: 500,           // ✅ NEW
    pistonSize: '1.6mm',   // ✅ NEW
    pistonType: 'Tekno',   // Material/Brand
    reasoning: 'Thicker front oil (500 CST) slows weight transfer; 1.6mm piston reduces low-speed bleed, maintaining mid-stroke control.',
  },
}
```

**Required Action:**
1. Add `oilCST: number`, `pistonSize: string`, `pistonType: string` to FixOption interface
2. Audit all 8 symptoms in SYMPTOM_LIBRARY; add piston specs per [RC_Tuning_Standard.md:15](Directives/Standards/RC_Tuning_Standard.md#L15)
3. Update reasoning strings to explain piston impact

### 4.2 XV4 Return Valve Logic

**Current State:** [physicsAdvisor.ts:162-180](Execution/frontend/src/lib/physicsAdvisor.ts#L162-L180) has XV4 reference but **no split-valve flow calculation**.

**Missing Implementation:**

```typescript
// NEW: XV4 Flow Calculation (VRP Split-Valve Model)
const XV4_WASHERS = {
  'Black': { rebound: 100, bleed: 'max' },    // Highest rebound
  'Red': { rebound: 75, bleed: 'high' },
  'Gold': { rebound: 50, bleed: 'med' },
  'Blue': { rebound: 25, bleed: 'low' },      // Least rebound
};

const XV4_HOLES = {
  '1.0mm': { lowSpeedFlow: 'tight', highSpeedFlow: 'restricted' },
  '1.1mm': { lowSpeedFlow: 'med', highSpeedFlow: 'restricted' },
  '1.3mm': { lowSpeedFlow: 'open', highSpeedFlow: 'med' },
  '1.5mm': { lowSpeedFlow: 'open', highSpeedFlow: 'open' },
};

// Calculate total flow: (# holes) * (sum of diameters) * (washer rebound factor)
export function calculateXV4Flow(
  holeCount: number,
  holeDiameter: string,
  washerColor: string
): number {
  // Returns flow index (0-100) for recommendation logic
}
```

**Integration Points:**
- When symptom = "High-Speed Ruts / Chattering": recommend Black washer + 1.1mm holes
- When symptom = "Bumpy Track Feel": recommend Blue washer + 1.5mm holes
- Populate AIAdvisor.tsx recommendations with washer color + hole specs

### 4.3 Team Report (8-Point Format)

**Current State:** No structured output for session kickoff.

**Required Implementation:**

When user initiates new session, AI Engineer should output:

```
═══════════════════════════════════════════════════════════════════
  SESSION KICKOFF: MBX8R [CHASSIS_01] @ Regional Event
═══════════════════════════════════════════════════════════════════

1. TIRE STRATEGY
   Compound: S3 (Clay specialist, 50°F track temp)
   Pressure: 1.75 BAR (F) / 1.68 BAR (R)
   Compound swap trigger: If temps exceed 95°F

2. SUSPENSION SETUP
   ┌──────────┬────────┬───────────┬────────┬──────────┐
   │ Position │ Oil    │ Piston    │ Spring │ R. Height│
   ├──────────┼────────┼───────────┼────────┼──────────┤
   │ Front    │ 450    │ 5x1.6mm   │ White  │ 27mm     │
   │ Rear     │ 400    │ 5x1.5mm   │ Blue   │ 29mm     │
   └──────────┴────────┴───────────┴────────┴──────────┘

3. SWAY BARS
   ┌──────────┬──────────┬──────────────┐
   │ Position │ Diameter │ Deadband     │
   ├──────────┼──────────┼──────────────┤
   │ Front    │ 2.0mm    │ 2 turns      │
   │ Rear     │ 1.8mm    │ 3 turns      │
   └──────────┴──────────┴──────────────┘

4. DIFFERENTIALS
   Center: 10k | Front: 12k | Rear: 8k (O-ring type)

5. GEOMETRY
   ┌────────┬─────────┬──────────┬─────────┐
   │ Param  │ Front   │ Rear     │ Note    │
   ├────────┼─────────┼──────────┼─────────┤
   │ Camber │ -2.5°   │ -1.8°    │ Clay    │
   │ Toe    │ 0.5°IN  │ 0.3°OUT  │ Stable  │
   │ Caster │ 45°     │ N/A      │ Stock   │
   └────────┴─────────┴──────────┴─────────┘

6. POWER
   Gearing: 13/76 (sandy clay)
   Carb: 4/5 HSN / 2/3 LSN (Van Dalen Method)
   Idle Gap: 0.65mm

7. CHANGE WINDOWS
   Q1→Q2: Monitor tire fade; prep compound swap
   Night transition: Add 100 CST oil (temp drop)
   Rain contingency: Switch to hard compound + stiffer geometry

8. TOP 3 WATCH-POINTS
   ① Tire spin-up on clay (monitor first 3 laps)
   ② Mid-corner push (if present, reduce front sway 0.2mm)
   ③ Landing chatter (if present, soften front oil 50 CST)
```

### 4.4 Single Voice Requirement

**Current State:** AIAdvisor displays only chat but context hints at 4 personas (Strategist, Analyst, Spotter, Librarian).

**Required Change:**
- User sees **only AI Engineer voice** in AIAdvisor.tsx
- Internal dialogue (strategy reasoning, analysis loops) **hidden**
- Output: Direct imperatives ("Switch to Blue spring", "Apply 7k oil")

**Implementation:**
- Filter advisorStore messages to hide system role outputs
- ChatMessage component: only render role === 'user' or role === 'ai_engineer'
- Hide role === 'system' | 'strategist' | 'analyst' | etc.

---

## SECTION 5: EXECUTION CONSTRAINTS AUDIT

### Font Standards
- ✅ JetBrains Mono imported/available in Tailwind config
- ❌ Not applied to all table values in LiveClipboard and TheVault
- **Action:** Apply `font-mono` class to all numeric/CST values

### Tone (Zero Fluff)
- ✅ physicsAdvisor.ts uses professional language
- 🟡 AIAdvisor.tsx has "Welcome to Neural Link" (conversational)
- ❌ LiveClipboard missing (would need imperative tone in parsing)

**Example:**
```
BAD: "You might want to try increasing your front oil a bit..."
GOOD: "Increase front oil to 500 CST. Apply 1.6mm piston."
```

### Single Voice
- ❌ Four persona files exist (advisor.md, strategist.md, analyst.md, librarian.md)
- ❌ No consolidation to unified "AI Engineer" voice in code
- **Action:** In AIAdvisor, suppress all non-AI-Engineer persona outputs

---

## SECTION 6: DATABASE & QUERY BLOCKERS

### Missing Queries (Required for C.A.S.H. Protocol)

```typescript
// @/lib/queries.ts — ADD THESE:

// 1. Insert setup change (LiveClipboard)
export async function insertSetupChange(params: {
  vehicleId: string;
  sessionId: string;
  changeType: string;
  proposedValue: string;
}) { /* ... */ }

// 2. Fetch closed sessions (TheVault table)
export async function getClosedSessionsByProfile(profileId: string) {
  /* ... */
}

// 3. Get session history with telemetry (TheVault context)
export async function getSessionHistory(vehicleId: string) {
  /* ... */
}
```

### Supabase Schema Assumptions
- ✅ `sessions` table exists (read in AIAdvisor.tsx)
- ✅ `vehicles` table exists (read in AIAdvisor.tsx)
- ❓ `setup_changes` table — **VERIFY EXISTS**
- ❓ `historic_sessions` table — **VERIFY EXISTS** or use sessions + filter

---

## SECTION 7: CRITICAL GAPS SUMMARY

| Component | Issue | Severity | Blocker |
|-----------|-------|----------|---------|
| LiveClipboard | Component doesn't exist | 🔴 Critical | YES |
| AIAdvisor → insertSetupChange | Query missing | 🔴 Critical | YES |
| TheVault → monospaced table | Partial implementation | 🟡 High | Partial |
| physicsAdvisor.ts → Piston Primacy | Oil/piston pairs missing | 🟡 High | NO |
| XV4 split-valve logic | Not implemented | 🟡 High | NO |
| Team Report format | No structured output | 🟡 High | NO |
| Single voice enforcement | Multiple personas active | 🟠 Medium | NO |
| FontMono application | Inconsistently applied | 🟠 Medium | NO |

---

## SECTION 8: RECOMMENDED EXECUTION SEQUENCE

### PHASE 1: FOUNDATION (Non-blocking, parallel)
```
[1] Reorder tabs in TabNav.tsx (5 min)
[2] Add Piston Primacy to physicsAdvisor.ts (30 min)
[3] Implement XV4 flow logic (45 min)
[4] Create setup_changes database table + query (30 min)
[5] Verify/create historic_sessions table (15 min)
```

### PHASE 2: LIVEOBARD INTEGRATION (Blocking)
```
[6] Create LiveClipboard.tsx component (60 min)
     ├── Parser (regex + NLP for oil/piston extraction)
     ├── State management (setup changes array)
     ├── Checkbox trigger to insertSetupChange()
     └── Top 3 Watch-points footer

[7] Integrate LiveClipboard into AIAdvisor.tsx (30 min)
[8] Test end-to-end: AI rec → Parse → UI display → DB insert (30 min)
```

### PHASE 3: VAULT REFINEMENT
```
[9] Implement monospaced table in TheVault.tsx (45 min)
[10] Fetch closed sessions query + render (30 min)
[11] Remove history from RacerGarage.tsx (15 min)
[12] Test historical session navigation (20 min)
```

### PHASE 4: POLISH
```
[13] Apply JetBrains Mono consistently (20 min)
[14] Suppress non-AI-Engineer personas in chat (15 min)
[15] Team Report template → ChatMessage format (30 min)
[16] End-to-end smoke test (30 min)
```

---

## SECTION 9: APPROVAL GATES

**Before proceeding to Phase 2**, confirm:
- [ ] LiveClipboard component plan approved
- [ ] insertSetupChange() query signature locked
- [ ] AI parsing strategy (regex vs. semantic NLP) selected
- [ ] Database schema for setup_changes table finalized

**Before proceeding to Phase 4**, confirm:
- [ ] All Phase 1-3 tests passing
- [ ] monospaced table font rendering verified
- [ ] Team Report format accepted by user

---

## SECTION 10: TECHNICAL DEBT OBSERVATIONS

1. **Persona System Fragmentation:** Four separate prompt files (advisor.md, strategist.md, etc.) suggest multi-agent loop. If single voice is required, consolidate these into unified AI Engineer prompt.

2. **Chat State Isolation:** advisorStore's chatMessages don't distinguish between AI-generated and system-generated responses. May need role filtering at store level.

3. **Parser Complexity:** Extracting "1.6mm Tekno piston" from free-form chat is regex-fragile. Consider adding structured output mode to AI prompts (JSON schema) for live clipboard reliability.

4. **Database Normalization:** setup_changes table links to both vehicle_id AND session_id. Ensure referential integrity constraints exist.

---

## FINAL ASSESSMENT

**Readiness:** 🟡 **YELLOW — Proceed with Caution**

✅ **Strengths:**
- Clear strategic vision (6-tab flow, single voice, physics rigor)
- Physics layer (physicsAdvisor.ts) is well-architected
- Existing UI has professional polish (monospace, dark theme)

❌ **Weaknesses:**
- LiveClipboard doesn't exist; requires full implementation
- No bridge between recommendation output and database persistence
- XV4 logic and Piston Primacy partially specified
- Multi-persona system conflicts with "single voice" directive

🔧 **Action:** Approve Phase 1 foundation work, then gate Phase 2 on LiveClipboard design finalization.

---

**Prepared by:** Claude (AI Engineer)
**Date:** 2026-01-21
**Status:** READY FOR REVIEW
