# Maintenance Plan: Fix Tab Rendering

## Goal Description
Tabs 2-5 are failing to render on the Railway deployment. Investigation reveals that the "Lazy Loading" optimization (`lazy_tab_renderer`) relies on client-side tab state that is not correctly synchronized with the server in the current Streamlit configuration. This plan disables lazy loading to restore functionality.

## User Review Required
> [!NOTE]
> This reverts a performance optimization (Lazy Loading) to prioritize stability and correctness. App startup time may slightly increase, but all tabs will be visible.

## Proposed Changes

### Execution Layer
#### [MODIFY] [dashboard.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit Workspaces/APEX-AGR-SYSTEM/Execution/dashboard.py)
- Remove `lazy_tab_renderer` calls.
- Replace with direct `.render()` calls for all tabs (`event_setup`, `setup_advisor`, `race_support`, `post_analysis`, `setup_library`).

## Verification Plan

### Automated Tests
- None (Visual regression).

### Manual Verification
1. **Deploy**: Push changes to Railway.
2. **Access App**: Open the deployed application.
3. **Click Tabs**: Click Tabs 2, 3, 4, and 5.
4. **Verify Content**: Ensure content loads immediately for each tab (no blank screens).
