"""Master Chassis Library storage and retrieval service.
Manages track-specific baseline setups from pro drivers and community.
Uses JSONB for flexible setup storage.
Supports both PostgreSQL (production) and CSV (fallback/local).
"""

import json
import os
from datetime import datetime

import pandas as pd

from Execution.database.database import db
from Execution.services.config_service import SETUP_KEYS, csv_row_to_jsonb, jsonb_to_csv_row


class LibraryService:
    """Master Chassis Library storage and retrieval service.
    Uses master_library table with JSONB setup column.
    """

    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = os.path.join(self.base_dir, "data")
        self.library_path = os.path.join(self.data_dir, "master_library.csv")
        self.use_database = db.is_connected

        # Ensure data directory exists for CSV fallback
        os.makedirs(self.data_dir, exist_ok=True)

        # Initialize CSV library if it doesn't exist (fallback mode)
        if not os.path.exists(self.library_path):
            self._init_csv_library()

    def _init_csv_library(self):
        """Initialize empty master library CSV with proper schema."""
        columns = [
            "ID", "Track", "Brand", "Vehicle", "Condition", "Date", "Source", "Driver"  # Phase 4.2
        ] + SETUP_KEYS
        pd.DataFrame(columns=columns).to_csv(self.library_path, index=False)

    def add_baseline(self, track, brand, vehicle, condition, setup_data,
                     source="User Upload", driver_name=None, event_name=None,
                     submitted_by=None):
        """Add a new baseline to the library.

        Args:
            track: Track name (e.g., "Thunder Alley")
            brand: Vehicle brand (e.g., "Tekno")
            vehicle: Vehicle model (e.g., "NB48 2.2")
            condition: Track condition (e.g., "Dry/Bumpy/High")
            setup_data: Dict with setup parameters (flat or JSONB format)
            source: Origin of baseline (e.g., "Pro Sheet", "User Upload")
            driver_name: Pro driver name (optional)
            event_name: Event name (optional)
            submitted_by: Profile ID of submitter (optional)

        Returns:
            ID of the newly created baseline

        """
        if self.use_database:
            return self._add_baseline_db(track, brand, vehicle, condition,
                                         setup_data, source, driver_name,
                                         event_name, submitted_by)
        else:
            return self._add_baseline_csv(track, brand, vehicle, condition,
                                          setup_data, source)

    def _add_baseline_db(self, track, brand, vehicle, condition, setup_data,
                         source, driver_name, event_name, submitted_by):
        """Add baseline to PostgreSQL database."""
        try:
            # Convert to JSONB if flat format
            if 'diffs' not in setup_data:
                setup_json = csv_row_to_jsonb(setup_data)
            else:
                setup_json = setup_data

            query = """
                INSERT INTO master_library (
                    track_name, brand, vehicle_model, surface_condition,
                    setup, source, driver_name, event_name, submitted_by
                ) VALUES (
                    %(track)s, %(brand)s, %(vehicle)s, %(condition)s,
                    %(setup)s, %(source)s, %(driver_name)s, %(event_name)s,
                    %(submitted_by)s
                )
                RETURNING id
            """

            params = {
                'track': track,
                'brand': brand,
                'vehicle': vehicle,
                'condition': condition,
                'setup': json.dumps(setup_json),
                'source': source,
                'driver_name': driver_name,
                'event_name': event_name,
                'submitted_by': submitted_by
            }

            result = db.execute_query(query, params, fetch=True)
            return result[0]['id']

        except Exception as e:
            print(f"Error adding baseline to database: {e}")
            return self._add_baseline_csv(track, brand, vehicle, condition,
                                          setup_data, source, driver_name)

    def _add_baseline_csv(self, track, brand, vehicle, condition, setup_data, source, driver_name=None):
        """Add baseline to CSV file (fallback mode)."""
        library = pd.read_csv(self.library_path)

        # Generate unique ID
        new_id = len(library) + 1

        # Ensure flat format for CSV
        if 'diffs' in setup_data:
            flat_setup = jsonb_to_csv_row(setup_data, "")
            del flat_setup['Car']
        else:
            flat_setup = {k.upper(): v for k, v in setup_data.items()
                          if k.upper() in SETUP_KEYS}

        new_entry = {
            "ID": new_id,
            "Track": track,
            "Brand": brand,
            "Vehicle": vehicle,
            "Condition": condition,
            "Date": datetime.now().strftime("%Y-%m-%d"),
            "Source": source,
            "Driver": driver_name or "",  # Phase 4.2: Racer name
            **flat_setup
        }

        library = pd.concat([library, pd.DataFrame([new_entry])], ignore_index=True)
        library.to_csv(self.library_path, index=False)

        return new_id

    def search_baselines(self, search_term=None, track=None, brand=None, vehicle=None, condition=None):
        """Search for matching baselines.

        Args:
            search_term (str): General search string (matches track, brand, or vehicle)
            track (str): Specific track filter
            brand (str): Specific brand filter
            vehicle (str): Specific vehicle filter
            condition (str): Specific condition filter

        Returns: DataFrame of matching baselines (flat format for dashboard)
        """
        if self.use_database:
            return self._search_baselines_db(search_term, track, brand, vehicle, condition)
        else:
            return self._search_baselines_csv(search_term, track, brand, vehicle, condition)

    def _search_baselines_db(self, search_term, track, brand, vehicle, condition):
        """Search baselines in PostgreSQL database."""
        try:
            conditions = []
            params = {}

            # General search term (OR logic across main fields)
            if search_term:
                conditions.append("""(
                    track_name ILIKE %(term)s OR
                    brand ILIKE %(term)s OR
                    vehicle_model ILIKE %(term)s OR
                    driver_name ILIKE %(term)s
                )""")
                params['term'] = f"%{search_term}%"

            # Specific filters (AND logic)
            if track:
                conditions.append("track_name ILIKE %(track)s")
                params['track'] = f"%{track}%"
            if brand:
                conditions.append("brand ILIKE %(brand)s")
                params['brand'] = f"%{brand}%"
            if vehicle:
                conditions.append("vehicle_model ILIKE %(vehicle)s")
                params['vehicle'] = f"%{vehicle}%"
            if condition:
                conditions.append("surface_condition ILIKE %(condition)s")
                params['condition'] = f"%{condition}%"

            where_clause = " AND ".join(conditions) if conditions else "TRUE"

            query = f"""
                SELECT id, track_name, brand, vehicle_model, surface_condition,
                       date_created, source, driver_name, event_name, setup
                FROM master_library
                WHERE {where_clause}
                ORDER BY date_created DESC, id DESC
            """

            results = db.execute_query(query, params)

            if results:
                # Convert JSONB to flat DataFrame
                rows = []
                for r in results:
                    setup = r.get('setup') or {}
                    flat = jsonb_to_csv_row(setup, "")
                    del flat['Car']
                    row = {
                        'ID': r['id'],
                        'Track': r['track_name'],
                        'Brand': r['brand'],
                        'Vehicle': r['vehicle_model'],
                        'Condition': r['surface_condition'],
                        'Date': r['date_created'],
                        'Source': r['source'],
                        **flat
                    }
                    rows.append(row)
                return pd.DataFrame(rows)
            else:
                return pd.DataFrame()

        except Exception as e:
            print(f"Error searching baselines in database: {e}")
            return self._search_baselines_csv(search_term, track, brand, vehicle, condition)

    def _search_baselines_csv(self, search_term, track, brand, vehicle, condition):
        """Search baselines in CSV file (fallback mode)."""
        library = pd.read_csv(self.library_path)

        if library.empty:
            return library

        # General search term (OR logic)
        if search_term:
            term = search_term.lower()
            mask = (
                library['Track'].str.contains(term, case=False, na=False) |
                library['Brand'].str.contains(term, case=False, na=False) |
                library['Vehicle'].str.contains(term, case=False, na=False) |
                library['Driver'].str.contains(term, case=False, na=False)
            )
            library = library[mask]

        # Specific filters (AND logic)
        if track:
            library = library[library['Track'].str.contains(track, case=False, na=False)]
        if brand:
            library = library[library['Brand'].str.contains(brand, case=False, na=False)]
        if vehicle:
            library = library[library['Vehicle'].str.contains(vehicle, case=False, na=False)]
        if condition:
            library = library[library['Condition'].str.contains(condition, case=False, na=False)]

        return library

    def get_baseline(self, baseline_id):
        """Get a specific baseline by ID."""
        if self.use_database:
            return self._get_baseline_db(baseline_id)
        else:
            return self._get_baseline_csv(baseline_id)

    def _get_baseline_db(self, baseline_id):
        """Get baseline from PostgreSQL database."""
        try:
            query = """
                SELECT id, track_name, brand, vehicle_model, surface_condition,
                       date_created, source, driver_name, event_name, setup
                FROM master_library WHERE id = %s
            """
            results = db.execute_query(query, (baseline_id,))

            if results:
                r = results[0]
                setup = r.get('setup') or {}
                flat = jsonb_to_csv_row(setup, "")
                del flat['Car']
                return {
                    'ID': r['id'],
                    'Track': r['track_name'],
                    'Brand': r['brand'],
                    'Vehicle': r['vehicle_model'],
                    'Condition': r['surface_condition'],
                    'Date': r['date_created'],
                    'Source': r['source'],
                    **flat
                }
            return None

        except Exception as e:
            print(f"Error getting baseline from database: {e}")
            return self._get_baseline_csv(baseline_id)

    def _get_baseline_csv(self, baseline_id):
        """Get baseline from CSV file (fallback mode)."""
        library = pd.read_csv(self.library_path)
        baseline = library[library['ID'] == baseline_id]

        if baseline.empty:
            return None

        return baseline.iloc[0].to_dict()

    def delete_baseline(self, baseline_id):
        """Delete a baseline from the library."""
        if self.use_database:
            self._delete_baseline_db(baseline_id)
        else:
            self._delete_baseline_csv(baseline_id)

    def _delete_baseline_db(self, baseline_id):
        """Delete baseline from PostgreSQL database."""
        try:
            query = "DELETE FROM master_library WHERE id = %s"
            db.execute_query(query, (baseline_id,), fetch=False)
        except Exception as e:
            print(f"Error deleting baseline from database: {e}")
            self._delete_baseline_csv(baseline_id)

    def _delete_baseline_csv(self, baseline_id):
        """Delete baseline from CSV file (fallback mode)."""
        library = pd.read_csv(self.library_path)
        library = library[library['ID'] != baseline_id]
        library.to_csv(self.library_path, index=False)

    def promote_session_to_library(self, track, brand, vehicle, condition,
                                   actual_setup, profile_id=None):
        """Promote a successful session setup to the master library.

        Args:
            track: Track name
            brand: Vehicle brand
            vehicle: Vehicle model
            condition: Track condition
            actual_setup: The session's actual_setup dict
            profile_id: Profile ID of the racer (optional)

        """
        return self.add_baseline(
            track, brand, vehicle, condition, actual_setup,
            source="Promoted Session", submitted_by=profile_id
        )


# Singleton instance
library_service = LibraryService()
