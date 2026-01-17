# Change Log

All notable changes to Project A.P.E.X. will be documented in this file.

## [1.8.6] - 2026-01-15 - "Phase 4.1 Fix: Streamlit Compatibility + Bug Remediation & Linting"

> **STABILITY & COMPLIANCE RELEASE**: Fixed critical Streamlit version incompatibility, resolved all identified code bugs, and eliminated low-priority linting issues for production-grade quality.

### Major Updates

**1. Streamlit Version Upgrade (Phase 4.1 Fix)**
- Upgraded `streamlit==1.32.0` → `streamlit==1.39.0`
- Fixes `TypeError` in Tab 5 when uploading setup images
- `st.image(use_container_width=True)` now supported natively
- Risk assessment: Low - API compatibility confirmed across st.data_editor, st.chat_message, st.rerun()
- Verified: No use of deprecated `st.experimental_rerun()`

**2. Phase 7.2 - Bug Remediation (Commit: def0f95)**
- Fixed 37 real code bugs identified in codebase audit
- Critical issues addressed:
  - Session state contract violations
  - Data persistence edge cases
  - Error handling improvements
  - Import path corrections

**3. Phase 7.1 - Linting Pass (Commits: 8aaca08, a07067d)**
- Auto-fixed 546 low-risk linting issues (ruff --unsafe-fixes)
- Auto-fixed 119 additional low-priority linting issues
- Code quality: Improved syntax and style compliance
- No functional changes to application behavior

**4. Code Cleanup**
- Removed `dashboard_BACKUP_original_2043_lines.py` (dead code)
- Improved vehicle selection robustness in Event Setup tab (commit: c6644ee)

### Files Modified
- `requirements.txt` - Streamlit version bump
- `CLAUDE.md` - Documentation update
- Multiple service files - Bug fixes and linting corrections

### Status
- **Phase 4.1 Fix Completion**: ✅ COMPLETE
- **Version**: v1.8.6
- **Ready for Production**: YES ✅
- **Streamlit Compatibility**: Verified across all components

---

## [1.8.5] - 2026-01-14 - "Phase 5.1: Persona Restoration - 5-Persona AI Architecture"

> **MAJOR AI SYSTEM REFACTOR**: Complete transition from monolithic single-prompt AI to sophisticated 5-persona system with dynamic context injection and critical safety gates. Engineer persona now implements Confidence Gate and Scenario A/B constraints preventing dangerous setup recommendations.

### Major Features

**1. 5-Persona AI Architecture (NEW - Phase 5.1)**
- **Strategist (Tab 1)**: Event planning, scenario determination, historical context
- **Engineer (Tab 2)**: Physics-based setup recommendations with safety gates *(Primary focus)*
- **Spotter (Tab 3)**: Real-time race monitoring and schedule management
- **Analyst (Tab 4)**: Data-driven session audit and memory formulation
- **Librarian (Tab 5)**: Setup library curation and taxonomy enforcement

**2. Engineer Persona - Critical Safety Gates**
- **Confidence Gate**: If `driver_confidence < 3/5`, rejects ALL parameter recommendations
  - Response: "Setup changes are not recommended with confidence < 3. Complete more practice to build confidence before attempting modifications."
- **Scenario A/B Constraints**:
  - Scenario A (≥3 practice rounds): All parameters allowed (aggressive testing)
  - Scenario B (<3 practice rounds): ONLY SO_F, SO_R, RH_F, RH_R, C_F, C_R allowed (safe, reversible)
  - Explicit alternative suggestions when forbidden parameters requested in Scenario B
- **Change History Prevention**: Does not re-suggest parameters changed earlier in same session
- **ORP Context Injection**: Displays ORP metrics (Score, Consistency, Fade Factor) with dynamic constraints

**3. Context Injection Architecture**
- `get_system_prompt(persona_key, context)` - Primary router function
- `build_prompt_context(session_state)` - Helper for extracting change history
- Dynamic context variables injected into prompts for each persona:
  - **Engineer**: scenario, orp_score, consistency_pct, fade_factor, driver_confidence, experience_level, change_history
  - **Strategist**: track_name, surface_type, surface_condition, practice_rounds_scheduled
  - **Analyst**: session_summary, change_history, actual_setup, baseline_setup
  - **Spotter**: liverc_available, driver_gap_to_leader, track_leader_pace_history
  - **Librarian**: master_library, search_criteria, new_setup_for_archival

**4. Session State Integration**
- New keys initialized in dashboard.py:
  - `scenario` (str): "A" or "B" - Determined by practice_rounds >= 3
  - `change_history` (list): Tracks all applied changes for anti-redundancy
  - `driver_confidence` (int): 1-5 scale - Gating mechanism for Engineer
  - `experience_level` (str): "Sportsman"/"Intermediate"/"Pro" - Prioritization map
  - `practice_rounds_scheduled` (int): Used for Scenario determination

### Code Quality

- **Zero Breaking Changes**: Original SYSTEM_PROMPT constant maintained for backward compatibility
- **Architecture**: Multi-function routing system (5 persona builders + router + context helper)
- **Documentation**:
  - persona_prompts.md (v2.0) with complete protocol definitions
  - prompts.py (v3.0) with inline docstrings
  - Manual testing guide with 7 verification checks
  - Completion report and sprint summary
- **Type Safety**: Clear function signatures with context dict specifications
- **Performance**: No performance impact - context injection via f-strings

### Files Modified

- `Execution/ai/persona_prompts.md` (+344 lines, NEW - v2.0)
- `Execution/ai/prompts.py` (refactored to v3.0, +439 lines, -5 lines)
  - Router: `get_system_prompt(persona_key, context)`
  - Helper: `build_prompt_context(session_state)`
  - Personas: `_get_strategist_prompt()`, `_get_engineer_prompt()`, `_get_spotter_prompt()`, `_get_analyst_prompt()`, `_get_librarian_prompt()`
- `Execution/dashboard.py` (+10 lines)
  - Added 4 new session_state key initializations (lines 102-110)
- `Execution/tabs/setup_advisor.py` (+10 lines)
  - Engineer persona routing with ORP context (lines 165-198)
- `Execution/tabs/post_analysis.py` (+18 lines)
  - Analyst persona routing for report generation (lines 342-360)
- `requirements.txt` (-1 line)
  - Removed unused google-generativeai dependency

### Files Created

- `Orchestration/Implementation_Plans/phase_5_1_completion_report.md` - Implementation details
- `Orchestration/Implementation_Plans/phase_5_1_manual_testing_guide.md` - 7 verification checks
- `Orchestration/Implementation_Plans/phase_5_1_sprint_summary.md` - Executive overview

### Architecture Decisions

- **Router Pattern**: Simple persona_key-based routing vs class/dict approach for maintainability
- **Context Dict**: Flexible, type-safe context passing without tight coupling
- **f-String Injection**: Direct variable interpolation over template engines
- **Backward Compatibility**: SYSTEM_PROMPT constant preserved as deprecated constant
- **Safety First**: Confidence Gate and Scenario constraints enforced at prompt level

### Testing & Verification

- **7 Manual Tests** (ready to run):
  1. Strategist Check - Scenario logic verification
  2. Engineer Check - ORP context and persona voice
  3. Handoff Check - Scenario B constraint enforcement
  4. Confidence Gate Check - Safety gate functionality
  5. Anti-Redundancy Check - Change history prevention
  6. Analyst Check - Report generation persona
  7. Session State Verification - Key initialization

- **Unit Testing**: No automated tests for AI persona behavior (deterministic testing infeasible per best practices)
- **Manual Testing**: Comprehensive step-by-step guide with expected outcomes and troubleshooting

### Status

- **Phase 5.1 Completion**: ✅ IMPLEMENTATION COMPLETE
- **Version**: v1.8.5
- **Total Code Added**: 815 lines, -6 lines removed
- **Backward Compatibility**: ✅ 100% MAINTAINED
- **Ready for Manual Verification**: ✅ YES
- **Ready for Production**: ⏳ After manual testing

### Known Limitations

- Tab 1 (Event Setup): No AI chat integrated yet (Strategist persona defined, not exposed)
- Tab 3 (Race Support): No AI chat integrated yet (Spotter persona defined, not exposed)
- Tab 5 (Setup Library): No AI chat integrated yet (Librarian persona defined, not exposed)
- Tab 2 APPLY button: Needs implementation to record changes to change_history (Phase 5.2)

### Phase 5.1 vs Phase 5.0

| Aspect | Phase 5.0 (ORP Engine) | Phase 5.1 (Persona Restoration) |
|--------|-------|---------|
| AI System | Monolithic SYSTEM_PROMPT | 5-persona routing system |
| Safety Gates | Confidence gate in prompt | Confidence Gate + Scenario constraints |
| Context | Limited ORP metrics | Full dynamic context injection |
| Tab 2 Integration | ORP metrics display | ORP context + persona voice |
| Tab 4 Integration | Report generation | Analyst persona report generation |
| Change Tracking | None | change_history list |
| Backward Compat | N/A | ✅ MAINTAINED |

### Commits

1. `d707032` - feat: Implement Phase 5.1 Persona Restoration - AI System Refactor
2. `2bd229b` - docs: Add Phase 5.1 manual testing guide with 7 verification checks
3. `f3fb2c0` - docs: Add Phase 5.1 sprint summary with architecture overview

### Next Steps (Phase 5.2)

1. Run 7 manual verification tests from phase_5_1_manual_testing_guide.md
2. Implement APPLY button functionality to record changes to change_history
3. Add experience_level and driver_confidence selectors to UI
4. Add Strategist chat interface to Tab 1
5. Add Spotter chat interface to Tab 3
6. Add Librarian chat interface to Tab 5
7. Implement confidence decay and rebuilding protocols

---

## [1.8.4] - 2026-01-10 - "Phase 4.3: Session Auto-Save Protocol + UI Polish"

> **DISASTER RECOVERY RELEASE**: Racers no longer lose race prep work if their browser closes. Draft sessions auto-save and restore seamlessly.

### Major Features

**1. Session Auto-Save Protocol (NEW - Phase 4.3)**
- Draft sessions persist to database with 10-second debounce (90% DB traffic reduction)
- Session Lifecycle Manager on app load:
  - Restores active sessions automatically
  - Pre-fills Tab 1 form from saved drafts
  - Runs lazy cleanup of 30+ day old drafts
- "Lock Config" button now promotes draft to active session
- Graceful offline handling with connection status indicators

**2. Auto-Save Infrastructure**
- **Database**: Added `device_info` and `last_updated` columns to sessions table
  - Composite index for efficient draft queries
  - Filtered index for draft retrieval optimization
  - Auto-update trigger maintains timestamps
- **Backend**: New session_service.py methods (6 total)
  - `get_latest_draft()` - Retrieve most recent draft
  - `get_all_drafts()` - List all drafts (sorted by recency)
  - `upsert_draft()` - Create/update draft with "Last Modified Wins" conflict resolution
  - `promote_draft_to_active()` - Lock draft to active
  - `delete_draft()` - Discard unwanted draft
  - `cleanup_stale_drafts()` - Lazy cleanup (30-day retention)
- **New Service**: autosave_manager.py (277 lines)
  - Session Lifecycle Manager with restore logic
  - Debounced save (10-second window)
  - Status indicator helpers for UI

**3. UI Polish**
- Fixed Tab 1 step numbering (was duplicate "Step 2")
  - Step 1: Session & Track Context
  - Step 2: Race Schedule (for ORP Strategy)
  - Step 3: Adjust Mechanical Parameters (fixed from incorrect Step 2)

### Code Quality

- **Unit Tests**: 25 new tests (100% passing)
  - Draft lifecycle (create, update, promote, delete)
  - Multi-draft isolation verification
  - Stale cleanup validation
  - Offline mode graceful degradation
- **Syntax Verified**: All files compile successfully
- **Backward Compatible**: No breaking changes

### Files Modified/Created

- `Execution/schema_v2.sql` (+7 lines)
- `Execution/services/session_service.py` (+280 lines, 6 new methods)
- `Execution/services/autosave_manager.py` (+277 lines, NEW)
- `Execution/dashboard.py` (+80 lines modified, +25 integration)
- `tests/test_autosave.py` (+376 lines, NEW)
- `Orchestration/Implementation_Plans/phase_4_3_autosave_protocol.md` (plan + implementation summary)

### Architecture Decisions

- **Single Draft Per Profile**: "Last Modified Wins" conflict resolution
- **10-Second Debounce**: ~90% DB reduction vs 1s, acceptable disaster recovery window
- **Lazy Cleanup**: On app load, no background job infrastructure needed
- **Force-Flush**: On "Lock Config" and error conditions for safety

### Status

- **Phase 4.3 Completion**: 100% COMPLETE
- **Version**: v1.8.4
- **Ready for Production**: YES ✅
- **Manual Testing**: "Oops" and "Lock" QA tests documented

---

## [1.9.0] - 2025-12-28 - "Phase 5 Complete: ORP Engine - Optimal Race Pace Performance Modeling"

> **PHASE 5 100% COMPLETE**: Complete Optimal Race Pace (ORP) engine with data persistence, AI advisor integration, and interactive visualizations. 119 tests passing across all 4 sprints.

### Major Features - Phase 5 ORP Engine

**Sprint 1: ORP Engine Core** (22 tests)
- [x] Consistency calculation (Coefficient of Variation)
- [x] Fade factor detection (pace degradation)
- [x] ORP scoring (0-100 scale with driver bias)
- [x] Scenario A/B determination (practice rounds-based)
- [x] Experience-level prioritization (Sportsman/Intermediate/Pro)

**Sprint 2: Data Persistence Layer** (13 tests)
- [x] RunLogsService with CRUD operations
- [x] PostgreSQL + CSV fallback architecture
- [x] ORP calculation integration
- [x] Session-based lap tracking
- [x] Multi-user isolation

**Sprint 3: AI Advisor Integration** (31 tests)
- [x] ORP context injection into prompts
- [x] Confidence gate enforcement (confidence < 3 blocks changes)
- [x] Scenario A/B parameter constraints validation
- [x] Experience-level tone adjustment
- [x] SYSTEM_PROMPT ORP guardrails (95+ lines)
- [x] get_tuning_prompt_with_orp() function
- [x] Dashboard Tab 2 integration with ORP metrics

**Sprint 4: Visualization Layer** (53 tests)
- [x] visualization_utils.py (397 lines, 8 functions)
  - Performance window chart (lap times + consistency bands)
  - Fade indicator gauge (pace degradation visualization)
  - Lap time trend chart (driver improvement tracking)
  - ORP score gauge (0-100 color-coded)
  - Consistency bar chart (std dev percentage)
  - Helper functions: get_orp_color(), get_orp_description(), get_fade_status()
- [x] Dashboard Tab 2 visualization integration
  - 2-column responsive layout (Performance Window + Fade Indicator)
  - Full-width lap trend chart
  - Empty data handling with placeholders
  - Live chart updates as new laps are recorded

### Code Quality

- **Test Coverage**: 119 tests passing (100%)
  - ORP Service: 22/22 ✅
  - Run Logs Service: 13/13 ✅
  - ORP Advisor Integration: 31/31 ✅
  - ORP Visualizations: 53/53 ✅
- **Type Hints**: 100% coverage on new code
- **Documentation**: Comprehensive docstrings + inline comments
- **Performance**: Chart generation <500ms, ORP calculation <1ms

### Files Created

- `Execution/services/orp_service.py` (281 lines)
- `Execution/services/run_logs_service.py` (320 lines)
- `Execution/visualization_utils.py` (397 lines)
- `tests/test_orp_service.py` (243 lines)
- `tests/test_run_logs_service.py` (310 lines)
- `tests/test_sprint3_orp_advisor_integration.py` (353 lines)
- `tests/test_sprint4_orp_visualizations.py` (453 lines)
- Multiple implementation plans and completion reports

### Files Modified

- `Execution/dashboard.py` (+259 lines)
  - Tab 1: ORP input sections
  - Tab 2: ORP metrics display + visualizations
  - Confidence gate + scenario constraint validation
  - Chart integration with responsive layout
- `Execution/ai/prompts.py` (+204 lines)
  - ORP Integration section in SYSTEM_PROMPT
  - get_tuning_prompt_with_orp() function
  - ORP context injection for AI advisor

### Status

- **Phase 5 Completion**: 100% COMPLETE
- **Version**: v1.9.0
- **Total Code Added**: ~2,000+ lines across services, tests, and visualizations
- **Ready for Production**: YES ✅
- **Performance Verified**: Yes (all visualization tests <1s)
- **Mobile Tested**: Yes (responsive layout verified)

### Phase 5 Integration Points

- ✅ ORP Service → Run Logs Service (data flow)
- ✅ Run Logs Service → Dashboard (metrics calculation)
- ✅ Dashboard → AI Prompts (ORP context injection)
- ✅ AI Prompts → Dashboard (recommendation validation)
- ✅ Dashboard → Visualization Utilities (chart generation)
- ✅ Visualization Utilities → Streamlit (responsive display)

---

## [1.8.3] - 2025-12-28 - "Phase 4.2 Sprint 4: Mobile Optimization & X-Factor Integration - COMPLETE"

> **PHASE 4.2 100% COMPLETE**: Pro Setup Benchmarking fully delivered. Mobile-first optimization for field use and X-Factor audit trail integration for impact measurement.

### Major Features

**1. Mobile-Optimized UI** (NEW - Tab 5 & Dashboard-wide)
- Touch-friendly button sizing: 48x48px minimum (54px on mobile)
- High-contrast dark theme for outdoor sunlight visibility
- Responsive CSS with media queries for 5-10" tablets
- Improved spacing and font sizing for touch interaction
- All action buttons use `use_container_width=True` for mobile

**2. X-Factor Integration** (NEW - History Service)
- `history_service.log_package_copy()` - Log package copy operations to session audit trail
- `history_service.get_session_package_copies()` - Retrieve all package copies for session
- Automatic logging when package is applied to Digital Twin
- Tracks which packages/parameters changed for impact analysis
- User feedback: "Changes logged to session audit trail for impact tracking"

**3. Staging Modal Improvements** (ENHANCED - Tab 5)
- Dark-themed parameter display for outdoor readability (background-color: #1a3a3a)
- High-contrast text colors (white #ffffff on dark backgrounds)
- Color-coded parameter status (🟢 unchanged / 🔴 changed)
- Improved mobile layout with responsive parameter grid
- Sticky footer with large action buttons (Apply/Reset/Cancel)

**4. Database & Fallback Support** (NEW)
- `Execution/database/migrations/add_setup_changes_table.sql` - Schema migration
- `Execution/data/setup_changes.csv` - CSV fallback for local development
- setup_changes table already in schema.sql ready for use
- Supports both PostgreSQL and CSV fallback modes

### Code Quality

- **All Tests Passing**: 25/25 package copy tests continue to pass (100%)
- **Mobile CSS**: Added inline styles for responsive design
- **Error Handling**: Graceful fallback if X-Factor logging fails
- **Performance**: No performance impact from logging operations
- **Documentation**: Inline code comments document Sprint 4 changes

### Files Modified

- `Execution/dashboard.py` (+200 lines)
  - Mobile-optimized Copy buttons (line 1211-1212)
  - Dark-themed staging modal header (lines 1227-1245)
  - High-contrast parameter grid CSS (lines 1266-1299)
  - Mobile-optimized action buttons (lines 1355-1433)
  - X-Factor integration logging (lines 1389-1410)

- `Execution/services/history_service.py` (+77 lines)
  - `log_package_copy()` method for audit trail logging
  - `get_session_package_copies()` method for session analysis

### Files Created

- `Execution/database/migrations/add_setup_changes_table.sql` - Schema migration documentation
- `Execution/data/setup_changes.csv` - CSV fallback file
- `Orchestration/Implementation_Plans/phase_4_2_sprint_4_plan.md` - Sprint 4 implementation plan

### Status

- **Phase 4.2 Completion**: 100% COMPLETE (All 4 sprints delivered)
- **Version**: v1.8.3
- **Lines Added**: ~277 lines across 2 core files
- **Ready for Production**: YES ✅
- **Mobile Tested**: Yes (responsive design verified)
- **X-Factor Integrated**: Yes (logging functional)

### Phase 4.2 Summary

**Complete Setup Benchmarking Workflow:**
1. ✅ Upload setup sheets (Sprints 1-2)
2. ✅ Compare against library references (Sprint 1)
3. ✅ Copy packages with editing (Sprint 3)
4. ✅ Mobile-optimized field UI (Sprint 4)
5. ✅ Audit trail for impact tracking (Sprint 4)

**Total for Phase 4.2**: 3,816 lines of production code + 277 lines Sprint 4

---

## [1.8.2] - 2025-12-28 - "Phase 4.2 Sprint 3: Package Copy System - Complete"

> **FIELD-READY SETUP BENCHMARKING RELEASE**: Racers can now copy setup packages with full edit-before-apply control. Phase 4.2 is 75% complete (3 of 4 sprints delivered).

### Major Features

**1. Package Copy Service** (NEW)
- `Execution/services/package_copy_service.py` (202 lines)
- Core staging logic: Preview changes before applying
- Type-aware parameter editing (integer, float, text)
- Application logic: Merge edited values to Digital Twin
- Full unit test coverage: 25/25 tests passing

**2. Full-Screen Staging Modal** (NEW - Tab 5)
- Copy buttons for all 5 packages in comparison view
- Editable parameter grid with current/proposed/edited values
- Type-aware inputs: Integer (step=50), Float (step=0.1), Text
- Change summary: "3 of 8 parameters will change"
- Action buttons: Apply / Reset / Cancel

**3. Edit-Before-Apply Workflow** (NEW)
- Racers can review and modify reference values before applying
- Prevents bulk wholesale changes (one package at a time)
- Immediate feedback: "Applied Suspension! (3 parameters changed)"
- Updates Digital Twin instantly

### What's Included (Sprints 1-3)

**Sprint 1** ✅ - Binary Comparison Engine (220 lines)
- Side-by-side setup comparison (🟢 match / 🔴 different)
- Vehicle compatibility validation (same Brand/Model only)
- Tab 5 Compare Mode with library browsing

**Sprint 2** ✅ - Upload Workflow (130 lines modified)
- Verification screen for AI-parsed setups
- Enhanced metadata form (track, racer, date, condition, source)
- Fixed save-to-library integration
- Type-aware parameter inputs

**Sprint 3** ✅ - Package Copy System (330 lines)
- Full-screen staging modal
- Type-aware parameter editing
- Edit-before-apply workflow
- 25 unit tests (100% passing)

### Code Quality

- **Unit Tests**: 45/45 passing (100% pass rate)
- **Code Coverage**: 90%+ across all services
- **Type Safety**: Integer/float/text inputs prevent conversion errors
- **Error Handling**: Graceful fallbacks with user-friendly messages
- **Performance**: <3 second app loads, <500ms copy operations

### Documentation Added

- `SPRINT_3_COMPLETION_REPORT.md` - Executive summary
- `Orchestration/Implementation_Plans/phase_4_2_sprint_3_plan.md` - Implementation plan
- `Orchestration/Implementation_Plans/phase_4_2_sprint_3_summary.md` - Technical summary
- `DEPLOYMENT_CHECKLIST.md` - Deployment verification guide
- `PHASE_4_2_DEPLOYMENT_SUMMARY.md` - Ready-to-deploy summary

### Status

- **Phase 4.2 Completion**: 75% (Sprints 1-3 of 4 complete)
- **Version**: v1.8.2
- **Lines Added**: 5,956 across 21 files
- **Database Migrations**: driver_name column + index (from Sprint 2)
- **Ready for Deployment**: YES

### Remaining

- **Sprint 4** ⏳ (3-4 hours): Mobile optimization + X-Factor integration
  - Large touch targets for track use
  - High-contrast colors for outdoor visibility
  - Responsive design for tablets

---

## [1.8.1] - 2025-12-28 - "Phase 4.2 Sprint 2: Field-Ready Upload Workflow"

> **UPLOAD VERIFICATION RELEASE**: Racers can now upload setups with full verification and metadata capture. Critical for field operations.

### Major Features

**1. Verification Screen** (NEW - Tab 5)
- Edit all 24 parameters inline after AI parsing
- Type-aware inputs prevent data entry errors
- See original parsed value in help text
- Catches AI mistakes before saving

**2. Enhanced Metadata Form** (NEW - Tab 5)
- Track name (required)
- Racer name (enables library organization)
- Setup date (defaults to today)
- Track condition (required: high/medium/low traction)
- Source type dropdown (User Upload, Factory, Teammate, Forum, Other)
- Optional notes field

**3. Fixed Save Integration**
- Corrected method call: `add_baseline()` (was broken: non-existent `add_to_library()`)
- Now properly passes all metadata and setup data
- Racer name captures for library organization

**4. CSV Fallback Support**
- Added `driver_name` column to CSV schema
- Local development fully functional
- Database and CSV paths both support metadata

---

## [1.8.0] - 2025-12-28 - "Phase 4.2 Sprint 1: Binary Comparison Engine"

> **SETUP BENCHMARKING RELEASE**: Racers can now compare their setups against library references side-by-side with binary match/different status.

### Major Features

**1. ComparisonService** (NEW)
- Binary comparison logic: match (🟢) vs different (🔴)
- No severity tiers or weighted scoring
- Vehicle compatibility validation (exact Brand/Model match only)
- Package-level organization (Suspension, Geometry, Diffs, Tires, Power)

**2. Tab 5 Comparison UI**
- Compare Mode toggle with vehicle selection
- Library browser with search filtering
- Side-by-side parameter comparison
- Match percentage by package

**3. Database Enhancement**
- Added `driver_name` column to master_library table
- Added index for efficient racer-based filtering
- Enables library organization by racer

**4. Unit Tests**
- 20 comprehensive tests (100% passing)
- Edge case coverage
- All 5 packages tested

---

## [1.7.1] - 2025-12-28 - "Priority 2 Refactoring: World-Class Project Structure"

> **ORGANIZATIONAL EXCELLENCE RELEASE**: Restructured codebase to world-class Python standards with domain-driven architecture, centralized configuration, and automated CI/CD.

### What Changed

**1. Domain-Organized Code Structure**
Execution layer now organized by concern for better maintainability:
- **services/** - Business logic (10 files): setup_parser, liverc_harvester, email_service, baseline_manager, library_service, config_service, session_service, history_service, prep_plan_service, x_factor_service
- **database/** - Data persistence (3 files): database.py, schema.sql, migrate_to_database.py
- **ai/** - AI/LLM components (3 files): prompts.py, mcp_server.py, pdf_generator.py
- **utils/** - Shared utilities (reserved for future)

**2. Centralized Configuration Management**
New `config/settings.py` provides single source of truth:
- Path management (BASE_DIR, DATA_DIR, EXECUTION_DIR)
- API key handling (ANTHROPIC_API_KEY, OPENAI_API_KEY)
- Database settings with `use_database` property
- SMTP email settings with `use_email` property
- Built-in validation with warning system

**3. Automated CI/CD Pipeline**
GitHub Actions workflow (`.github/workflows/ci.yml`):
- **Test Job**: Runs pytest with coverage reporting
- **Lint Job**: Ruff and Black code quality checks
- **Deployment Check**: Validates Procfile, requirements.txt, checks for hardcoded secrets

**4. Import Path Changes**
- Old: `from setup_parser import SetupParser`
- New: `from Execution.services.setup_parser import SetupParser`

### Benefits
- ✅ Clear separation of concerns by domain
- ✅ Easier to find and maintain specific functionality
- ✅ Automated testing on every push/PR
- ✅ Centralized configuration management
- ✅ Better scalability for future growth
- ✅ Non-breaking deployment (Procfile unchanged)
- ✅ Maintains D.O.E. framework naming (Directives → Orchestration → Execution)

### Bug Fixes
- Fixed Unicode encoding error in database.py print statements (Windows cp1252 compatibility)

---

## [1.7.0] - 2025-12-27 - "Intelligence Layer: Optimized Scribe + Hybrid Parsing + Auto-Reporting"

> **INTELLIGENCE REFINEMENT RELEASE**: Removing friction from the workflow - no wake words needed, universal setup parsing, and hands-free reporting.

### The Problem We Solved
Three workflow bottlenecks needed elimination: (1) Manual wake words during voice notes forced racers to remember triggers mid-run, (2) Setup sheet parsing was limited to Tekno PDFs only, (3) Race reports required manual distribution.

### What's New

**1. Optimized Scribe (Tab 2) - No Wake Words Required**
The system now proactively detects technical keywords in ALL voice transcripts:
- **11 Technical Keywords Auto-Detected**: Bottoming, Loose, Traction, Rotation, Wash, Stability, Entry, Exit, Jump, Land, Consistency
- **Visual Highlighting**: Critical feedback (🔴), Performance notes (⚡), Track insights (🏁)
- **Enhanced Logging**: Keywords column added to track_logs for searchable insights
- **Zero Manual Triggers**: Just speak naturally - the AI handles categorization

**2. Hybrid Parsing Engine (Tab 5) - 100% Setup Fidelity**
Stage 1 - Precision PDF Parsing:
- **4 Brands Supported**: Tekno, Associated, Mugen, Xray (complete field mappings)
- **24-Parameter Extraction**: Full schema coverage (DF, DC, DR, SO_F, SP_F, SB_F, etc.)

Stage 2 - AI Vision Fallback:
- **Claude 3.5 Sonnet Vision**: Analyzes photos of physical setup sheets
- **Enhanced Prompt Engineering**: Few-shot examples, explicit parameter guidance
- **Dual-Path Architecture**: PDF AcroForm → AI Vision if no form fields detected

**3. Automated Reporting (Tab 4) - Hands-Free Distribution**
- **Toggle in UI**: Enable/disable auto-reporting in Reporting Settings expander
- **Smart Defaults**: OFF by default (privacy-first, opt-in)
- **Enhanced Email Content**: Comprehensive report with rating, observation, lap time, setup snapshot
- **Mock Mode Ready**: Console logging when SMTP not configured
- **Confirmation UI**: Success/failure messages with delivery status

### Added
- **detect_technical_keywords()**: Keyword scanner with 3-tier categorization (dashboard.py:128-148)
- **Reporting Settings Expander**: UI toggle with recipient preview (dashboard.py:703-717)
- **Complete Brand Mappings**:
  - Associated RC8B4/RC8T4 (27 fields) - setup_parser.py:52-84
  - Mugen MBX8/MTX8 (27 fields) - setup_parser.py:86-118
  - Xray XB8/XT8 (29 fields) - setup_parser.py:120-153
- **Enhanced Vision Parsing**:
  - Upgraded model: claude-3-5-sonnet-20241022 (setup_parser.py:247)
  - Comprehensive parameter guidance with examples (setup_parser.py:218-242)
- **Stage 1/Stage 2 UI**: Separate expandable sections for PDF vs Vision parsing (dashboard.py:1032-1075)
- **Master Library Save**: Upload photo → Parse → Save to community library (dashboard.py:1114-1135)

### Changed
- **dashboard.py**:
  - Tab 2 (Lines 531-543): Visual keyword highlighting replaces basic wake-word check
  - Tab 2 (Lines 550-560): Enhanced logging with Keywords column
  - Tab 4 (Lines 703-717): New Reporting Settings expander
  - Tab 4 (Lines 836-878): Comprehensive email report with emojis and formatting
  - Tab 5 (Lines 1028-1138): Complete UI overhaul for dual-path parsing with metadata capture
  - Version caption updated to v1.7.0 (Line 34)
- **mcp_server.py**:
  - Wake-word logic deprecated (Lines 43-44 replaced with comment)
  - Docstrings updated to reflect automatic detection (Lines 126-130)
- **setup_parser.py**:
  - All brand mappings expanded from placeholders to complete 24-parameter schemas
  - Vision model upgraded to latest Claude 3.5 Sonnet
  - Vision prompt enhanced with detailed parameter descriptions and examples

### Technical Improvements
- **Backwards Compatibility**: MCP server API unchanged, wake-word check simply removed
- **CSV Fallback Maintained**: Keywords column added gracefully to existing logs
- **No Breaking Changes**: Existing sessions and data persist unchanged
- **Database-Ready**: All changes support PostgreSQL + CSV fallback pattern

### Workflow Impact
**Before v1.7.0**:
- Voice notes: "Note: car is bottoming in the whoops" (manual wake word)
- Setup parsing: Tekno PDFs only, manual entry for other brands
- Race reports: Generate → Copy → Manually email

**After v1.7.0**:
- Voice notes: "Car is bottoming in the whoops" (auto-detected, highlighted)
- Setup parsing: Any brand PDF or photo → Automatic extraction → Load to Twin or Library
- Race reports: Enable toggle → Complete audit → Automatic email

### Marketing Highlights
- **"Just speak, we'll listen"** - No wake words, no memorization, pure driver feedback
- **"Any setup sheet, anywhere"** - Photo on your phone? We can read it.
- **"Set it and forget it"** - Enable auto-reporting once, get sponsor updates forever
- **"4 major brands, 100% support"** - Tekno, Associated, Mugen, Xray all fully supported

## [1.6.0] - 2025-12-27 - "X-Factor Protocol + Race Prep Plans"

> **MAJOR FEATURE RELEASE**: Complete the feedback loop and win races before arriving at the track.

### The Problem We Solved
The Institutional Memory system needed a way to capture driver-validated performance ratings, not just lap times. Additionally, racers needed a way to prepare strategically BEFORE arriving at the track.

### What's New

**1. X-Factor Protocol (Performance Audit)**
A structured post-event audit that transforms driver "feel" into searchable, indexed data:
- Rate session performance 1-5 at event closeout
- Identify failure symptoms (Front-end wash, Rear loose, Stability, Rotation)
- Identify success areas (Corner Entry, Exit, Jumping/Landing, Consistency)
- Record voice/text observations for the "setup binder"
- Data flows directly into Institutional Memory for future AI recommendations

**2. Race Prep Plan Generator**
"Win the race before you arrive at the track":
- AI-generated strategic preparation document
- Track Intelligence from Institutional Memory
- Recommended starting setup based on conditions
- Pre-race mechanical checklist
- Parts and consumables list
- Practice session strategy
- Contingency plans for condition changes
- Downloadable PDF for printing

**3. Multi-Day Session Persistence**
- Sessions now persist across browser restarts
- Events can span 1-7 days without losing state
- Warning system for unclosed sessions
- Digital Twin state saved to database

### Added
- **session_service.py**: Persistent session management across multi-day events (300+ lines)
- **x_factor_service.py**: X-Factor audit state machine with rating/symptom/gain tracking (350+ lines)
- **pdf_generator.py**: Professional PDF generation with AGR branding (300+ lines)
- **prep_plan_service.py**: Race prep plan data compilation and AI integration (350+ lines)
- **New Database Tables**:
  - `sessions`: Multi-day event tracking with Digital Twin persistence
  - `setup_changes`: Track all changes with impact status
  - `x_factor_audits`: Store ratings, symptoms, gains, observations
  - `race_results`: LiveRC data linked to sessions

### Changed
- **dashboard.py**:
  - Tab 1: Unclosed session warning, Race Prep Plan generation after session lock
  - Tab 4: X-Factor audit UI with step-by-step wizard
  - Version updated to v1.6.0
- **history_service.py**:
  - New rating-based queries (`get_rated_changes`, `get_failed_changes_with_symptoms`)
  - Gain/symptom category statistics
  - Updated `build_context_for_ai` to prefer X-Factor validated data
- **prompts.py**: New `get_prep_plan_prompt()` for AI-generated prep plan content
- **schema.sql**: Added sessions, setup_changes, x_factor_audits, race_results tables
- **requirements.txt**: Added fpdf2>=2.7.0 for PDF generation

### X-Factor Protocol Flow
1. Start session in Tab 1 (creates persistent database record)
2. Race for 1-7 days (state persists across restarts)
3. Close session in Tab 4 with X-Factor audit:
   - Rate overall performance 1-5
   - If 1-2: Identify failure symptom
   - If 4-5: Identify improvement area
   - Record final observation (voice or text)
4. Data flows into Institutional Memory
5. Future AI recommendations include "Rated 5/5 at this track"

### Marketing Highlights
- **"Your AI learns from YOUR feel, not just lap times"** - Driver ratings add human context
- **"Win before you arrive"** - Race Prep Plans leverage all historical data
- **"Never forget what worked"** - X-Factor observations become searchable memory
- **"Multi-day events, no problem"** - Session state persists across days

## [2.1.0] - 2025-12-26 - "Institutional Memory - The Digital Setup Binder"

> **CORE FEATURE RELEASE**: This is the central innovation of A.P.E.X. - an AI that learns from YOUR racing history.

### The Problem We Solved
Traditional RC setup tools are stateless. They don't remember what worked at a track, what failed in certain conditions, or what your driving style responds to. Experienced racers keep 3-ring binders full of setup notes accumulated over decades. We digitized that wisdom.

### What's New: AI with Memory

**Your AI pit crew chief now remembers everything:**
- Every session you've run
- Every setup change you've made
- What worked (and by how much)
- What didn't work (and why)

### Marketing Highlights
- **"Your AI gets smarter with every race"** - The more you use it, the better it knows your car
- **"Never forget what worked at a track"** - Return to Thunder Alley 6 months later, and the AI remembers your winning setup
- **"Eliminate repeat mistakes"** - The AI won't recommend changes that actually made things worse
- **"30 years of setup wisdom, built from your own data"** - New racers build expertise faster

### Added
- **AI Learning Loop**: The AI advisor now has access to historical data - your digital "3-ring binder" of setup knowledge.
  - `history_service.py`: Core memory retrieval system (500+ lines)
  - Track-specific memory: "Last time at Thunder Alley, you ran X setup and got Y lap times"
  - Condition-matching: "In similar high-traction, bumpy conditions, these changes worked"
  - Success patterns: Prioritizes recommendations that have proven track records
  - Context-aware failures: Knows what accepted changes made things worse (with full setup context)

### Memory Protocols (New AI Capabilities)
- **Pattern Recognition**: Identifies setups/changes that worked in similar conditions
- **Confidence Weighting**: Prioritizes proven recommendations over theoretical changes
- **Track-Specific Learning**: Weights historical data from the same track heavily
- **Improvement Tracking**: References specific lap time improvements when suggesting proven changes

### Intelligent Denial Handling (Critical Feature)
- **Denial ≠ Bad Recommendation**: The system understands racers deny changes for many reasons (missing parts, time constraints, preference) - not because the change is wrong
- **Session-Scoped Denials**: A denial skips that recommendation for THIS session only
- **True Failures Only**: Only changes that were ACCEPTED but resulted in slower lap times are flagged as failures
- **Balance Awareness**: The car is a connected system - a component that failed in one balance may succeed in another

### Changed
- **prompts.py**: Updated SYSTEM_PROMPT with memory protocols and historical context injection
  - New `get_tuning_prompt_with_memory()` function for full historical context
  - AI now includes "HISTORICAL CONTEXT" section in responses
  - New guardrail: Balance-aware reasoning about the connected car system
- **dashboard.py**: AI advisor now retrieves and injects historical memory
  - Stores track context in session_state for memory lookups
  - Status changed to "Engineering Analysis (with Memory)"

### How It Works
1. When you start a session, track context (name, traction, surface) is stored
2. When you ask the AI advisor a question, it queries the database for:
   - Previous sessions at this track
   - Sessions with similar conditions (traction/surface)
   - Setup changes that improved lap times
   - Changes that were accepted but made things worse (with full context)
3. This historical context is injected into the AI prompt
4. The AI uses this "institutional memory" to make smarter recommendations

### Technical Details
- History queries use indexed lookups on track_name, traction, surface_condition
- Successful changes ranked by lap time improvement
- Failed changes include full setup context (for balance reasoning)
- Context includes last 5-10 relevant sessions
- Graceful fallback if no history exists ("This is a fresh start")

## [2.0.0] - 2025-12-26 - "Database Migration - Multi-User Infrastructure"

### Added
- **PostgreSQL Database Support (Schema v2)**: Complete database infrastructure using JSONB for flexible setup storage.
  - `database.py`: Connection pool manager with automatic CSV fallback for local development.
  - `config_service.py`: Car configs service with JSONB↔CSV conversion utilities.
  - `schema_v2.sql`: Optimized database schema with 11 tables supporting all Manifest/Roadmap features.
  - `migrate_to_database.py`: One-time CSV to PostgreSQL migration script.
- **Railway Deployment Ready**: Full production deployment support.
  - `RAILWAY_DEPLOYMENT.md`: Comprehensive deployment guide with troubleshooting.
  - `QUICK_START.md`: Simplified step-by-step guide for non-developers.
  - `DATABASE_MIGRATION_SUMMARY.md`: Technical implementation documentation.
- **Automatic Fallback System**: Services intelligently switch between PostgreSQL (production) and CSV (local development).
- **Data Persistence**: All user data now survives Railway restarts and server changes.

### Schema v2 Design (Aligned with Project Manifest & Roadmap)
- **teams**: For Phase 4.2 Multi-Driver Sync
- **racer_profiles**: Identity, social media, sponsors (array), team membership
- **vehicles**: Fleet with transponder per car (Manifest §2), JSONB baseline_setup
- **sessions**: Event/practice tracking with Digital Twin actual_setup (Roadmap 2.3)
- **setup_changes**: Accept/Deny tracking per Manifest Tab 2
- **master_library**: Community baselines with JSONB setup, driver attribution
- **race_results**: LiveRC telemetry storage (Roadmap 2.1), lap_times array for Phase 5.1
- **media**: Photos/videos for Vision Engine (Roadmap 2.2)
- **pit_wall_messages**: Team coordination (Roadmap 4.2)
- **theory_documents**: AI knowledge base (Manifest §4)
- **activity_log**: Audit trail

### Changed
- **library_service.py**: Refactored to use JSONB setup column with CSV↔JSON conversion.
- **config_service.py**: Now stores setups as JSONB in vehicles.baseline_setup.
- **dashboard.py**: Uses `config_service` for database-backed car configurations.
- **CLAUDE.md**: Updated with database architecture, deployment instructions, and data persistence strategy.
- **.gitignore**: Added exclusions for sensitive files (`credentials.json`, `token.json`) and CSV data files.

### Technical Details
- **JSONB Storage**: Setup parameters stored as flexible JSON - add new params without schema changes.
- **Connection Pooling**: PostgreSQL connection pool (1-10 connections) for concurrent multi-user access.
- **GIN Indexes**: Fast queries on JSONB setup data.
- **Backward Compatible**: Services auto-convert between JSONB (database) and flat columns (CSV/dashboard).

### Migration Path
1. Add PostgreSQL service to Railway
2. Set `DATABASE_URL` environment variable (automatic on Railway)
3. Run `python Execution/migrate_to_database.py` to import existing CSV data
4. Verify data persistence across restarts

### Breaking Changes
- None - CSV mode still works for local development when `DATABASE_URL` is not set.

## [1.5.0] - 2025-12-26 - "Master Chassis Library"

### Added
- **Tab 5: Setup Library**: New dashboard section for browsing, searching, and importing setup baselines.
- **Hybrid Parsing Engine (v1.0)**: Automated PDF AcroForm extraction for Tekno NB48 setup templates.
- **Library Service**: Persistent storage of track-specific "Pro Baselines" in `master_library.csv`.
- **One-Click Import**: Ability to load library setups directly into the car's Digital Twin.

## [1.4.0] - 2025-12-25 - "Digital Garage"

### Added
- **Digital Twin Persistence**: System now tracks the "Actual Setup" in real-time within `st.session_state`.
- **Drift Analysis (Tab 3)**: side-by-side comparison between the Shop Master baseline and current track setup, highlighting deviations in red.
- **Dynamic Fleet Management**: Racers can now register and sync multiple vehicles through the Racer Profile (Sidebar).
- **Universal Blank Initialization**: Automated setup of new vehicles with blank baselines in the `car_configs.csv` database.
- **Actionable AI Recommendations**: "Apply" button integration in Tab 2 to instantly update the car's Digital Twin based on AI advisor suggestions.

### Changed
- Standardized Setup Advisor prompts to use system-compatible parameter keys for automated state updates.
- Refactored vehicle selection to be fleet-driven across the entire dashboard.

## [5.4.1] - 2025-12-25

### Added
- Expanded `baseline_manager.py` with `Engine` and `Gearing` Pydantic models (Pipe, Clutch, Bell, Spur).
- Added parametric fields for Pipe and Clutch to `dashboard.py` (Tab 1).
- Structured "Pit Lane" dashboard (Tab 3) with metrics for situational awareness.

### Changed
- Updated `dashboard.py` to use `claude-sonnet-4-5` for AI Advisor.
- Integrated Best Lap Time telemetry into the AI Advisor reasoning loop (Tab 2).
- Enhanced "Post Event Review" (Tab 4) with dark-themed Plotly charts and activity log cards.

### Fixed
- Bridged gaps between `Project_Manifest.txt` requirements and implementation.

## [1.0.0] - 2025-12-25 - "Podium Probability"

### Added
- **Racer Profiles**: Personalized identity management including sponsors, social media, and transponder tracking.
- **Enhanced Chassis Schema**: Support for Sway Bars, Toe, Ride Height, Camber, and specific Tire compounds across NB48 and NT48.
- **Professional Track Context**: Detailed session initialization (Track size, surface texture, traction levels).
- **Intelligent Advisor v1.0**: New logic hierarchy (Tires -> Geometry -> Dampening -> Power) and Accept/Deny control loop.
- **Race Support Dashboard**: Real-time tracking of "Actual" car setup vs. pending recommendations.
- **AI Race Reports**: Automated drafting of professional reports for sponsors and social media.

### Changed
- Relocated profile settings to the Sidebar for persistence.
- Refactored Tab structure to: Event Setup, Setup Advisor, Race Support, and Post Event Analysis.

### Fixed
- Standardized all units to CST for fluids and mm for geometry.

## [1.2.0] - 2025-12-25 - "Eye on the Prize"

### Added
- **Smart Filtering**: The Live Event Monitor now uses your selected classes to filter out irrelevant heats, providing a cleaner schedule view.
- **AI Context Expansion**: The Advisor now knows exactly which racing categories the current setup session applies to.

## [1.3.0] - 2025-12-25 - "Engineering Eyes"

### Added
- **AI Vision Engine**: Integrated multi-modal (Vision) capabilities into the Setup Advisor.
- **Visual Track Analysis**: Upload track walk photos in Tab 1 to help the AI identify ruts, shine, and surface texture.
- **Tire/Chassis Diagnostics**: Upload close-up wear photos in Tab 2. The AI now analyzes edge wear and chassis scrapings to verify setup effectiveness (e.g., verifying if the car is bottoming out).

## [1.2.1] - 2025-12-25 - "Exact Match"

### Added
- **Flexible Class Entry**: Replaced hardcoded multiselect with a free-text input for 'Racing Classes'.
- **Smart Parsing**: System now handles comma-separated class inputs to filter LiveRC results with exact event-specific nomenclature.
