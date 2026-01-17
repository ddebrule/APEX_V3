"""A.P.E.X. Tab 3: Race Support (Ground Truth & LiveRC Monitoring).

Handles:
- LiveRC event URL input
- Heat & class monitoring
- Live heat scraping
- Ground truth data display
- Digital Twin drift analysis
- Static reference guides

State Management:
- Reads: racer_profile, active_session_id, actual_setup, pending_changes
- Writes: event_url, monitored_heats, active_classes

Architecture:
- Imported by dashboard.py (the orchestrator)
- All session state keys pre-initialized by orchestrator
- Stateless UI rendering with side effects (state updates)
"""

import pandas as pd
import streamlit as st

from Execution.services.liverc_harvester import LiveRCHarvester


def render():
    """Render Tab 3: Race Support."""
    # --- Current Session Context ---
    current_session = "No Active Session"
    if st.session_state.active_session_id:
        current_session = f"Session #{st.session_state.active_session_id}"

    st.subheader(f"🏁 Active Session: {current_session}")

    # Event Monitoring Section
    with st.expander("📡 LIVE EVENT MONITOR"):
        st.session_state.event_url = st.text_input(
            "Main Event URL (Result Index)",
            value=st.session_state.event_url,
            placeholder="https://track.liverc.com/results/"
        )
        col_m1, col_m2 = st.columns([1, 1])
        if col_m1.button("🔍 SCAN FOR MY HEATS"):
            if st.session_state.event_url:
                with st.spinner("Scanning Heat Sheets..."):
                    harvester = LiveRCHarvester(st.session_state.event_url)
                    r_name = st.session_state.racer_profile["name"]
                    classes = st.session_state.active_classes
                    st.session_state.monitored_heats = harvester.scan_heat_sheets(r_name, classes=classes)
                    if st.session_state.monitored_heats:
                        st.success(f"Found {len(st.session_state.monitored_heats)} races for {r_name}!")
                    else:
                        st.warning("No matches found. Ensure your name in the Profile matches LiveRC exactly.")
            else:
                st.error("Enter an Event URL first.")

        if st.session_state.monitored_heats:
            st.divider()
            st.write("### 📅 Your Event Schedule")
            for heat in st.session_state.monitored_heats:
                c1, c2, c3 = st.columns([1, 2, 1])
                c1.write(f"**{heat['Race']}**")
                status = heat['Status']
                if "Not Yet Run" in status:
                    c2.info(f"⌛ {status}")
                elif "Complete" in status:
                    c2.success(f"🏁 {status}")
                else:
                    c2.warning(status)
                c3.link_button("🔗 VIEW", heat['URL'])

    st.divider()

    # ALERT: Pending Changes
    if st.session_state.pending_changes:
        st.warning(f"⚠️ **NOTICE:** There are {len(st.session_state.pending_changes)} pending setup recommendations in the Advisor tab.")

    # --- DRIFT ANALYSIS (Actual vs Baseline) ---
    if st.session_state.actual_setup:
        st.write("### ⚖️ Digital Twin Drift Analysis")

        # Build comparison data
        actual = st.session_state.actual_setup

        comparison = []
        for key in actual.keys():
            act_val = actual[key]
            # Note: baseline comparison would require car_data lookup
            # For now, we display actual setup state
            comparison.append({
                "Parameter": key,
                "Actual Setup": act_val
            })

        if comparison:
            comp_df = pd.DataFrame(comparison)
            st.dataframe(comp_df, use_container_width=True, hide_index=True)
    else:
        st.info("No active session configuration locked. Digital Twin is offline.")

    st.divider()
    st.write("### 🌡️ Static Reference Guides")
    c1, c2 = st.columns(2)
    with c1:
        st.error("**Engine Tuning**")
        st.markdown("- **Rich**: Bogging, smoke, low temp 👉 *Lean LSN*")
        st.markdown("- **Lean**: High temp, hanging idle, cut out 👉 *Rich HSN*")
    with c2:
        st.warning("**Chassis Handling**")
        st.markdown("- **Understeer**: Thicker Front Diff or Softer Front Springs")
        st.markdown("- **Oversteer**: Thicker Rear Diff or Stiffer Front Springs")
