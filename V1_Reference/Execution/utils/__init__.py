"""A.P.E.X. Utilities.

Shared utility functions and helpers used across tabs.

Modules:
- ui_helpers.py: Shared UI functions (keyword detection, weather, transcription, etc.)

These utilities do NOT access st.session_state directly and can be imported
and tested independently by any tab module.
"""

from .ui_helpers import detect_technical_keywords, encode_image, get_system_context, get_weather, transcribe_voice

__all__ = [
    "transcribe_voice",
    "get_system_context",
    "detect_technical_keywords",
    "encode_image",
    "get_weather"
]
