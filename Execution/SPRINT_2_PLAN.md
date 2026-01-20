# 🎯 SPRINT 2 PLAN: The Navigation Split (Strategy vs Control)

**Status:** Ready for execution
**Dependency:** Sprint 1 complete ✅
**Duration:** 2-3 implementation phases
**Goal:** Refactor monolithic logic into focused journey stages

---

## 📋 Sprint 2 Deliverables Overview

### **Phase 1: Navigation Architecture**
- [MODIFY] TabNav.tsx — 6-tab manifest restoration
- [MODIFY] Layout routing structure — URL-based navigation

### **Phase 2: Strategy Tab (Setup)**
- [NEW] RaceStrategy.tsx — Standalone setup screen
- [NEW] LiveRC URL input field
- [NEW] Track/Vehicle matrix consolidation

### **Phase 3: Control Tab (Monitoring)**
- [NEW] RaceControl.tsx — Passive monitoring mode
- [NEW] Telemetry display (from LiveRCScraper)
- [NEW] "Start Debrief" button → Advisor handoff

---

## 🏗️ Architectural Flow: Sprint 2

```
TabNav (6 tabs)
├─ Garage (identity)
├─ Strategy (setup input + LiveRC URL)
├─ Control (passive monitoring + debrief trigger)
├─ Advisor (chat + debrief mode)
├─ Audit (performance comparison)
└─ Vault (session history + librarian)

Strategy → Control → Advisor → Vault
(linear journey through a race session)
```

---

## 📝 File-by-File Specifications

### **1. [MODIFY] TabNav.tsx**

**Current State:**
- 6 tabs exist but may have inconsistent naming
- Unclear tab ordering

**Required Changes:**
```typescript
const TABS = [
  { id: 'garage', label: 'Garage', icon: '🏠' },
  { id: 'strategy', label: 'Strategy', icon: '📋' },
  { id: 'control', label: 'Control', icon: '⚡' },
  { id: 'advisor', label: 'Advisor', icon: '🤖' },
  { id: 'audit', label: 'Audit', icon: '📊' },
  { id: 'vault', label: 'Vault', icon: '📚' },
];
```

**Routing Logic:**
- Tab selection updates URL (`?tab=strategy`)
- Persists selection in missionControlStore (or sessionStorage)
- Tab 3 (Control) shows only when session is locked/active

**Component Rendering:**
```typescript
const renderTab = (tabId: string) => {
  switch (tabId) {
    case 'garage': return <RacerGarage />;
    case 'strategy': return <RaceStrategy />;
    case 'control': return <RaceControl />;
    case 'advisor': return <AIAdvisor />;
    case 'audit': return <PerformanceAudit />;
    case 'vault': return <TheVault />;
    default: return null;
  }
};
```

**UI Changes:**
- Add border/highlight to active tab
- Disable "Control" tab until session is locked
- Use Bloomberg Terminal styling (green accent for active)

---

### **2. [NEW] RaceStrategy.tsx**

**Purpose:** Pre-race setup configuration

**Location:** `src/components/tabs/RaceStrategy.tsx`

**Key Sections:**

#### **A. Event Header**
```typescript
- Event name: [editable text]
- Session type: [dropdown: practice/qualifier/main]
- Track: [from TrackContext]
- Vehicle: [from selectedVehicle]
```

#### **B. LiveRC URL Input**
```typescript
- Input field: [paste LiveRC URL here]
- Validate: must contain "liverc.com" and "?p=view_event&id="
- On valid input: store in missionControlStore.setLiveRcUrl()
- Show feedback: "✓ URL valid" or "✗ Invalid LiveRC URL"
```

#### **C. Track/Vehicle Matrices** (consolidated)
```typescript
// TrackContextMatrix (already exists, integrate here)
- Surface: [loamy | hard_packed | clay]
- Traction: [1-10 slider]
- Temperature: [°F input]

// VehicleTechnicalMatrix (already exists, integrate here)
- Display current baseline_setup keys
- Allow inline editing (for tires, camber, springs, etc.)
```

#### **D. Action Buttons**
```typescript
- [Lock & Activate Session] button
  - Validates: racer + vehicle + track + liverc_url all set
  - On click:
    * setSessionStatus('active')
    * Enable Control tab
    * Auto-navigate to Control tab
- [Cancel] button → Back to Garage
```

**Wiring:**
```typescript
// Connect to stores
const { selectedRacer, selectedVehicle, liveRcUrl, setLiveRcUrl } = useMissionControlStore();
const { setSessionStatus } = useMissionControlStore();

// On mount: prefill with existing session data if editing
useEffect(() => {
  if (selectedSession) {
    setFormData({
      eventName: selectedSession.event_name,
      trackContext: selectedSession.track_context,
      liveRcUrl: missionControlStore.liveRcUrl,
    });
  }
}, [selectedSession]);
```

---

### **3. [NEW] RaceControl.tsx**

**Purpose:** Live monitoring & debrief trigger

**Location:** `src/components/tabs/RaceControl.tsx`

**Key Sections:**

#### **A. Session Lock Indicator**
```typescript
- Display: [Session ID] | [Racer Name] | [Vehicle] | [Track]
- Status badge: "🔒 LOCKED & ACTIVE" (green)
- Elapsed time: [timer since lock]
```

#### **B. Telemetry Live Feed** (optional polling)
```typescript
// Display current telemetry (if scraper has run)
const { sessionTelemetry, currentORP } = useMissionControlStore();

if (sessionTelemetry) {
  return (
    <div className="telemetry-display">
      <div>Laps: {sessionTelemetry.laps}</div>
      <div>Best Lap: {(sessionTelemetry.best_lap / 1000).toFixed(3)}s</div>
      <div>Average: {(sessionTelemetry.average_lap / 1000).toFixed(3)}s</div>
      <div>ORP Score: {currentORP?.orp_score || '--'}%</div>
      <div>Fade Factor: {currentORP?.fade_factor ? `${(currentORP.fade_factor * 100).toFixed(1)}%` : 'N/A'}</div>
    </div>
  );
}
```

#### **C. The Scribe** (1000 char textarea)
```typescript
<textarea
  maxLength={1000}
  placeholder="Describe the mechanical sensation (e.g., 'bouncy on triples', 'loose on mid-corner')."
  value={scribeFeedback}
  onChange={(e) => setScribeFeedback(e.target.value)}
/>
<div>{scribeFeedback.length} / 1000</div>
```

#### **D. Action Buttons**
```typescript
- [Scrape LiveRC] button
  - Calls: scrapeRaceResults(liveRcUrl, driverId)
  - Shows: status icon (success ✓ | stale ⚠ | error ✗)
  - Updates: sessionTelemetry + racerLapsSnapshot in store
  - On success: triggers calculateORP()

- [Start Debrief] button
  - Validates: telemetry exists && scribe feedback optional
  - Creates: SessionContext object
  - Calls: advisorStore.loadSessionContext()
  - Triggers: Auto-navigate to Advisor tab
  - Locks: RaceControl (no further edits)

- [Edit Setup] button
  - Opens modal for baseline_setup adjustments
  - Reflects Logical Tuning Hierarchy (TIRES → GEOMETRY → SHOCKS → POWER)
```

**Wiring:**
```typescript
const {
  selectedSession,
  liveRcUrl,
  sessionTelemetry,
  currentORP,
  setSessionTelemetry,
  setRacerLapsSnapshot,
  calculateORP,
} = useMissionControlStore();

const { loadSessionContext } = useAdvisorStore();

const handleScrapeAndCalculate = async () => {
  const result = await scrapeRaceResults(liveRcUrl, selectedRacer.id, sessionTelemetry);

  if (result.status === 'success') {
    setSessionTelemetry(result.data);

    // Extract racerLaps from page (need to pass full object)
    // This requires refactoring LiveRCScraper to return racerLaps too
    const racerLaps = await extractRacerLapsFromHTML(liveRcUrl);
    setRacerLapsSnapshot(racerLaps);

    calculateORP(selectedRacer.id);
    toast('✓ Telemetry loaded');
  } else {
    toast(`⚠ ${result.warning || 'Failed to scrape'}`);
  }
};

const handleStartDebrief = () => {
  const sessionContext: SessionContext = {
    telemetry: sessionTelemetry!,
    orp_score: currentORP!,
    fade_factor: currentORP?.fade_factor || null,
    current_setup_id: selectedSession.id,
    applied_setup_snapshot: structuredClone(selectedSession.actual_setup),
    racer_scribe_feedback: scribeFeedback,
  };

  loadSessionContext(sessionContext);
  navigateTo('advisor');
};
```

---

## ⚠️ Known Gaps & Dependencies

### **Gap 1: racerLaps Extraction**
- LiveRCScraper.ts returns `ScrapedTelemetry` (lap times) but not the full `racerLaps` object
- **Action Required:** Refactor LiveRCScraper to also return the extracted `racerLaps` object
- **Why:** Needed for `getGlobalTop5Average()` in calculateORP

### **Gap 2: Debrief Navigation**
- After "Start Debrief" is clicked, need to navigate to Advisor tab
- **Action Required:** Create navigation helper (e.g., `useNavigateTo(tabId)`)

### **Gap 3: Session State Transitions**
- Session status: `draft` → `active` (locked in Strategy) → `archived` (moved to Vault after Debrief)
- **Action Required:** Ensure missionControlStore + database stay in sync

---

## 🔄 Data Flow: Sprint 2

```
[RaceStrategy]
  ├─ Input: LiveRC URL
  ├─ Input: Track context + Vehicle selection
  └─ Action: Lock & Activate → sessionStatus = 'active'

[RaceControl]
  ├─ Display: Current session info
  ├─ Action: Scrape LiveRC
  │  └─ Updates: sessionTelemetry + racerLapsSnapshot
  │  └─ Triggers: calculateORP()
  │  └─ Displays: ORP score + Fade Factor
  ├─ Input: Racer Scribe feedback
  └─ Action: Start Debrief
     ├─ Creates: SessionContext (telemetry + ORP + setup + scribe)
     ├─ Calls: advisorStore.loadSessionContext()
     └─ Navigate: → Advisor tab

[Advisor] (existing, enhanced)
  ├─ Receives: System prompt injection (Debrief mode)
  ├─ Receives: ORP-driven clarifying questions
  └─ On complete: Session ready for Vault archival
```

---

## ✅ Definition of Done: Sprint 2

- [ ] TabNav shows 6 tabs in correct order
- [ ] RaceStrategy.tsx displays and accepts LiveRC URL
- [ ] RaceStrategy validates URL format before locking session
- [ ] RaceControl.tsx displays telemetry (best lap, avg lap, ORP score, fade factor)
- [ ] RaceControl has Scribe textarea (1000 char max)
- [ ] "Scrape LiveRC" button updates telemetry and calculates ORP
- [ ] "Start Debrief" button creates SessionContext and navigates to Advisor
- [ ] SessionContext is correctly injected into advisorStore
- [ ] Build passes with zero type errors
- [ ] Tab navigation (strategy → control → advisor) works seamlessly

---

## 📊 Effort Estimate by Component

| Component | Effort | Notes |
|---|---|---|
| TabNav refactoring | 30 min | Mostly renaming + routing |
| RaceStrategy.tsx | 90 min | LiveRC validation + matrix consolidation |
| RaceControl.tsx | 120 min | Telemetry display + Scribe + button logic |
| LiveRCScraper refinement | 30 min | Return racerLaps object in addition to telemetry |
| Navigation helpers | 20 min | useNavigateTo or similar |
| Testing & fixes | 60 min | Build verification + integration tests |
| **Total** | **~5 hours** | — |

---

## 🚀 Next Steps After Sprint 2

**Sprint 3 (Performance Audit):**
- PerformanceAudit.tsx — side-by-side ORP comparison, trend charts
- Session history UI

**Sprint 4 (Vault & Librarian):**
- TheVault.tsx — session archival + semantic search
- Librarian AI integration

---

## 📖 Reference: Logical Tuning Hierarchy (for UI hints)

When displaying setup parameters in RaceControl, organize by this hierarchy:

1. **TIRES**: `tire_compound`, `tire_insert`, `tread_pattern`
2. **GEOMETRY**: `camber`, `toe_in`, `ride_height`, `front_toe_out`
3. **SHOCKS**: `shock_oil`, `springs`, `front_sway_bar`, `rear_sway_bar`
4. **POWER**: `punch`, `brake`

*(This is conceptual guidance for UI labeling, not a code structure)*

---

**Status:** Ready to execute Sprint 2 🎯
