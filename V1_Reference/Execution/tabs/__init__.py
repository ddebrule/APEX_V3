"""A.P.E.X. Tab Modules.

This package contains modular Streamlit tab implementations extracted from
the monolithic dashboard.py. Each module is a self-contained tab with its
own render() function.

Tab Structure:
- event_setup.py (Tab 1): Pre-event session initialization
- setup_advisor.py (Tab 2): AI-powered setup recommendations
- race_support.py (Tab 3): Ground truth & LiveRC monitoring
- post_analysis.py (Tab 4): Post-event analytics & reporting
- setup_library.py (Tab 5): Master chassis library browser

All tabs access st.session_state directly. The dashboard.py orchestrator
initializes all session state before importing tabs.
"""

__all__ = [
    "event_setup",
    "setup_advisor",
    "race_support",
    "post_analysis",
    "setup_library",
]
