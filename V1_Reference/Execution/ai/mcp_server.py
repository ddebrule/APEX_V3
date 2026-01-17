import datetime
import json
import os
from typing import Literal, Optional

from fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("APEX AI")

# Project Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "Data")
DIRECTIVES_DIR = os.path.join(BASE_DIR, "Directives")
SESSION_LOG_FILE = os.path.join(DATA_DIR, "session_logs.md")
BASELINE_FILE = os.path.join(DATA_DIR, "baseline_storage.json")
THEORY_DIR = os.path.join(DATA_DIR, "theory-library")

def _load_baseline():
    try:
        with open(BASELINE_FILE) as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def _save_baseline(data):
    with open(BASELINE_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def _get_fleet_key(fleet_id: str) -> str:
    """Normalize fleet_id to match storage keys."""
    fid = fleet_id.lower()
    if "buggy" in fid or "nb48" in fid:
        return "nb48_2.2"
    if "truggy" in fid or "nt48" in fid:
        return "nt48_2.2"
    return fid


# Implementation Functions (Exposed for testing)
def _log_session_impl(text: str, fleet_id: Optional[str] = None) -> str:
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Wake-word logic deprecated in v1.7.0 - automatic keyword detection now handles all transcripts
    # All voice notes are logged regardless of wake words

    # Determine tags
    if fleet_id:
        f_key = _get_fleet_key(fleet_id)
        tag = f"fleet:{'buggy' if 'nb48' in f_key else 'truggy'}"
    else:
        tag = "fleet:unknown"

    log_entry = f"\n- **{timestamp}** [{tag}]: {text}"

    # Append to session logs
    try:
        with open(SESSION_LOG_FILE, 'a') as f:
            f.write(log_entry)
        return f"Logged: {text} ({tag})"
    except Exception as e:
        return f"Error logging session: {str(e)}"

def _manage_baseline_impl(action: Literal["get", "update_experiment", "promote"], fleet_id: str, key: Optional[str] = None, value: Optional[str] = None) -> str:
    data = _load_baseline()
    f_key = _get_fleet_key(fleet_id)

    if f_key not in data:
        return f"Error: Fleet ID {f_key} not found in baseline."

    if action == "get":
        return json.dumps(data[f_key], indent=2)

    elif action == "update_experiment" or action == "promote":
        if not key:
            return "Error: Key required for update."

        parts = key.split('.')
        target = data[f_key]
        try:
            for part in parts[:-1]:
                if part not in target:
                    target[part] = {}
                target = target[part]
            target[parts[-1]] = value
        except TypeError:
             return "Error: Cannot update nested key in non-dict."

        _save_baseline(data)
        return f"Baseline updated: {f_key} {key} = {value} ({action})"

    return "Invalid action."

def _tuning_advisor_impl(query: str, fleet_id: str) -> str:
    f_key = _get_fleet_key(fleet_id)

    # Read Setup Logic
    setup_logic_content = ""
    try:
        with open(os.path.join(DIRECTIVES_DIR, "setup_logic.md")) as f:
            setup_logic_content = f.read()
    except Exception:
        setup_logic_content = "Could not read setup_logic.md"

    # List Theory Files
    theory_files = []
    try:
        for _root, _dirs, files in os.walk(THEORY_DIR):
            for file in files:
                if file.endswith(".pdf") or file.endswith(".md") or file.endswith(".txt"):
                    theory_files.append(file)
    except Exception:
        pass

    response = f"**Tuning Advisor for {f_key}**\n\n"
    response += f"**Query:** {query}\n\n"
    response += "**Core Setup Directives:**\n"
    response += setup_logic_content + "\n\n"
    response += "**Available Theory Resources:**\n"
    response += ", ".join(theory_files)

    return response

# MCP Tool Wrappers
@mcp.tool()
def log_session(text: str, fleet_id: Optional[str] = None) -> str:
    """Captures voice/text notes with automatic keyword detection (v1.7.0).
    No wake words required - all transcripts are automatically analyzed.
    Tags with fleet_id (nb48_2.2 or nt48_2.2).
    """
    return _log_session_impl(text, fleet_id)

@mcp.tool()
def manage_baseline(action: Literal["get", "update_experiment", "promote"], fleet_id: str, key: Optional[str] = None, value: Optional[str] = None) -> str:
    """Tracks buggy and truggy setups.
    action:
        - 'get': returns current baseline for fleet_id
        - 'update_experiment': updates a specific setting in the baseline
        - 'promote': saves changes as the new 'Active Baseline'.
    """
    return _manage_baseline_impl(action, fleet_id, key, value)

@mcp.tool()
def tuning_advisor(query: str, fleet_id: str) -> str:
    """Provides recommendations based on theory files and setup logic."""
    return _tuning_advisor_impl(query, fleet_id)


if __name__ == "__main__":
    mcp.run()
