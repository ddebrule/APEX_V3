"""
Phase 6.5.1: Cached Data Loading Helpers

Streamlit @st.cache_data decorators for common expensive operations.
Reduces rerun impact by caching data loads (5-10 minute TTLs).

Functions:
- load_configs_cached: Cache config_service.load_configs()
- search_library_cached: Cache library_service.search_baselines()
- list_profiles_cached: Cache profile_service.list_profiles()
- load_session_history_cached: Cache CSV reads for session history
"""

import streamlit as st


@st.cache_data(ttl=300)  # 5-minute TTL
def load_configs_cached(profile_id):
    """
    Load vehicle configs with 5-minute cache.

    Args:
        profile_id (int): Profile ID to load configs for

    Returns:
        pd.DataFrame: Cached configuration DataFrame

    Benefit: Prevents repeated database queries during tab switches
    """
    from Execution.services.config_service import config_service

    return config_service.load_configs(profile_id)


@st.cache_data(ttl=600)  # 10-minute TTL
def search_library_cached(search_term="", filters=None):
    """
    Search master library with 10-minute cache.

    Args:
        search_term (str): Search query
        filters (dict): Optional filter dict (brand, model, etc)

    Returns:
        list: Cached list of matching baselines

    Benefit: Prevents repeated library queries during browsing
    """
    from Execution.services.library_service import library_service

    if filters is None:
        filters = {}

    return library_service.search_baselines(
        search_term=search_term,
        **filters
    )


@st.cache_data(ttl=300)  # 5-minute TTL
def list_profiles_cached():
    """
    List all racer profiles with 5-minute cache.

    Returns:
        list: Cached list of profile dicts

    Benefit: Prevents repeated profile list queries
    """
    from Execution.services.profile_service import profile_service

    return profile_service.list_profiles()


@st.cache_data(ttl=600)  # 10-minute TTL
def load_session_history_cached(csv_path):
    """
    Load session history CSV with 10-minute cache.

    Args:
        csv_path (str): Path to session CSV file

    Returns:
        pd.DataFrame: Cached session history

    Benefit: Prevents repeated CSV reads during tab switches
    """
    import pandas as pd
    import os

    if os.path.exists(csv_path):
        try:
            return pd.read_csv(csv_path)
        except Exception:
            return pd.DataFrame()
    return pd.DataFrame()


@st.cache_data(ttl=300)  # 5-minute TTL
def get_baseline_cached(baseline_id):
    """
    Get single baseline with 5-minute cache.

    Args:
        baseline_id (int): Baseline ID

    Returns:
        dict: Cached baseline setup

    Benefit: Prevents repeated baseline fetches during comparison
    """
    from Execution.services.library_service import library_service

    return library_service.get_baseline(baseline_id)


# Cache invalidation helpers
def clear_config_cache(profile_id):
    """Clear cached configs for a profile (e.g., after save)."""
    load_configs_cached.clear()


def clear_library_cache():
    """Clear cached library search results."""
    search_library_cached.clear()


def clear_profile_cache():
    """Clear cached profile list."""
    list_profiles_cached.clear()


def clear_all_caches():
    """Clear all cached helpers."""
    clear_config_cache(None)
    clear_library_cache()
    clear_profile_cache()
