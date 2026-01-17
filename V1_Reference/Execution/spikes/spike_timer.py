"""
Spike 1: UI Latency Test (`st.fragment`)

Goal: Measure if Streamlit's st.fragment can achieve < 200ms click-to-update latency.

Instructions:
1. Run: streamlit run Execution/spikes/spike_timer.py
2. Click the "Start Stopwatch" button
3. Stop it immediately after (click again)
4. Record the elapsed time in milliseconds
5. Repeat 5 times and average
6. Success Criteria: Average < 200ms

Current Expectation: With st.fragment, should be ~50-150ms per click.
"""

import streamlit as st
import time
from datetime import datetime

# === PAGE CONFIG ===
st.set_page_config(page_title="Spike 1: UI Latency Test", layout="centered")
st.title("⚡ Spike 1: UI Latency Test")
st.subtitle("Measuring st.fragment responsiveness")

# === SETUP SESSION STATE ===
if "test_results" not in st.session_state:
    st.session_state.test_results = []
    st.session_state.stopwatch_running = False
    st.session_state.start_time = None
    st.session_state.last_tick = None


# === ISOLATED FRAGMENT: HIGH-FREQUENCY COMPONENT ===
@st.fragment
def stopwatch_component():
    """Fragment that rerenders independently when stopwatch state changes."""

    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("▶️ Start/Stop", key="stopwatch_button", use_container_width=True):
            if st.session_state.stopwatch_running:
                # STOP: Record result
                elapsed_ms = (time.time() - st.session_state.start_time) * 1000
                st.session_state.test_results.append(elapsed_ms)
                st.session_state.stopwatch_running = False
                st.session_state.start_time = None
                st.success(f"✅ Stopped. Elapsed: {elapsed_ms:.1f}ms")
            else:
                # START: Begin timing
                st.session_state.stopwatch_running = True
                st.session_state.start_time = time.time()
                st.info("⏱️ Stopwatch started...")

    with col2:
        st.metric(
            "Status",
            "🟢 RUNNING" if st.session_state.stopwatch_running else "🔴 STOPPED"
        )

    with col3:
        if st.session_state.stopwatch_running and st.session_state.start_time:
            elapsed = (time.time() - st.session_state.start_time) * 1000
            st.metric("Elapsed (ms)", f"{elapsed:.0f}")
        else:
            st.metric("Elapsed (ms)", "—")


# === MAIN LAYOUT ===
st.divider()
st.subheader("📊 Test Instructions")

col_instr1, col_instr2 = st.columns(2)

with col_instr1:
    st.markdown("""
    **Test Protocol:**
    1. Click "Start/Stop" button
    2. Note time to first metric update
    3. Stop immediately
    4. Record elapsed milliseconds
    5. Repeat 5 times
    """)

with col_instr2:
    st.markdown("""
    **Success Criteria:**
    - ✅ **PASS:** Average < 200ms
    - ⚠️ **CAUTION:** 200-500ms (marginal)
    - ❌ **FAIL:** > 500ms or flickering

    **Fallback:** If FAIL → Pivot to React components
    """)

st.divider()

# === STOPWATCH COMPONENT (isolated rerender) ===
st.subheader("⏱️ Stopwatch Component")
stopwatch_component()

# === RESULTS TRACKING ===
st.divider()
st.subheader("📈 Test Results")

if st.session_state.test_results:
    results_df = {
        "Trial": list(range(1, len(st.session_state.test_results) + 1)),
        "Elapsed (ms)": [f"{t:.1f}" for t in st.session_state.test_results],
    }

    col_results1, col_results2 = st.columns(2)

    with col_results1:
        st.dataframe(results_df, use_container_width=True)

    with col_results2:
        avg_latency = sum(st.session_state.test_results) / len(st.session_state.test_results)
        st.metric("Average Latency (ms)", f"{avg_latency:.1f}")

        if avg_latency < 200:
            st.success("✅ **PASS**: st.fragment achieves < 200ms latency!")
        elif avg_latency < 500:
            st.warning("⚠️ **CAUTION**: Latency is acceptable but not optimal")
        else:
            st.error("❌ **FAIL**: Latency exceeds 200ms threshold")

    # Reset button
    if st.button("🔄 Reset Results"):
        st.session_state.test_results = []
        st.rerun()
else:
    st.info("Run the stopwatch test above to see results here.")

# === DEBUG INFO ===
with st.expander("🔧 Debug Info"):
    st.write(f"Fragment Support: st.fragment is available in Streamlit 1.37+")
    st.write(f"Current Session State Keys: {list(st.session_state.keys())}")
    st.metric("Total Tests Run", len(st.session_state.test_results))
