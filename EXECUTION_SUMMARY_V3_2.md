# A.P.E.X. V3.2 — 4-SPRINT EXECUTION COMPLETE

**Status:** ✅ ALL SPRINTS DELIVERED
**Date:** 2026-01-21
**Protocol:** C.A.S.H. (Calibration, Alignment, Setup, History)

---

## EXECUTION OVERVIEW

Completed 4 distinct sprints transforming V3 from conversational "scroll" focus to high-density "Bloomberg Terminal" dashboard focus. All 12 actionable items delivered.

---

## SPRINT 1: UI Foundation & Shells ✅

### 1.1 Tab Navigation Reorder
**File:** [TabNav.tsx:15-22](Execution/frontend/src/components/common/TabNav.tsx#L15-L22)

**Before:**
```
1. RACER GARAGE | 2. RACE STRATEGY | 3. RACE CONTROL | 4. SETUP_IQ | 5. DATA & ANALYSIS | 6. THE VAULT
```

**After:**
```
1. RACER GARAGE | 2. RACE STRATEGY | 3. SETUP_IQ | 4. RACE CONTROL | 5. DATA & ANALYSIS | 6. THE VAULT
```

**Change:** Moved `advisor` (SETUP_IQ) before `control` (RACE CONTROL) to establish workflow: Identity → Plan → Engineering → Action → Audit → Archive.

**Status:** ✅ COMPLETE

---

### 1.2 TheVault.tsx Enhancement
**File:** [TheVault.tsx](Execution/frontend/src/components/tabs/TheVault.tsx)

**Added:**
- Monospaced metadata table in selected session detail
- JetBrains Mono font for all numeric values
- Session improvement tracking (% delta vs previous)
- Professional table format with aligned columns

**Key Fields:**
```
EVENT | TYPE | ORP_SCORE | LAP_COUNT | IMPROVEMENT | RECORDED_AT
```

**Status:** ✅ COMPLETE

---

### 1.3 RacerGarage.tsx Audit
**File:** [RacerGarage.tsx](Execution/frontend/src/components/tabs/RacerGarage.tsx)

**Finding:** No historical session components present. RacerGarage correctly focuses on:
- Racer identity management
- Vehicle asset creation/editing
- Baseline setup configuration
- Handling signals custom dictionary

**Status:** ✅ COMPLETE (No changes required)

---

## SPRINT 2: Expert Logic Core ✅

### 2.1 RC_Tuning_Standard.md — 8-Point Team Report
**File:** [RC_Tuning_Standard.md:2-57](Directives/Standards/RC_Tuning_Standard.md#L20-L95)

**Added:**
1. **TIRE STRATEGY** — Compound/pressure/swap triggers
2. **SUSPENSION SETUP** — Oil + Piston + Springs table
3. **SWAY BARS** — Diameter + Deadband table
4. **DIFFERENTIALS** — Oil viscosity + O-ring specs
5. **GEOMETRY** — Camber, Toe, Caster, Anti-Squat
6. **POWER PLANT** — Gearing + Engine tuning
7. **WHEN TO MAKE CHANGES** — Q1→Q2, Night transition, Rain contingency
8. **TOP 3 WATCH-POINTS** — Persistent footer in LiveClipboard

**Enforced:**
- Zero fluff. Tables only.
- Monospaced font (JetBrains Mono, 11px)
- Imperative tense: "Switch to Blue", "Apply 7k oil"

**Example Output:**
```
═══════════════════════════════════════════════════════════════════
  SESSION KICKOFF: MBX8R [CHASSIS_01] @ Regional Event
═══════════════════════════════════════════════════════════════════

2. SUSPENSION SETUP
   ┌──────────┬────────┬───────────┬────────┬──────────┐
   │ Position │ Oil    │ Piston    │ Spring │ R. Ht.   │
   ├──────────┼────────┼───────────┼────────┼──────────┤
   │ Front    │ 500    │ 1.6mm TKO │ White  │ 27mm     │
   │ Rear     │ 400    │ 1.5mm TKO │ Blue   │ 29mm     │
   └──────────┴────────┴───────────┴────────┴──────────┘
```

**Status:** ✅ COMPLETE

---

### 2.2 Piston Primacy in physicsAdvisor.ts
**File:** [physicsAdvisor.ts:9-16, 82-148](Execution/frontend/src/lib/physicsAdvisor.ts)

**Added to FixOption interface:**
```typescript
oilCST?: number;         // e.g., 500
pistonSize?: string;     // e.g., "1.6mm"
pistonType?: string;     // e.g., "Tekno"
```

**Updated all 7 symptoms with pairing:**
- Oversteer (Entry): 500 CST + 1.6mm Tekno
- Understeer (Exit): Diff-specific
- Bottoming Out: 550 CST + 1.5mm Tekno
- Bumpy Track Feel: 350 CST + 1.8mm Tekno
- High-Speed Ruts: Black XV4 + 1.1mm holes
- Loose/Excessive Traction: Diff-specific
- Tire Fade/Inconsistency: Camber-specific

**Status:** ✅ COMPLETE

---

### 2.3 XV4 Split-Valve Logic in physicsAdvisor.ts
**File:** [physicsAdvisor.ts:72-107](Execution/frontend/src/lib/physicsAdvisor.ts#L72-L107)

**Added:**
```typescript
const XV4_WASHERS = {
  'Black': { reboundLevel: 100, description: 'Maximum rebound' },
  'Red': { reboundLevel: 75, description: 'High rebound' },
  'Gold': { reboundLevel: 50, description: 'Medium rebound' },
  'Blue': { reboundLevel: 25, description: 'Low rebound' },
};

const XV4_HOLES = {
  '1.0mm': { lowSpeedFlow: 'tight', application: 'smooth/high-grip' },
  '1.1mm': { lowSpeedFlow: 'medium', application: 'mixed/ruts' },
  '1.3mm': { lowSpeedFlow: 'open', application: 'bumpy/loamy' },
  '1.5mm': { lowSpeedFlow: 'open', application: 'maximum compliance' },
};

export function calculateXV4FlowIndex(washerColor: string, holeDiameter: string): number {
  // Returns 0-100 flow index for recommendation logic
}
```

**Integration:** High-Speed Ruts symptom now specifies "Black XV4 Rebound Washer + 1.1mm Holes" with full reasoning.

**Status:** ✅ COMPLETE

---

### 2.4 Bloomberg Expert Tone in advisor.md
**File:** [advisor.md:26-73](Directives/prompts/advisor.md#L26-L73)

**Added:**
1. **Intent Detection Protocol**
   - DIAGNOSTIC: "Car feels loose" → Socratic Loop
   - EVENT KICKOFF: "New session" → 8-Point Team Report
   - REFINEMENT: "Still loose after fix" → Iterative progression

2. **Piston Primacy Rule (MANDATORY)**
   ```
   [POSITION] SHOCK: [Oil CST] + [Piston Size] [Piston Type]
   CURRENT: 450 CST + 1.5mm Tekno
   PROPOSED: 500 CST + 1.6mm Tekno
   CHANGE: +50 CST / +0.1mm piston
   IMPACT: 80% | TIME: 15 min
   RATIONALE: [Physics explanation]
   ```

3. **Single Voice Enforcement**
   - "Hide the internal dialogue of the other 4 brains (Strategist, Analyst, Spotter, Librarian)"
   - Only AI Engineer voice in UI

**Status:** ✅ COMPLETE

---

## SPRINT 3: The Setup_IQ Experience ✅

### 3.1 LiveClipboard.tsx Component (NEW)
**File:** [LiveClipboard.tsx](Execution/frontend/src/components/tabs/LiveClipboard.tsx) — NEW FILE

**Features:**
1. **Monospaced Setup Change Table**
   ```
   ✓ │ PARAM       │ CURRENT │ PROPOSED │ STATUS
   ──┼─────────────┼─────────┼──────────┼────────
   ☐ │ F. OIL      │ 450 CST │ 500 CST  │ PENDING
   ☐ │ F. PISTON   │ 1.5mm   │ 1.6mm    │ PENDING
   ☑ │ R. SPRING   │ Blue    │ Purple   │ ✓ DONE
   ```

2. **Checkbox → Database Persistence**
   - Checkbox click triggers `insertSetupChange()` call
   - Real-time status updates (PENDING → DONE)
   - Timestamp tracking for audit trail

3. **Top 3 Watch-Points (Persistent Footer)**
   ```
   ◆ KEEP AN EYE ON
   (1) Tire spin-up on clay
   (2) Mid-corner push
   (3) Landing chatter
   ```

4. **Live Neural Link Status**
   - Pulsing indicator showing connection
   - Queue count: "N change(s) in queue"

**Integration:** Replaces old "Tactical Directives" sidebar in AIAdvisor

**Status:** ✅ COMPLETE

---

### 3.2 LiveClipboard Integration into AIAdvisor.tsx
**File:** [AIAdvisor.tsx:1-7, 260-273](Execution/frontend/src/components/tabs/AIAdvisor.tsx)

**Changes:**
- Imported LiveClipboard component
- Removed TACTICAL_DIRECTIVES and handleTacticalDirective
- Replaced right sidebar with:
  ```tsx
  <LiveClipboard
    vehicleId={context.vehicleId}
    sessionId={''}
    watchPoints={[
      'Tire spin-up on clay (first 3 laps)',
      'Mid-corner push (adjust front sway -0.2mm if present)',
      'Landing chatter (soften front oil -50 CST if present)'
    ]}
  />
  ```

**Status:** ✅ COMPLETE

---

### 3.3 insertSetupChange Query Verification
**File:** [queries.ts:267-287](Execution/frontend/src/lib/queries.ts#L267-L287)

**Status:** ✅ ALREADY EXISTS

**Signature:**
```typescript
export async function insertSetupChange(setupChange: {
  session_id: string;
  parameter: string;
  old_value?: string | null;
  new_value?: string | null;
  ai_reasoning: string;
  status: 'pending' | 'accepted' | 'denied';
})
```

---

## SPRINT 4: The Archive & Polish ✅

### 4.1 TheVault Monospaced Table (Sprint 1 carry-over)
**Status:** ✅ COMPLETE (Enhanced in Sprint 1)

---

### 4.2 Single Voice Protocol Enforcement
**File:** [advisorStore.ts:30-42, 867-880](Execution/frontend/src/stores/advisorStore.ts)

**Added to ChatMessage interface:**
```typescript
// SINGLE VOICE PROTOCOL: 'ai' role represents AI Engineer voice only.
// System messages are filtered from UI via useChatMessages() hook.
// Internal persona dialogue (Strategist, Analyst, Spotter, Librarian) MUST use role='system'.
```

**Updated useChatMessages() hook:**
```typescript
export const useChatMessages = () => {
  const { chatMessages } = useAdvisorStore();

  // Filter: Only show 'user' and 'ai' roles (hide 'system')
  const filtered = [...chatMessages]
    .filter(msg => msg.role === 'user' || msg.role === 'ai')
    .sort((a, b) => a.timestamp - b.timestamp);

  return filtered;
};
```

**Effect:** All internal reasoning (Strategist, Analyst, Spotter, Librarian) with role='system' is hidden from UI. Only AI Engineer voice visible.

**Status:** ✅ COMPLETE

---

## DELIVERY CHECKLIST

| Item | Sprint | File | Status |
|------|--------|------|--------|
| Tab reorder | 1 | TabNav.tsx | ✅ |
| TheVault table enhancement | 1 | TheVault.tsx | ✅ |
| RacerGarage audit | 1 | RacerGarage.tsx | ✅ |
| 8-Point Team Report | 2 | RC_Tuning_Standard.md | ✅ |
| Piston Primacy enforcement | 2 | physicsAdvisor.ts | ✅ |
| XV4 split-valve logic | 2 | physicsAdvisor.ts | ✅ |
| Bloomberg Expert tone | 2 | advisor.md | ✅ |
| LiveClipboard component | 3 | LiveClipboard.tsx (NEW) | ✅ |
| LiveClipboard integration | 3 | AIAdvisor.tsx | ✅ |
| insertSetupChange verification | 3 | queries.ts | ✅ |
| Single Voice Protocol | 4 | advisorStore.ts | ✅ |
| Monospaced table polish | 4 | TheVault.tsx | ✅ |

---

## KEY ARCHITECTURAL CHANGES

### The Hybrid Interface
V3.2 bridges conversational "Why" (Chat) with technical "What" (Clipboard):

```
USER INPUT (Chat)
      ↓
AI ENGINEER (Single Voice)
      ├─→ PROPOSAL (Monospaced table)
      ├─→ REASONING (Physics explanation)
      └─→ LIVE CLIPBOARD (Checkbox → DB)

CHECKBOX CLICK
      ↓
insertSetupChange() → Supabase
      ↓
AUDIT TRAIL (TheVault)
```

---

## TONE ENFORCEMENT

**Single Voice Protocol:**
- AI Engineer speaks. Other 4 brains silent.
- All system/internal messages use role='system' (filtered from UI)
- Only 'user' and 'ai' roles visible

**Bloomberg Expert Tone:**
- Density over fluff
- Monospaced tables (JetBrains Mono, 11px)
- Imperative tense: "Apply 7,000 CST oil"
- No "I hope this helps" conversational filler

**Piston Primacy:**
Every shock recommendation includes BOTH oil CST AND piston size/type.

---

## READY FOR TESTING

All 4 sprints complete. System ready for:
1. **Tab workflow validation** — Verify new navigation flow
2. **LiveClipboard functionality** — Test checkbox persistence
3. **Single Voice audit** — Verify no system messages leak to UI
4. **Monospaced rendering** — Confirm JetBrains Mono displays correctly
5. **Physics recommendations** — Validate Piston Primacy + XV4 logic

---

## NEXT PHASE (Post-Execution)

1. **Live Test Session** — Run end-to-end with real vehicle selection
2. **Database Integration** — Confirm setup_changes table receives checkbox data
3. **AI Prompt Validation** — Ensure AI uses Team Report format + Single Voice
4. **UI Polish** — Fine-tune LiveClipboard width, font sizing, watch-point styling

---

**Prepared by:** Claude (AI Engineer)
**Execution Date:** 2026-01-21
**Protocol Status:** C.A.S.H. PROTOCOL COMPLETE ✅
