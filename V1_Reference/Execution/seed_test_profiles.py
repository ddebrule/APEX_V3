"""Seed test profiles into the database.

This script creates multiple test racer profiles with vehicles and sponsors
for development and testing purposes.

Usage:
    python Execution/seed_test_profiles.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from Execution.database.database import db


def seed_profiles():
    """Create test profiles with vehicles and sponsors."""
    if not db.is_connected:
        print("ERROR: Database not connected. Please set DATABASE_URL environment variable.")
        return

    test_profiles = [
        {
            "name": "Default Racer",
            "email": "default@apex.local",
            "facebook": "",
            "instagram": "",
            "sponsors": ["AGR Labs", "Tekno RC"],
            "vehicles": [
                {"brand": "Tekno", "model": "NB48 2.2", "nickname": "Race Buggy", "transponder": "TR-001"},
                {"brand": "Tekno", "model": "NT48 2.2", "nickname": "Truggy", "transponder": "TR-002"},
            ]
        },
        {
            "name": "Max Verstappen",
            "email": "max@apex.local",
            "facebook": "fb.com/maxverstappen",
            "instagram": "maxverstappen",
            "sponsors": ["Red Bull", "Oracle"],
            "vehicles": [
                {"brand": "Associated", "model": "RC8B4", "nickname": "Main", "transponder": "MV-001"},
                {"brand": "Tekno", "model": "NB48 2.2", "nickname": "Backup", "transponder": "MV-002"},
            ]
        },
        {
            "name": "Lewis Hamilton",
            "email": "lewis@apex.local",
            "facebook": "fb.com/lewishamilton",
            "instagram": "lewishamilton",
            "sponsors": ["Mercedes", "Tommy Hilfiger"],
            "vehicles": [
                {"brand": "Mugen", "model": "MBX8", "nickname": "Race", "transponder": "LH-001"},
            ]
        },
        {
            "name": "Lando Norris",
            "email": "lando@apex.local",
            "facebook": "fb.com/landonorris",
            "instagram": "landonorris",
            "sponsors": ["McLaren", "OnePlus"],
            "vehicles": [
                {"brand": "Xray", "model": "XT8", "nickname": "Primary", "transponder": "LN-001"},
                {"brand": "Tekno", "model": "NT48 2.2", "nickname": "Secondary", "transponder": "LN-002"},
            ]
        }
    ]

    for profile_data in test_profiles:
        try:
            # Check if profile already exists
            existing = db.execute_query(
                "SELECT id FROM racer_profiles WHERE name = %s",
                (profile_data["name"],),
                fetch=True
            )

            if existing:
                profile_id = existing[0]['id']
                print(f"Profile '{profile_data['name']}' already exists (ID: {profile_id})")

                # Update the profile
                db.execute_query(
                    """
                    UPDATE racer_profiles
                    SET email = %s, facebook = %s, instagram = %s, sponsors = %s
                    WHERE id = %s
                    """,
                    (
                        profile_data["email"],
                        profile_data["facebook"],
                        profile_data["instagram"],
                        profile_data["sponsors"],
                        profile_id
                    ),
                    fetch=False
                )
                print("  Updated profile data")
            else:
                # Create new profile
                result = db.execute_query(
                    """
                    INSERT INTO racer_profiles (name, email, facebook, instagram, sponsors)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        profile_data["name"],
                        profile_data["email"],
                        profile_data["facebook"],
                        profile_data["instagram"],
                        profile_data["sponsors"]
                    ),
                    fetch=True
                )

                if result:
                    profile_id = result[0]['id']
                    print(f"Created profile '{profile_data['name']}' (ID: {profile_id})")

            # Add vehicles
            for vehicle in profile_data.get("vehicles", []):
                # Check if vehicle already exists
                existing_vehicle = db.execute_query(
                    """
                    SELECT id FROM vehicles
                    WHERE profile_id = %s AND brand = %s AND model = %s
                    """,
                    (profile_id, vehicle["brand"], vehicle["model"]),
                    fetch=True
                )

                if existing_vehicle:
                    vehicle_id = existing_vehicle[0]['id']
                    # Update existing vehicle
                    db.execute_query(
                        """
                        UPDATE vehicles
                        SET nickname = %s, transponder = %s
                        WHERE id = %s
                        """,
                        (vehicle.get("nickname", ""), vehicle.get("transponder", ""), vehicle_id),
                        fetch=False
                    )
                    print(f"  Updated vehicle: {vehicle['brand']} {vehicle['model']} (transponder: {vehicle.get('transponder', 'N/A')})")
                else:
                    # Create new vehicle
                    db.execute_query(
                        """
                        INSERT INTO vehicles (profile_id, brand, model, nickname, transponder)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (
                            profile_id,
                            vehicle["brand"],
                            vehicle["model"],
                            vehicle.get("nickname", ""),
                            vehicle.get("transponder", "")
                        ),
                        fetch=False
                    )
                    print(f"  Added vehicle: {vehicle['brand']} {vehicle['model']} (transponder: {vehicle.get('transponder', 'N/A')})")

        except Exception as e:
            print(f"ERROR creating profile '{profile_data['name']}': {e}")

    print("\nSeed complete!")


if __name__ == "__main__":
    seed_profiles()
