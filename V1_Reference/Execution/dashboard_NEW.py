"""A.P.E.X. Dashboard - The Orchestrator (Phase 6 Modular Refactor).

This is the main entry point for the A.P.E.X. Streamlit application.
It follows the "Hub & Spoke" architecture:

- Orchestrator (this file): Handles app config, session init, navigation
- Tabs (Execution/tabs/*): Independent modules for each feature tab
- Components (Execution/components/*): Reusable UI components (sidebar)
- Utils (Execution/utils/*): Shared stateless utilities (helpers)
- Services: Domain logic (existing; unchanged)

Responsibilities:
1. Set page configuration
2. Initialize all session state (Sole Owner)
3. Render sidebar component
4. Render tab navigation & call tab.render()

See: Orchestration/Architecture/session_state_contract.md for state ownership details
"""


import streamlit as st
from dotenv import load_dotenv

from Execution.components import sidebar
from Execution.tabs import event_setup, post_analysis, race_support, setup_advisor, setup_library

# === 1. APP CONFIGURATION ===
st.set_page_config(page_title="AGR APEX Advisor", page_icon="🏎️", layout="wide")
load_dotenv()

st.title("🏎️ Project A.P.E.X.")
st.caption("Avant Garde Racing | v1.8.2 - Phase 6: Modular Refactor")

# === 2. SESSION STATE INITIALIZATION ===
def init_session_state():
    """Initialize all session state keys. This is the SOLE owner of session state.

    Rules:
    - Called before any tabs are imported
    - All keys are initialized with default values
    - Tabs are consumers (read/write to known keys)

    See: Orchestration/Architecture/session_state_contract.md
    """
    # --- Global Profile & Context ---
    if "racer_profile" not in st.session_state:
        st.session_state.racer_profile = {
            "name": "Test Racer John",
            "email": "test.john@example.com",
            "facebook": "fb.com/testracerjohn",
            "instagram": "instagr.am/testracerjohn",
            "transponder": "TR-9988-X",
            "sponsors": [
                {"name": "AGR Labs"},
                {"name": "Tekno RC"},
                {"name": "Pro-Line Racing"}
            ],
            "vehicles": [
                {"Brand": "Tekno", "Model": "NB48 2.2"},
                {"Brand": "Tekno", "Model": "NT48 2.2"},
                {"Brand": "Associated", "Model": "RC8B4"}
            ]
        }

    # --- Digital Twin & Setup State ---
    if "actual_setup" not in st.session_state:
        st.session_state.actual_setup = None
    if "pending_changes" not in st.session_state:
        st.session_state.pending_changes = []

    # --- Session Context ---
    if "active_session_id" not in st.session_state:
        st.session_state.active_session_id = None
    if "track_context" not in st.session_state:
        st.session_state.track_context = {}
    if "session_just_started" not in st.session_state:
        st.session_state.session_just_started = False

    # --- Weather & Media ---
    if "weather_data" not in st.session_state:
        st.session_state.weather_data = None
    if "track_media" not in st.session_state:
        st.session_state.track_media = []
    if "tire_media" not in st.session_state:
        st.session_state.tire_media = []

    # --- ORP & Race Planning ---
    if "x_factor_audit_id" not in st.session_state:
        st.session_state.x_factor_audit_id = None
    if "x_factor_state" not in st.session_state:
        st.session_state.x_factor_state = "idle"
    if "last_report" not in st.session_state:
        st.session_state.last_report = None
    if "practice_rounds" not in st.session_state:
        st.session_state.practice_rounds = 0
    if "qualifying_rounds" not in st.session_state:
        st.session_state.qualifying_rounds = 4

    # --- AI Chat & Setup Advisor ---
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # --- LiveRC Monitoring ---
    if "event_url" not in st.session_state:
        st.session_state.event_url = ""
    if "monitored_heats" not in st.session_state:
        st.session_state.monitored_heats = []
    if "active_classes" not in st.session_state:
        st.session_state.active_classes = []

    # --- Package Copy & Modal State ---
    if "show_staging_modal" not in st.session_state:
        st.session_state.show_staging_modal = False
    if "staging_package" not in st.session_state:
        st.session_state.staging_package = None
    if "staging_data" not in st.session_state:
        st.session_state.staging_data = {}
    if "comparison_baseline_id" not in st.session_state:
        st.session_state.comparison_baseline_id = None

    # --- Setup Parsing & Import ---
    if "last_parsed_data" not in st.session_state:
        st.session_state.last_parsed_data = None
    if "last_parsed_source" not in st.session_state:
        st.session_state.last_parsed_source = None
    if "last_parsed_brand" not in st.session_state:
        st.session_state.last_parsed_brand = None
    if "last_parsed_model" not in st.session_state:
        st.session_state.last_parsed_model = None
    if "verified_setup_data" not in st.session_state:
        st.session_state.verified_setup_data = {}
    if "show_library_save" not in st.session_state:
        st.session_state.show_library_save = False

    # --- Session Lifecycle (Phase 4.3: Auto-Save) ---
    if "draft_session_id" not in st.session_state:
        st.session_state.draft_session_id = None
    if "last_save_result" not in st.session_state:
        st.session_state.last_save_result = None
    if "draft_picker_shown" not in st.session_state:
        st.session_state.draft_picker_shown = False
    if "session_lifecycle_initialized" not in st.session_state:
        st.session_state.session_lifecycle_initialized = True

        # Run lifecycle check only once per session
        from Execution.services.autosave_manager import autosave_manager
        profile_id = 1  # TODO: Get from auth when available

        lifecycle_result = autosave_manager.restore_session_on_load(profile_id)

        if lifecycle_result['status'] == 'active':
            # Restore active session
            session_data = lifecycle_result['session_data']
            st.session_state.active_session_id = session_data['id']
            st.session_state.actual_setup = session_data.get('actual_setup', {})
            st.session_state.track_context = {
                'track_name': session_data.get('track_name', ''),
                'track_size': session_data.get('track_size', ''),
                'traction': session_data.get('traction', ''),
                'surface_type': session_data.get('surface_type', ''),
                'surface_condition': session_data.get('surface_condition', ''),
                'event_name': session_data.get('session_name', ''),
                'session_type': session_data.get('session_type', '')
            }

        elif lifecycle_result['status'] == 'draft':
            # Restore draft (pre-fill Tab 1)
            session_data = lifecycle_result['session_data']
            st.session_state.draft_session_id = session_data['id']
            st.session_state.track_context = {
                'track_name': session_data.get('track_name', ''),
                'track_size': session_data.get('track_size', ''),
                'traction': session_data.get('traction', ''),
                'surface_type': session_data.get('surface_type', ''),
                'surface_condition': session_data.get('surface_condition', '')
            }
            st.session_state.actual_setup = session_data.get('actual_setup', {})

        elif lifecycle_result['status'] == 'multiple_drafts':
            # Show picker for multiple drafts
            st.session_state.draft_picker_shown = True

    # --- Auto-Email Reports (Phase 3.2) ---
    if "auto_email_reports" not in st.session_state:
        st.session_state.auto_email_reports = False


# === 3. INITIALIZE SESSION STATE (Before importing tabs) ===
init_session_state()

# === 4. RENDER SIDEBAR ===
sidebar.render()

# === 5. TAB NAVIGATION & RENDERING ===

# Create tab container
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📋 Event Setup",
    "🛠️ Setup Advisor",
    "🏎️ Race Support",
    "📊 Post Event Analysis",
    "📚 Setup Library"
])

# Render each tab
with tab1:
    event_setup.render()

with tab2:
    setup_advisor.render()

with tab3:
    race_support.render()

with tab4:
    post_analysis.render()

with tab5:
    setup_library.render()
