"""
Phase 6.5.1: Streamlit Fragments for High-Frequency Components

This module contains isolated @st.fragment components that rerender independently
without triggering full-page reruns. Used for performance optimization.

Fragments:
- orp_metrics_display: ORP score, scenario, confidence gate, fade factor
- pending_recommendations_panel: Accept/Deny recommendation buttons
- staging_modal: 24-parameter editing form (Modal isolation)
- profile_editor_form: Profile & fleet editing (Sidebar isolation)

See: Phase 6.5.1 Reactive UI Refactor plan
"""

import streamlit as st


@st.fragment
def orp_metrics_display(orp_score, orp_context, scenario, confidence):
    """
    Fragment: ORP Metrics Display (Isolated Rerender)

    Displays 4-column metrics for ORP scoring without triggering full tab rerun.
    This component updates independently when AI responds with new ORP context.

    Args:
        orp_score (float): Current ORP score (0-100)
        orp_context (dict): Dict with 'consistency', 'fade' keys
        scenario (str): 'A' (Avant Garde) or 'B' (Conservative)
        confidence (int): Confidence rating (1-5)

    Benefit: Metrics update without rerunning entire Tab 2
    """
    col_orp1, col_orp2, col_orp3, col_orp4 = st.columns(4)

    with col_orp1:
        st.metric(
            "ORP Score",
            f"{orp_score:.1f}",
            delta=f"{orp_context.get('consistency', 0):.1f}% consistency"
        )

    with col_orp2:
        scenario_label = "A: Avant Garde" if scenario == 'A' else "B: Conservative"
        st.metric("Scenario", scenario_label)

    with col_orp3:
        gate_status = "✅ PASS" if confidence >= 3 else "❌ REJECT"
        st.metric("Confidence Gate", gate_status, delta=f"{confidence}/5")

    with col_orp4:
        fade_label = f"{orp_context.get('fade', 1.0):.3f}"
        st.metric(
            "Fade Factor",
            fade_label,
            help="<1.0=improving, 1.0=stable, >1.0=degrading"
        )


@st.fragment
def pending_recommendations_panel(pending_changes, scenario, driver_confidence):
    """
    Fragment: Pending Recommendations Panel (Isolated Rerender)

    Displays recommendation cards with Accept/Deny buttons.
    This component updates independently without rerunning Setup Advisor tab.

    Args:
        pending_changes (list): List of "PARAM: Value" recommendation strings
        scenario (str): 'A' (Avant Garde) or 'B' (Conservative)
        driver_confidence (int): Confidence rating (1-5)

    Benefit: Accept/Deny clicks don't trigger full tab rerun

    Returns:
        dict: Update info (keys removed, actions taken) or empty dict if no changes
    """
    from datetime import datetime

    if not pending_changes:
        return {}

    st.divider()
    st.write("### 🚦 Pending AI Recommendations")

    update_info = {
        'removed_indices': [],
        'accepted_changes': []
    }

    # Confidence gate check
    if driver_confidence < 3:
        st.error(
            f"🛑 **CONFIDENCE GATE REJECTED**\n\n"
            f"Driver confidence is {driver_confidence}/5 (threshold: 3/5). "
            f"Setup changes are NOT recommended at this confidence level.\n\n"
            f"**Recommendation:** Complete more practice rounds to build confidence before applying setup changes."
        )
        st.info(
            f"All {len(pending_changes)} pending recommendations are **BLOCKED** by the confidence gate. "
            f"Build your confidence data first, then reanalyze."
        )
        return update_info

    # Confidence gate PASSED - display recommendations
    SCENARIO_B_PARAMS = {'SO_F', 'SO_R', 'RH_F', 'RH_R', 'C_F', 'C_R'}

    for i, change in enumerate(pending_changes):
        with st.container(border=True):
            # Parse parameter
            param_key = None
            param_value = None

            if ":" in change:
                parts = change.split(":", 1)
                param_key = parts[0].strip().upper()
                param_value = parts[1].strip()

            # Check scenario constraints
            constraint_violated = False
            constraint_msg = ""

            if param_key and scenario == 'B':
                if param_key not in SCENARIO_B_PARAMS:
                    constraint_violated = True
                    constraint_msg = (
                        f"⚠️ **Scenario B Constraint Violation**: "
                        f"'{param_key}' is a risky parameter not allowed in Scenario B (Conservative).\n\n"
                        f"**Allowed in Scenario B:** {', '.join(sorted(SCENARIO_B_PARAMS))}\n\n"
                        f"**Reason:** Limited practice time requires safe, reversible changes only."
                    )

            # Render recommendation
            if constraint_violated:
                st.warning(constraint_msg)
                st.info(f"**Recommendation {i+1}:** {change}")
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("⚠️ APPLY ANYWAY (at your own risk)", key=f"frag_force_acc_{i}"):
                        st.warning("Applying high-risk parameter in conservative scenario. Proceed with caution.")
                        update_info['accepted_changes'].append({
                            'timestamp': datetime.now().isoformat(),
                            'parameter': param_key if param_key else 'Unknown',
                            'value': param_value if param_value else 'Unknown',
                            'status': 'accepted_forced'
                        })
                with col2:
                    if st.button(f"❌ DISCARD {i+1}", key=f"frag_den_{i}"):
                        update_info['removed_indices'].append(i)
            else:
                # No constraint violation
                st.info(f"**Recommendation {i+1}:** {change}")

                if param_key and scenario == 'B' and param_key in SCENARIO_B_PARAMS:
                    st.caption("✅ Parameter allowed in Scenario B (Conservative)")
                elif param_key and scenario == 'A':
                    st.caption("✅ Parameter allowed in Scenario A (Avant Garde)")

                col1, col2 = st.columns(2)
                with col1:
                    if st.button(f"✅ APPLY {change[:15]}...", key=f"frag_acc_{i}"):
                        update_info['accepted_changes'].append({
                            'timestamp': datetime.now().isoformat(),
                            'parameter': param_key if param_key else 'Unknown',
                            'value': param_value if param_value else 'Unknown',
                            'status': 'accepted'
                        })
                        st.success(f"Applied: {change}")

                with col2:
                    if st.button(f"❌ DISCARD {i+1}", key=f"frag_den_discard_{i}"):
                        update_info['removed_indices'].append(i)

    return update_info


@st.fragment
def staging_modal_fragment(show_modal, staging_package, comparison_baseline_id, actual_setup):
    """
    Fragment: Staging Modal (Isolated Rerender)

    Displays editable parameter grid for package copy staging.
    This component updates independently without rerunning entire Tab 5.

    Args:
        show_modal (bool): Whether to show the modal
        staging_package (str): Name of package being staged
        comparison_baseline_id (int): ID of baseline being copied
        actual_setup (dict): Current setup being compared

    Benefit: Parameter edits don't rerun entire setup library tab

    Returns:
        dict: Update info with modal actions (close, apply, reset)
    """
    from Execution.services.library_service import library_service
    from Execution.services.package_copy_service import package_copy_service

    if not show_modal or not staging_package:
        return {}

    update_info = {
        'action': None,  # 'apply', 'close', 'reset'
        'edited_values': {},
        'changes_count': 0
    }

    st.divider()

    # Mobile-optimized header
    st.markdown(f"""
        <style>
        .staging-header {{
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 1rem;
        }}
        .staging-summary {{
            background-color: #1a3a3a;
            border-left: 4px solid #51cf66;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1.5rem;
            font-size: 1.1em;
        }}
        </style>
        <div class="staging-header">📋 Staging: {staging_package}</div>
    """, unsafe_allow_html=True)

    # Get the baseline and current setup
    baseline = library_service.get_baseline(comparison_baseline_id)
    if baseline and actual_setup:
        # Stage the package
        staging = package_copy_service.stage_package(
            staging_package,
            baseline,
            actual_setup
        )

        # Show summary with mobile-friendly styling
        summary = package_copy_service.get_package_change_summary(staging)
        st.markdown(f"""
            <div class="staging-summary">{summary}</div>
        """, unsafe_allow_html=True)

        # Display editable parameters with mobile optimization
        st.markdown(f"**Parameters in {staging_package}:**")

        # Mobile-optimized parameter grid CSS
        st.markdown("""
            <style>
            .param-row {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 0.5rem;
                padding: 1rem 0;
                border-bottom: 1px solid #e0e0e0;
                font-size: 1rem;
            }
            .param-name {
                font-weight: 600;
                word-break: break-word;
            }
            .param-value {
                text-align: center;
            }
            .param-status-changed {
                color: #ff6b6b;
                font-weight: bold;
            }
            .param-status-same {
                color: #51cf66;
            }
            @media (max-width: 768px) {
                .param-row {
                    grid-template-columns: 1fr;
                    gap: 0.75rem;
                    padding: 0.75rem 0;
                }
            }
            </style>
        """, unsafe_allow_html=True)

        edited_values = {}
        for change in staging['changes']:
            param = change['param']
            current = change['current']
            proposed = change['proposed']
            param_type = change['param_type']

            status_icon = "🔴" if current != proposed else "🟢"

            # Mobile-responsive layout: single column on mobile, 4 columns on desktop
            col1, col2, col3, col4 = st.columns([1.5, 1, 1, 1.5])

            with col1:
                st.caption(f"**{param}**")

            with col2:
                st.caption(f"Current:\n{current}")

            with col3:
                st.caption(f"{status_icon}\n{proposed}")

            with col4:
                # Type-aware input with larger touch targets
                if param_type == 'integer':
                    edited_value = st.number_input(
                        label=f"Edit {param}",
                        value=int(proposed) if isinstance(proposed, (int, float)) and proposed != '—' else int(current) if isinstance(current, (int, float)) else 0,
                        step=1 if param in ['Bell', 'Spur', 'ST_F', 'ST_R'] else 50,
                        key=f"stage_int_{param}",
                        label_visibility="collapsed"
                    )
                    edited_values[param] = edited_value
                elif param_type == 'float':
                    edited_value = st.number_input(
                        label=f"Edit {param}",
                        value=float(proposed) if isinstance(proposed, (int, float)) and proposed != '—' else float(current) if isinstance(current, (int, float)) else 0.0,
                        step=0.1,
                        format="%.2f",
                        key=f"stage_float_{param}",
                        label_visibility="collapsed"
                    )
                    edited_values[param] = edited_value
                else:  # text
                    edited_value = st.text_input(
                        label=f"Edit {param}",
                        value=str(proposed) if proposed != '—' else str(current),
                        key=f"stage_text_{param}",
                        label_visibility="collapsed"
                    )
                    edited_values[param] = edited_value

        st.divider()

        # Mobile-optimized action buttons with larger touch targets (48px minimum height)
        st.markdown("""
            <style>
            .stButton > button {
                min-height: 48px;
                font-size: 16px;
                font-weight: 600;
                padding: 12px 16px;
            }
            @media (max-width: 768px) {
                .stButton > button {
                    min-height: 54px;
                    font-size: 18px;
                }
            }
            </style>
        """, unsafe_allow_html=True)

        # Action buttons with mobile-friendly layout
        action_col1, action_col2, action_col3 = st.columns(3, gap="small")

        with action_col1:
            if st.button("✅ Apply", width="stretch", key="frag_modal_apply",
                        help="Apply selected changes to Digital Twin"):
                # Apply the package
                updated_setup, changes_count = package_copy_service.apply_package(
                    staging_package,
                    edited_values,
                    actual_setup
                )
                update_info['action'] = 'apply'
                update_info['edited_values'] = edited_values
                update_info['changes_count'] = changes_count

        with action_col2:
            if st.button("🔄 Reset", width="stretch", key="frag_modal_reset",
                        help="Reset edits to proposed values"):
                update_info['action'] = 'reset'

        with action_col3:
            if st.button("❌ Cancel", width="stretch", key="frag_modal_cancel",
                        help="Close without applying changes"):
                update_info['action'] = 'close'

    return update_info


@st.fragment
def profile_editor_fragment(racer_profile, profile_id):
    """
    Fragment: Profile Editor (Isolated Rerender)

    Editable profile form with batch-save pattern.
    This component updates independently without rerunning entire sidebar.

    Args:
        racer_profile (dict): Current racer profile
        profile_id (int): Current profile ID for persistence

    Benefit: Profile edits don't reload entire sidebar

    Returns:
        dict: Update info with save success/errors
    """
    import pandas as pd
    from Execution.services.profile_service import profile_service

    update_info = {
        'saved': False,
        'error': None,
        'profile': racer_profile.copy()
    }

    # === BATCH-SAVE FORM PATTERN ===
    with st.form("frag_profile_editor_form", clear_on_submit=False):
        # --- Section 1: Personal Info ---
        new_name = st.text_input(
            "Name",
            value=racer_profile.get("name", "")
        )
        new_email = st.text_input(
            "Email",
            value=racer_profile.get("email", "")
        )
        new_facebook = st.text_input(
            "Facebook Profile",
            value=racer_profile.get("facebook", "")
        )
        new_instagram = st.text_input(
            "Instagram Profile",
            value=racer_profile.get("instagram", "")
        )

        # --- Section 1b: Set as Default ---
        all_profiles = profile_service.list_profiles()
        is_current_default = False
        for p in all_profiles:
            if p['id'] == profile_id:
                is_current_default = p.get('is_default', False)
                break

        set_as_default = st.checkbox(
            "⭐ Set as Default Profile",
            value=is_current_default,
            help="This profile will load automatically when you start the app"
        )

        # --- Section 2: Sponsors ---
        st.write("**Sponsors**")
        sponsors_input = racer_profile.get("sponsors", [])
        if not sponsors_input:
            sponsors_input = [{"name": ""}]
        df_sponsors = pd.DataFrame(sponsors_input)

        edited_sponsors_df = st.data_editor(
            df_sponsors,
            key="frag_sponsors_editor",
            num_rows="dynamic",
            use_container_width=True,
            column_config={"name": st.column_config.TextColumn("Sponsor Name")}
        )

        # --- Section 3: Fleet ---
        st.write("**Fleet (Vehicles)**")
        vehicles_input = racer_profile.get("vehicles", [])
        if not vehicles_input:
            vehicles_input = [{"id": None, "brand": "", "model": "", "nickname": "", "transponder": ""}]
        df_vehicles = pd.DataFrame(vehicles_input)

        edited_vehicles_df = st.data_editor(
            df_vehicles,
            key="frag_fleet_editor",
            num_rows="dynamic",
            use_container_width=True,
            column_config={
                "id": None,
                "brand": st.column_config.TextColumn("Brand"),
                "model": st.column_config.TextColumn("Model"),
                "nickname": st.column_config.TextColumn("Nickname"),
                "transponder": st.column_config.TextColumn("Transponder #")
            },
            hide_index=True
        )

        # --- Section 4: Performance Profile (ORP) ---
        st.write("**Performance Profile (for ORP)**")

        if 'experience_level' not in racer_profile:
            racer_profile['experience_level'] = 'Intermediate'
        if 'driving_style' not in racer_profile:
            racer_profile['driving_style'] = ''

        new_experience_level = st.selectbox(
            "Experience Level",
            options=["Sportsman", "Intermediate", "Pro"],
            index=["Sportsman", "Intermediate", "Pro"].index(
                racer_profile.get('experience_level', 'Intermediate')
            ),
            help="Affects ORP weighting (Sportsman: 80% consistency, Pro: 70% speed)"
        )

        new_driving_style = st.text_area(
            "Driving Style Notes",
            value=racer_profile.get('driving_style', ''),
            max_chars=255,
            placeholder="e.g., 'Prefers smooth lines' or 'Likes rotation'",
            height=80,
            help="Your preferred approach (stored in profile)"
        )

        # --- Submit Action ---
        submitted = st.form_submit_button("💾 Save Profile")

    # --- Validation, Save & Logic (Post-Submit, Outside Form) ---
    if submitted:
        # Process Vehicles
        cleaned_vehicles = []
        vehicles_records = edited_vehicles_df.to_dict('records')

        for v in vehicles_records:
            brand = str(v.get('brand', '')).strip() if pd.notna(v.get('brand')) else ''
            model = str(v.get('model', '')).strip() if pd.notna(v.get('model')) else ''

            if not brand and not model:
                continue

            cleaned_row = {
                'id': v.get('id') if pd.notna(v.get('id')) else None,
                'brand': brand,
                'model': model,
                'nickname': str(v.get('nickname', '')).strip() if pd.notna(v.get('nickname')) else '',
                'transponder': str(v.get('transponder', '')).strip() if pd.notna(v.get('transponder')) else ''
            }
            cleaned_vehicles.append(cleaned_row)

        # Process Sponsors
        cleaned_sponsors = []
        sponsors_records = edited_sponsors_df.to_dict('records')

        for s in sponsors_records:
            name = str(s.get('name', '')).strip() if pd.notna(s.get('name')) else ''
            if name:
                cleaned_sponsors.append({'name': name})

        # Build updated profile
        updated_profile = {
            "name": new_name,
            "email": new_email,
            "facebook": new_facebook,
            "instagram": new_instagram,
            "sponsors": cleaned_sponsors,
            "vehicles": cleaned_vehicles,
            "experience_level": new_experience_level,
            "driving_style": new_driving_style
        }

        # Persist to Database
        if profile_id:
            success, error = profile_service.update_profile(profile_id, updated_profile)

            if success:
                if set_as_default and not is_current_default:
                    profile_service.set_default_profile(profile_id)
                elif not set_as_default and is_current_default:
                    st.warning("⚠️ Profile is currently the default. Set another profile as default first.")

                update_info['saved'] = True
                update_info['profile'] = updated_profile
                st.success("Profile saved successfully!")
            else:
                update_info['error'] = error
                if "Duplicate Vehicle" in error:
                    st.error(f"❌ {error}")
                    st.info("Review your vehicles list - check for duplicates (same brand + model)")
                else:
                    st.error(f"Save Failed: {error}")
        else:
            update_info['error'] = "Profile ID not found"
            st.error("Profile ID not found")

    return update_info
