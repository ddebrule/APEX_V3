"""Profile Service for Racer Profile persistence.

Handles CRUD operations for the racer_profiles and vehicles tables (schema_v2).
Responsible for mapping between:
- Database format: sponsors as TEXT[] array in racer_profiles, vehicles in vehicles table
- App format: sponsors as list of dicts [{'name': 'Sponsor'}], vehicles as list of dicts
"""

from Execution.database.database import db, get_or_create_default_profile


class ProfileService:
    """Service for managing racer profile persistence."""

    def get_profile(self, profile_id=None):
        """Load racer profile from database.

        Args:
            profile_id (int, optional): Profile ID to load. If None, loads default profile.

        Returns:
            dict: Profile with keys: id, name, email, facebook, instagram,
                  sponsors (list of dicts), vehicles (list of dicts)
            Returns default dict if DB is not connected or no profile found.

        """
        # Default profile fallback
        default_profile = {
            "id": None,
            "name": "Default Racer",
            "email": "default@apex.local",
            "facebook": "",
            "instagram": "",
            "sponsors": [],
            "vehicles": []
        }

        if not db.is_connected:
            return default_profile

        try:
            # Get profile ID if not provided
            if profile_id is None:
                profile_id = get_or_create_default_profile()

            if profile_id is None:
                return default_profile

            # Query the profile (schema_v2: sponsors is TEXT[], transponder is in vehicles)
            result = db.execute_query(
                """
                SELECT id, name, email, facebook, instagram, sponsors
                FROM racer_profiles
                WHERE id = %s
                """,
                (profile_id,),
                fetch=True
            )

            if not result:
                return default_profile

            row = result[0]

            # Transform database array to list of dicts
            sponsors_array = row.get('sponsors', []) or []
            sponsors_list = [{'name': s} for s in sponsors_array if s]

            # Load vehicles for this profile
            vehicles_result = db.execute_query(
                """
                SELECT id, brand, model, nickname, transponder
                FROM vehicles
                WHERE profile_id = %s
                ORDER BY created_at DESC
                """,
                (profile_id,),
                fetch=True
            )

            vehicles_list = []
            if vehicles_result:
                vehicles_list = [
                    {
                        "id": v.get('id'),
                        "brand": v.get('brand', ''),
                        "model": v.get('model', ''),
                        "nickname": v.get('nickname', ''),
                        "transponder": v.get('transponder', '')
                    }
                    for v in vehicles_result
                ]

            return {
                "id": row.get('id'),
                "name": row.get('name', 'Default Racer'),
                "email": row.get('email', ''),
                "facebook": row.get('facebook', ''),
                "instagram": row.get('instagram', ''),
                "sponsors": sponsors_list,
                "vehicles": vehicles_list
            }

        except Exception as e:
            print(f"Error loading profile: {e}")
            return default_profile

    def update_profile(self, profile_id, data):
        """Update racer profile in database.

        Args:
            profile_id (int): Profile ID to update
            data (dict): Profile data with keys: name, email, facebook, instagram,
                        sponsors (list of dicts), vehicles (list of dicts)

        Returns:
            tuple: (success: bool, error_msg: str or None)

        """
        if not db.is_connected:
            return False, "Database not connected"

        try:
            # Transform list of dicts to array for database
            sponsors_list = data.get('sponsors', [])
            sponsors_array = [s.get('name', '') for s in sponsors_list if s.get('name')]

            # Update profile (schema_v2: sponsors is TEXT[] array)
            db.execute_query(
                """
                UPDATE racer_profiles
                SET name = %s,
                    email = %s,
                    facebook = %s,
                    instagram = %s,
                    sponsors = %s
                WHERE id = %s
                """,
                (
                    data.get('name', 'Default Racer'),
                    data.get('email', ''),
                    data.get('facebook', ''),
                    data.get('instagram', ''),
                    sponsors_array,  # PostgreSQL array format
                    profile_id
                ),
                fetch=False
            )

            # Update vehicles
            vehicles = data.get('vehicles', [])
            for vehicle in vehicles:
                if 'id' in vehicle and vehicle['id']:
                    # Update existing vehicle
                    db.execute_query(
                        """
                        UPDATE vehicles
                        SET brand = %s, model = %s, nickname = %s, transponder = %s
                        WHERE id = %s AND profile_id = %s
                        """,
                        (
                            vehicle.get('brand', ''),
                            vehicle.get('model', ''),
                            vehicle.get('nickname', ''),
                            vehicle.get('transponder', ''),
                            vehicle['id'],
                            profile_id
                        ),
                        fetch=False
                    )
                else:
                    # Insert new vehicle
                    db.execute_query(
                        """
                        INSERT INTO vehicles (profile_id, brand, model, nickname, transponder)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (
                            profile_id,
                            vehicle.get('brand', ''),
                            vehicle.get('model', ''),
                            vehicle.get('nickname', ''),
                            vehicle.get('transponder', '')
                        ),
                        fetch=False
                    )

            return True, None

        except Exception as e:
            error_str = str(e)

            # Check for duplicate vehicle constraint violation
            if "vehicles_profile_id_brand_model_key" in error_str:
                error_msg = (
                    "Duplicate Vehicle: You already have a vehicle with this brand and model "
                    "in your fleet. Each vehicle combination (brand/model) can only appear once per profile. "
                    "Edit the existing vehicle or remove it before adding a new one with the same brand/model."
                )
            else:
                error_msg = f"Error updating profile: {error_str}"

            print(error_msg)
            return False, error_msg

    def list_profiles(self):
        """List all racer profiles with default status.

        Returns:
            list: List of profile dicts with id, name, email, is_default

        """
        if not db.is_connected:
            return []

        try:
            result = db.execute_query(
                """
                SELECT id, name, email, is_default
                FROM racer_profiles
                ORDER BY is_default DESC, name ASC
                """,
                fetch=True
            )
            return result or []
        except Exception as e:
            print(f"Error listing profiles: {e}")
            return []

    def create_profile(self, name, email="", facebook="", instagram=""):
        """Create a new racer profile.

        If this is the first profile, it will automatically be marked as default.
        Subsequent profiles start as non-default and must be explicitly set.

        Args:
            name (str): Profile name
            email (str): Profile email
            facebook (str): Facebook URL
            instagram (str): Instagram handle

        Returns:
            tuple: (profile_id: int or None, error_msg: str or None)

        """
        if not db.is_connected:
            return None, "Database not connected"

        try:
            # Check if this is the first profile
            profile_count = db.execute_query(
                "SELECT COUNT(*) as count FROM racer_profiles",
                fetch=True
            )
            is_first_profile = (profile_count[0]['count'] if profile_count else 0) == 0

            # Create the profile (auto-default to FALSE, will update if first)
            result = db.execute_query(
                """
                INSERT INTO racer_profiles (name, email, facebook, instagram, sponsors, is_default)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (name, email, facebook, instagram, [], is_first_profile),
                fetch=True
            )

            if result:
                profile_id = result[0]['id']
                # If first profile, ensure it's marked as default
                if is_first_profile:
                    db.execute_query(
                        "UPDATE racer_profiles SET is_default = TRUE WHERE id = %s",
                        (profile_id,),
                        fetch=False
                    )
                return profile_id, None
            return None, "Failed to create profile"

        except Exception as e:
            error_msg = f"Error creating profile: {str(e)}"
            print(error_msg)
            return None, error_msg

    def get_default_profile(self):
        """Fetch the profile marked as default.

        Returns:
            dict: Profile data (same as get_profile()).
            None if no default profile exists or DB not connected.

        """
        if not db.is_connected:
            return None

        try:
            result = db.execute_query(
                """
                SELECT id FROM racer_profiles
                WHERE is_default = TRUE
                LIMIT 1
                """,
                fetch=True
            )

            if result:
                return self.get_profile(result[0]["id"])
            return None

        except Exception as e:
            print(f"Error getting default profile: {str(e)}")
            return None

    def set_default_profile(self, profile_id):
        """Set a profile as the default, unsetting any previous default.

        This ensures only one profile is marked as default at a time.

        Args:
            profile_id (int): Profile ID to set as default.

        Returns:
            tuple: (success: bool, error_msg: str or None)

        """
        if not db.is_connected:
            return False, "Database not connected"

        try:
            # Begin transaction: unset all, then set the target
            db.execute_query(
                "UPDATE racer_profiles SET is_default = FALSE",
                fetch=False
            )
            db.execute_query(
                "UPDATE racer_profiles SET is_default = TRUE WHERE id = %s",
                (profile_id,),
                fetch=False
            )
            return True, None

        except Exception as e:
            error_msg = f"Error setting default profile: {str(e)}"
            print(error_msg)
            return False, error_msg

# Singleton instance for use throughout the app
profile_service = ProfileService()
