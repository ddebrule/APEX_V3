"""Shared UI helper functions for A.P.E.X. tabs.

These utilities are stateless (no st.session_state access) and can be
imported and tested independently by any tab module.

Functions:
- get_weather(): Fetch weather data from Open-Meteo API
- transcribe_voice(): Convert audio to text using OpenAI Whisper
- get_system_context(): Assemble theory library context for AI
- encode_image(): Encode uploaded image to base64
- detect_technical_keywords(): Scan transcript for racing keywords
"""

import base64
import os

import openai
import PyPDF2
import requests


def get_weather(lat, lon):
    """Fetch real-time weather and density altitude from Open-Meteo API.

    Args:
        lat (float): Latitude
        lon (float): Longitude

    Returns:
        Dict: {"Temp": "25°C", "Hum": "65%", "DA": "1200 ft"} or {"Error": "Weather Offline"}

    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,surface_pressure&timezone=auto"
        res = requests.get(url, timeout=5).json()['current']
        da = int((res['temperature_2m'] * 120) + ((1013 - res['surface_pressure']) * 30))
        return {
            "Temp": f"{res['temperature_2m']}°C",
            "Hum": f"{res['relative_humidity_2m']}%",
            "DA": f"{da} ft"
        }
    except Exception:
        return {"Error": "Weather Offline"}


def transcribe_voice(audio_bytes, openai_key, data_dir):
    """Transcribe audio bytes to text using OpenAI Whisper API.

    Args:
        audio_bytes (bytes): Audio data in WAV format
        openai_key (str): OpenAI API key
        data_dir (str): Path to temporary file directory

    Returns:
        str: Transcribed text or error message

    """
    if not openai_key:
        return "Error: API Key missing."

    client = openai.OpenAI(api_key=openai_key)
    temp_file = os.path.join(data_dir, "temp_audio.wav")

    try:
        with open(temp_file, "wb") as f:
            f.write(audio_bytes)

        with open(temp_file, "rb") as f:
            transcript = client.audio.transcriptions.create(model="whisper-1", file=f)

        return transcript.text
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


def get_system_context(active_config_text="", theory_path=None):
    """Assemble comprehensive system context from theory library documents.

    Reads all PDFs and TXT files from theory_path and concatenates them
    with active session config to create a rich context for AI advisor.

    Args:
        active_config_text (str): Current session/car config text
        theory_path (str): Path to theory library directory (e.g., Data/theory-library)

    Returns:
        str: Formatted context with all documents

    """
    context = f"\n[ACTIVE SESSION CONFIG & TRACK DATA]\n{active_config_text}\n"

    if theory_path and os.path.exists(theory_path):
        for file in os.listdir(theory_path):
            file_path = os.path.join(theory_path, file)

            if file.endswith(".pdf"):
                try:
                    reader = PyPDF2.PdfReader(file_path)
                    text = "".join([page.extract_text() for page in reader.pages])
                    context += f"\n[DOC: {file} (PDF)]\n{text}\n"
                except Exception:
                    pass

            elif file.endswith(".txt"):
                try:
                    with open(file_path, encoding='utf-8') as f:
                        context += f"\n[DOC: {file} (TXT)]\n{f.read()}\n"
                except Exception:
                    pass

    return context


def encode_image(uploaded_file):
    """Encode a Streamlit uploaded file to base64 string for API submission.

    Args:
        uploaded_file: Streamlit UploadedFile object

    Returns:
        str: Base64 encoded image data

    """
    return base64.b64encode(uploaded_file.getvalue()).decode("utf-8")


def detect_technical_keywords(transcript: str) -> dict:
    """Scan transcript for technical racing keywords.

    Identifies critical handling issues, performance changes, and track features.
    Used by Scribe service to categorize voice notes.

    v1.7.0 - Optimized Scribe (No Wake Words Required)

    Args:
        transcript (str): Raw voice transcript text

    Returns:
        Dict: {
            "critical": [...],      # Safety/handling issues
            "performance": [...],   # Performance changes
            "track_features": [...]  # Track surface/layout
        }

    """
    keywords = {
        "critical": ["Bottoming", "Wash", "Stability"],
        "performance": ["Loose", "Traction", "Rotation", "Consistency"],
        "track_features": ["Entry", "Exit", "Jump", "Land"]
    }

    detected = {"critical": [], "performance": [], "track_features": []}
    transcript_lower = transcript.lower()

    for category, words in keywords.items():
        for word in words:
            if word.lower() in transcript_lower:
                detected[category].append(word)

    return detected
