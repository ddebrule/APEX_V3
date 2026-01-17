"""A.P.E.X. Sidebar Component.

Renders the racer profile editor and racing status in the Streamlit sidebar.

This component:
- Displays racer profile (name, email, socials, transponder)
- Allows editing of sponsors and fleet
- Shows ORP performance profile (experience level, driving style)
- Displays current session & weather status
- Syncs fleet to database and weather data
"""

import pandas as pd
import streamlit as st
from streamlit_js_eval import get_geolocation

from Execution.services.profile_service import profile_service
from Execution.utils.ui_helpers import get_weather


def render():
    """Render the sidebar with racer profile and racing status.

    Accesses/modifies st.session_state:
    - racer_profile: All profile fields (name, email, fleet, sponsors)
    - weather_data: Current weather/DA
    """
    # Import config service for fleet sync
    from Execution.services.config_service import config_service

    current_session = "Standard Practice"

    # Determine current session name from active session ID or logs
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    log_path = os.path.join(base_dir, "data", "track_logs.csv")

    if os.path.exists(log_path):
        try:
            history_df = pd.read_csv(log_path)
            if not history_df.empty:
                init_logs = history_df[history_df['Notes'].str.contains("SESSION_START:", na=False)]
                if not init_logs.empty:
                    latest = init_logs.iloc[-1]
                    current_session = latest['Event']
        except Exception:
            pass

    with st.sidebar:
        st.header("👤 Racer Profile")

        # === CONNECTION STATUS ===
        from Execution.database.database import db
        if db.is_connected:
            st.success("✅ Database Online")
        else:
            st.error("❌ Database Offline")
            st.warning("Using CSV Mode (Read-Only)")
        st.divider()

        # === PROFILE MANAGEMENT ===4.4: PROFILE SWITCHER (Multi-Racer Management) ===
        st.subheader("Select Racer")

        # Get all profiles
        all_profiles = profile_service.list_profiles()
        if all_profiles:
            # Build profile options with default indicator
            profile_options = []
            profile_ids = []
            default_index = 0

            for idx, profile in enumerate(all_profiles):
                profile_id = profile['id']
                profile_name = profile['name']
                is_default = profile.get('is_default', False)

                # Add star indicator for default profile
                display_name = f"⭐ {profile_name}" if is_default else profile_name
                profile_options.append(display_name)
                profile_ids.append(profile_id)

                # Set default index
                if profile_id == st.session_state.get('profile_id'):
                    default_index = idx

            # Profile selectbox
            selected_profile_display = st.selectbox(
                "Active Racer",
                options=profile_options,
                index=default_index,
                key="profile_selectbox",
                help="Switch between different racer profiles"
            )

            # Handle profile switch
            selected_index = profile_options.index(selected_profile_display)
            new_profile_id = profile_ids[selected_index]

            if new_profile_id != st.session_state.get('profile_id'):
                # Warn if active session exists
                if st.session_state.get('active_session_id'):
                    st.warning(
                        "⚠️ You have an active session. Switching profiles will clear your session data."
                    )
                    col1, col2 = st.columns(2)
                    if col1.button("✅ Confirm Switch", key="confirm_switch"):
                        # Clear session state (all except profile ID and racer profile)
                        _clear_session_state_for_profile_switch()

                        # Load new profile
                        new_profile = profile_service.get_profile(new_profile_id)
                        st.session_state.profile_id = new_profile_id
                        st.session_state.racer_profile = new_profile

                        # Auto-sync fleet
                        _sync_fleet_for_profile(new_profile)

                        st.success(f"✅ Switched to {new_profile['name']}")
                        st.rerun()
                    if col2.button("❌ Cancel", key="cancel_switch"):
                        st.rerun()
                else:
                    # No active session, switch immediately
                    new_profile = profile_service.get_profile(new_profile_id)
                    st.session_state.profile_id = new_profile_id
                    st.session_state.racer_profile = new_profile

                    # Auto-sync fleet
                    _sync_fleet_for_profile(new_profile)

                    st.rerun()

        # New Racer button (below selectbox)
        if st.button("➕ New Racer", key="new_racer_btn", use_container_width=True):
            st.session_state.show_new_racer_form = True

        # New racer creation form (expander)
        if st.session_state.get('show_new_racer_form', False):
            with st.expander("Create New Profile", expanded=True):
                with st.form("new_racer_form", clear_on_submit=True):
                    new_racer_name = st.text_input(
                        "Racer Name",
                        placeholder="e.g., Child Racer, Teammate"
                    )
                    new_racer_email = st.text_input(
                        "Email (Optional)",
                        placeholder="racer@example.com"
                    )

                    create_submitted = st.form_submit_button("✅ Create Profile")

                if create_submitted:
                    if not new_racer_name or not new_racer_name.strip():
                        st.error("❌ Racer name is required")
                    else:
                        # Create new profile
                        profile_id, error = profile_service.create_profile(
                            name=new_racer_name.strip(),
                            email=new_racer_email.strip() if new_racer_email else ""
                        )

                        if profile_id:
                            # Switch to new profile
                            new_profile = profile_service.get_profile(profile_id)
                            st.session_state.profile_id = profile_id
                            st.session_state.racer_profile = new_profile
                            st.session_state.show_new_racer_form = False

                            # Clear session state for new profile
                            _clear_session_state_for_profile_switch()

                            st.success(f"✅ Created and switched to {new_racer_name}")
                            st.rerun()
                        else:
                            st.error(f"❌ Error creating profile: {error}")

        st.divider()

        with st.expander("📝 Edit Profile", expanded=False):
            # === BATCH-SAVE FORM PATTERN ===
            # Wrap all profile editing in a single form to prevent focus loss
            # and intermediate reruns during data entry.

            with st.form("profile_editor_form", clear_on_submit=False):
                # --- Section 1: Personal Info ---
                # Capture current values in local variables (do NOT write to state yet)
                new_name = st.text_input(
                    "Name",
                    value=st.session_state.racer_profile.get("name", "")
                )
                new_email = st.text_input(
                    "Email",
                    value=st.session_state.racer_profile.get("email", "")
                )
                new_facebook = st.text_input(
                    "Facebook Profile",
                    value=st.session_state.racer_profile.get("facebook", "")
                )
                new_instagram = st.text_input(
                    "Instagram Profile",
                    value=st.session_state.racer_profile.get("instagram", "")
                )

                # --- Section 1b: Set as Default (Phase 4.4) ---
                current_profile_id = st.session_state.get('profile_id')
                is_current_default = False
                if current_profile_id:
                    all_profiles = profile_service.list_profiles()
                    for p in all_profiles:
                        if p['id'] == current_profile_id:
                            is_current_default = p.get('is_default', False)
                            break

                set_as_default = st.checkbox(
                    "⭐ Set as Default Profile",
                    value=is_current_default,
                    help="This profile will load automatically when you start the app"
                )

                # --- Section 2: Sponsors ---
                st.write("**Sponsors**")
                # Convert list of dicts to DataFrame for editor
                sponsors_input = st.session_state.racer_profile.get("sponsors", [])
                if not sponsors_input:
                    sponsors_input = [{"name": ""}]
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
                if not vehicles_input:
                    vehicles_input = [{"id": None, "brand": "", "model": "", "nickname": "", "transponder": ""}]
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

                # --- Section 4: Performance Profile (ORP) ---
                st.write("**Performance Profile (for ORP)**")

                if 'experience_level' not in st.session_state.racer_profile:
                    st.session_state.racer_profile['experience_level'] = 'Intermediate'
                if 'driving_style' not in st.session_state.racer_profile:
                    st.session_state.racer_profile['driving_style'] = ''

                new_experience_level = st.selectbox(
                    "Experience Level",
                    options=["Sportsman", "Intermediate", "Pro"],
                    index=["Sportsman", "Intermediate", "Pro"].index(
                        st.session_state.racer_profile.get('experience_level', 'Intermediate')
                    ),
                    help="Affects ORP weighting (Sportsman: 80% consistency, Pro: 70% speed)"
                )

                new_driving_style = st.text_area(
                    "Driving Style Notes",
                    value=st.session_state.racer_profile.get('driving_style', ''),
                    max_chars=255,
                    placeholder="e.g., 'Prefers smooth lines' or 'Likes rotation'",
                    height=80,
                    help="Your preferred approach (stored in profile)"
                )

                # --- Submit Action ---
                # This button is the ONLY thing that triggers a re-run/save
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
                        continue  # Skip rows where both brand AND model are empty

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
                    st.session_state.racer_profile['experience_level'] = new_experience_level
                    st.session_state.racer_profile['driving_style'] = new_driving_style

                    # Persist to Database
                    profile_id = st.session_state.get("profile_id")
                    if profile_id:
                        success, error = profile_service.update_profile(profile_id, st.session_state.racer_profile)

                        if success:
                            # Handle "Set as Default" checkbox (Phase 4.4)
                            if set_as_default and not is_current_default:
                                # User just checked the box - set as default
                                default_success, default_error = profile_service.set_default_profile(profile_id)
                                if not default_success:
                                    st.warning(f"Profile saved, but could not set as default: {default_error}")
                            elif not set_as_default and is_current_default:
                                # User unchecked the box - can't unset default without setting another
                                st.warning("⚠️ Profile is currently the default. You must set another profile as default first.")

                            st.success("Profile saved successfully!")
                            st.rerun()  # MANDATORY: Refresh UI and Sync Fleet context
                        else:
                            # Check if it's a duplicate vehicle error for better UX
                            if "Duplicate Vehicle" in error:
                                st.error(f"❌ {error}")
                                st.info(
                                    "**How to fix this:**\n"
                                    "1. Review your vehicles list above\n"
                                    "2. Find the duplicate vehicle (same brand + model)\n"
                                    "3. Either edit the existing vehicle or delete it\n"
                                    "4. Try saving again"
                                )
                            else:
                                st.error(f"Save Failed: {error}")
                    else:
                        st.error("Profile ID not found")
                else:
                    for err in validation_errors:
                        st.error(err)

            # --- Sync Fleet Button (Outside Form) ---
            st.divider()
            st.caption("💡 Tip: Save Profile above before syncing fleet.")
            if st.button("🔄 Sync Fleet Settings"):
                configs = config_service.load_configs()

                # Build list of vehicle display names from the saved fleet
                fleet_vehicles = st.session_state.racer_profile.get("vehicles", [])
                fleet_names = []
                for v in fleet_vehicles:
                    brand = v.get("brand", "").strip()
                    model = v.get("model", "").strip()
                    nickname = v.get("nickname", "").strip()

                    # Use nickname if available, otherwise construct "Brand Model"
                    if nickname:
                        fleet_names.append(nickname)
                    elif brand and model:
                        fleet_names.append(f"{brand} {model}")
                    elif brand:
                        fleet_names.append(brand)
                    elif model:
                        fleet_names.append(model)

                # Add missing vehicles with Universal Blank
                for v_name in fleet_names:
                    if v_name not in configs['Car'].tolist():
                        blank_row = {col: 0 for col in configs.columns}
                        blank_row['Car'] = v_name
                        # Set reasonable defaults for text fields
                        for txt_col in ['SP_F', 'P_F', 'SP_R', 'P_R', 'Tread', 'Compound', 'Pipe', 'Clutch']:
                            if txt_col in blank_row:
                                blank_row[txt_col] = "BLANK"
                        configs = pd.concat([configs, pd.DataFrame([blank_row])], ignore_index=True)

                config_service.save_configs(configs)
                st.success("Fleet Synchronized with Master Database.")
                st.rerun()

        # Racing status section
        st.divider()
        st.header("🏁 Racing Status")
        st.info(f"Driver: {st.session_state.racer_profile['name']}")
        st.info(f"Active Session: {current_session}")

        # Weather sync button
        if st.button("🛰️ Sync Track Weather"):
            loc = get_geolocation()
            if loc:
                st.session_state.weather_data = get_weather(
                    loc['coords']['latitude'],
                    loc['coords']['longitude']
                )
                st.rerun()

        # Display weather data if available
        if st.session_state.weather_data:
            st.sidebar.metric(
                "Density Altitude",
                st.session_state.weather_data.get("DA", "N/A")
            )


# === HELPER FUNCTIONS (Phase 4.4: Multi-Racer Management) ===

def _clear_session_state_for_profile_switch():
    """Clear all session state related to active setup and racing.

    Called when user switches to a different profile to prevent data bleed.
    Preserves: racer_profile, profile_id, user_id
    Clears: active_session_id, actual_setup, pending_changes, etc.
    """
    keys_to_clear = [
        'active_session_id',
        'actual_setup',
        'pending_changes',
        'track_context',
        'messages',  # Chat history
        'weather_data',
        'track_media',
        'tire_media',
        'x_factor_audit_id',
        'x_factor_state',
        'last_report',
        'practice_rounds',
        'qualifying_rounds',
        'practice_rounds_scheduled',
        'scenario',
        'change_history',
        'driver_confidence',
        'event_url',
        'monitored_heats',
        'active_classes',
        'show_staging_modal',
        'staging_package',
        'staging_data',
        'comparison_baseline_id',
        'last_parsed_data',
        'last_parsed_source',
        'last_parsed_brand',
        'last_parsed_model',
        'verified_setup_data',
        'show_library_save',
        'draft_session_id',
        'last_save_result',
        'draft_picker_shown',
        'prep_plan_pdf',
    ]

    for key in keys_to_clear:
        if key in st.session_state:
            del st.session_state[key]


def _sync_fleet_for_profile(racer_profile):
    """Sync the profile's vehicles to the Shop Master database.

    Called when switching profiles to load their vehicles into car_configs.csv.

    Args:
        racer_profile (dict): The racer profile with vehicles list
    """
    from Execution.services.config_service import config_service

    configs = config_service.load_configs()

    # Build list of vehicle display names from the fleet
    fleet_vehicles = racer_profile.get("vehicles", [])
    fleet_names = []

    for v in fleet_vehicles:
        brand = v.get("brand", "").strip()
        model = v.get("model", "").strip()
        nickname = v.get("nickname", "").strip()

        # Use nickname if available, otherwise construct "Brand Model"
        if nickname:
            fleet_names.append(nickname)
        elif brand and model:
            fleet_names.append(f"{brand} {model}")
        elif brand:
            fleet_names.append(brand)
        elif model:
            fleet_names.append(model)

    # Add missing vehicles with Universal Blank template
    for v_name in fleet_names:
        if v_name not in configs['Car'].tolist():
            blank_row = {col: 0 for col in configs.columns}
            blank_row['Car'] = v_name
            # Set reasonable defaults for text fields
            for txt_col in ['SP_F', 'P_F', 'SP_R', 'P_R', 'Tread', 'Compound', 'Pipe', 'Clutch']:
                if txt_col in blank_row:
                    blank_row[txt_col] = "BLANK"
            configs = pd.concat([configs, pd.DataFrame([blank_row])], ignore_index=True)

    config_service.save_configs(configs)
