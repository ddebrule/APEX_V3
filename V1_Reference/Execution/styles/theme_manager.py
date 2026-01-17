
import os

import streamlit as st


def load_global_styles():
    """Injects the main.css file into the Streamlit app.
    This function should be called at the very top of dashboard.py.
    """
    # Calculate path to css relative to this file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    css_path = os.path.join(current_dir, "main.css")

    with open(css_path) as f:
        css = f.read()

    st.markdown(f'<style>{css}</style>', unsafe_allow_html=True)

def render_header():
    """Renders the custom APEX header with the signature rainbow line.
    Replaces st.title().
    """
    st.markdown("""
        <div style="margin-bottom: 0.5rem;">
            <h1 style="margin:0; padding:0; font-size: 3rem;">PROJECT A.P.E.X.</h1>
            <p style="color: #888; margin-top: -10px; font-family: 'Rajdhani'; letter-spacing: 2px;">AVANT GARDE RACING SYSTEMS</p>
        </div>
        <div class="rainbow-separator"></div>
    """, unsafe_allow_html=True)
