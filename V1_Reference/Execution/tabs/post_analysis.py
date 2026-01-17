"""A.P.E.X. Tab 4: Post Event Analysis (Analytics & Reporting).

Handles:
- X-Factor audit trail and session closeout
- Session performance rating
- Failure/success symptom collection
- Voice observation recording
- LiveRC data synchronization
- Lap time visualization & charts
- Race report generation (AI-powered)
- Email report distribution

State Management:
- Reads: actual_setup, active_session_id, messages
- Writes: x_factor_audit_id, x_factor_state, last_report

Dependencies:
- x_factor_service: X-Factor audit logic
- session_service: Session CRUD operations
- LiveRCHarvester: LiveRC web scraping
- email_service: Report distribution
- visualization_utils: Charts and graphs
- prompts: AI report generation
"""

import os
from datetime import datetime

import anthropic
import pandas as pd
import plotly.express as px
import streamlit as st
from streamlit_mic_recorder import mic_recorder

from Execution.ai import prompts
from Execution.services.email_service import email_service
from Execution.services.liverc_harvester import LiveRCHarvester
from Execution.services.session_service import session_service
from Execution.services.x_factor_service import FAILURE_SYMPTOMS, SUCCESS_GAINS, x_factor_service
from Execution.utils import transcribe_voice


def render():
    """Render Tab 4: Post Event Analysis."""
    # On Railway, get API key from environment variables (secrets.toml not available in container)
    ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
    if not ANTHROPIC_KEY:
        st.error("❌ ANTHROPIC_API_KEY not configured. Please set environment variable in Railway dashboard.")
        st.stop()
    LOG_PATH = "Execution/data/track_logs.csv"

    st.subheader("📊 Post Event Analysis")

    # Load history for session review
    history_df = pd.read_csv(LOG_PATH) if os.path.exists(LOG_PATH) else pd.DataFrame()

    # ============================================================
    # X-FACTOR PROTOCOL: SESSION CLOSEOUT AUDIT
    # ============================================================
    if st.session_state.get('active_session_id'):
        with st.expander("🎯 Session Closeout & X-Factor Audit", expanded=True):
            st.write("Close your session and rate your performance to add to Institutional Memory.")
            st.caption("This data helps the AI make better recommendations in the future.")

            # --- AUTOMATED REPORTING SETTINGS ---
            with st.expander("⚙️ Reporting Settings", expanded=False):
                auto_email = st.checkbox(
                    "📧 Automatically email race reports on session close",
                    value=st.session_state.get('auto_email_reports', False),
                    help="When enabled, completing the X-Factor audit will automatically send a comprehensive summary to your registered email."
                )
                st.session_state.auto_email_reports = auto_email

                if auto_email:
                    recipient_email = st.session_state.racer_profile.get('email', 'No email set')
                    st.info(f"📬 Reports will be sent to: **{recipient_email}**")
                    st.caption("Update email in Racer Profile (Sidebar) if needed.")
                else:
                    st.caption("Enable auto-reporting to receive hands-free sponsor updates.")

            st.divider()

            # Get session info
            active_session = session_service.get_active_session(profile_id=None)
            if active_session:
                st.info(f"**Active Session:** {active_session.get('session_name', 'Unnamed')} | "
                       f"**Track:** {active_session.get('track_name', 'Unknown')} | "
                       f"**Started:** {active_session.get('start_date', 'N/A')}")

            # Show changes made during session
            session_changes = session_service.get_session_changes(st.session_state.get('active_session_id'))
            if session_changes:
                st.write("**Changes made this session:**")
                for change in session_changes[:10]:
                    status_icon = "✅" if change.get('status') == 'accepted' else "❌"
                    st.markdown(f"- {status_icon} **{change.get('parameter')}**: {change.get('old_value')} -> {change.get('new_value')}")

            st.divider()

            # X-Factor Audit State Machine
            audit_state = st.session_state.get('x_factor_state', 'idle')

            if audit_state == "idle":
                if st.button("Begin Session Closeout", type="primary"):
                    audit_id = x_factor_service.start_session_audit(st.session_state.get('active_session_id'))
                    if audit_id:
                        st.session_state.x_factor_audit_id = audit_id
                        st.session_state.x_factor_state = "rating"
                        st.rerun()
                    else:
                        st.error("Failed to start audit. Database may not be connected.")

            elif audit_state == "rating":
                st.write("### Step 1: Rate Session Performance")
                st.caption("How did the car perform overall during this event?")

                rating = st.slider("Performance Rating", 1, 5, 3, help="1-2: Got worse | 3: No change | 4-5: Improved")

                rating_labels = {
                    1: "Significantly worse - major problems",
                    2: "Worse - noticeable issues",
                    3: "Neutral - no significant change",
                    4: "Better - noticeable improvement",
                    5: "Significantly better - great performance"
                }
                st.caption(rating_labels.get(rating, ""))

                if st.button("Continue", key="rating_continue"):
                    x_factor_service.record_rating(st.session_state.x_factor_audit_id, rating)
                    st.session_state.x_factor_rating = rating
                    if rating <= 2:
                        st.session_state.x_factor_state = "symptom"
                    elif rating >= 4:
                        st.session_state.x_factor_state = "gain"
                    else:
                        st.session_state.x_factor_state = "observation"
                    st.rerun()

            elif audit_state == "symptom":
                st.write("### Step 2: What Was the Primary Issue?")
                st.caption("Help the AI understand what went wrong.")

                symptom = st.radio("Select the main symptom:", FAILURE_SYMPTOMS, horizontal=True)

                if st.button("Continue", key="symptom_continue"):
                    x_factor_service.record_symptom(st.session_state.x_factor_audit_id, symptom)
                    st.session_state.x_factor_state = "observation"
                    st.rerun()

            elif audit_state == "gain":
                st.write("### Step 2: Where Did It Improve Most?")
                st.caption("Help the AI understand what got better.")

                gain = st.radio("Select the main improvement area:", SUCCESS_GAINS, horizontal=True)

                if st.button("Continue", key="gain_continue"):
                    x_factor_service.record_gain(st.session_state.x_factor_audit_id, gain)
                    st.session_state.x_factor_state = "observation"
                    st.rerun()

            elif audit_state == "observation":
                st.write("### Step 3: Final Observation")
                st.caption("Any notes for the 'setup binder'? (Voice or text)")

                # Voice input option
                audio = mic_recorder(key="xfactor_audio", start_prompt="🎙️ Record Note", stop_prompt="⏹️ Stop")
                observation = ""
                if audio:
                    observation = transcribe_voice(audio['bytes'])
                    st.text_area("Transcribed:", observation, key="obs_transcribed", disabled=True)
                else:
                    observation = st.text_area("Or type your observation:", placeholder="e.g. Car was great on corner exit but still loose on power application...")

                best_lap = st.number_input("Best Lap Time (optional):", min_value=0.0, step=0.001, format="%.3f")

                if st.button("Complete Audit & Close Session", type="primary"):
                    # Record observation
                    if observation:
                        x_factor_service.record_observation(
                            st.session_state.x_factor_audit_id,
                            observation,
                            best_lap if best_lap > 0 else None
                        )

                    # Complete the audit
                    x_factor_service.complete_audit(st.session_state.x_factor_audit_id)

                    # Close the session
                    session_service.close_session(st.session_state.get('active_session_id'))

                    # Reset state
                    st.session_state.active_session_id = None
                    st.session_state.x_factor_audit_id = None
                    st.session_state.x_factor_state = "idle"
                    st.session_state.actual_setup = None

                    st.success("Session closed! Data saved to Institutional Memory.")

                    # --- AUTOMATED EMAIL DISTRIBUTION ---
                    if st.session_state.get('auto_email_reports'):
                        with st.spinner("📧 Sending automated sponsor reports..."):
                            recipient = st.session_state.racer_profile.get("email", "racer@example.com")
                            session_name = active_session.get('session_name', 'Event') if active_session else 'Event'
                            subject = f"A.P.E.X. Race Report: {session_name}"

                            # Build comprehensive email report
                            rating_value = st.session_state.get('x_factor_rating', 'N/A')
                            rating_emoji = "🔴" if rating_value <= 2 else "🟡" if rating_value == 3 else "🟢"

                            summary = f"""
=== A.P.E.X. RACE REPORT ===

Racer: {st.session_state.racer_profile.get('name', 'N/A')}
Event: {session_name}
Track: {active_session.get('track_name', 'N/A') if active_session else 'N/A'}
Date: {datetime.now().strftime('%Y-%m-%d')}

PERFORMANCE RATING: {rating_emoji} {rating_value}/5

DRIVER OBSERVATION:
{observation if observation else 'No observation provided'}

BEST LAP TIME: {f"{best_lap:.3f}s" if best_lap and best_lap > 0 else 'Not recorded'}

SESSION CHANGES:
{len(session_changes) if session_changes else 0} setup adjustments made during this session

SETUP SNAPSHOT:
{str(st.session_state.get('actual_setup', {})) if st.session_state.get('actual_setup') else 'No Digital Twin loaded'}

---
Powered by AGR A.P.E.X. v1.8.3 - Phase 6 Modular Refactor
Accelerate Performance + Experimentation = X-Factor
"""

                            success, msg = email_service.send_report(recipient, subject, summary)

                            if success:
                                st.success(f"✅ Report sent to {recipient}")
                                st.caption(msg)
                            else:
                                st.error(f"❌ Failed to send report: {msg}")

                    st.balloons()
                    st.rerun()

            # Cancel button for any state except idle
            if audit_state != "idle":
                if st.button("Cancel Audit"):
                    st.session_state.x_factor_state = "idle"
                    st.session_state.x_factor_audit_id = None
                    st.rerun()
    else:
        with st.expander("🎯 Session Closeout", expanded=False):
            st.info("No active session. Start a session in Tab 1 to enable closeout audit.")

    st.divider()

    # LiveRC Harvester Section
    with st.expander("🌐 Sync LiveRC Data", expanded=True):
        lr_url = st.text_input("LiveRC Results URL", placeholder="https://track.liverc.com/results/?p=view_race_result&id=...")
        if st.button("🚀 FETCH TELEMETRY"):
            if lr_url:
                harvester = LiveRCHarvester(lr_url)
                if harvester.fetch_results():
                    r_name = st.session_state.racer_profile["name"]
                    tel = harvester.get_driver_telemetry(r_name)
                    if tel:
                        st.success(f"Telemetry Found for {r_name}!")
                        st.json(tel)
                        # Save to session log for Advisor context
                        note = f"LIVERC_SYNC: {tel['Laps/Time']} | Fastest: {tel['Fastest']} | Consistency: {tel['Consistency']}"
                        log_entry = {"Date": datetime.now().strftime("%Y-%m-%d %H:%M"), "Event": st.session_state.get('active_session_id', 'General'), "Notes": note}
                        if os.path.exists(LOG_PATH):
                            pd.DataFrame([log_entry]).to_csv(LOG_PATH, mode='a', index=False, header=False)
                        else:
                            os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
                            pd.DataFrame([log_entry]).to_csv(LOG_PATH, mode='w', index=False)
                        st.info("Performance data synced to session log.")
                    else:
                        st.warning(f"Results fetched, but racer '{r_name}' not found in the list. Check your name in the Profile sidebar.")
                        st.write("### Drivers Found:")
                        st.write(", ".join([d['Driver'] for d in harvester.driver_data]))
                else:
                    st.error("Failed to harvest LiveRC page. Ensure the URL is correct.")
            else:
                st.error("Please enter a valid LiveRC URL.")

    st.divider()

    # Session history review and reporting
    if not history_df.empty:
        selected_ev = st.selectbox("Select Session:", history_df['Event'].unique()[::-1])
        ev_logs = history_df[history_df['Event'] == selected_ev].copy()

        ev_logs['Lap_Time'] = pd.to_numeric(ev_logs.get('Lap_Time', None), errors='coerce')
        plot_data = ev_logs.dropna(subset=['Lap_Time'])
        if not plot_data.empty:
            fig = px.line(plot_data, x='Date', y='Lap_Time', markers=True,
                         title='⏱️ Lap Time Progression (Lower is Faster)',
                         template="plotly_dark", color_discrete_sequence=['#00FFCC'])
            fig.update_yaxes(autorange="reversed", title="Lap Time (s)")
            fig.update_xaxes(title="Time of Day")
            st.plotly_chart(fig, use_container_width=True)

        st.write("### 📜 Session Activity Log")
        for _, row in ev_logs.iterrows():
            is_start = "SESSION_START:" in str(row['Notes'])
            is_accepted = "ACCEPTED:" in str(row['Notes'])
            with st.container(border=True):
                c1, c2 = st.columns([4, 1])
                with c1:
                    st.markdown(f"**{row['Date']}**")
                    if is_start:
                        st.info(row['Notes'].replace("SESSION_START: ", "🏁 **Session Initialized:** "))
                    elif is_accepted:
                        st.success(row['Notes'].replace("ACCEPTED: ", "✅ **Change Applied:** "))
                    else:
                        st.write(f"📝 {row['Notes']}")
                with c2:
                    if 'Lap_Time' in row and pd.notnull(row['Lap_Time']) and row['Lap_Time'] > 0:
                        st.metric("Pace", f"{row['Lap_Time']}s")
                    if not is_start:
                        st.caption(f"🚗 {row.get('Vehicle', 'N/A')}")

        st.divider()
        st.write("### 🏁 Conclusion & Reports")

        rc1, rc2 = st.columns(2)
        rpt_format = rc1.selectbox("Report Format", ["Facebook/Instagram", "Sponsor Email", "Technical PDF"])

        if rc2.button("📝 GENERATE AI RACE REPORT"):
            with st.status("🤖 Drafting Race Report..."):
                client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
                session_summary = ev_logs.to_string()
                profile = st.session_state.racer_profile

                # Use the prompt generator
                prompt = prompts.get_report_prompt(profile, session_summary, rpt_format)

                # === BUILD ANALYST CONTEXT (Phase 5.1) ===
                analyst_context = {
                    'session_summary': session_summary,
                    'report_format': rpt_format,
                    'change_history': st.session_state.get('change_history', []),
                    'actual_setup': st.session_state.get('actual_setup', {})
                }

                # Get Analyst persona system prompt with dynamic context injection
                analyst_system_prompt = prompts.get_system_prompt("analyst", analyst_context)

                response = client.messages.create(
                    model="claude-sonnet-4-5",
                    max_tokens=2000,
                    temperature=0.7,
                    system=analyst_system_prompt,
                    messages=[{"role": "user", "content": prompt}]
                )
                st.session_state.last_report = response.content[0].text

        if st.session_state.get("last_report"):
            st.markdown(st.session_state.last_report)

            drc1, drc2 = st.columns(2)
            drc1.download_button("💾 Download Report (.md)", st.session_state.last_report, file_name=f"APEX_Report_{selected_ev}.md")

            if drc2.button("📩 PREPARE EMAIL REPORT"):
                with st.status("📧 Preparing email..."):
                    recipient = st.session_state.racer_profile.get("email", "racer@example.com")
                    subject = f"A.P.E.X. Race Report: {selected_ev}"
                    success, msg = email_service.send_report(recipient, subject, st.session_state.last_report)

                if success:
                    st.success(msg)
                else:
                    st.error(msg)
