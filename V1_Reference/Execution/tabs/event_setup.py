"""A.P.E.X. Tab 1: Event Setup (Pre-Event Configuration).

Handles:
- Vehicle selection from fleet/Shop Master
- Session & track context initialization
- ORP scenario strategy selection
- Mechanical parameter initialization
- Session locking & Digital Twin creation
- Race prep plan generation

State Management:
- Reads: racer_profile, actual_setup
- Writes: active_session_id, actual_setup, track_context, session_just_started
         practice_rounds, qualifying_rounds, draft_session_id
"""

import os
from datetime import datetime

import pandas as pd
import streamlit as st

from Execution.services.autosave_manager import autosave_manager
from Execution.services.config_service import config_service
from Execution.services.orp_service import ORPService
from Execution.services.prep_plan_service import prep_plan_service
from Execution.services.session_service import session_service


def render():
    """Render Tab 1: Event Setup & Pre-Event Configuration.

    This is the primary entry point for starting a new session.
    It handles:
    1. Vehicle selection from Fleet
    2. Session & track context
    3. ORP strategy selection
    4. Mechanical parameters
    5. Session locking (creates persistent session in DB)
    """
    st.subheader("🏎️ Shop Master & Session Initiation")

    # --- CHECK FOR ACTIVE SESSIONS ---
    if st.session_state.active_session_id:
        with st.container(border=True):
            st.warning("**Active Session Detected**")
            st.info(
                "You have an ongoing session. Close it in Tab 4 (Post Event Analysis) "
                "before starting a new event."
            )
            if st.button("Continue with Current Session"):
                st.rerun()
            return  # Exit early if active session exists

    # --- VEHICLE SELECTION ---
    configs = config_service.load_configs()

    # Use Fleet from Profile as primary list
    fleet_list = [
        f"{v.get('brand', '')} {v.get('model', '')}".strip()
        for v in st.session_state.racer_profile.get("vehicles", [])
        if v.get('brand') and str(v.get('brand', '')).strip() not in ["", "None"]
    ]
    if not fleet_list:
        fleet_list = [c for c in configs['Car'].tolist() if pd.notna(c) and str(c).strip() != ""]

    if not fleet_list:
        st.error("⚠️ No vehicles found")
        st.info(
            "Before starting a session, you need to add at least one vehicle to your Racer Profile.\n\n"
            "**Steps to add a vehicle:**\n"
            "1. Open the sidebar (☰ menu at top left)\n"
            "2. Find the **Racer Profile** section\n"
            "3. Add a new vehicle to your fleet (e.g., 'Tekno NB48 2.2')\n"
            "4. Return to this tab and start your session"
        )
        return

    selected_car = st.selectbox("Vehicle Select:", fleet_list)

    # Safety Check: Car might not be synced to CSV yet
    if selected_car in configs['Car'].tolist():
        car_data = configs[configs['Car'] == selected_car].iloc[0]
    else:
        st.warning(
            f"⚠️ {selected_car} not found in database. Initializing with blank template."
        )
        # Create temporary blank row for UI
        # Create temporary blank row for UI with type-safe defaults
        blank_row = {}
        # Define known text columns to Initialize as strings
        text_cols = ['SP_F', 'P_F', 'SP_R', 'P_R', 'Tread', 'Compound', 'Pipe', 'Clutch', 'Car', 'Brand', 'Model', 'Notes']
        
        for col in configs.columns:
            if col in text_cols:
                blank_row[col] = "BLANK" if col in ['SP_F', 'P_F', 'SP_R', 'P_R', 'Tread', 'Compound', 'Pipe', 'Clutch'] else ""
            else:
                blank_row[col] = 0
                
        car_data = pd.Series(blank_row)

    # --- STEP 1: SESSION & TRACK CONTEXT ---
    st.write("### 🎯 Step 1: Session & Track Context")
    with st.form("lock_session"):
        sc1, sc2, sc3 = st.columns(3)
        event_name = sc1.text_input("Session Name", placeholder="e.g. Q1 Nitro Challenge")
        session_type = sc2.selectbox(
            "Session Type",
            ["Practice", "Qualifying", "Main", "Club Race"]
        )
        session_date = sc3.date_input("Date", datetime.now())

        tc1, tc2, tc3, tc4 = st.columns(4)
        track_name = tc1.text_input("Track Name", placeholder="e.g. Thunder Alley")
        track_size = tc2.selectbox("Track Size", ["Small", "Medium", "Large"])
        track_traction = tc3.selectbox("Traction Level", ["Low", "Medium", "High"])
        session_classes_raw = tc4.text_input(
            "Racing Classes",
            placeholder="e.g. Nitro Buggy, E-Buggy"
        )

        y1, y2 = st.columns(2)
        track_type = y1.selectbox("Type", ["Dusty", "Dry", "Wet", "Muddy"])
        track_surface = y2.selectbox("Surface", ["Smooth", "Bumpy", "Rutted"])

        st.write("**Track Photos/Video**")
        t_up = st.file_uploader(
            "Upload Track Walk Media",
            type=["jpg", "png", "mp4"],
            accept_multiple_files=True,
            key="track_up"
        )
        if t_up:
            st.session_state.track_media = t_up

        # === ORP STRATEGY INPUTS (Phase 5 Sprint 2) ===
        st.write("### 📊 Step 2: Race Schedule (for ORP Strategy)")
        st.caption(
            "These settings determine whether risky 'Avant Garde' setup changes "
            "are recommended."
        )

        orp1, orp2 = st.columns(2)
        practice_rounds = orp1.number_input(
            "Practice Rounds",
            min_value=0,
            max_value=10,
            value=st.session_state.get('practice_rounds', 0),
            step=1,
            help="Number of practice heats (0 = no practice, 3+ = Avant Garde mode unlocked)"
        )

        qualifying_rounds = orp2.number_input(
            "Qualifying Rounds",
            min_value=0,
            max_value=6,
            value=st.session_state.get('qualifying_rounds', 4),
            step=1,
            help="Number of qualifying heats to complete"
        )

        # Display ORP Scenario info
        orp_service = ORPService()
        experience_level = st.session_state.get('experience_level', 'Intermediate')
        strategy = orp_service.get_strategy_for_scenario(
            experience_level=experience_level,
            practice_rounds=practice_rounds,
            qualifying_rounds=qualifying_rounds
        )

        if strategy:
            scenario = "A: Avant Garde" if strategy['scenario'] == "A" else "B: Conservative"
            st.info(
                f"📊 **Scenario {scenario}** - {strategy['description']}\n\n"
                f"**Allowed Parameter Categories:** "
                f"{', '.join(strategy['allowed_parameters'][:3])}"
            )

        # --- SESSION LOCK BUTTON ---
        if st.form_submit_button("🚀 LOCK CONFIG & START SESSION"):
            # Validate required fields
            if not event_name or not track_name:
                st.error("⚠️ Event Name and Track Name are required.")
            else:
                session_classes = (
                    [c.strip() for c in session_classes_raw.split(",")]
                    if session_classes_raw
                    else []
                )
                st.session_state.active_classes = session_classes

                # Store ORP parameters for later use
                st.session_state.practice_rounds = practice_rounds
                st.session_state.qualifying_rounds = qualifying_rounds
                st.session_state.practice_rounds_scheduled = practice_rounds

                # === AUTO-DETECT SCENARIO (Priority 3) ===
                # Scenario A (Avant Garde): >= 3 practice rounds - allow aggressive changes
                # Scenario B (Conservative): < 3 practice rounds - only safe, reversible changes
                if practice_rounds >= 3:
                    st.session_state.scenario = "A"
                else:
                    st.session_state.scenario = "B"

                # Store track context for AI memory system
                st.session_state.track_context = {
                    "track_name": track_name,
                    "track_size": track_size,
                    "traction": track_traction,
                    "surface_type": track_type,
                    "surface_condition": track_surface,
                    "event_name": event_name,
                    "session_type": session_type,
                    "session_date": str(session_date)
                }

                # Create persistent session in database
                session_data = {
                    'session_name': event_name,
                    'session_type': session_type,
                    'track_name': track_name,
                    'track_size': track_size,
                    'traction': track_traction,
                    'surface_type': track_type,
                    'surface_condition': track_surface,
                    'actual_setup': st.session_state.actual_setup or {},
                    'practice_rounds': practice_rounds,
                    'qualifying_rounds': qualifying_rounds
                }

                # Phase 4.3: Auto-Save - Promote draft if one exists, otherwise create new session
                if st.session_state.draft_session_id:
                    # Promote existing draft to active
                    success = autosave_manager.promote_to_active(st.session_state.draft_session_id)
                    if success['status'] == 'success':
                        st.session_state.active_session_id = st.session_state.draft_session_id
                        st.session_state.draft_session_id = None
                        st.success("✅ Session Config Locked. Digital Twin Initialized.")
                        st.session_state.session_just_started = True
                        st.rerun()
                    else:
                        st.error(f"❌ Failed to lock session: {success['message']}")
                else:
                    # Create new session
                    new_session_id = session_service.create_session(
                        profile_id=None,  # TODO: Get from auth when available
                        vehicle_id=None,  # TODO: Get from fleet
                        session_data=session_data
                    )
                    if new_session_id:
                        st.session_state.active_session_id = new_session_id

                        # Log session start to track_logs
                        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                        log_path = os.path.join(base_dir, "data", "track_logs.csv")
                        class_str = ", ".join(session_classes)
                        full_context = (
                            f"EVENT: {event_name} ({session_type}) | CLASSES: {class_str} | "
                            f"TRACK: {track_name} ({track_size}/{track_traction}/{track_type}/{track_surface}) | "
                            f"Car: {selected_car}"
                        )
                        log_df = pd.DataFrame([{
                            "Date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                            "Event": event_name,
                            "Notes": f"SESSION_START: {full_context}"
                        }])
                        log_df.to_csv(
                            log_path,
                            mode='a',
                            header=not os.path.exists(log_path),
                            index=False
                        )

                        st.success("✅ Session Config Locked. Digital Twin Initialized.")
                        st.session_state.session_just_started = True
                        st.rerun()
                    else:
                        error_details = getattr(session_service, 'last_error', 'Unknown Error')
                        st.error(f"❌ Failed to create session. Error details: {error_details}")
                        if "practice_rounds" in str(error_details) or "qualifying_rounds" in str(error_details):
                            st.info("💡 Hint: You may need to run the database migration. Try checking 'schema_v2.sql'.")

    # --- STEP 3: MECHANICAL PARAMETERS ---
    st.divider()
    with st.container(border=True):
        st.write("### 🛠️ Step 3: Adjust Mechanical Parameters")

        # Use Actual Setup if session is active, else use Shop Master car_data
        base_src = st.session_state.actual_setup if st.session_state.actual_setup else car_data

        st.write("**Tires & Drivetrain**")
        tt1, tt2, d1, d2, d3 = st.columns(5)
        new_tread = tt1.text_input("Tread", value=base_src.get('Tread', 'Kosmos'))
        new_comp = tt2.text_input("Compound", value=base_src.get('Compound', 'Green'))
        new_df = d1.number_input("Front Diff", value=int(base_src.get('DF', 0)), step=500)
        new_dc = d2.number_input("Center Diff", value=int(base_src.get('DC', 0)), step=500)
        new_dr = d3.number_input("Rear Diff", value=int(base_src.get('DR', 0)), step=500)

        st.divider()
        st.write("**Front Suspension**")
        sf1, sf2, sf3, sf4, sf5, sf6, sf7 = st.columns(7)
        new_so_f = sf1.number_input("F Oil", value=int(base_src.get('SO_F', 0)))
        new_sp_f = sf2.text_input("F Spring", value=base_src.get('SP_F', 'BLANK'))
        new_sb_f = sf3.number_input(
            "F Bar",
            value=float(base_src.get('SB_F', 2.3)),
            step=0.1
        )
        new_p_f = sf4.text_input("F Pistons", value=base_src.get('P_F', '1.2x4'))
        new_toe_f = sf5.number_input(
            "F Toe",
            value=float(base_src.get('Toe_F', -1.0)),
            step=0.5
        )
        new_rh_f = sf6.number_input(
            "F RideHt",
            value=float(base_src.get('RH_F', 27.0)),
            step=0.5
        )
        new_c_f = sf7.number_input(
            "F Camber",
            value=float(base_src.get('C_F', -2.0)),
            step=0.5
        )

        st.write("**Rear Suspension**")
        sr1, sr2, sr3, sr4, sr5, sr6, sr7 = st.columns(7)
        new_so_r = sr1.number_input("R Oil", value=int(base_src.get('SO_R', 0)))
        new_sp_r = sr2.text_input("R Spring", value=base_src.get('SP_R', 'BLANK'))
        new_sb_r = sr3.number_input(
            "R Bar",
            value=float(base_src.get('SB_R', 2.5)),
            step=0.1
        )
        new_p_r = sr4.text_input("R Pistons", value=base_src.get('P_R', '1.7x4'))
        new_toe_r = sr5.number_input(
            "R Toe",
            value=float(base_src.get('Toe_R', 3.0)),
            step=0.5
        )
        new_rh_r = sr6.number_input(
            "R RideHt",
            value=float(base_src.get('RH_R', 28.0)),
            step=0.5
        )
        new_c_r = sr7.number_input(
            "R Camber",
            value=float(base_src.get('C_R', -3.0)),
            step=0.5
        )

        st.divider()
        st.write("**Power & Gearing**")
        p1, p2, p3, g1, g2 = st.columns(5)
        new_v = p1.number_input(
            "Venturi",
            value=float(base_src.get('Venturi', 7.0)),
            step=0.5
        )
        new_p = p2.text_input("Pipe", value=base_src.get("Pipe", "REDS 2143"))
        new_cl = p3.text_input("Clutch", value=base_src.get("Clutch", "4-Shoe Med"))
        new_b = g1.number_input("Bell", value=int(base_src.get('Bell', 13)))
        new_s = g2.number_input("Spur", value=int(base_src.get('Spur', 48)))

        # Prepare parameter lists for later use
        cols = [
            'DF', 'DC', 'DR',
            'SO_F', 'SP_F', 'SB_F', 'P_F', 'Toe_F', 'RH_F', 'C_F',
            'SO_R', 'SP_R', 'SB_R', 'P_R', 'Toe_R', 'RH_R', 'C_R',
            'Tread', 'Compound', 'Venturi', 'Pipe', 'Clutch', 'Bell', 'Spur'
        ]
        vals = [
            new_df, new_dc, new_dr,
            new_so_f, new_sp_f, new_sb_f, new_p_f, new_toe_f, new_rh_f, new_c_f,
            new_so_r, new_sp_r, new_sb_r, new_p_r, new_toe_r, new_rh_r, new_c_r,
            new_tread, new_comp, new_v, new_p, new_cl, new_b, new_s
        ]

        c1, c2 = st.columns(2)
        if c1.button("🔄 APPLY TO ACTUAL SETUP (SESSION)"):
            st.session_state.actual_setup = dict(zip(cols, vals))
            st.success("✅ Digital Twin Updated for this session.")
            st.rerun()

        if c2.button("💾 UPDATE PERMANENT SHOP MASTER"):
            if selected_car in configs['Car'].values:
                configs.loc[configs['Car'] == selected_car, cols] = vals
            else:
                new_row = dict(zip(cols, vals))
                new_row['Car'] = selected_car
                configs = pd.concat([configs, pd.DataFrame([new_row])], ignore_index=True)

            config_service.save_configs(configs)
            st.success(f"✅ Master Baseline for {selected_car} Updated.")
            st.rerun()

    # --- RACE PREP PLAN OFFER ---
    if st.session_state.session_just_started and st.session_state.track_context:
        with st.container(border=True):
            st.subheader("📋 Generate Race Prep Plan?")
            st.write("Create a strategic preparation document for this event.")
            st.caption(
                "Includes: Strategic Overview, Track Intelligence, Recommended Setup, "
                "Checklist, Parts List, Practice Strategy, Contingencies"
            )

            col_prep1, col_prep2 = st.columns(2)
            if col_prep1.button("Generate Race Prep Plan", type="primary"):
                with st.spinner("Building your race strategy..."):
                    # Get vehicle info from selected car
                    car_parts = selected_car.split(' ', 1) if selected_car else ['Tekno', 'NB48']
                    vehicle_info = {
                        'brand': car_parts[0] if len(car_parts) > 0 else 'Tekno',
                        'model': car_parts[1] if len(car_parts) > 1 else selected_car
                    }

                    pdf_bytes = prep_plan_service.generate_full_plan(
                        racer_profile=st.session_state.racer_profile,
                        track_context=st.session_state.track_context,
                        vehicle_info=vehicle_info
                    )

                    st.session_state.prep_plan_pdf = pdf_bytes
                    st.session_state.session_just_started = False
                    st.success("✅ Race Prep Plan Generated!")
                    st.rerun()

            if col_prep2.button("Skip for Now"):
                st.session_state.session_just_started = False
                st.rerun()

    # --- DOWNLOAD PREP PLAN ---
    if "prep_plan_pdf" in st.session_state and st.session_state.prep_plan_pdf:
        with st.container(border=True):
            st.success("✅ Your Race Prep Plan is ready!")
            dl_col1, dl_col2 = st.columns(2)
            dl_col1.download_button(
                "📥 Download PDF",
                st.session_state.prep_plan_pdf,
                file_name=f"Race_Prep_{st.session_state.track_context.get('track_name', 'Plan')}.pdf",
                mime="application/pdf"
            )
            if dl_col2.button("❌ Clear"):
                del st.session_state.prep_plan_pdf
                st.rerun()
