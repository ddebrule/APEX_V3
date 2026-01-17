# Racer Profile Persistence Implementation Plan

## Goal Description
The Racer Profile feature currently relies solely on temporary session state. This means any changes made (adding sponsors, updating name/email) are lost if the browser is refreshed or the session ends. The goal is to implement full data persistence using the existing `racer_profiles` database table, ensuring that user edits are saved and restored correctly.

## User Review Required
> [!NOTE]
> **User ID Strategy**: `get_or_create_default_profile()` already exists in `database.py`; we will use it to get the ID.
> **Sponsor Data Mapping**: The App uses a List of Dicts `[{'name': 'Sponsor'}]` for the UI (DataFrame compatibility). The Database uses a generic Array `TEXT[]`.
>   - **Load**: Convert DB `['A', 'B']` -> App `[{'name': 'A'}, {'name': 'B'}]`.
>   - **Save**: Convert App `[{'name': 'A'}, {'name': 'B'}]` -> DB `['A', 'B']`.
>   - **Responsibility**: `ProfileService` will handle this conversion transparently.

## Proposed Changes

### Execution
#### [NEW] [profile_service.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Execution/services/profile_service.py)
Create `ProfileService` in `Execution/services/`.
- **`get_profile()`**:
  - Call `database.get_or_create_default_profile()` to get `profile_id`.
  - Query `SELECT * FROM racer_profiles WHERE id = %s`.
  - **Mapping**: Transform `sponsors` (SQL Array) -> `[{'name': s} for s in row['sponsors']]`.
  - **Fallback**: If DB fails, return default dict.
- **`update_profile(data)`**:
  - Call `database.get_or_create_default_profile()` to get `profile_id`.
  - **Mapping**: Transform `data['sponsors']` -> `[s['name'] for s in data['sponsors'] if s.get('name')]`.
  - Execute `UPDATE racer_profiles SET name=%s, email=%s, facebook=%s, instagram=%s, sponsors=%s WHERE id=%s`.
  - Returns `True`/`False` and optional error message.

#### [MODIFY] [dashboard.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Execution/dashboard.py)
Update `init_session_state` to load from DB.
- Import `from Execution.services.profile_service import profile_service`.
- Replace default `racer_profile` init with `profile_service.get_profile()`.

#### [MODIFY] [sidebar.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Execution/components/sidebar.py)
- Import `profile_service`.
- In `render()`, after the "Edit Profile" expander (or inside it at the bottom):
  - Add `if st.button("💾 Save Profile"):`.
  - Call `success, error = profile_service.update_profile(st.session_state.racer_profile)`.
  - If `success`: `st.success("Profile saved successfully!")`.
  - If `fail`: `st.error(f"Failed to save: {error}")`.

### Verification Plan

### Automated Tests
#### [NEW] [test_profile_mocks.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Execution/tests/test_profile_mocks.py)
- Use `unittest.mock` to mock `db.execute_query` and `get_or_create_default_profile`.
- Verify `ProfileService` correctly maps the Sponsor list <-> Array logic.

### Manual Verification
1.  **Start**: Run `streamlit run Execution/dashboard.py`.
2.  **Verify Load**: Check if name/sponsors load from DB (if connected) or fallback.
3.  **Edit**: Add a sponsor "Test Sponsor 1".
4.  **Save**: Click "Save Profile". Assert success message.
5.  **Persistence**: Stop app, restart app. Verify "Test Sponsor 1" is present.
