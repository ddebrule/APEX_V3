"""
Spike 3: State Safety - Debounced Persistence Test

Goal: Validate that a 3-second debounce protocol loses no data on browser crash.

Instructions:
1. Run: streamlit run Execution/spikes/spike_state_manager.py
2. Enter data (e.g., "Shock Oil: 600")
3. Wait 4 seconds (Allow debounce to fire and save to file)
4. KILL THE BROWSER TAB (Ctrl+W or close window)
5. Reopen the app
6. Check if "Shock Oil" value persisted

Success Criteria:
✅ PASS: Value is "600" after reopening
❌ FAIL: Value reverts to default

The StateManager prototype demonstrates:
- Instant UI update on keystroke
- "Dirty Bit" flag for pending changes
- 3-second debounced write to persistent storage (JSON file as mock DB)
- Recovery from browser crash
"""

import streamlit as st
import json
import time
from pathlib import Path
from datetime import datetime

# === PAGE CONFIG ===
st.set_page_config(page_title="Spike 3: State Safety Test", layout="centered")
st.title("💾 Spike 3: State Safety Test")
st.subtitle("Debounced Persistence with Crash Recovery")

# === SETUP ===
PERSISTENT_FILE = Path("Execution/spikes/.spike3_persistent_state.json")

def load_persistent_state():
    """Load state from persistent file (simulating database)."""
    if PERSISTENT_FILE.exists():
        with open(PERSISTENT_FILE, "r") as f:
            return json.load(f)
    return {
        "shock_oil": "—",
        "tire_compound": "—",
        "last_saved": None
    }

def save_persistent_state(state):
    """Save state to persistent file (simulating database)."""
    PERSISTENT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PERSISTENT_FILE, "w") as f:
        state["last_saved"] = datetime.now().isoformat()
        json.dump(state, f, indent=2)


# === SIMPLE STATE MANAGER ===
class SimpleStateManager:
    """Minimal StateManager prototype with 3s debounce logic."""

    DEBOUNCE_SECONDS = 3

    def __init__(self):
        self.dirty = False
        self.last_change_time = None
        self.debounce_timer_id = None

    def mark_dirty(self):
        """Mark state as changed; schedule debounced write."""
        self.dirty = True
        self.last_change_time = time.time()

    def get_debounce_status(self):
        """Return status: how many seconds until auto-save."""
        if not self.dirty:
            return None, "✅ Clean"

        elapsed = time.time() - self.last_change_time
        remaining = self.DEBOUNCE_SECONDS - elapsed

        if remaining > 0:
            return remaining, f"⏳ Dirty ({remaining:.1f}s until save)"
        else:
            return 0, "💾 Ready to save"

    def should_save(self):
        """Check if debounce window has passed."""
        if not self.dirty or not self.last_change_time:
            return False
        return (time.time() - self.last_change_time) >= self.DEBOUNCE_SECONDS


# === SESSION STATE INIT ===
if "state_manager" not in st.session_state:
    st.session_state.state_manager = SimpleStateManager()
    st.session_state.in_memory_state = load_persistent_state()
    st.session_state.auto_save_messages = []


state_mgr = st.session_state.state_manager
in_mem_state = st.session_state.in_memory_state

# === LAYOUT ===
st.divider()
st.subheader("📋 Crash Test Protocol")

col_proto1, col_proto2 = st.columns(2)

with col_proto1:
    st.markdown("""
    **Steps:**
    1. Enter a value (e.g., "600")
    2. Watch "Debounce Status" (⏳ counting down)
    3. Wait 4 seconds (Allow save)
    4. **Kill the browser tab**
    5. **Reopen the app**
    """)

with col_proto2:
    st.markdown("""
    **Expected Behavior:**
    - ✅ **PASS:** Value persists after crash
    - ❌ **FAIL:** Value reverts to default

    **What's Happening:**
    - Input → Instant UI update (no freeze)
    - After 3s of silence → Auto-save to file
    - Browser crash → Session lost, but file saved
    - Reopen → Load from file (recovered!)
    """)

st.divider()

# === INPUT SECTION ===
st.subheader("⚙️ Setup Parameters")

col_shock, col_tire = st.columns(2)

with col_shock:
    shock_oil = st.text_input(
        "Shock Oil (CST)",
        value=in_mem_state.get("shock_oil", "—"),
        placeholder="e.g., 600",
        key="shock_oil_input"
    )
    # Mark dirty on change
    if shock_oil != in_mem_state.get("shock_oil"):
        state_mgr.mark_dirty()
        in_mem_state["shock_oil"] = shock_oil

with col_tire:
    tire_compound = st.text_input(
        "Tire Compound",
        value=in_mem_state.get("tire_compound", "—"),
        placeholder="e.g., Blue",
        key="tire_compound_input"
    )
    # Mark dirty on change
    if tire_compound != in_mem_state.get("tire_compound"):
        state_mgr.mark_dirty()
        in_mem_state["tire_compound"] = tire_compound

# === DEBOUNCE STATUS ===
st.divider()
st.subheader("🔄 Debounce Status")

remaining, status = state_mgr.get_debounce_status()

col_status1, col_status2 = st.columns([2, 1])

with col_status1:
    st.write(f"**{status}**")

with col_status2:
    if state_mgr.should_save():
        save_persistent_state(in_mem_state)
        st.session_state.auto_save_messages.append({
            "time": datetime.now().strftime("%H:%M:%S"),
            "values": f"Shock Oil={in_mem_state['shock_oil']}, Tire={in_mem_state['tire_compound']}"
        })
        state_mgr.dirty = False
        st.success("💾 Saved!")

# === PERSISTENT STATE DISPLAY ===
st.divider()
st.subheader("💾 Persistent Storage (File)")

persisted = load_persistent_state()
col_persist1, col_persist2 = st.columns(2)

with col_persist1:
    st.metric("Shock Oil (Saved)", persisted.get("shock_oil", "—"))

with col_persist2:
    st.metric("Tire Compound (Saved)", persisted.get("tire_compound", "—"))

if persisted.get("last_saved"):
    st.caption(f"Last saved: {persisted['last_saved']}")

# === AUTO-SAVE LOG ===
st.divider()
st.subheader("📝 Auto-Save Log")

if st.session_state.auto_save_messages:
    for msg in st.session_state.auto_save_messages:
        st.info(f"**{msg['time']}** → {msg['values']}")
else:
    st.info("No auto-saves yet. Enter data and wait 4 seconds...")

# === MANUAL RESET ===
col_manual1, col_manual2 = st.columns(2)

with col_manual1:
    if st.button("🔄 Reset Persistent State"):
        if PERSISTENT_FILE.exists():
            PERSISTENT_FILE.unlink()
        st.session_state.in_memory_state = {
            "shock_oil": "—",
            "tire_compound": "—",
            "last_saved": None
        }
        st.rerun()

with col_manual2:
    if st.button("🔍 Simulate Recovery"):
        st.info("In production, this happens automatically on app reload.")
        persisted = load_persistent_state()
        st.write(persisted)

# === DEBUG INFO ===
with st.expander("🔧 Debug Info"):
    st.write(f"Persistent file path: {PERSISTENT_FILE}")
    st.write(f"File exists: {PERSISTENT_FILE.exists()}")
    st.metric("Total auto-saves this session", len(st.session_state.auto_save_messages))
    st.write("**Raw Persistent State:**")
    st.json(load_persistent_state())

# === INSTRUCTIONS FOR REAL CRASH TEST ===
with st.expander("📌 How to Run the Actual Crash Test"):
    st.markdown("""
    1. **Enter Data:** Type "600" in Shock Oil field
    2. **Wait 4 Seconds:** Watch debounce countdown to "Ready to save"
    3. **Trigger Save:** You should see "💾 Saved!" message
    4. **Kill Tab:** Ctrl+W (Windows) or Cmd+W (Mac) to close browser
    5. **Reopen App:** Run `streamlit run Execution/spikes/spike_state_manager.py` again
    6. **Verify Recovery:** Check if "Shock Oil" still shows "600"

    **Expected Results:**
    - ✅ **PASS:** "Shock Oil" displays "600" → Data survived crash
    - ❌ **FAIL:** "Shock Oil" displays "—" → Data was lost
    """)
