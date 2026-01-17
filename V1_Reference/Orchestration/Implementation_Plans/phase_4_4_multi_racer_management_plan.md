# Phase 4.4: Multi-Racer Profile Management Implementation Plan

## Goal Description
Enable the system to support multiple racer profiles, allowing a user to manage different racers (e.g., self, child, teammate) from a single instance. This includes the ability to create new profiles, switch between them, and designate a "default" profile that loads automatically.

## User Review Required
> [!IMPORTANT]
> **Database Schema Update**: This plan involves adding an `is_default` boolean column to the `racer_profiles` table. A migration script will be required.

> [!NOTE]
> **Session Volatility**: Switching profiles will clear the current `st.session_state` related to the active setup and fleet. Users must save their work before switching profiles.

## Proposed Changes

### Database Layer
#### [MODIFY] `Execution/database/schema.sql`
- Add `is_default` BOOLEAN DEFAULT FALSE column to `racer_profiles`.
- Ensure only one profile can be marked as default per user (or globally for single-user mode).

#### [NEW] `Execution/database/migrations/add_default_column.py`
- Create a standalone Python script to apply this specific migration.
- **Logic**: Check if column exists; if not, `ALTER TABLE racer_profiles ADD COLUMN is_default BOOLEAN DEFAULT FALSE`.
- **Run Timing**: This must be executed *before* deploying the UI changes.

### Backend Layer (Execution)
#### [MODIFY] `Execution/services/profile_service.py`
- **Method**: `get_profile(None)` -> Query `WHERE is_default = TRUE`.
- **Method**: `set_default_profile(profile_id)`:
    - Transaction: Set all `is_default = FALSE`, then set target `is_default = TRUE`.
- **Method**: `create_profile(...)`: 
    - Logic: If `count(profiles) == 0`, set `is_default = TRUE` automatically. Otherwise `FALSE`.
- **Method**: `get_default_profile()`: Standardized accessor.

#### [REFAC] `Execution/database/database.py`
- Refactor `get_or_create_default_profile` to use `profile_service` (or strictly SQL) that respects the `is_default` column, removing the old hardcoded logic.

### UI Layer (Execution)
#### [MODIFY] `Execution/components/sidebar.py`
- **Profile Switcher UI**:
    - **Component**: `st.selectbox("Select Racer", options=profiles)` (No "New" option inside).
    - **Action**: `st.button("➕ New Racer")` placed immediately below the selectbox.
- **Session Clearing Protocol**:
    - When switching profiles, clear **ALL** session keys *except* `racer_profile`, `profile_id`, and `user_id`.
    - Explicitly clear: `actual_setup`, `pending_changes`, `track_context`, `chat_history`, `weather_data`.
    - **Auto-Sync**: Automatically run `config_service.sync_fleet()` (or equivalent) to load the new profile's vehicles into the "Shop Master" context.
- **New Profile Workflow**:
    - On "➕ New Racer" click, open an `st.expander("Create New Profile", expanded=True)`.
    - Form: Name, Email.
    - Submit: Creates profile -> Sets as active -> Collapses/Hides expander.
- **Default Toggle**:
    - Inside the "📝 Edit Profile" expander (existing), add a `st.checkbox("Set as Default Profile", value=is_current_default)`.
    - Logic: If checked (and wasn't before), call `set_default_profile()`.

## Verification Plan

### Automated Tests
- Test `connect_to_db` with new schema.
- Test `create_profile` sets default correctly.
- Test `set_default_profile` ensures mutual exclusivity.

### Manual Verification
1.  **Startup**: Launch app. Verify the "Default Racer" (or previously set default) loads automatically.
2.  **Create**: Click "New Racer", enter "Racer X", save. Verify "Racer X" is now active.
3.  **Switch**: Use dropdown to switch back to "Default Racer". Verify fleet and details update.
4.  **Set Default**: select "Racer X", click "Set as Default". Restart app. Verify "Racer X" loads automatically.
