import os
from datetime import datetime, timedelta

import pandas as pd

# --- PATHS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
LOG_PATH = os.path.join(DATA_DIR, "track_logs.csv")
CONFIG_PATH = os.path.join(DATA_DIR, "car_configs.csv")

os.makedirs(DATA_DIR, exist_ok=True)

# --- 1. POPULATE CAR CONFIGS (SHOP MASTER) ---
configs = [
    {
        "Car": "NB48 2.2 Buggy", "DF": 7000, "DC": 7000, "DR": 5000,
        "SO_F": 450, "SP_F": "Green", "SB_F": 2.3, "P_F": "1.2x4", "Toe_F": -1.0, "RH_F": 27.0, "C_F": -2.0, "ST_F": 105,
        "SO_R": 400, "SP_R": "Yellow", "SB_R": 2.5, "P_R": "1.7x4", "Toe_R": 3.0, "RH_R": 28.0, "C_R": -3.0, "ST_R": 122,
        "Tread": "Kosmos", "Compound": "Green",
        "Venturi": 7.0, "Pipe": "REDS 2143", "Clutch": "4-Shoe Med", "Bell": 13, "Spur": 48
    },
    {
        "Car": "NT48 2.2 Truggy", "DF": 10000, "DC": 10000, "DR": 7000,
        "SO_F": 600, "SP_F": "Pink", "SB_F": 2.5, "P_F": "1.3x8", "Toe_F": -1.0, "RH_F": 33.0, "C_F": -2.0, "ST_F": 115,
        "SO_R": 500, "SP_R": "Red", "SB_R": 2.8, "P_R": "1.3x8", "Toe_R": 3.0, "RH_R": 35.0, "C_R": -3.0, "ST_R": 135,
        "Tread": "Relapse", "Compound": "Green",
        "Venturi": 8.0, "Pipe": "REDS 2143", "Clutch": "4-Shoe Heavy", "Bell": 13, "Spur": 50
    },
    {
        "Car": "Test Chassis GT", "DF": 5000, "DC": 5000, "DR": 3000,
        "SO_F": 300, "SP_F": "White", "SB_F": 2.0, "P_F": "1.1x4", "Toe_F": 0.0, "RH_F": 25.0, "C_F": -1.0, "ST_F": 100,
        "SO_R": 300, "SP_R": "White", "SB_R": 2.2, "P_R": "1.1x4", "Toe_R": 2.0, "RH_R": 26.0, "C_R": -2.0, "ST_R": 110,
        "Tread": "Blockade", "Compound": "M3",
        "Venturi": 6.5, "Pipe": "OS Speed", "Clutch": "3-Shoe", "Bell": 14, "Spur": 46
    }
]
pd.DataFrame(configs).to_csv(CONFIG_PATH, index=False)
print(f"Created/Updated Shop Master at {CONFIG_PATH}")

# --- 2. POPULATE TRACK LOGS (ACTIVITY HISTORY) ---
now = datetime.now()
session_name = "Mock Test Nationals"

logs = [
    # Session Start
    {
        "Date": (now - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M"),
        "Event": session_name,
        "Notes": f"SESSION_START: EVENT: {session_name} (Practice) | CLASSES: Nitro Buggy | TRACK: Thunder Alley (Large/Medium/Dry/Smooth) | Car: NB48 2.2 Buggy | Setup: {{'DF': 7000, 'DC': 7000, 'DR': 5000}}",
        "Vehicle": "NB48 2.2 Buggy",
        "Lap_Time": None
    },
    # Observation 1
    {
        "Date": (now - timedelta(minutes=100)).strftime("%Y-%m-%d %H:%M"),
        "Event": session_name,
        "Notes": "Driver observation: Car feels slightly loose on corner exit.",
        "Vehicle": "NB48 2.2 Buggy",
        "Lap_Time": 32.5
    },
    # Change Applied
    {
        "Date": (now - timedelta(minutes=90)).strftime("%Y-%m-%d %H:%M"),
        "Event": session_name,
        "Notes": "DIGITAL_TWIN_UPDATE: DR -> 7000",
        "Vehicle": "NB48 2.2 Buggy",
        "Lap_Time": None
    },
    # Observation 2 (Improved)
    {
        "Date": (now - timedelta(minutes=60)).strftime("%Y-%m-%d %H:%M"),
        "Event": session_name,
        "Notes": "Driver observation: Rear is more planted now. Pushing harder.",
        "Vehicle": "NB48 2.2 Buggy",
        "Lap_Time": 31.8
    },
    # LiveRC Sync
    {
        "Date": (now - timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M"),
        "Event": session_name,
        "Notes": "LIVERC_SYNC: 12 Laps / 6:05.2 | Fastest: 31.2 | Consistency: 92%",
        "Vehicle": "NB48 2.2 Buggy",
        "Lap_Time": 31.2
    }
]

pd.DataFrame(logs).to_csv(LOG_PATH, index=False)
print(f"Created/Updated Track Logs at {LOG_PATH}")
