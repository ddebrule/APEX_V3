# A.P.E.X. Roadmap: Phase 2 & Beyond

This document tracks the strategic evolution of the AGR APEX system beyond the v1.0 foundational build.

**Current Status**: v1.8.7 | Phase 4.4 Complete | Phase 4.3 Complete | Phase 5.1 Integrated | Multi-Racer Ready

---

## **NEW** Phase 2.5: Institutional Memory - The Digital Setup Binder
*Focus: AI that learns from YOUR racing history.*

### 1.5 UI/UX Design Standards (COMPLETE v1.8.3)
*Focus: Formalizing the UI/UX standards for a calm, intuitive experience.*
- [x] **Design Directive**: Created `Directives/design_standards.md` to codify the "Race Engineer Cockpit" philosophy.
- [x] **Theme Standards**: Established protocol for Global Theming via `.streamlit/config.toml`.
- [x] **Visual Prompting**: Formalized "Make it look like this" workflow for rapid iteration.

### The Core Innovation
Traditional RC setup tools are stateless - they don't remember what worked. A.P.E.X. now has **Institutional Memory**: the AI equivalent of a veteran racer's 30-year setup binder, but with the ability to cross-reference, pattern-match, and reason about physics.

### 2.5.1 Historical Context Engine
- [x] **Track-Specific Memory**: "Last time at Thunder Alley, you ran X setup and got Y lap times"
- [x] **Condition Matching**: "In similar high-traction, bumpy conditions, these changes worked"
- [x] **Success Pattern Recognition**: Prioritizes recommendations with proven track records
- [x] **Failure Context Awareness**: Knows what accepted changes made things worse (and why)

### 2.5.2 Intelligent Denial Handling
- [x] **Denial ≠ Bad Recommendation**: System understands racers deny changes for many reasons (missing parts, time constraints) - not because the change is wrong
- [x] **Session-Aware**: Denied recommendations are skipped for THIS session only
- [x] **Long-Term Learning**: Only accepted changes that resulted in slower lap times are flagged as failures

### 2.5.3 Balance-Aware Reasoning
- [x] **Connected System Philosophy**: The car is a system seeking balance between speed and control
- [x] **Full Setup Context**: When a change failed, the AI sees the entire setup at that moment
- [x] **Complementary Adjustments**: A change that failed in one balance may succeed in another

### 2.5.4 X-Factor Protocol (COMPLETE v1.6.0)
*The "black box" that converts driver feel into searchable data*

The X-Factor Protocol is a structured post-event audit that completes the learning loop. It transforms subjective driver feedback into objective, indexed performance data.

**Trigger**: Session closeout (Tab 4) at end of race event (1-7 days)

**Protocol Flow**:
- [x] **Rating**: 1-5 performance scale at session close
- [x] **Symptom Capture (1-2 ratings)**: Front-end wash, Rear loose, Stability, Rotation
- [x] **Gain Capture (4-5 ratings)**: Corner Entry, Exit, Jumping/Landing, Consistency
- [x] **Final Observation**: Voice or text note for the "binder"

**Implementation** (v1.6.0):
- `x_factor_service.py`: Audit state machine
- `session_service.py`: Multi-day session persistence
- Tab 4 UI: Step-by-step audit wizard
- Database: `x_factor_audits` table with rating, symptom, gain, observation
- Integration: `history_service.py` queries by rating for AI context

### Why This Matters (Marketing Highlights)
- **Your AI Gets Smarter Over Time**: Every session teaches the system what works for YOUR driving style
- **Track Knowledge Retention**: Never forget what worked at a specific track
- **Condition Pattern Library**: Build a database of what works in specific conditions
- **Eliminate Repeat Mistakes**: The AI won't recommend changes that actually made things worse
- **Veteran Knowledge, Zero Experience Required**: New racers get the benefit of accumulated wisdom

---

## Phase 2: Integrated Intelligence
*Focus: Real-time telemetry and sensory inputs.*

### 2.0 Optimized Scribe (COMPLETE v1.7.0)
*"The Flight Recorder" - No wake words, just speak*
- [x] **Automatic Keyword Detection**: 11 technical racing terms auto-detected in ALL transcripts
- [x] **Visual Highlighting**: Critical feedback (Bottoming, Wash, Stability) marked with 🔴
- [x] **Performance Tracking**: Loose, Traction, Rotation, Consistency marked with ⚡
- [x] **Track Insights**: Entry, Exit, Jump, Land marked with 🏁
- [x] **Enhanced Logging**: Keywords column in track_logs for searchable insights
- [x] **Wake-Word Deprecation**: No manual triggers needed, natural speech only

### 2.1 LiveRC Data Harvester
- [x] Develop a scraper/API client for LiveRC.com.
- [x] Automatically extract Heat/Main results (Pace, Consistency, Rank).
- [x] Map telemetry data to the `Setup Advisor` for automated performance analysis.
- [x] **Real-Time Event Monitoring**: Scan entire event schedules and track racer progress (Upcoming vs. Done).

### 2.2 AI Vision Engine (Track & Tires)
- [x] Implement multimodal support for photo/video uploads.
- [x] **Track Walk Analysis**: AI recognizes ruts, surface texture, and moisture.
- [x] **Tire Wear Analysis**: AI identifies wear patterns (camber wear, excessive spin) to suggest pivots.

### 2.3 The "Digital Twin" Evolution
- [x] Formalize the `actual_setup` state persistence across sessions.
- [x] Implement a "Drift Analysis" tool (How far is current setup from Baseline?).
- [x] Automatic state updates: "Accepting" a recommendation updates the Digital Twin instantly.

### 2.4 Dynamic Fleet Management & Production Readiness
- [x] Move vehicle registration to the Racer Profile (Sidebar).
- [x] Implement "Universal Blank" baseline initialization for new chassis.
- [x] Dynamic selection menus across all tabs powered by the user's fleet.

## Phase 3: Pro-Level Reporting & Automation
*Focus: Outreach and administrative efficiency.*

### 3.1 Advanced Race Report Generator
- [x] Multi-format output (Facebook/Instagram, Sponsor Email, PDF).
- [x] Automatic Sponsor @mentioning based on `RacerProfile`.
- [ ] Deep Link integration (Share direct to social hooks).

### 3.2 Automated Email Distribution (COMPLETE v1.7.0)
- [x] Integration with SMTP/SendGrid infrastructure (Ready to plug-in).
- [x] Full automation (Send on race completion trigger).
- [x] UI toggle for enabling/disabling auto-reports.
- [x] Enhanced email content with comprehensive race summary.

### 3.3 Race Prep Plan Generator (COMPLETE v1.6.0)
*"Win the race before you arrive at the track"*

Most racers know their race calendar weeks or months in advance. The Race Prep Plan transforms event registration (Tab 1) into a strategic preparation document.

**Trigger**: After entering event details in Tab 1, system offers: "Would you like a Race Prep Plan?"

**Plan Contents** (AI-generated, leveraging Institutional Memory):
- [x] **Strategic Overview**: Goals for the event, realistic expectations based on historical performance at this track/conditions
- [x] **Track Intelligence**: What the AI knows from your past sessions + Master Library baselines
- [x] **Recommended Starting Setup**: Best baseline for expected conditions, informed by history
- [x] **Mechanical Checklist**: Pre-race maintenance items (shock rebuilds, diff service, wear items)
- [x] **Parts & Consumables List**: What to bring based on conditions (tire compounds, shock oils, spare parts)
- [x] **Practice Session Strategy**: What to focus on in each practice run
- [x] **Contingency Notes**: "If conditions change to X, pivot setup toward Y"

**Output**: PDF format for printing or email to racer

**Implementation** (v1.6.0):
- `prep_plan_service.py`: Data compilation and AI orchestration
- `pdf_generator.py`: Professional PDF generation with AGR branding
- Tab 1 UI: Prep plan offer after session lock, download button
- AI prompt: `get_prep_plan_prompt()` for strategic content generation

**Why This Matters**:
- Preparation is where races are won or lost
- Forces strategic thinking before arriving at the track
- Eliminates "I forgot to bring..." moments
- Leverages Institutional Memory BEFORE race day (proactive, not reactive)
- Professional-grade race weekend planning

## Phase 4: Team Intelligence & Benchmarking
*Focus: Collaborative data and community insights.*

### 4.1 Master Chassis Library (COMPLETE v1.8.6)
- [x] Brand/Vehicle registration in Racer Profile (Brand + Model fields).
- [x] Template analysis (Tekno NB48/NT48 PDFs received).
- [x] Global repository of "Pro Baselines" for all major tracks (Infrastructure ready).
- [x] **Hybrid Parsing Engine**: PDF form extraction (4 brands: Tekno, Associated, Mugen, Xray) + AI Vision for scanned sheets.
- [x] One-click import for community-verified setups.
- [x] **Stage 1**: Precision PDF AcroForm parsing for all major brands.
- [x] **Stage 2**: AI Vision fallback for photos of physical setup sheets.
- [x] Save parsed setups to Master Library with metadata.
- [x] **Streamlit Compatibility Fix (v1.8.6)**: Upgraded Streamlit 1.32.0 → 1.39.0 to support `use_container_width` parameter in st.image().

### 4.2 Pro Setup Benchmarking ("Compare & Copy") - **75% COMPLETE** (Sprints 1-3 Done, Sprint 4 Pending)

**Sprint 1 Complete** ✅ - Binary comparison engine with vehicle filtering
- [x] **Same Brand/Model Constraint**: Comparison only allowed between identical cars (e.g., Tekno NB48 2.2 vs. Tekno NB48 2.2) to ensure geometry matches.
- [x] **Tab 5 Integration**: Compare Mode checkbox with vehicle selection (session-based or manual).
- [x] **"Spot the Difference" Visualization**: Side-by-side comparison with binary color coding (🟢 match / 🔴 different).
- [x] **Binary Comparison Logic**: Simple match/different status without severity scoring.
- [x] **Database Migration**: Added `driver_name` column to `master_library` for racer organization.

**Sprint 2 Complete** ✅ - Field-ready upload workflow with verification (CRITICAL for field use)
- [x] **Verification Screen**: Edit all 24 parameters inline after AI parsing (catches AI mistakes before save).
- [x] **Enhanced Metadata Form**: Capture track, racer name, date, condition, source type, notes (organized Vehicle → Track → Date → Racer).
- [x] **Fixed Save-to-Library**: Calls proper `add_baseline()` method with complete metadata (was previously broken).
- [x] **CSV Fallback Support**: Added `driver_name` column to CSV schema for local development.
- [x] **Type-Aware Editing**: Integer/float/text inputs with sensible step values and format precision.

**Sprint 3 Complete** ✅ - Package copy system with edit-before-apply workflow
- [x] **Package Copy Service**: Core staging and application logic (202 lines, fully testable).
- [x] **Copy Buttons**: One per package in comparison view (Suspension, Geometry, Diffs, Tires, Power).
- [x] **Full-Screen Staging Modal**: Edit parameters before applying to Digital Twin.
- [x] **Type-Aware Parameter Inputs**: Integer (step=50), Float (step=0.1), Text inputs.
- [x] **Change Summary**: Shows "3 of 8 parameters will change" before confirming.
- [x] **Apply to Digital Twin**: Updates actual_setup immediately with feedback.
- [x] **Unit Tests**: 25/25 tests passing (100% coverage).

**Sprint 4 Complete** ✅ (Mobile optimization and X-Factor integration - PHASE 4.2 100% COMPLETE):
- [x] **Mobile Optimization**: Large touch targets (48x48px minimum), high-contrast colors, responsive layout for 7-10" tablets.
- [x] **X-Factor Integration**: Log package copy changes to session audit trail for impact tracking.
- [x] **CSS Improvements**: Dark-themed staging modal with improved contrast for outdoor visibility.
- [x] **Button Sizing**: All action buttons optimized for touch (48x54px on mobile).
- [x] **History Service**: Added log_package_copy() and get_session_package_copies() functions.
- [x] **CSV Fallback**: setup_changes.csv created for local development without database.

### 4.3 Session Auto-Save Protocol (COMPLETE v1.8.4)
*Focus: Protecting racer data during the chaotic prep period.*
- [x] **Draft Persistence**: Save Tab 1 data to `sessions` table with `status='draft'` immediately on input.
- [x] **Session Recovery**: Auto-load draft data when opening the app.
- [x] **Seamless Activation**: "Lock Config" promotes draft to active session without data loss.
- [x] **Debounced Save**: 10-second debounce window for ~90% DB traffic reduction
- [x] **Stale Cleanup**: Lazy cleanup of 30+ day old drafts on app load

### 4.4 Multi-Racer Profile Management (COMPLETE v1.8.7)
*Focus: Enabling multiple racer profiles and team management.*
- [x] **Database Schema**: Added `is_default` BOOLEAN column to `racer_profiles` table with partial index.
- [x] **Migration Script**: Python migration script for safe, idempotent deployment to PostgreSQL.
- [x] **Service Methods**: `get_default_profile()`, `set_default_profile()`, updated `list_profiles()` and `create_profile()`.
- [x] **Profile Switcher UI**: Selectbox in sidebar with ⭐ indicator for default profile.
- [x] **Default Profile Logic**: Auto-defaults first profile, persistent across app restarts.
- [x] **New Profile Workflow**: "➕ New Racer" button with inline form (Name, Email).
- [x] **Session Isolation**: 30+ session keys cleared on profile switch to prevent data bleed.
- [x] **Fleet Auto-Sync**: Automatic vehicle syncing when switching profiles.
- [x] **Comprehensive Tests**: 16 tests covering all functionality (100% pass rate).
- [x] **Production Ready**: Complete deployment guide with checklist and manual testing steps.

## Phase 5: Predictive Performance Modeling - ORP Engine (COMPLETE v1.9.0)
*Focus: AI-driven performance optimization with Optimal Race Pace (ORP) metrics.*

### 5.1 "Optimal Race Pace" (ORP) Strategy (COMPLETE - All 4 Sprints)
*Focus: Finding the racer's X-Factor - the sweet spot of Consistency + Speed.*

**Status: ✅ COMPLETE** | Tests: 119/119 passing | Version: v1.9.0

- [x] **Sprint 1 - ORP Engine** (22 tests): "Fade Factor" + consistency calculation + scoring
- [x] **Sprint 2 - Data Persistence** (13 tests): RunLogsService with PostgreSQL + CSV fallback
- [x] **Sprint 3 - AI Integration** (31 tests): Confidence gate, Scenario A/B constraints, Experience-level prioritization
- [x] **Sprint 4 - Visualization** (53 tests): Performance window + fade indicator + lap trend charts

**Core Components**:
- [x] **Consistency Calculation** (Coefficient of Variation): Measures lap-to-lap consistency
- [x] **Fade Factor** (Last 5 Avg / First 3 Avg): Detects pace degradation over session
- [x] **ORP Scoring** (0-100): 60% consistency weight + 40% speed weight (driver bias adjustable)
- [x] **The Gatekeeper** (Confidence < 3 = REJECT): Hard rule blocking changes at low confidence
- [x] **Scenario A/B Constraints**: Unlimited practice allows all params; limited practice only safe params
- [x] **Experience-Level Prioritization**:
    - *Sportsman:* 80% Consistency / 20% Speed
    - *Intermediate:* 50% Consistency / 50% Speed
    - *Pro:* 30% Consistency / 70% Speed
- [x] **Data Persistence**: PostgreSQL database + CSV fallback for local dev
- [x] **Dashboard Integration**: Tab 2 with ORP metrics + visualizations
- [x] **Interactive Visualizations**: Performance window, fade gauge, lap trends, consistency bars

---

## Phase 6: Codebase Modularization + Bug Remediation (Technical Refactor)
*Focus: Developer Experience & System Stability.*

**Status: 🏗️ IN PROGRESS** | Implementation: `Orchestration/Implementation_Plans/phase_6_modular_refactor_plan.md`

### 6.1 Modularization (Active)
Refactor the monolithic `dashboard.py` into discrete tab modules **without changing the user interface**. This prepares the system for rapid iteration during field testing.
- [ ] **Infrastructure**: Create `Execution/tabs/` modules.
- [ ] **Refactoring**: Split Logic for Tabs 1-5 into separate files.
- [ ] **Testing**: Ensure 1:1 functional parity with strict regression testing.

### 6.2 Bug Remediation (v1.8.6 - COMPLETE)
- [x] **Phase 7.2 Complete (def0f95)**: Fixed 37 real code bugs identified in comprehensive codebase audit
  - Session state contract violations
  - Data persistence edge cases
  - Error handling improvements
  - Import path corrections
- [x] **Phase 7.1 Complete (8aaca08, a07067d)**: Auto-fixed 665 total linting issues
  - 546 low-risk issues with ruff --unsafe-fixes
  - 119 additional low-priority issues
  - Code quality: Improved syntax and style compliance

### 6.3 Code Cleanup (v1.8.6)
- [x] Removed dead code: `dashboard_BACKUP_original_2043_lines.py`
- [x] Improved vehicle selection robustness in Event Setup tab
- [x] Streamlit compatibility fix: Version upgrade 1.32.0 → 1.39.0

## Phase 7: The 6-Tab Experience (v2.0 - Future)
*Focus: Cognitive Clarity & Chronological Workflow.*

**Status: 🧊 ON HOLD (Pending Field Testing)** | Vision: `Orchestration/Implementation_Plans/future_vision_6_tab_architecture.md`

The "6-Tab Architecture" restructures the application to align with a racer's mental model. Deferred until current 5-tab workflow is field-validated.

---

## Phase 7: Development Practices & Quality Engineering (DEFERRED)
*Focus: Long-term maintainability, error tracking, testing infrastructure.*

**Status:** 📋 Planned, not yet needed
**Plan:** `Orchestration/Implementation_Plans/priority_3_development_practices_plan.md`

### Implementation Triggers (When to Revisit)

**Trigger 1: Production Pain Points**
- Experiencing production errors that are hard to debug
- Users reporting bugs you can't reproduce
- → **Implement:** Sentry error tracking + Structured logging (1 hour)

**Trigger 2: Growing Contributor Base**
- Onboarding 2+ new contributors
- Questions about "how does this work?" become frequent
- → **Implement:** MkDocs documentation + Contributor guide (2-3 hours)

**Trigger 3: Code Quality Issues**
- Committing code with formatting/linting issues regularly
- Security vulnerabilities discovered in dependencies
- → **Implement:** Pre-commit hooks + Dependabot (1 hour)

**Trigger 4: Refactoring or Major Changes**
- Planning significant architecture changes
- Need confidence that changes won't break existing functionality
- → **Implement:** Expand test coverage + Integration tests (3-4 hours)

### Phase 6 Components (Prioritized)

#### 6.1 Core Quality Infrastructure (HIGH ROI)
- [ ] **Sentry Error Tracking**: Know when production crashes (30-45 min)
- [ ] **Dependabot**: Automated security patches (15 min)
- [ ] **Pre-commit Hooks**: Catch bugs before commit (30 min)
- [ ] **Structured Logging**: Debuggable production issues (30-45 min)

#### 6.2 Testing & Documentation (MEDIUM ROI)
- [ ] **Expand Unit Tests**: 40-60% coverage goal (2-3 hours)
- [ ] **"Leak-Proof" Docstrings**: Enforce on new/modified code only (ongoing)
- [ ] **Architecture Decision Records**: Document major decisions (1 hour for 3-5 ADRs)
- [ ] **Integration Tests**: Critical flows (Digital Twin, X-Factor) (1 hour)

#### 6.3 Documentation Site (LOWER ROI)
- [ ] **MkDocs Setup**: API reference + user guides (2-3 hours)
- [ ] **Contributor Guide**: Onboarding documentation (30-45 min)

#### 6.4 Developer Experience (OPTIONAL)
- [ ] **Makefile**: Common operations (test, lint, format, run) (30 min)
- [ ] **VS Code Settings**: Consistent environment (30 min)
- [ ] **Docker**: Containerization if needed (1 hour)

#### 6.5 User Experience Alignments (HIGH Priority)
- [ ] **Racer Profile Form Refactor**: Move sidebar editing to `st.form` to eliminate data entry friction and bugs.

### What to Skip (Low ROI at Current Scale)
- ❌ **Performance Monitoring**: Only if users complain about slowness
- ❌ **Usage Analytics**: Only needed for multi-user phase (Phase 4.2)
- ❌ **End-to-End UI Testing**: Too expensive for current ROI

### Quick-Start Guide (When Ready)
1. **Minimal Setup (1 hour):** Sentry + Dependabot only
2. **Recommended (2-3 hours):** Add pre-commit hooks + structured logging
3. **Full Setup (8-12 hours):** All Phase 6 components across multiple sessions

**Cost:** $0/month (all free-tier tools)

---
*Last Updated: 2026-01-15 (v1.8.6 - Streamlit Fix + Bug Remediation Complete)*
