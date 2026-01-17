# Phase 4.2 Sprint 3 - Package Copy System (Implementation Plan)

**Status:** Planning Phase
**Target Completion:** 8-10 hours of implementation
**Completion Target:** 75% of Phase 4.2 (3 of 4 sprints done)

---

## Overview

Sprint 3 delivers the **package copy system** - enabling racers to apply reference setup packages (Suspension, Geometry, Diffs, Tires, Power) to their Digital Twin with edit-before-apply workflow.

This is the critical "Action" step after comparison:
1. Compare → See differences (Sprint 1)
2. Verify upload → Save to library (Sprint 2)
3. **Copy packages → Apply to Digital Twin (Sprint 3)** ← You are here
4. Mobile polish (Sprint 4)

---

## Problem Statement

**Current State (Sprint 2):**
- Racers can compare setups side-by-side ✅
- They can see exactly which parameters differ ✅
- **BUT**: No way to copy a package and apply it ❌

**Field Scenario:**
```
Racer compares their setup to reference setup.
Sees: "Their Suspension is 5% match, ours is 100% match. Let's try that."
Current app response: "Nice comparison! Have fun!"
Desired response: "Copy Suspension package" → Edit values if needed → "Apply to Digital Twin"
```

**Why This Matters:**
- Field-critical workflow (racer wants to try reference suspension RIGHT NOW)
- Trust decision-making (edit before apply, not bulk copy)
- Integration with X-Factor audit (track that change, measure impact)

---

## Solution Architecture

### Layer 1: Service Layer (NEW)
**File:** `Execution/services/package_copy_service.py`

New service class for package staging and application:
```python
class PackageCopyService:
    def stage_package(package_name, reference_setup, current_setup):
        """
        Create a staging area showing what will change.
        Returns dict with proposed_values and current_values organized by param.
        """

    def apply_package(package_name, staged_setup, session_id=None):
        """
        Apply staged package to actual_setup in session state.
        If session_id provided, log change via session_service.
        Returns success bool.
        """

    def preview_change(param_name, new_value, current_value):
        """
        Helper to show before/after for single param.
        """
```

**Why separate service?**
- Logic can be unit tested without Streamlit
- Can be reused in non-Streamlit contexts (API, etc.)
- Keeps dashboard.py focused on UI

### Layer 2: UI Layer (Dashboard)
**File:** `Execution/dashboard.py` (Tab 5 Comparison section)

**Components:**
1. **Package Copy Cards** - Below comparison table
   - 5 cards, one per package
   - Each card shows: Package name + icon + match % + "Copy" button
   - Cards only appear when in comparison mode

2. **Full-Screen Staging Modal** - When "Copy" is clicked
   - Header: "Staging: Package Name"
   - Editable parameters organized by type (integer, float, text)
   - Side-by-side before/after display
   - Action buttons: Apply / Cancel / Reset to Reference

3. **Post-Apply Feedback**
   - Success message with change count
   - Option to undo (revert to previous values)
   - Link to Digital Twin (Tab 2) to see the change

### Layer 3: Integration
**File:** `Execution/dashboard.py` + `Execution/services/session_service.py`

**Change Logging:**
- If active session exists, log the package copy as a "change" via session_service
- Integrate with setup_changes table for impact tracking (X-Factor audit)

---

## Implementation Steps

### Step 1: Create PackageCopyService (2 hours)

**File:** `Execution/services/package_copy_service.py`

**Pseudocode:**
```python
class PackageCopyService:
    def stage_package(self, package_name, reference_setup, current_setup):
        """Create staging dict showing proposed values."""
        package_info = SETUP_PACKAGES[package_name]
        staging = {
            'package_name': package_name,
            'changes': [],
            'total_params': 0
        }

        for param in package_info['params']:
            reference_val = reference_setup.get(param, '—')
            current_val = current_setup.get(param, '—')

            staging['changes'].append({
                'param': param,
                'current': current_val,
                'proposed': reference_val,
                'will_change': current_val != reference_val
            })
            staging['total_params'] += 1

        staging['changes_count'] = sum(1 for c in staging['changes'] if c['will_change'])
        return staging

    def apply_package(self, package_name, proposed_setup, current_setup):
        """Apply proposed values to current setup."""
        package_info = SETUP_PACKAGES[package_name]
        updated_setup = current_setup.copy()

        for param in package_info['params']:
            if param in proposed_setup:
                updated_setup[param] = proposed_setup[param]

        return updated_setup, staging['changes_count']
```

**Tests:** `tests/test_package_copy_service.py`
- Test staging with no changes
- Test staging with some changes
- Test staging with all different values
- Test apply integration
- Test with missing/null parameters

### Step 2: Build Package Copy Cards (1.5 hours)

**File:** `Execution/dashboard.py` (within Tab 5 comparison section)

**Code Pattern:**
```python
# After comparison table display (around line 1203)
if compare_mode and st.session_state.actual_setup:
    st.divider()
    st.write("### 📦 Apply Package Changes")
    st.caption("Copy individual package configurations to your setup")

    cols = st.columns(5)
    for idx, (package_name, package_info) in enumerate(SETUP_PACKAGES.items()):
        with cols[idx]:
            package_match = comparison['packages'][package_name]['match_percent']

            st.metric(
                label=f"{package_info['icon']} {package_name}",
                value=f"{package_match}% match"
            )

            if st.button(f"Copy {package_name}", key=f"copy_btn_{package_name}"):
                st.session_state.staging_package = package_name
                st.session_state.show_staging_modal = True
                st.rerun()
```

**Design Decisions:**
- 5 columns, one card per package
- Match percentage visible immediately
- Button only appears in comparison mode
- Click sets session state for modal

### Step 3: Build Full-Screen Staging Modal (3 hours)

**File:** `Execution/dashboard.py` (modal handler)

**Pattern:**
```python
# Modal handler (somewhere in Tab 5)
if st.session_state.get('show_staging_modal'):
    # Create overlay effect
    with st.container():
        st.markdown("---")

        # Header
        st.write(f"## 📋 Staging: {st.session_state.staging_package}")

        # Staging content
        staging = package_copy_service.stage_package(
            st.session_state.staging_package,
            baseline,
            st.session_state.actual_setup
        )

        # Display changes with editable fields
        edited_values = {}
        for change in staging['changes']:
            param = change['param']
            col1, col2, col3 = st.columns([1, 1, 1])

            with col1:
                st.caption(f"{param}")
            with col2:
                st.caption(f"Current: {change['current']}")
            with col3:
                # Type-aware input (reuse logic from Sprint 2)
                edited_value = st.number_input(
                    label="Proposed",
                    value=change['proposed'],
                    key=f"stage_{param}"
                )
                edited_values[param] = edited_value

        # Summary
        st.info(f"Will change {staging['changes_count']} parameters")

        # Actions
        action_col1, action_col2, action_col3 = st.columns(3)
        with action_col1:
            if st.button("✅ Apply", key="apply_package"):
                # Apply logic here
                st.session_state.actual_setup = package_copy_service.apply_package(...)
                st.session_state.show_staging_modal = False
                st.success("✅ Package applied!")
                st.rerun()

        with action_col2:
            if st.button("🔄 Reset", key="reset_staging"):
                # Reset to reference values
                st.rerun()

        with action_col3:
            if st.button("❌ Cancel", key="cancel_staging"):
                st.session_state.show_staging_modal = False
                st.rerun()
```

**Key Features:**
- Type-aware inputs (same as verification screen)
- Shows current vs proposed side-by-side
- Preview of change count
- Three action buttons

### Step 4: Integration with Session Service (1.5 hours)

**File:** `Execution/dashboard.py` + Session service method call

**Pattern:**
```python
# After successful apply
if st.session_state.get('active_session_id'):
    try:
        # Log the change for X-Factor audit
        session_service.log_package_copy(
            session_id=st.session_state.active_session_id,
            package_name=st.session_state.staging_package,
            baseline_source=baseline.get('Source'),
            parameters_changed=staging['changes_count']
        )
    except Exception as e:
        st.warning(f"Note: Could not log to session: {e}")
```

**New Session Service Method:**
```python
def log_package_copy(self, session_id, package_name, baseline_source, parameters_changed):
    """Log package copy for change tracking."""
    # Records in setup_changes table for impact measurement
```

### Step 5: Unit Tests (1.5 hours)

**File:** `tests/test_package_copy_service.py`

**Test Cases:**
```
✓ Stage package with all matching values
✓ Stage package with some differences
✓ Stage package with all different values
✓ Apply package updates actual_setup correctly
✓ Apply package preserves unrelated parameters
✓ Stage with missing parameters (normalize to "—")
✓ Apply handles type conversion correctly
✓ Integration: stage → edit → apply workflow
```

**Coverage Target:** 85%+ for service layer

---

## Files to Create/Modify

### NEW FILES:
1. `Execution/services/package_copy_service.py` (150-180 lines)
2. `tests/test_package_copy_service.py` (200-250 lines)
3. `Orchestration/Implementation_Plans/phase_4_2_sprint_3_summary.md` (detailed technical docs)

### MODIFIED FILES:
1. `Execution/dashboard.py`
   - Import package_copy_service (line ~25)
   - Add session state for staging modal (line ~86)
   - Add package copy cards (after line 1203)
   - Add staging modal handler (after package copy cards)
   - Update version to v1.8.1 (line 35)

2. `Execution/services/session_service.py`
   - Add `log_package_copy()` method

3. `Roadmap.md`
   - Mark Phase 4.2 as 75% complete (Sprints 1-3)

4. `Directives/Project_Manifest.txt`
   - Update Phase 4.2 Sprint 3 status

---

## Testing Strategy

### Functional Tests:
- [ ] Copy Suspension package with no edits → applies correctly
- [ ] Edit proposed value before applying → edited value applied, not reference
- [ ] Cancel staging modal → returns to comparison view
- [ ] Copy second package → first package not lost
- [ ] Session integration → change logged to database

### Edge Cases:
- [ ] Copy package when no active session → still works (in-memory only)
- [ ] Copy package with null/missing parameters → normalized properly
- [ ] User uploads new setup while staging modal open → modal state preserved
- [ ] Rapid package copies → no state corruption

### Integration:
- [ ] Apply package → visible in Digital Twin (Tab 2)
- [ ] X-Factor audit can see applied changes
- [ ] CSV fallback path works (no database)

---

## Success Criteria

Sprint 3 is complete when:
- [ ] PackageCopyService created with 85%+ test coverage
- [ ] 5 package copy cards appear in comparison view
- [ ] Full-screen staging modal shows editable parameters
- [ ] Apply button successfully updates actual_setup
- [ ] Changes logged to session if active session exists
- [ ] Cancel/Reset buttons work correctly
- [ ] Undo feature implemented (optional for Sprint 3)
- [ ] All unit tests pass
- [ ] Documentation complete (implementation summary)
- [ ] Roadmap and Manifest updated

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Staging modal state corruption | High | Explicit cleanup on modal close, clear state naming |
| Type conversion errors on apply | High | Reuse type-aware input logic from Sprint 2 |
| Session logging fails silently | Medium | Try/catch with warning, not error |
| User edits parameters then cancels | Low | Modal is read-only until "Edit" is clicked (TBD) |

---

## Time Breakdown

- **PackageCopyService:** 2 hours
- **Package Copy Cards:** 1.5 hours
- **Staging Modal UI:** 3 hours
- **Session Integration:** 1.5 hours
- **Unit Tests:** 1.5 hours
- **Documentation & Polish:** 1 hour
- **Contingency:** 1 hour

**Total: 8-10 hours** ✅

---

## Next Steps (After Sprint 3)

### Sprint 4: Mobile Optimization (3-4 hours)
- Large touch targets (48x48px minimum) for package cards and buttons
- High-contrast colors for outdoor visibility
- Full-screen modal responsive on 7-10" tablets
- Test on actual iPad/Android tablet

### Post-Phase 4.2:
- Bulk copy mode (if requested by users)
- Undo/Redo system for setup changes
- Setup history and revert capability
- Share setups with teammates

---

## Key Design Principles (From User Feedback)

1. **Binary comparison, not severity tiers** ✓ (Sprint 1)
2. **Verification before every save** ✓ (Sprint 2)
3. **Confirmation required for package copy** ← **Sprint 3 focuses here**
4. **Edit-before-apply workflow** ← **Enables user control**
5. **No bulk mode** ← **Each package requires intention**
6. **Mobile-first for field use** ← **Sprint 4**

---

**Implementation Lead:** Claude Haiku 4.5
**Project Owner:** AGR Labs
**Target Start:** Immediately after Sprint 2 completion
**Estimated Duration:** 8-10 hours

