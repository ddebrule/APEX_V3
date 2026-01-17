# Phase 6: Racer Profile UX Optimization

## Goal
Eliminate the data entry friction and "focus loss" bugs in the Racer Profile sidebar by implementing a "Batch Save" workflow inside a single unified Streamlit form.

## Problem Analysis
The user reports:
> "It's a cumbersome process... Write now I enter vehicle then it clears my entry on model to save the brand name."

**Technical Cause**:
The `st.data_editor` is currently running in "immediate mode". Every interaction triggers a script rerun, immediately updating `st.session_state` and re-rendering. This causes focus loss and partial data saves.

## Proposed Changes

### 1. Unified Form Architecture (`Execution/components/sidebar.py`)

We will wrap **all** profile fields into a **Single Streamlit Form**.

**Structure**:
```python
import pandas as pd # Ensure pandas is imported

with st.expander("📝 Edit Profile", expanded=False):
    with st.form("profile_editor_form", clear_on_submit=False):
        # --- Section 1: Personal Info ---
        # Capture current values in local variables
        new_name = st.text_input("Name", value=st.session_state.racer_profile.get("name", ""))
        new_email = st.text_input("Email", value=st.session_state.racer_profile.get("email", ""))
        new_facebook = st.text_input("Facebook Profile", value=st.session_state.racer_profile.get("facebook", ""))
        new_instagram = st.text_input("Instagram Profile", value=st.session_state.racer_profile.get("instagram", ""))

        # --- Section 2: Sponsors ---
        st.write("**Sponsors**")
        # Convert list of dicts to DataFrame for editor
        sponsors_input = st.session_state.racer_profile.get("sponsors", [])
        if not sponsors_input: sponsors_input = [{"name": ""}] # Seed empty row
        df_sponsors = pd.DataFrame(sponsors_input)
        
        edited_sponsors_df = st.data_editor(
            df_sponsors,
            key="form_sponsors_editor", 
            num_rows="dynamic",
            use_container_width=True,
            column_config={"name": st.column_config.TextColumn("Sponsor Name")}
        )

        # --- Section 3: Fleet ---
        st.write("**Fleet (Vehicles)**")
        # Convert list of dicts to DataFrame for editor
        vehicles_input = st.session_state.racer_profile.get("vehicles", [])
        if not vehicles_input: vehicles_input = [{"id": None, "brand": "", "model": "", "nickname": "", "transponder": ""}]
        df_vehicles = pd.DataFrame(vehicles_input)

        edited_vehicles_df = st.data_editor(
            df_vehicles,
            key="form_fleet_editor",
            num_rows="dynamic",
            use_container_width=True,
            column_config={
                "id": None,  # Hide ID
                "brand": st.column_config.TextColumn("Brand"),
                "model": st.column_config.TextColumn("Model"),
                "nickname": st.column_config.TextColumn("Nickname"),
                "transponder": st.column_config.TextColumn("Transponder #")
            },
            hide_index=True
        )

        # --- Submit Action ---
        # Triggers the re-run
        submitted = st.form_submit_button("💾 Save Profile")

    # --- Validation, Save & Logic (Post-Submit, Outside Form) ---
    if submitted:
        validation_errors = []
        
        # 1. Process Vehicles (DataFrame -> List of Dicts)
        cleaned_vehicles = []
        # Handle DataFrame output
        vehicles_records = edited_vehicles_df.to_dict('records')
        
        for v in vehicles_records:
            brand = str(v.get('brand', '')).strip() if pd.notna(v.get('brand')) else ''
            model = str(v.get('model', '')).strip() if pd.notna(v.get('model')) else ''
            
            # VALIDATION RULE: At least Brand OR Model must be present
            if not brand and not model:
                continue # specific empty row filter
                
            # Clean data
            cleaned_row = {
                'id': v.get('id') if pd.notna(v.get('id')) else None,
                'brand': brand,
                'model': model,
                'nickname': str(v.get('nickname', '')).strip() if pd.notna(v.get('nickname')) else '',
                'transponder': str(v.get('transponder', '')).strip() if pd.notna(v.get('transponder')) else ''
            }
            cleaned_vehicles.append(cleaned_row)

        # 2. Process Sponsors (DataFrame -> List of Dicts)
        cleaned_sponsors = []
        sponsors_records = edited_sponsors_df.to_dict('records')
        
        for s in sponsors_records:
            name = str(s.get('name', '')).strip() if pd.notna(s.get('name')) else ''
            # VALIDATION RULE: Name must not be empty
            if name:
                cleaned_sponsors.append({'name': name})

        # 3. Commit or Error
        if not validation_errors:
            # Update Session State
            st.session_state.racer_profile["name"] = new_name
            st.session_state.racer_profile["email"] = new_email
            st.session_state.racer_profile["facebook"] = new_facebook
            st.session_state.racer_profile["instagram"] = new_instagram
            st.session_state.racer_profile["sponsors"] = cleaned_sponsors
            st.session_state.racer_profile["vehicles"] = cleaned_vehicles
            
            # Persist to Database
            success, error = profile_service.update_profile(profile_id, st.session_state.racer_profile)
            
            if success:
                st.success("Profile saved successfully!")
                st.rerun() # MANDATORY: Refresh UI and Sync Fleet context
            else:
                st.error(f"Save Failed: {error}")
        else:
            for err in validation_errors:
                st.error(err)
```

### 2. "Sync Fleet" Workflow Update

Move "Sync Fleet" **OUTSIDE** and **BELOW** the form.

**Logic Update**:
- The button works on `st.session_state.racer_profile`.
- Because we call `st.rerun()` on save, the button always sees the latest saved data.
- **UX**: Add helper text: `st.caption("Tip: Save Profile above before syncing fleet.")`

### 3. Verification Plan

#### Test Case 1: Batch Entry
- **Action**: Open form. Fill Name. Add 2 sponsors. Add 1 vehicle.
- **Check**: No app re-runs while typing. Focus remains stable.
- **Action**: Click Save.
- **Result**: Success message appears. App refreshes. Data persists.

#### Test Case 2: Validation Logic
- **Action**: Add vehicle with **only** Brand (no Model). Save.
- **Result**: **Accepted** (Row is saved).
- **Action**: Add vehicle with **only** Model (no Brand). Save.
- **Result**: **Accepted** (Row is saved).
- **Action**: Add sponsor with empty name. Save.
- **Result**: **Filtered Out** (Row disappears, not saved).

#### Test Case 3: Sync Integration
- **Action**: Create new vehicle "TestCar". Save.
- **Action**: Click "Sync Fleet".
- **Result**: "TestCar" appears in `config_service` (Car Configs).

#### Test Case 4: Discard
- **Action**: Type junk in Name field. Do NOT click Save.
- **Action**: Refresh browser (F5).
- **Result**: Name reverts to previous saved value.
