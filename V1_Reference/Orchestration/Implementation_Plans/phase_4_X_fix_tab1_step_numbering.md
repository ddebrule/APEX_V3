# Fix Tab 1 Step Numbering Duplication

## Goal Description
The user reported a UI bug in Tab 1 where there are two sections labeled "Step 2". This was likely caused by injecting the new "Race Schedule (for ORP Strategy)" section as Step 2 without renumbering the existing "Adjust Mechanical Parameters" section. This plan fixes the numbering sequence.

## User Review Required
None. This is a minor text fix.

## Proposed Changes

### Execution
#### [MODIFY] [dashboard.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Execution/dashboard.py)
- Locate the line `st.write("### 🛠️ Step 2: Adjust Mechanical Parameters")` (approx line 519).
- Change it to `st.write("### 🛠️ Step 3: Adjust Mechanical Parameters")`.

## Verification Plan

### Manual Verification
1.  **Launch the App**: Run `streamlit run Execution/dashboard.py`.
2.  **Navigate to Tab 1**: "📋 Event Setup".
3.  **Inspect Steps**:
    - Verify "Step 1: Session & Track Context" exists.
    - Verify "Step 2: Race Schedule (for ORP Strategy)" exists.
    - Verify the next section is now labeled "Step 3: Adjust Mechanical Parameters".
