# Phase 4: Frontend Framework Implementation Plan

**Architect Directive**: Stage 2 - Frontend Framework
**Status**: READY TO EXECUTE
**Reference Mockups**:
- v29_complete_unified_command.html (Tab 2 - Race Control)
- v31_ai_advisor_complete.html (Tab 3 - AI Advisor)

---

## Critical Design Specifications (From Mockups)

### CSS Variables (Foundation)
```css
--apex-dark: #0A0A0B              /* Background */
--apex-surface: #121214           /* Panel backgrounds */
--apex-blue: #2196F3              /* Pre-session (Setup) */
--apex-red: #E53935               /* Active session */
--apex-green: #4CAF50             /* Positive signals */
--apex-silver: #B0BEC5            /* Secondary text */
--apex-white: #FFFFFF             /* Primary text */
--apex-border: rgba(255,255,255,0.08)  /* Borders */
--font-size-base: 19px            /* Base font size */
--apex-font-mono: 'JetBrains Mono'
```

### Color Logic (Critical)
- **BLUE (#2196F3)**: Pre-session setup mode (all toggles/inputs)
- **RED (#E53935)**: Active session mode + Headers/Section Titles (always)
- **GREEN (#4CAF50)**: Positive signals (mic button glow, status indicators)
- **GLASS**: rgba(255, 255, 255, 0.02) background for all panels

---

## Phase 4 Implementation Sequence

### Stage 2.1: Tab 1 - Paddock Operations
**Priority**: HIGH (Foundation)
**Complexity**: LOW (mostly refactor)
**Time**: ~2-3 hours

#### Tasks:
1. Create `frontend/src/components/tabs/RacerGarage.tsx`
2. Rename label: "Mission Control" → "Racer Garage"
3. Migrate EventIdentity.tsx as the main component
4. Implement Class Registry sidebar:
   - Input field for class name
   - Add/Delete buttons
   - List of existing classes (fetched from DB)
   - Styling: Terminal-style, monospace, compact

#### Component Structure:
```
RacerGarage.tsx
├── Header
│   ├── Red brand (◆ RACER GARAGE)
│   └── Status indicators
├── EventIdentity.tsx (existing - no changes)
│   ├── Fleet Configuration (Green ◆)
│   └── Vehicle Status (Blue ◆)
└── ClassRegistry (NEW sidebar)
    ├── Input: "Add Class"
    ├── List: Classes with delete buttons
    └── Fetches from: classes table
```

#### Database Integration:
- Query: `SELECT * FROM classes WHERE profile_id = selectedRacer.id`
- Insert: `INSERT INTO classes (profile_id, name) VALUES (...)`
- Delete: `DELETE FROM classes WHERE id = ...`

---

### Stage 2.2: Tab 2 - Unified Race Control
**Priority**: HIGH (Core functionality)
**Complexity**: HIGH (state machine + matrices)
**Time**: ~4-5 hours

#### Reference: mockup_v29_complete_unified_command.html

#### Key Architectural Features:

##### State Machine: BLUE ↔ RED
```
Initial State: BLUE (Pre-Session)
├── All inputs/toggles: BLUE (#2196F3)
├── Headers: RED (#E53935)
└── User can configure everything

Transition: SessionLockSlider → 90% drag = Lock
Trigger: onDeploy() callback
└── SessionLockSlider deploys (existing logic)

Active State: RED (Session Running)
├── All inputs/toggles: RED (disabled/read-only)
├── Headers: RED (unchanged)
├── Track data: Live updates
└── Can only view, not edit
```

##### Data Density Requirements:

**16-Parameter Track Context Matrix (BLUE mode)**
- Scale (e.g., "1:10", "1:8")
- Grip (e.g., "Medium", "High", "Low")
- Material (e.g., "Clay", "Carpet", "Dirt")
- Temperature (e.g., "85°F")
- [And 12 more parameters from mockup]

**9-Point Vehicle Technical Matrix (BLUE mode)**
- Shock Oil (Front/Rear)
- Anti-roll Bar Setting
- Differential
- Tire Pressure
- Suspension Height
- Spring Rate
- Camber
- Toe-In
- [+ 1 more]

##### Component Structure:
```
UnifiedRaceControl.tsx (NEW)
├── State: mode = "BLUE" | "RED"
├── BLUE Mode (Pre-Session)
│   ├── Track Context Matrix (16 inputs)
│   ├── Vehicle Technical Matrix (9 inputs)
│   ├── Class Registry (dropdown)
│   └── SessionLockSlider (bottom)
│       └── onDeploy() → setMode("RED")
└── RED Mode (Active Session)
    ├── TrackIntelligence (live ticker + grid)
    ├── Setup Changes Feed
    └── Live data display (read-only)
```

#### Logic Reuse:
- **SessionLockSlider**: Use existing component (no changes)
  - Triggers transition: BLUE → RED
  - Calls createSession() on deploy
- **TrackIntelligence**: Use existing component
  - Display live track data in RED mode
  - Pull from selectedSession.track_context

#### Database Integration:
- Read BLUE mode: selectedVehicle.baseline_setup (pre-session config)
- On Deploy: createSession() writes session + track_context to DB
- Read RED mode: selectedSession.track_context (live updates)

---

### Stage 2.3: Tab 3 - AI Advisor (Command Chat)
**Priority**: HIGH (User-facing)
**Complexity**: VERY HIGH (chat UI + voice + context)
**Time**: ~5-6 hours

#### Reference: mockup_v31_ai_advisor_complete.html

#### Key Architectural Features:

##### Command Chat Interface
```
Layout:
┌─ Left Sidebar (240px) ──────────────────┐
│ • Dynamic Configuration                 │
│   - Vehicle Context dropdown            │
│   - Dynamic data bindings               │
└─────────────────────────────────────────┘
┌─ Center Chat (Flex) ────────────────────┐
│ • High-density message stream           │
│   - AI (Red Avatar)                     │
│   - User (Dark Avatar)                  │
│ • Input area (19px base font)           │
│   - Text input (Blue until focused)     │
│   - Mic button (GREEN glow)             │
│   - Send button                         │
└─────────────────────────────────────────┘
┌─ Right Sidebar (260px) ─────────────────┐
│ • Tactical Directives                   │
│   - Pre-selected symptom buttons        │
│   - User Concepts (dashed area)         │
└─────────────────────────────────────────┘
```

##### Voice Input Implementation
```
Microphone Button Requirements:
- Color: GREEN (#4CAF50)
- Glow effect: rgba(76, 175, 80, 0.3)
- Size: Consistent with input area
- Behavior:
  • Click to start recording
  • Click again to stop
  • Transcribe to text
  • Insert into input field
```

##### Persistent Context Deck (Sidebar)
```
Dynamic Configuration:
├── Vehicle Context
│   └── <select> Dropdown
│       ├── Option: Buggy
│       └── Option: Truggy
│
└── Dynamic Data Bindings
    └── Updates based on selected vehicle:
        • Tire compound
        • Suspension setup
        • Current lap time
        • Ambient conditions
```

##### Tactical Directives (Right Rail)
```
Pre-Selected Buttons:
├── "Loose Rear End"
├── "Oversteer"
├── "Bottoms Out"
├── "Understeer"
└── [more from Socratic loop symptoms]

User Concepts (Dashed Area):
└── Area for custom user inputs
```

##### Component Structure:
```
AIAdvisor.tsx (NEW)
├── Left Sidebar: ContextDeck
│   ├── VehicleContextSelector
│   └── DynamicConfigurationList
├── Center: ChatInterface
│   ├── MessageStream
│   │   ├── AIMessage (Red avatar)
│   │   └── UserMessage (Dark avatar)
│   └── InputArea
│       ├── TextInput (Blue focused)
│       ├── MicrophoneButton (Green glow)
│       └── SendButton
└── Right Rail: TacticalDirectives
    ├── SymptomButtons
    └── UserConceptsArea

Imports (Phase 2.1 reuse):
├── advisorStore (Socratic loop logic)
├── ChatMessage.tsx (existing)
├── ProposalCard.tsx (existing)
└── ProposalCardsContainer.tsx (existing)
```

#### Logic Reuse:
- **Socratic Loop State Machine**: Use existing advisorStore
  - Same conversation phases (symptom → clarifying → proposal)
  - Same physics guardrails
  - Same institutional memory checks
- **Chat Components**: Wrap existing message/proposal components
  - Use ChatMessage for history display
  - Use ProposalCard for recommendation display
- **Data Binding**: Pull from selectedVehicle and racer sponsors

#### Sponsor-Based Filtering (Backend Ready):
```
// From racer_profile.sponsors JSONB
sponsors: [
  { brand: "JConcepts", category: "Tires" },
  { brand: "Castle", category: "Motor" }
]

// SetupAdvisor.py should filter:
if racer.sponsors.contains("JConcepts"):
  recommend("JConcepts tires for this condition")
```

---

## Implementation Checklist

### Pre-Implementation
- [ ] Read mockup_v29_complete_unified_command.html in browser (see full layout)
- [ ] Read mockup_v31_ai_advisor_complete.html in browser (see chat UI)
- [ ] Create CSS variables in global stylesheet
- [ ] Update TabNav.tsx with new tab labels

### Tab 1: Racer Garage
- [ ] Create RacerGarage.tsx
- [ ] Import EventIdentity.tsx (no changes)
- [ ] Create ClassRegistry.tsx component
- [ ] Wire database queries (classes table)
- [ ] Test: Add/delete classes, racer selection
- [ ] Style: Match mockup colors and spacing

### Tab 2: Unified Race Control
- [ ] Create UnifiedRaceControl.tsx
- [ ] Create state machine: mode = BLUE | RED
- [ ] Create TrackContextMatrix.tsx (16 parameters)
- [ ] Create VehicleTechnicalMatrix.tsx (9 parameters)
- [ ] Integrate SessionLockSlider (existing)
- [ ] Integrate TrackIntelligence (existing)
- [ ] Wire: BLUE mode reads vehicle.baseline_setup
- [ ] Wire: BLUE→RED transition calls createSession()
- [ ] Wire: RED mode reads session.track_context
- [ ] Test: Complete BLUE→RED workflow

### Tab 3: AI Advisor
- [ ] Create AIAdvisor.tsx
- [ ] Create ContextDeck.tsx (sidebar)
- [ ] Create ChatInterface.tsx (message stream)
- [ ] Create TacticalDirectives.tsx (right rail)
- [ ] Create MicrophoneButton.tsx (Green glow)
- [ ] Integrate advisorStore (existing Socratic loop)
- [ ] Integrate ChatMessage + ProposalCard (existing)
- [ ] Wire: Vehicle context selector
- [ ] Wire: Dynamic configuration updates
- [ ] Wire: Sponsor-based recommendation filtering
- [ ] Test: Chat flow with proposals

### Tab Navigation
- [ ] Update TabNav.tsx labels
- [ ] Update routing logic
- [ ] Hide/show tabs conditionally
- [ ] Test: Navigation between all 5 tabs

### Styling & Polish
- [ ] Apply CSS variables throughout
- [ ] Verify 19px base font size
- [ ] Verify Glassmorphism (rgba glass backgrounds)
- [ ] Verify color coding (BLUE pre-session, RED active)
- [ ] Test responsive layouts
- [ ] Verify monospace fonts (JetBrains Mono)

### Testing
- [ ] End-to-end: Create racer → Vehicle → Class → Session → Active
- [ ] Verify BLUE mode all editable
- [ ] Verify RED mode read-only
- [ ] Verify data persists in database
- [ ] Console: Zero errors
- [ ] Browser: All UI responsive

---

## Critical Implementation Details

### Font Scaling (From Mockup)
```
STRICT REQUIREMENT: 19px base font size for inputs and chat text

In Tailwind, create custom size:
<Input className="text-lg font-base" style={{fontSize: '19px'}} />

OR update tailwind.config.js:
fontSize: {
  base: '19px',  // Override default 16px
  ...
}
```

### Glassmorphism Pattern
```
Every panel background must use:
backgroundColor: rgba(255, 255, 255, 0.02)
OR
className="bg-white bg-opacity-2"  (if Tailwind allows)
```

### State Machine Pattern (BLUE ↔ RED)
```
// In UnifiedRaceControl.tsx
const [mode, setMode] = useState<'BLUE' | 'RED'>('BLUE');

// SessionLockSlider onDeploy callback
const handleDeploy = async () => {
  const session = await createSession(...);
  setMode('RED');
  setSelectedSession(session);
}

// Conditional rendering
{mode === 'BLUE' && (
  <div className="text-apex-blue">
    {/* All inputs BLUE, editable */}
  </div>
)}

{mode === 'RED' && (
  <div className="text-apex-red">
    {/* All inputs RED, read-only */}
  </div>
)}
```

### Component Migration (Controlled Integration)
```
DO NOT REWRITE:
- SessionLockSlider.tsx (use as-is)
- TrackIntelligence.tsx (use as-is)
- advisorStore.ts (use as-is)
- ChatMessage.tsx (use as-is)
- ProposalCard.tsx (use as-is)

WRAP them in new shells:
UnifiedRaceControl.tsx
├── Uses SessionLockSlider
└── Uses TrackIntelligence

AIAdvisor.tsx
├── Uses advisorStore
├── Uses ChatMessage
└── Uses ProposalCard
```

---

## File Structure After Phase 4

```
frontend/src/components/
├── tabs/
│   ├── RacerGarage.tsx (NEW - Tab 1)
│   ├── UnifiedRaceControl.tsx (NEW - Tab 2)
│   ├── AIAdvisor.tsx (NEW - Tab 3)
│   └── [Battery, Signal, Sync tabs - existing]
├── sections/
│   ├── EventIdentity.tsx (unchanged)
│   ├── SessionLockSlider.tsx (unchanged)
│   ├── TrackIntelligence.tsx (unchanged)
│   └── BaselineInitialization.tsx (unchanged)
├── advisor/ (for Tab 3)
│   ├── ChatMessage.tsx (unchanged)
│   ├── ProposalCard.tsx (unchanged)
│   ├── ContextDeck.tsx (NEW)
│   ├── ChatInterface.tsx (NEW)
│   ├── TacticalDirectives.tsx (NEW)
│   └── MicrophoneButton.tsx (NEW)
└── common/
    ├── TabNav.tsx (updated with new labels)
    └── ClassRegistry.tsx (NEW - for Tab 1)
```

---

## Success Criteria

### Functionality
- ✅ All 3 tabs render without errors
- ✅ Navigation between tabs works
- ✅ BLUE mode: All inputs editable
- ✅ RED mode: All inputs read-only
- ✅ Session lock slider transitions BLUE→RED
- ✅ Chat interface accepts messages
- ✅ Data persists to database

### Styling
- ✅ 19px base font size on inputs
- ✅ BLUE color in pre-session mode
- ✅ RED color in active mode and headers
- ✅ GREEN glow on microphone button
- ✅ Glassmorphism rgba(255,255,255,0.02) on all panels
- ✅ JetBrains Mono for terminal-style text
- ✅ Responsive grid layouts

### Code Quality
- ✅ No console errors
- ✅ Phase 2.1 components unchanged
- ✅ All new components follow existing patterns
- ✅ Database queries typed correctly
- ✅ State management centralized in stores

---

## Architect Review Points

Before starting implementation, confirm:

1. ✅ CSS variables defined with correct hex colors
2. ✅ 19px base font size enforced
3. ✅ Glassmorphism rgba values correct
4. ✅ BLUE/RED logic mapped to state machine
5. ✅ Phase 2.1 components identified for reuse
6. ✅ Database schema supports all new features
7. ✅ Mockups studied and layout understood

---

## Next Action

**START**: Tab 1 (Paddock Operations) - Foundation layer
**THEN**: Tab 2 (Unified Race Control) - Core state machine
**FINALLY**: Tab 3 (AI Advisor) - User-facing chat

Ready to implement Stage 2.
