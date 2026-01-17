"""A.P.E.X. Tab 5: Setup Library (Master Chassis Library Management).

Handles:
- Setup library browsing & searching
- PDF/Vision parsing
- Setup comparison
- Package copy with staging modal
- Library save & import

State Management:
- Reads: racer_profile, active_session_id, actual_setup, comparison_baseline_id
- Writes: actual_setup, last_parsed_*, staging_*, show_library_save, comparison_baseline_id

Architecture:
- Imported by dashboard.py (the orchestrator)
- All session state keys pre-initialized by orchestrator
- Modular render functions for different UI sections
"""

import os
import time
from datetime import datetime

import pandas as pd
import streamlit as st

from Execution.services.comparison_service import SETUP_PACKAGES, comparison_service
from Execution.services.library_service import library_service
from Execution.services.package_copy_service import package_copy_service
from Execution.services.session_service import session_service
from Execution.services.setup_parser import setup_parser
from Execution.utils.cached_helpers import search_library_cached, clear_library_cache


def render_staging_modal():
    """Render the staging modal for package copy.

    Called when show_staging_modal=True and staging_package is set.
    Allows user to edit parameters before applying changes to Digital Twin.
    """
    if not st.session_state.show_staging_modal or not st.session_state.staging_package:
        return

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
        <div class="staging-header">📋 Staging: {st.session_state.staging_package}</div>
    """, unsafe_allow_html=True)

    # Get the baseline and current setup
    baseline = library_service.get_baseline(st.session_state.comparison_baseline_id)
    if baseline and st.session_state.actual_setup:
        # Stage the package
        staging = package_copy_service.stage_package(
            st.session_state.staging_package,
            baseline,
            st.session_state.actual_setup
        )

        # Show summary with mobile-friendly styling
        summary = package_copy_service.get_package_change_summary(staging)
        st.markdown(f"""
            <div class="staging-summary">{summary}</div>
        """, unsafe_allow_html=True)

        # Display editable parameters with mobile optimization
        st.markdown(f"**Parameters in {st.session_state.staging_package}:**")

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
            if st.button("✅ Apply", width="stretch", key="modal_apply",
                        help="Apply selected changes to Digital Twin"):
                # Apply the package
                updated_setup, changes_count = package_copy_service.apply_package(
                    st.session_state.staging_package,
                    edited_values,
                    st.session_state.actual_setup
                )

                # Update actual setup
                st.session_state.actual_setup = updated_setup

                # Close modal
                st.session_state.show_staging_modal = False
                st.session_state.staging_package = None
                st.session_state.staging_data = {}

                st.success(f"✅ Applied {changes_count} changes to Digital Twin")
                st.rerun()

        with action_col2:
            if st.button("🔄 Reset", width="stretch", key="modal_reset",
                        help="Reset edits to proposed values"):
                st.session_state.staging_data = {}
                st.rerun()

        with action_col3:
            if st.button("❌ Cancel", width="stretch", key="modal_cancel",
                        help="Close without applying changes"):
                st.session_state.show_staging_modal = False
                st.session_state.staging_package = None
                st.session_state.staging_data = {}
                st.rerun()


def render():
    """Render Tab 5: Setup Library."""
    st.subheader("📚 Master Chassis Library")
    st.caption("Compare setups, upload new sheets, and manage your personal racing library.")

    l_tab1, l_tab2 = st.tabs(["🔍 Browse & Compare", "📤 Upload Setup Sheet"])

    with l_tab1:
        # Comparison Mode Toggle
        compare_mode = st.checkbox("🔍 Compare Mode",
                                   help="Enable to compare library setups with your current or selected vehicle")

        st.divider()

        # Vehicle Selection (for filtering and comparison)
        if compare_mode:
            st.write("### 🏎️ Select Vehicle for Comparison")

            # Check if active session exists
            if st.session_state.active_session_id:
                session = session_service.get_session(st.session_state.active_session_id)
                if session:
                    current_brand = session.get('brand', '')
                    current_vehicle = session.get('vehicle_model', '')
                    st.info(f"📍 Current Session: **{current_brand} {current_vehicle}**")

                    use_session_vehicle = st.checkbox("Use current session vehicle", value=True)

                    if use_session_vehicle:
                        selected_brand = current_brand
                        selected_vehicle = current_vehicle
                    else:
                        # Manual vehicle selection
                        vehicles = st.session_state.racer_profile.get('vehicles', [])
                        if vehicles:
                            vehicle_options = [f"{v['Brand']} {v['Model']}" for v in vehicles]
                            selected = st.selectbox("Select Vehicle", vehicle_options)
                            selected_brand, selected_vehicle = selected.split(" ", 1)
                        else:
                            st.warning("⚠️ No vehicles in your fleet. Add vehicles in the sidebar.")
                            selected_brand = None
                            selected_vehicle = None
                else:
                    # No active session
                    st.info("ℹ️ No active session. Select a vehicle manually.")
                    vehicles = st.session_state.racer_profile.get('vehicles', [])
                    if vehicles:
                        vehicle_options = [f"{v['Brand']} {v['Model']}" for v in vehicles]
                        selected = st.selectbox("Select Vehicle", vehicle_options)
                        selected_brand, selected_vehicle = selected.split(" ", 1)
                    else:
                        st.warning("⚠️ No vehicles in your fleet. Add vehicles in the sidebar.")
                        selected_brand = None
                        selected_vehicle = None
            else:
                # No active session
                st.info("ℹ️ No active session. Select a vehicle manually.")
                vehicles = st.session_state.racer_profile.get('vehicles', [])
                if vehicles:
                    vehicle_options = [f"{v['Brand']} {v['Model']}" for v in vehicles]
                    selected = st.selectbox("Select Vehicle", vehicle_options)
                    selected_brand, selected_vehicle = selected.split(" ", 1)
                else:
                    st.warning("⚠️ No vehicles in your fleet. Add vehicles in the sidebar.")
                    selected_brand = None
                    selected_vehicle = None

            st.divider()
        else:
            selected_brand = None
            selected_vehicle = None

        # Library Browser
        st.write("### 🏺 Setup Library")

        # Search filters
        search_col1, search_col2 = st.columns(2)
        s_track = search_col1.text_input("Filter by Track", placeholder="e.g. Thunder Alley")

        if compare_mode and selected_brand:
            # In compare mode, only show matching brand/vehicle
            s_brand = selected_brand
            search_col2.text_input("Brand (Locked)", value=selected_brand, disabled=True)
        else:
            # Normal browse mode - show all brands
            s_brand = search_col2.selectbox("Filter by Brand", ["All", "Tekno", "Associated", "Mugen", "Xray"])
            s_brand = s_brand if s_brand != "All" else None

        # Search library (Phase 6.5.1: Cached for performance)
        results = search_library_cached(
            search_term=s_track if s_track else "",
            filters={
                'brand': s_brand if s_brand else None,
                'vehicle': selected_vehicle if compare_mode and selected_vehicle else None
            }
        )

        if not results.empty:
            # Sort by date descending
            results = results.sort_values('Date', ascending=False) if 'Date' in results.columns else results

            st.caption(f"Found {len(results)} setup(s)")

            # Display setups as expandable cards
            for _idx, setup in results.iterrows():
                setup_brand = setup.get('Brand', 'Unknown')
                setup_vehicle = setup.get('Vehicle', 'Unknown')
                setup_track = setup.get('Track', 'Unknown')
                setup_date = setup.get('Date', 'Unknown')
                setup_condition = setup.get('Condition', '')
                setup_source = setup.get('Source', 'Unknown')

                # Card title
                card_title = f"{setup_brand} {setup_vehicle} - {setup_track} ({setup_date})"

                with st.expander(card_title):
                    col1, col2 = st.columns([3, 1])

                    with col1:
                        st.markdown(f"**Track:** {setup_track}")
                        st.markdown(f"**Condition:** {setup_condition}")
                        st.markdown(f"**Source:** {setup_source}")
                        st.markdown(f"**Date:** {setup_date}")

                    with col2:
                        if compare_mode and st.session_state.actual_setup:
                            if st.button("⚖️ Compare", key=f"compare_{setup['ID']}", width="stretch"):
                                st.session_state.comparison_baseline_id = setup['ID']
                                st.rerun()

                        if st.button("📥 Import", key=f"import_{setup['ID']}", width="stretch", type="secondary"):
                            # Extract only the 24 parameters
                            param_keys = [
                                'DF', 'DC', 'DR',
                                'SO_F', 'SP_F', 'SB_F', 'P_F', 'Toe_F', 'RH_F', 'C_F', 'ST_F',
                                'SO_R', 'SP_R', 'SB_R', 'P_R', 'Toe_R', 'RH_R', 'C_R', 'ST_R',
                                'Tread', 'Compound', 'Venturi', 'Pipe', 'Clutch', 'Bell', 'Spur'
                            ]
                            clean_setup = {k: setup[k] for k in param_keys if k in setup and pd.notna(setup[k])}
                            st.session_state.actual_setup = clean_setup
                            st.success("✅ Imported setup to Digital Twin!")
                            st.rerun()
        else:
            st.info("📭 No setups found. Upload your first setup sheet to get started!")

        # Comparison View
        if compare_mode and 'comparison_baseline_id' in st.session_state and st.session_state.actual_setup:
            st.divider()
            st.write("## ⚖️ Setup Comparison")

            # Get baseline setup
            baseline = library_service.get_baseline(st.session_state.comparison_baseline_id)

            if baseline:
                # Validate compatibility
                is_compatible, error_msg = comparison_service.validate_comparison_compatibility(
                    {'brand': selected_brand, 'model': selected_vehicle},
                    {'brand': baseline.get('Brand'), 'model': baseline.get('Vehicle')}
                )

                if not is_compatible:
                    st.error(error_msg)
                    if st.button("❌ Close Comparison"):
                        del st.session_state.comparison_baseline_id
                        st.rerun()
                else:
                    # Perform comparison
                    comparison = comparison_service.compare_setups(
                        st.session_state.actual_setup,
                        baseline
                    )

                    # Display comparison header
                    st.markdown(f"### Comparing: Your Setup vs. {baseline.get('Source', 'Reference')}")
                    st.caption(f"Track: {baseline.get('Track')} | Condition: {baseline.get('Condition')} | Date: {baseline.get('Date')}")

                    # Overall similarity
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Overall Match", f"{comparison['match_percent']}%")
                    with col2:
                        st.metric("Matching Parameters", f"{comparison['match_count']} of {comparison['total_params']}")
                    with col3:
                        if st.button("❌ Close Comparison"):
                            del st.session_state.comparison_baseline_id
                            st.rerun()

                    st.divider()

                    # Display comparison by package
                    for package_name, package_info in SETUP_PACKAGES.items():
                        package_comparison = comparison['packages'][package_name]
                        package_match_pct = package_comparison['match_percent']

                        with st.expander(f"{package_info['icon']} {package_name} - {package_match_pct}% match", expanded=True):
                            st.caption(package_info['description'])

                            # Build comparison table
                            comparison_data = []
                            for param in package_info['params']:
                                param_comp = comparison['params'][param]

                                # Status emoji
                                status_icon = "🟢" if param_comp['status'] == 'match' else "🔴"

                                comparison_data.append({
                                    "Parameter": param,
                                    "Your Setup": param_comp['user'],
                                    "Reference": param_comp['reference'],
                                    "Status": status_icon
                                })

                            df_compare = pd.DataFrame(comparison_data)
                            st.dataframe(df_compare, hide_index=True, use_container_width=True)

                    # Package copy card for this package
                    if st.button(f"📦 Copy {package_name}", key=f"copy_btn_{package_name}",
                                width="stretch", help=f"Copy {package_name} package to Digital Twin"):
                        st.session_state.staging_package = package_name
                        st.session_state.show_staging_modal = True
                        st.rerun()

                # Render staging modal if visible
                render_staging_modal()

            else:
                st.error("❌ Could not load baseline for comparison.")
                if st.button("❌ Close Comparison"):
                    del st.session_state.comparison_baseline_id
                    st.rerun()

    with l_tab2:
        st.write("### 🏗️ Hybrid Parsing Engine (v1.7.0)")
        st.info("✨ **NEW**: Upload a fillable PDF setup sheet OR a clear photo of physical setup sheet to automatically extract its configuration using AI Vision.")

        # Get DATA_DIR for temp files
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        DATA_DIR = os.path.join(BASE_DIR, "data")
        os.makedirs(DATA_DIR, exist_ok=True)

        # Stage 1: Precision PDF Parsing
        with st.expander("📄 Stage 1: PDF Precision Parsing", expanded=True):
            st.caption("For fillable PDF setup sheets (Tekno, Associated, Mugen, Xray)")

            up_col1, up_col2 = st.columns(2)
            up_brand_pdf = up_col1.selectbox("Select Brand:", ["Tekno", "Associated", "Mugen", "Xray"], key="pdf_brand")
            up_model_pdf = up_col2.text_input("Model (Optional):", placeholder="e.g. NB48 2.2", key="pdf_model")

            pdf_file = st.file_uploader("Upload PDF Setup Sheet", type=["pdf"], key="pdf_upload")

            if pdf_file and st.button("🔍 Parse PDF", key="parse_pdf"):
                with st.spinner("Extracting AcroForm fields..."):
                    temp_path = os.path.join(DATA_DIR, "temp_import.pdf")
                    with open(temp_path, "wb") as f:
                        f.write(pdf_file.getbuffer())

                    st.session_state.last_parsed_data = setup_parser.parse_pdf(temp_path, up_brand_pdf)
                    st.session_state.last_parsed_source = "PDF"
                    st.session_state.last_parsed_brand = up_brand_pdf
                    st.session_state.last_parsed_model = up_model_pdf if up_model_pdf else up_brand_pdf
                    os.remove(temp_path)
                    st.rerun()

        # Stage 2: AI Vision Fallback
        with st.expander("📸 Stage 2: AI Vision Parsing", expanded=True):
            st.caption("For photos of setup sheets, scanned sheets, or when PDF parsing fails")

            vis_col1, vis_col2 = st.columns(2)
            up_brand_vis = vis_col1.selectbox("Select Brand:", ["Tekno", "Associated", "Mugen", "Xray"], key="vis_brand")
            up_model_vis = vis_col2.text_input("Model (Optional):", placeholder="e.g. NT48 2.2", key="vis_model")

            photo_file = st.file_uploader("Upload Photo of Setup Sheet", type=["jpg", "jpeg", "png"], key="photo_upload")

            if photo_file:
                st.image(photo_file, caption="Uploaded Setup Sheet", use_column_width=True)

                if st.button("🔍 Parse with AI Vision", key="parse_vision"):
                    with st.spinner("🤖 Analyzing with Claude Vision AI... (This may take 10-15 seconds)"):
                        try:
                            image_bytes = photo_file.read()
                            parsed_result = setup_parser.parse_with_vision(image_bytes, up_brand_vis)

                            if parsed_result and len(parsed_result) > 0:
                                st.session_state.last_parsed_data = parsed_result
                                st.session_state.last_parsed_source = "Vision"
                                st.session_state.last_parsed_brand = up_brand_vis
                                st.session_state.last_parsed_model = up_model_vis if up_model_vis else up_brand_vis
                                st.success(f"✅ Successfully extracted {len(parsed_result)} setup parameters!")
                                st.rerun()
                            else:
                                st.error("❌ Could not extract any setup parameters from the image. Try a clearer photo or different angle.")
                        except Exception as e:
                            st.error(f"❌ Vision parsing failed: {str(e)}")
                            print(f"Vision parsing error: {e}")

        # Display Parsed Results
        if "last_parsed_data" in st.session_state and st.session_state.last_parsed_data:
            st.divider()
            st.success(f"✅ Successfully extracted {len(st.session_state.last_parsed_data)} parameters via {st.session_state.get('last_parsed_source', 'Unknown')}")

            # Display in grid format
            st.write("### 📊 Extracted Parameters")
            cols = st.columns(4)
            for i, (key, value) in enumerate(st.session_state.last_parsed_data.items()):
                with cols[i % 4]:
                    st.metric(key, value)

            st.divider()

            # Action buttons
            act_col1, act_col2, act_col3 = st.columns(3)

            if act_col1.button("📥 Load to Digital Twin", type="primary"):
                if st.session_state.actual_setup:
                    st.session_state.actual_setup.update(st.session_state.last_parsed_data)
                else:
                    st.session_state.actual_setup = st.session_state.last_parsed_data

                st.success("✅ Setup imported to Digital Twin! (Available in Tab 2)")
                del st.session_state.last_parsed_data
                st.rerun()

            if act_col2.button("📚 Save to Master Library"):
                # Prompt for setup metadata
                st.session_state.show_library_save = True

            if act_col3.button("❌ Discard"):
                del st.session_state.last_parsed_data
                st.warning("Parsed data discarded.")
                st.rerun()

            # Verification Screen
            if st.session_state.get("show_library_save", False):
                st.divider()
                st.subheader("🔍 Verify Parsed Data")
                st.info("Review the extracted values below. Edit any incorrect parameters before saving.")

                # Initialize verified_data in session state if not exists
                if "verified_setup_data" not in st.session_state:
                    st.session_state.verified_setup_data = st.session_state.last_parsed_data.copy()

                # Build verification form with parameter categories
                st.write("### 📋 Extracted Parameters (Click to Edit)")

                # Create verification grid organized by package
                verified_data = {}

                for package_name, package_info in SETUP_PACKAGES.items():
                    with st.expander(f"{package_info['icon']} {package_name}", expanded=True):
                        # Organize parameters in columns
                        cols = st.columns(4)

                        for idx, param in enumerate(package_info['params']):
                            with cols[idx % 4]:
                                # Get current parsed value
                                parsed_value = st.session_state.last_parsed_data.get(param, "")

                                # Determine input type based on parameter
                                if param in ['DF', 'DC', 'DR', 'SO_F', 'SO_R', 'Bell', 'Spur', 'ST_F', 'ST_R']:
                                    # Integer inputs
                                    try:
                                        default_val = int(parsed_value) if parsed_value and parsed_value != "" else 0
                                    except (ValueError, TypeError):
                                        default_val = 0
                                    verified_data[param] = st.number_input(
                                        param,
                                        value=default_val,
                                        step=1 if param in ['Bell', 'Spur', 'ST_F', 'ST_R'] else 50,
                                        key=f"verify_{param}",
                                        help=f"Parsed: {parsed_value}"
                                    )

                                elif param in ['SB_F', 'SB_R', 'Toe_F', 'Toe_R', 'RH_F', 'RH_R', 'C_F', 'C_R', 'Venturi']:
                                    # Float inputs
                                    try:
                                        default_val = float(parsed_value) if parsed_value and parsed_value != "" else 0.0
                                    except (ValueError, TypeError):
                                        default_val = 0.0
                                    verified_data[param] = st.number_input(
                                        param,
                                        value=default_val,
                                        step=0.1,
                                        format="%.2f",
                                        key=f"verify_{param}",
                                        help=f"Parsed: {parsed_value}"
                                    )

                                else:
                                    # Text inputs (tire compounds, springs, pistons, etc.)
                                    verified_data[param] = st.text_input(
                                        param,
                                        value=str(parsed_value) if parsed_value and parsed_value != "" else "",
                                        key=f"verify_{param}",
                                        help=f"Parsed: {parsed_value}"
                                    )

                st.divider()

                # METADATA FORM
                st.write("### 📝 Setup Metadata")
                st.caption("Provide context for this setup")

                metadata_col1, metadata_col2 = st.columns(2)

                with metadata_col1:
                    track_name = st.text_input(
                        "Track Name*",
                        placeholder="e.g. Thunder Alley RC",
                        help="Where this setup was used"
                    )
                    racer_name = st.text_input(
                        "Racer Name",
                        placeholder="e.g. Ryan Maifield",
                        help="Who developed/drove this setup"
                    )
                    setup_date = st.date_input(
                        "Date",
                        value=datetime.now().date(),
                        help="When this setup was recorded"
                    )

                with metadata_col2:
                    condition = st.text_input(
                        "Track Condition*",
                        placeholder="e.g. Dry/Bumpy/High Traction",
                        help="Surface conditions (Dry/Wet/Dusty, Smooth/Bumpy/Rutted, High/Medium/Low grip)"
                    )
                    source_type = st.selectbox(
                        "Source Type",
                        ["User Upload", "Factory Base", "Friend/Teammate", "Online Forum", "Other"],
                        help="Where did this setup come from?"
                    )
                    st.text_area(
                        "Notes (Optional)",
                        placeholder="Any additional context about this setup...",
                        height=60,
                        help="Conditions, notes, anything helpful for future reference"
                    )

                st.divider()

                # VERIFICATION CHECKBOX + ACTION BUTTONS
                verify_checkbox = st.checkbox(
                    "✅ I have reviewed the extracted values and metadata",
                    help="Confirm you've checked everything before saving"
                )

                col1, col2, col3 = st.columns(3)

                with col1:
                    if st.button("💾 Save to Master Library", type="primary", disabled=not verify_checkbox, width="stretch"):
                        # Validate required fields
                        if not track_name or not condition:
                            st.error("⚠️ Track Name and Condition are required.")
                        else:
                            try:
                                # Call proper add_baseline method with all metadata
                                baseline_id = library_service.add_baseline(
                                    track=track_name,
                                    brand=st.session_state.last_parsed_brand,
                                    vehicle=st.session_state.last_parsed_model,
                                    condition=condition,
                                    setup_data=verified_data,
                                    source=source_type,
                                    driver_name=racer_name if racer_name else None
                                )

                                st.success(f"✅ Setup saved to Master Library! (ID: {baseline_id})")
                                st.balloons()

                                # Clean up session state
                                st.session_state.show_library_save = False
                                del st.session_state.last_parsed_data
                                st.session_state.verified_setup_data = {}

                                # Brief pause then rerun
                                time.sleep(1)
                                st.rerun()

                            except Exception as e:
                                st.error(f"❌ Error saving to library: {str(e)}")
                                st.info("Tip: Check that all parameters are valid numbers or text.")

                with col2:
                    if st.button("❌ Cancel", width="stretch"):
                        st.session_state.show_library_save = False
                        del st.session_state.last_parsed_data
                        st.session_state.verified_setup_data = {}
                        st.warning("Cancelled - setup not saved.")
                        st.rerun()

                with col3:
                    if st.button("📥 Load to Digital Twin", width="stretch", type="secondary"):
                        # Load verified data to Digital Twin
                        if st.session_state.actual_setup:
                            st.session_state.actual_setup.update(verified_data)
                        else:
                            st.session_state.actual_setup = verified_data

                        st.success("✅ Setup loaded to Digital Twin (Tab 2)!")
                        del st.session_state.last_parsed_data
                        st.session_state.show_library_save = False
                        st.rerun()
