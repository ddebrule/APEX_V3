"""A.P.E.X. Tab 2: Setup Advisor (AI-Powered Recommendations).

Handles:
- Voice note recording & transcription
- AI chat interface for setup recommendations
- Weather data fetching & integration
- AI prompt generation with context
- ORP (Optimal Racing Performance) scoring
- Performance visualization

State Management:
- Reads: track_context, actual_setup, racer_profile
- Writes: messages, weather_data, pending_changes

Dependencies:
- anthropic: LLM for AI recommendations
- openai: Whisper transcription
- streamlit_mic_recorder: Voice recording
- plotly: Performance visualizations
- prompts: AI prompt templates
- RunLogsService: Session lap data
"""

import os
from datetime import datetime

import anthropic
import pandas as pd
import streamlit as st
from streamlit_mic_recorder import mic_recorder

from Execution.ai import prompts
from Execution.components import fragments
from Execution.services.run_logs_service import RunLogsService
from Execution.utils import detect_technical_keywords, encode_image, get_system_context, transcribe_voice
from Execution.visualization_utils import create_fade_indicator, create_lap_trend_chart, create_performance_window_chart


def render():
    """Render Tab 2: Setup Advisor."""
    # On Railway, get API key from environment variables (secrets.toml not available in container)
    ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
    if not ANTHROPIC_KEY:
        st.error("❌ ANTHROPIC_API_KEY not configured. Please set environment variable in Railway dashboard.")
        st.stop()
    LOG_PATH = "Execution/data/track_logs.csv"

    st.subheader("🛠️ Setup Advisor")

    # Use Fleet from Profile - construct vehicle names from nickname or brand/model
    fleet_list = []
    for v in st.session_state.racer_profile.get("vehicles", []):
        if v.get("nickname"):
            fleet_list.append(v["nickname"])
        elif v.get("brand") and v.get("model"):
            fleet_list.append(f"{v['brand']} {v['model']}")

    if not fleet_list:
        fleet_list = ["NB48 2.2 Buggy", "NT48 2.2 Truggy"]

    active_car_adv = st.selectbox("Car on Stand:", fleet_list, key="adv_car")
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    audio = mic_recorder(start_prompt="🎤 Record Observation", stop_prompt="✅ Analyze", key='scribe_v54')
    c_text, c_lap = st.columns([3, 1])
    manual_in = c_text.chat_input("Ask advisor...")
    lap_val = c_lap.number_input("Best Lap (s)", 0.0, 200.0, 0.0, step=0.1)

    with st.expander("📷 Tire & Chassis Vision", expanded=False):
        tire_up = st.file_uploader("Upload Tire/Chassis Wear Photos", type=["jpg", "png"], accept_multiple_files=True, key="tire_up")
        if tire_up:
            st.session_state.tire_media = tire_up

    # Get current session for context
    current_session = st.session_state.get('active_session_id', 'General')

    query = transcribe_voice(audio['bytes']) if audio else manual_in
    if query:
        st.session_state.messages.append({"role": "user", "content": query})
        with st.chat_message("assistant"):
            with st.status("🧠 Engineering Analysis (with ORP Constraints)..."):
                client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

                # Get active setup display
                active_config_display = st.session_state.get('actual_setup', {})
                lib = get_system_context(active_config_text=str(active_config_display))
                event_info = f"Session: {current_session} | Best Lap: {lap_val}s" if lap_val > 0 else f"Session: {current_session}"

                # === ORP CONTEXT INJECTION ===
                run_logs_service = RunLogsService()
                orp_context = {}
                if st.session_state.get('active_session_id'):
                    orp_context = run_logs_service.calculate_orp_from_session(
                        session_id=st.session_state.get('active_session_id'),
                        experience_level=st.session_state.get('experience_level', 'Intermediate'),
                        driver_confidence=st.session_state.get('driver_confidence', 3)
                    )

                # Fallback if ORP unavailable
                if not orp_context:
                    orp_context = {
                        'orp_score': 50,
                        'status': 'insufficient_data',
                        'consistency': 0,
                        'fade': 1.0
                    }

                # Determine Scenario A/B based on practice rounds
                practice_rounds = st.session_state.get('practice_rounds', 0)
                scenario = 'A' if practice_rounds >= 3 else 'B'
                confidence = st.session_state.get('driver_confidence', 3)
                experience_level = st.session_state.get('experience_level', 'Intermediate')
                orp_score = orp_context.get('orp_score', 50)

                # Experience level prioritization map
                exp_priority = {
                    'Sportsman': '80% Consistency / 20% Speed',
                    'Intermediate': '50% Consistency / 50% Speed',
                    'Pro': '30% Consistency / 70% Speed'
                }

                # Display ORP metrics before AI analysis (Phase 6.5.1: Isolated fragment)
                fragments.orp_metrics_display(
                    orp_score=orp_score,
                    orp_context=orp_context,
                    scenario=scenario,
                    confidence=confidence
                )

                # Get track context for memory lookup
                tc = st.session_state.get('track_context', {})
                if tc:
                    # Parse brand/model from selected car
                    car_parts = active_car_adv.split(' ', 1)
                    car_parts[0] if len(car_parts) > 0 else 'Tekno'
                    car_parts[1] if len(car_parts) > 1 else active_car_adv

                    # Use ORP-aware prompt function
                    prompt_text = prompts.get_tuning_prompt_with_orp(
                        car=active_car_adv,
                        query=query,
                        event_context=event_info,
                        library=lib,
                        orp_context=orp_context,
                        experience_level=experience_level,
                        scenario=scenario,
                        orp_score=orp_score,
                        confidence=confidence
                    )
                else:
                    # Fallback to basic prompt if no session context
                    prompt_text = prompts.get_tuning_prompt(active_car_adv, query, event_info, lib)

                # === BUILD PERSONA CONTEXT (Phase 5.1) ===
                engineer_context = {
                    'scenario': scenario,
                    'orp_score': orp_score,
                    'consistency_pct': orp_context.get('consistency', 0),
                    'fade_factor': orp_context.get('fade', 1.0),
                    'driver_confidence': confidence,
                    'experience_level': experience_level,
                    'change_history': st.session_state.get('change_history', [])
                }

                # Multi-modal payload construction
                content = [{"type": "text", "text": prompt_text}]

                # Attach Track Media from Session Setup (Tab 1)
                track_media = st.session_state.get('track_media', [])
                for img in track_media:
                    if hasattr(img, 'type') and img.type.startswith("image/"):
                        content.append({
                            "type": "image",
                            "source": {"type": "base64", "media_type": img.type, "data": encode_image(img)}
                        })

                # Attach Tire Media from Advisor Tab (Tab 2)
                tire_media = st.session_state.get('tire_media', [])
                for img in tire_media:
                    if hasattr(img, 'type') and img.type.startswith("image/"):
                        content.append({
                            "type": "image",
                            "source": {"type": "base64", "media_type": img.type, "data": encode_image(img)}
                        })

                # Get Engineer persona system prompt with dynamic context injection
                engineer_system_prompt = prompts.get_system_prompt("engineer", engineer_context)

                response = client.messages.create(
                    model="claude-sonnet-4-5",
                    max_tokens=2000,
                    temperature=0.3,
                    system=engineer_system_prompt,
                    messages=[{"role": "user", "content": content}]
                )
            reply = response.content[0].text

            # === AUTOMATIC KEYWORD DETECTION ===
            detected = detect_technical_keywords(query)

            # Visual highlighting based on detected keywords
            if detected.get("critical"):
                st.warning(f"🔴 **CRITICAL FEEDBACK DETECTED:** {', '.join(detected['critical'])}")
            if detected.get("performance"):
                st.info(f"⚡ **PERFORMANCE NOTE:** {', '.join(detected['performance'])}")
            if detected.get("track_features"):
                st.info(f"🏁 **TRACK INSIGHT:** {', '.join(detected['track_features'])}")

            st.markdown(reply)
            st.session_state.messages.append({"role": "assistant", "content": reply})

            # === ORP ANALYSIS CONTEXT DISPLAY ===
            st.divider()
            st.subheader("📊 ORP Analysis Context")

            col_orp_a, col_orp_b, col_orp_c, col_orp_d = st.columns(4)

            with col_orp_a:
                st.metric(
                    "ORP Score",
                    f"{orp_score:.1f}",
                    delta=f"{orp_context.get('consistency', 0):.1f}% consistency",
                    delta_color="inverse"
                )

            with col_orp_b:
                st.metric(
                    "Status",
                    orp_context.get('status', 'calculated').replace('_', ' ').title()
                )

            with col_orp_c:
                st.metric(
                    "Fade Factor",
                    f"{orp_context.get('fade', 1.0):.3f}",
                    help="1.0 = stable, <1.0 = improving, >1.0 = degrading"
                )

            with col_orp_d:
                gate_status = "✅ PASS" if confidence >= 3 else "❌ REJECT"
                st.metric(
                    "Confidence Gate",
                    gate_status,
                    delta=f"{confidence}/5"
                )

            # Show constraint info
            st.info(f"**Scenario {scenario}: {' Avant Garde (risky params allowed)' if scenario == 'A' else ' Conservative (safe params only)'}** | "
                   f"**{experience_level} Driver:** {exp_priority.get(experience_level, '50/50')}")

            # === ORP VISUALIZATION ===
            st.divider()
            st.subheader("📈 ORP Performance Visualizations")

            # Get lap times from run_logs_service for visualization
            if st.session_state.get('active_session_id'):
                lap_times = run_logs_service.get_session_laps(st.session_state.get('active_session_id'))

                if lap_times and len(lap_times) > 0:
                    best_lap = min(lap_times)
                    consistency = orp_context.get('consistency', 0)
                    fade_factor = orp_context.get('fade', 1.0)

                    # 2-column layout: Performance Window + Fade Indicator
                    col_viz1, col_viz2 = st.columns(2)

                    with col_viz1:
                        st.write("**Performance Window**")
                        fig_perf = create_performance_window_chart(lap_times, best_lap, consistency)
                        st.plotly_chart(fig_perf, use_container_width=True)

                    with col_viz2:
                        st.write("**Fade Indicator**")
                        fig_fade = create_fade_indicator(fade_factor)
                        st.plotly_chart(fig_fade, use_container_width=True)

                    # Full-width: Lap Time Trend
                    st.write("**Lap Time Trend**")
                    fig_trend = create_lap_trend_chart(lap_times, best_lap, confidence)
                    st.plotly_chart(fig_trend, use_container_width=True)
                else:
                    st.info("💡 Lap data will appear here as laps are recorded in the session.")

            # Simple [PROPOSED_CHANGE] parsing
            if "[PROPOSED_CHANGE]" in reply:
                change_str = reply.split("[PROPOSED_CHANGE]")[-1].strip()
                if 'pending_changes' not in st.session_state:
                    st.session_state.pending_changes = []
                st.session_state.pending_changes.append(change_str)

            # Enhanced logging with keyword flags
            all_keywords = detected.get("critical", []) + detected.get("performance", []) + detected.get("track_features", [])
            log_entry = {
                "Date": datetime.now().strftime("%m-%d %H:%M"),
                "Event": current_session,
                "Vehicle": active_car_adv,
                "Notes": query,
                "Lap_Time": lap_val if lap_val > 0 else None,
                "Keywords": ", ".join(all_keywords) if all_keywords else ""
            }
            if os.path.exists(LOG_PATH):
                pd.DataFrame([log_entry]).to_csv(LOG_PATH, mode='a', index=False, header=False)
            else:
                os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
                pd.DataFrame([log_entry]).to_csv(LOG_PATH, mode='w', index=False)

    # === PENDING RECOMMENDATIONS DISPLAY (Phase 6.5.1: Isolated fragment) ===
    if st.session_state.get('pending_changes'):
        # Fragment renders independently without full tab rerun
        update_info = fragments.pending_recommendations_panel(
            pending_changes=st.session_state.pending_changes,
            scenario='A' if st.session_state.get('practice_rounds', 0) >= 3 else 'B',
            driver_confidence=st.session_state.get('driver_confidence', 3)
        )

        # Apply updates from fragment
        if update_info.get('removed_indices'):
            # Remove accepted/discarded recommendations (in reverse order to maintain indices)
            for idx in sorted(update_info['removed_indices'], reverse=True):
                if 0 <= idx < len(st.session_state.pending_changes):
                    st.session_state.pending_changes.pop(idx)

        if update_info.get('accepted_changes'):
            # Log accepted changes to history
            for change_entry in update_info['accepted_changes']:
                st.session_state.change_history.append(change_entry)
