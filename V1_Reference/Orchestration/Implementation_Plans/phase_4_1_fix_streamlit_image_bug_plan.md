# Phase 4.1 Fix: Streamlit Compatibility & Recovery

## Goal
Restore Tab 1 functionality (broken by 1.39.0 upgrade) and fix the original Tab 5 `TypeError` by adapting the code to Streamlit 1.32.0.

## Problem Description
1. **Regression**: Upgrading to Streamlit 1.39.0 caused layout/rendering issues in Tab 1 (inputs disappeared).
2. **Original Bug**: `Execution/tabs/setup_library.py` uses `use_container_width=True` in `st.image()`. This parameter is not available in Streamlit 1.32.0, which uses `use_column_width=True` instead.

## Proposed Changes

### 1. Revert Environment (Recovery)
Downgrade Streamlit back to the stable version known to work with the rest of the app.

#### [MODIFY] [requirements.txt](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/requirements.txt)
- Revert `streamlit==1.39.0` to `streamlit==1.32.0`

#### [MODIFY] [CLAUDE.md](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/CLAUDE.md)
- Revert comment to `streamlit==1.32.0`

### 2. Fix Code Compatibility (Tab 5)
Update the image display code to match Streamlit 1.32.0 API.

#### [MODIFY] [Execution/tabs/setup_library.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Execution/tabs/setup_library.py)
- **Locate**: `st.image(photo_file, caption="Uploaded Setup Sheet", use_container_width=True)` (Line 501)
- **Replace with**: `st.image(photo_file, caption="Uploaded Setup Sheet", use_column_width=True)`

*Note: `st.button` supports `use_container_width` in 1.32.0, so other instances of the keyword can remain.*

## Verification Plan

### 1. Recovery Verification
- [ ] Reinstall dependencies: `pip install -r requirements.txt`
- [ ] Run app: `streamlit run Execution/dashboard.py`
- [ ] **Tab 1 Check**: Verify all input fields (Session Name, Track, etc.) are visible and functional.

### 2. Bug Fix Verification
- [ ] **Tab 5 Check**: Upload a setup image (JPG/PNG).
- [ ] Verify image renders correctly using `use_column_width`.
- [ ] Verify no `TypeError`.

