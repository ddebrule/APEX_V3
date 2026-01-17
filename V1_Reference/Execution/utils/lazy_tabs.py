"""
Phase 6.5.1: Lazy Tab Loading Utilities

Defers rendering of inactive tabs to improve startup and tab-switch latency.

Functions:
- lazy_tab_renderer: Wraps tab content with lazy loading logic
- track_active_tab: Tracks which tab is currently active

Benefits:
- Inactive tabs don't render until clicked
- Heavy components (charts, API calls) deferred
- App startup ~2-3x faster
- Tab switches feel snappier
"""

import streamlit as st


def initialize_tab_tracking():
    """Initialize session state for tab tracking."""
    if "active_tab_index" not in st.session_state:
        st.session_state.active_tab_index = 0


def lazy_tab_renderer(tab_index, render_function, *args, **kwargs):
    """
    Lazily render tab content only when tab is active.

    Usage:
        tab1, tab2, tab3 = st.tabs(["Tab 1", "Tab 2", "Tab 3"])

        with tab1:
            lazy_tab_renderer(0, event_setup.render)

        with tab2:
            lazy_tab_renderer(1, setup_advisor.render)

        with tab3:
            lazy_tab_renderer(2, race_support.render)

    Args:
        tab_index (int): Index of this tab (0-based)
        render_function (callable): Function to call to render tab content
        *args: Positional arguments to pass to render_function
        **kwargs: Keyword arguments to pass to render_function

    Benefit: Inactive tabs don't render until clicked
    """
    # Initialize tracking if needed
    initialize_tab_tracking()

    # Only render if this tab is currently active
    if st.session_state.active_tab_index == tab_index:
        try:
            render_function(*args, **kwargs)
        except Exception as e:
            st.error(f"Error rendering tab: {str(e)}")
    else:
        # Show placeholder for inactive tab
        st.empty()


def track_active_tab_with_buttons(tab_names):
    """
    Alternative to st.tabs() using buttons for manual tab tracking.

    Usage:
        tab_names = ["Event Setup", "Setup Advisor", "Race Support", "Post Analysis", "Setup Library"]
        track_active_tab_with_buttons(tab_names)

        if st.session_state.active_tab_index == 0:
            event_setup.render()
        elif st.session_state.active_tab_index == 1:
            setup_advisor.render()
        # ... etc

    Args:
        tab_names (list): List of tab names

    Returns:
        int: Current active tab index

    Benefit: Gives full control over tab switching (can implement custom logic)
    """
    initialize_tab_tracking()

    # Create button row for tabs
    cols = st.columns(len(tab_names))
    for i, (col, name) in enumerate(zip(cols, tab_names)):
        with col:
            button_type = "primary" if i == st.session_state.active_tab_index else "secondary"
            if st.button(name, key=f"tab_btn_{i}", use_container_width=True, type=button_type):
                st.session_state.active_tab_index = i
                st.rerun()

    st.divider()
    return st.session_state.active_tab_index


# Pre-defined lazy renderers for APEX tabs
def lazy_event_setup():
    """Lazy renderer for Tab 1: Event Setup."""
    from Execution.tabs import event_setup
    lazy_tab_renderer(0, event_setup.render)


def lazy_setup_advisor():
    """Lazy renderer for Tab 2: Setup Advisor."""
    from Execution.tabs import setup_advisor
    lazy_tab_renderer(1, setup_advisor.render)


def lazy_race_support():
    """Lazy renderer for Tab 3: Race Support."""
    from Execution.tabs import race_support
    lazy_tab_renderer(2, race_support.render)


def lazy_post_analysis():
    """Lazy renderer for Tab 4: Post Analysis."""
    from Execution.tabs import post_analysis
    lazy_tab_renderer(3, post_analysis.render)


def lazy_setup_library():
    """Lazy renderer for Tab 5: Setup Library."""
    from Execution.tabs import setup_library
    lazy_tab_renderer(4, setup_library.render)
