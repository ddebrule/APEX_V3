"""Car Configuration (Shop Master Baselines) storage and retrieval service.
Uses JSONB for flexible setup storage.
Supports both PostgreSQL (production) and CSV (fallback/local).
"""

import json
import os

import pandas as pd

from Execution.database.database import db, get_or_create_default_profile

# Setup parameter keys for CSV compatibility
SETUP_KEYS = [
    'DF', 'DC', 'DR',
    'SO_F', 'SP_F', 'SB_F', 'P_F', 'Toe_F', 'RH_F', 'C_F', 'ST_F',
    'SO_R', 'SP_R', 'SB_R', 'P_R', 'Toe_R', 'RH_R', 'C_R', 'ST_R',
    'Tread', 'Compound', 'Venturi', 'Pipe', 'Clutch', 'Bell', 'Spur'
]


def _safe_get(row, key):
    """Safely get a value from row dict, converting NaN/None to None."""
    import pandas as pd
    val = row.get(key)
    # Convert pandas NaN or None to None
    if pd.isna(val):
        return None
    return val


def csv_row_to_jsonb(row):
    """Convert a CSV row (flat columns) to JSONB structure, handling NaN values."""
    return {
        "diffs": {
            "front": _safe_get(row, 'DF'),
            "center": _safe_get(row, 'DC'),
            "rear": _safe_get(row, 'DR')
        },
        "front": {
            "shock_oil": _safe_get(row, 'SO_F'),
            "spring": _safe_get(row, 'SP_F'),
            "sway_bar": _safe_get(row, 'SB_F'),
            "pistons": _safe_get(row, 'P_F'),
            "toe": _safe_get(row, 'Toe_F'),
            "ride_height": _safe_get(row, 'RH_F'),
            "camber": _safe_get(row, 'C_F'),
            "shock_travel": _safe_get(row, 'ST_F')
        },
        "rear": {
            "shock_oil": _safe_get(row, 'SO_R'),
            "spring": _safe_get(row, 'SP_R'),
            "sway_bar": _safe_get(row, 'SB_R'),
            "pistons": _safe_get(row, 'P_R'),
            "toe": _safe_get(row, 'Toe_R'),
            "ride_height": _safe_get(row, 'RH_R'),
            "camber": _safe_get(row, 'C_R'),
            "shock_travel": _safe_get(row, 'ST_R')
        },
        "tires": {
            "tread": _safe_get(row, 'Tread'),
            "compound": _safe_get(row, 'Compound')
        },
        "power": {
            "venturi": _safe_get(row, 'Venturi'),
            "pipe": _safe_get(row, 'Pipe'),
            "clutch": _safe_get(row, 'Clutch'),
            "bell": _safe_get(row, 'Bell'),
            "spur": _safe_get(row, 'Spur')
        }
    }


def jsonb_to_csv_row(setup_json, car_name):
    """Convert JSONB structure to flat CSV row."""
    diffs = setup_json.get('diffs', {})
    front = setup_json.get('front', {})
    rear = setup_json.get('rear', {})
    tires = setup_json.get('tires', {})
    power = setup_json.get('power', {})

    return {
        'Car': car_name,
        'DF': diffs.get('front'),
        'DC': diffs.get('center'),
        'DR': diffs.get('rear'),
        'SO_F': front.get('shock_oil'),
        'SP_F': front.get('spring'),
        'SB_F': front.get('sway_bar'),
        'P_F': front.get('pistons'),
        'Toe_F': front.get('toe'),
        'RH_F': front.get('ride_height'),
        'C_F': front.get('camber'),
        'ST_F': front.get('shock_travel'),
        'SO_R': rear.get('shock_oil'),
        'SP_R': rear.get('spring'),
        'SB_R': rear.get('sway_bar'),
        'P_R': rear.get('pistons'),
        'Toe_R': rear.get('toe'),
        'RH_R': rear.get('ride_height'),
        'C_R': rear.get('camber'),
        'ST_R': rear.get('shock_travel'),
        'Tread': tires.get('tread'),
        'Compound': tires.get('compound'),
        'Venturi': power.get('venturi'),
        'Pipe': power.get('pipe'),
        'Clutch': power.get('clutch'),
        'Bell': power.get('bell'),
        'Spur': power.get('spur')
    }


class ConfigService:
    """Car Configuration (Shop Master Baselines) storage and retrieval service.
    Uses vehicles table with JSONB baseline_setup column.
    """

    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = os.path.join(self.base_dir, "data")
        self.config_path = os.path.join(self.data_dir, "car_configs.csv")
        self.use_database = db.is_connected

        # Ensure data directory exists for CSV fallback
        os.makedirs(self.data_dir, exist_ok=True)

        # Initialize CSV if it doesn't exist (fallback mode)
        if not os.path.exists(self.config_path):
            self._init_csv_configs()

    def _init_csv_configs(self):
        """Initialize default car configs CSV."""
        default_data = [
            {
                "Car": "NB48 2.2 Buggy", "DF": 7000, "DC": 7000, "DR": 5000,
                "SO_F": 450, "SP_F": "Green", "SB_F": 2.3, "P_F": "1.2x4",
                "Toe_F": -1.0, "RH_F": 27.0, "C_F": -2.0, "ST_F": 105,
                "SO_R": 400, "SP_R": "Yellow", "SB_R": 2.5, "P_R": "1.7x4",
                "Toe_R": 3.0, "RH_R": 28.0, "C_R": -3.0, "ST_R": 122,
                "Tread": "Kosmos", "Compound": "Green",
                "Venturi": 7.0, "Pipe": "REDS 2143", "Clutch": "4-Shoe Med",
                "Bell": 13, "Spur": 48
            },
            {
                "Car": "NT48 2.2 Truggy", "DF": 10000, "DC": 10000, "DR": 7000,
                "SO_F": 600, "SP_F": "Pink", "SB_F": 2.5, "P_F": "1.3x8",
                "Toe_F": -1.0, "RH_F": 33.0, "C_F": -2.0, "ST_F": 115,
                "SO_R": 500, "SP_R": "Red", "SB_R": 2.8, "P_R": "1.3x8",
                "Toe_R": 3.0, "RH_R": 35.0, "C_R": -3.0, "ST_R": 135,
                "Tread": "Relapse", "Compound": "Green",
                "Venturi": 8.0, "Pipe": "REDS 2143", "Clutch": "4-Shoe Heavy",
                "Bell": 13, "Spur": 50
            }
        ]
        pd.DataFrame(default_data).to_csv(self.config_path, index=False)

    def load_configs(self, profile_id=None):
        """Load all car configs for a profile.
        Returns DataFrame with flat columns for dashboard compatibility.
        """
        if self.use_database:
            return self._load_configs_db(profile_id)
        else:
            return self._load_configs_csv()

    def _load_configs_db(self, profile_id):
        """Load configs from PostgreSQL database (vehicles table)."""
        try:
            if profile_id is None:
                profile_id = get_or_create_default_profile()

            if profile_id is None:
                return self._load_configs_csv()

            query = """
                SELECT nickname, brand, model, baseline_setup
                FROM vehicles
                WHERE profile_id = %s
                ORDER BY nickname
            """

            results = db.execute_query(query, (profile_id,))

            if results:
                # Convert JSONB to flat DataFrame for dashboard compatibility
                rows = []
                for r in results:
                    car_name = r['nickname'] or f"{r['brand']} {r['model']}"
                    setup = r['baseline_setup'] or {}
                    row = jsonb_to_csv_row(setup, car_name)
                    rows.append(row)
                return pd.DataFrame(rows)
            else:
                return pd.DataFrame(columns=['Car'] + SETUP_KEYS)

        except Exception as e:
            print(f"Error loading configs from database: {e}")
            return self._load_configs_csv()

    def _load_configs_csv(self):
        """Load configs from CSV file (fallback mode)."""
        if os.path.exists(self.config_path):
            return pd.read_csv(self.config_path)
        else:
            self._init_csv_configs()
            return pd.read_csv(self.config_path)

    def save_configs(self, df, profile_id=None):
        """Save car configs for a profile.
        Accepts DataFrame with flat columns (dashboard format).
        """
        if self.use_database:
            self._save_configs_db(df, profile_id)
        else:
            self._save_configs_csv(df)

    def _save_configs_db(self, df, profile_id):
        """Save configs to PostgreSQL database (vehicles table)."""
        try:
            if profile_id is None:
                profile_id = get_or_create_default_profile()

            if profile_id is None:
                self._save_configs_csv(df)
                return

            for _, row in df.iterrows():
                car_name = row.get('Car', '')

                # Parse brand/model from car name or use defaults
                # Assuming format like "NB48 2.2 Buggy" or "Brand Model"
                parts = car_name.split(' ', 1)
                brand = parts[0] if len(parts) > 0 else 'Unknown'
                model = parts[1] if len(parts) > 1 else car_name

                # Convert flat row to JSONB
                setup_json = csv_row_to_jsonb(row.to_dict())

                # Upsert vehicle with baseline_setup
                query = """
                    INSERT INTO vehicles (profile_id, brand, model, nickname, baseline_setup)
                    VALUES (%(profile_id)s, %(brand)s, %(model)s, %(nickname)s, %(setup)s)
                    ON CONFLICT (profile_id, brand, model) DO UPDATE SET
                        nickname = EXCLUDED.nickname,
                        baseline_setup = EXCLUDED.setup,
                        updated_at = CURRENT_TIMESTAMP
                """

                params = {
                    'profile_id': profile_id,
                    'brand': brand,
                    'model': model,
                    'nickname': car_name,
                    'setup': json.dumps(setup_json)
                }

                db.execute_query(query, params, fetch=False)

        except Exception as e:
            print(f"Error saving configs to database: {e}")
            self._save_configs_csv(df)

    def _save_configs_csv(self, df):
        """Save configs to CSV file (fallback mode)."""
        df.to_csv(self.config_path, index=False)

    def get_vehicle_by_name(self, car_name, profile_id=None):
        """Get a single vehicle's config by name."""
        df = self.load_configs(profile_id)
        vehicle = df[df['Car'] == car_name]
        if not vehicle.empty:
            return vehicle.iloc[0].to_dict()
        return None

    def update_vehicle_setup(self, car_name, updates, profile_id=None):
        """Update specific setup parameters for a vehicle.

        Args:
            car_name: Name of the vehicle
            updates: Dict of parameter updates (e.g., {'SO_F': 500, 'Compound': 'Blue'})
            profile_id: Profile ID (optional)

        """
        df = self.load_configs(profile_id)
        mask = df['Car'] == car_name

        if mask.any():
            for key, value in updates.items():
                if key in df.columns:
                    df.loc[mask, key] = value
            self.save_configs(df, profile_id)
            return True
        return False


# Singleton instance
config_service = ConfigService()
