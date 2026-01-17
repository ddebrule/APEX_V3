# Phase 6 Sprint 3 Quick Start Guide

**Objective:** Extract Tabs 2 & 4 following the proven modular pattern from Sprints 1-2

**Target:** 661 lines of code to extract (362 lines Tab 2 + 299 lines Tab 4)

---

## Quick Reference: The Pattern

### Step 1: Locate Source Code
Look in `Execution/dashboard_BACKUP_original_2043_lines.py`:
- **Tab 2 (Setup Advisor):** Lines 568-929 (362 lines)
- **Tab 4 (Post Event Analysis):** Lines 1043-1341 (299 lines)

### Step 2: Extract to Stub File
Replace the stub `Execution/tabs/[tab_name].py` with extracted code:
```python
def render():
    """Render Tab [N]: [Name]."""
    # ... extracted logic here
```

### Step 3: Update Imports
Each tab needs:
```python
import streamlit as st
# Add specific service imports (library_service, setup_parser, etc.)
# AVOID: import * or circular imports
```

### Step 4: Verify Session State
Ensure tab only:
- **Reads** from existing initialized keys
- **Writes** to keys documented in session_state_contract.md
- **Assumes** all keys exist (initialized by dashboard.py)

### Step 5: Test
```bash
pytest tests/ -v
# Should pass: 190+ tests
# Should not introduce new failures
```

---

## Tab 2: Setup Advisor (362 lines)

### Current Status
- **File:** `Execution/tabs/setup_advisor.py` (30-line stub)
- **Source location:** `Execution/dashboard_BACKUP_original_2043_lines.py:568-929`

### What It Does
- Voice note recording & transcription
- AI chat interface for setup recommendations
- Weather data fetching & integration
- AI prompt generation with track/car context
- Chat history management

### Session State
**Reads:**
- `track_context` (from Tab 1) - Track metadata
- `actual_setup` (from Tab 1) - Current car config
- `racer_profile` (from sidebar) - User info

**Writes:**
- `messages` - Chat history (accumulates per session)
- `weather_data` - Fetched weather
- `pending_changes` - AI-proposed setup changes

**Uses:**
- `messages` list for chat history
- `weather_data` dict for temp/humidity/density altitude

### Key Services to Import
```python
from Execution.ai import prompts
from Execution.services.email_service import email_service
from Execution.utils import (
    get_weather,
    transcribe_voice,
    get_system_context,
    detect_technical_keywords
)
```

### External Dependencies
- `streamlit_mic_recorder` - Voice recording
- `anthropic` - LLM calls (already in requirements.txt)
- `openai` - Whisper transcription (already in requirements.txt)

### Complexity Notes
- Moderate complexity (AI integration + voice I/O)
- Callback-heavy (voice recording, transcription)
- State-heavy (message accumulation)
- Good test case for AI-heavy tabs

---

## Tab 4: Post Event Analysis (299 lines)

### Current Status
- **File:** `Execution/tabs/post_analysis.py` (30-line stub)
- **Source location:** `Execution/dashboard_BACKUP_original_2043_lines.py:1043-1341`

### What It Does
- X-Factor audit trail analysis
- Session performance metrics
- Lap time visualization & charts
- Race report generation
- Historic data comparison

### Session State
**Reads:**
- `actual_setup` (from Tab 1) - Car config used in session
- `active_session_id` (from Tab 1) - Current session ID
- `messages` (from Tab 2) - Chat history for context

**Writes:**
- `x_factor_audit_id` - Active X-Factor being reviewed
- `x_factor_state` - State machine: "idle", "running", "complete"
- `last_report` - Last generated report

**Uses:**
- `x_factor_state` as finite state machine
- `last_report` dict for generated report data

### Key Services to Import
```python
from Execution.services.x_factor_service import (
    x_factor_service,
    FAILURE_SYMPTOMS,
    SUCCESS_GAINS
)
from Execution.services.run_logs_service import RunLogsService
from Execution.visualization_utils import (
    create_performance_window_chart,
    create_fade_indicator,
    create_lap_trend_chart,
    get_orp_color,
    get_orp_description
)
```

### External Dependencies
- `plotly.express` - Charts (already in requirements.txt)
- `pandas` - Data manipulation (already in requirements.txt)

### Complexity Notes
- Moderate complexity (data processing, visualization)
- Less state coupling than Tab 2
- Good read-only patterns
- Heavy use of existing visualization utilities
- Good reference implementation for post-processing tabs

---

## Extraction Workflow

### For Tab 2 (Setup Advisor)

```bash
# 1. Extract source lines 568-929 from backup
# 2. Clean up imports (move to top)
# 3. Create render() function wrapper
# 4. Update file: Execution/tabs/setup_advisor.py
# 5. Verify imports: all services available
# 6. Test: pytest tests/ -v
```

**Expected after:**
- Tab 2 should be ~362 lines
- All imports at top
- Single `render()` function
- Voice recording working
- Chat interface functional

### For Tab 4 (Post Event Analysis)

```bash
# 1. Extract source lines 1043-1341 from backup
# 2. Clean up imports (move to top)
# 3. Create render() function wrapper
# 4. Update file: Execution/tabs/post_analysis.py
# 5. Verify visualization utils import correctly
# 6. Test: pytest tests/ -v
```

**Expected after:**
- Tab 4 should be ~299 lines
- All imports at top
- Single `render()` function
- Charts rendering correctly
- Report generation functional

---

## Quality Checklist

### Before Committing

- [ ] Both tabs extract without errors
- [ ] All 190+ tests still passing
- [ ] No new test failures
- [ ] Session state contract still valid
- [ ] Imports resolve (no circular deps)
- [ ] `pytest tests/ -v` shows no regressions
- [ ] Dashboard orchestrator still <250 lines
- [ ] All 5 tabs render without errors

### Code Quality

- [ ] Extracted lines are clean (no monolithic mess)
- [ ] Functions are well-organized
- [ ] Comments preserved from original
- [ ] No unused imports
- [ ] Consistent indentation

### Documentation

- [ ] Tab docstring updated
- [ ] State Management comment updated
- [ ] Session state keys documented
- [ ] Architecture notes added

---

## Common Pitfalls to Avoid

### 1. Circular Imports
❌ Bad: `from Execution.tabs import setup_advisor`
✅ Good: Keep tabs independent, only import from services

### 2. Missing State Initialization
❌ Bad: `if st.session_state.messages` without checking existence
✅ Good: Assume all keys exist (initialized by dashboard.py)

### 3. Service Dependencies
❌ Bad: Import everything from Execution
✅ Good: Import only what each tab needs

### 4. Widget Keys
❌ Bad: Duplicate `key="button"` across tabs
✅ Good: Tab-specific keys like `key="tab2_button"` or `key=f"tab4_{param}"`

### 5. State Mutations
❌ Bad: Modify state without session_state assignment
✅ Good: Always use `st.session_state.key = new_value`

---

## Helpful Commands

```bash
# Run all tests
pytest tests/ -v

# Run only dashboard-related tests
pytest tests/ -k "autosave or comparison or package" -v

# Check syntax
python -m py_compile Execution/tabs/setup_advisor.py
python -m py_compile Execution/tabs/post_analysis.py

# View git diff
git diff Execution/tabs/

# Compare line counts
wc -l Execution/tabs/*.py
```

---

## Success Looks Like

After Sprint 3 is complete:

```
✅ Tab 2 (Setup Advisor) - 362 lines
✅ Tab 4 (Post Event Analysis) - 299 lines
✅ Dashboard orchestrator - 223 lines
✅ All 5 tabs functional and tested
✅ 190+ tests passing
✅ Zero regressions
✅ Session state contract fully implemented
```

---

## File Locations Reference

| File | Purpose | Sprint |
|------|---------|--------|
| `Execution/dashboard.py` | Orchestrator | 1 |
| `Execution/tabs/event_setup.py` | Tab 1 | 1 |
| `Execution/tabs/race_support.py` | Tab 3 | 2 |
| `Execution/tabs/setup_library.py` | Tab 5 | 2 |
| `Execution/tabs/setup_advisor.py` | Tab 2 (stub) | 3 |
| `Execution/tabs/post_analysis.py` | Tab 4 (stub) | 3 |
| `Execution/components/sidebar.py` | Sidebar | 1 |
| `Execution/utils/ui_helpers.py` | Helpers | 1 |
| `Orchestration/Architecture/session_state_contract.md` | State docs | 1 |
| `Orchestration/Implementation_Plans/phase_6_modular_refactor_plan.md` | Master plan | 1 |

---

## Contact/Questions

If stuck during Sprint 3:
1. Check `session_state_contract.md` - state rules
2. Review `event_setup.py` - simple Tab 1 reference
3. Review `setup_library.py` - complex Tab 5 reference
4. Check imports in working tabs
5. Run `pytest` to validate syntax

---

## Timeline

**Estimated Duration:** 8-12 hours total
- Tab 2 extraction & testing: 4-5 hours
- Tab 4 extraction & testing: 3-4 hours
- Integration & documentation: 1-2 hours

**Ready to start?** Begin with Tab 2 (Setup Advisor).

---

*Quick start guide for Phase 6 Sprint 3*
*Last updated: 2026-01-10*
