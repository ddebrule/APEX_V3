"""Migration script to transfer data from CSV files to PostgreSQL database.
Run this once after setting up the PostgreSQL database on Railway.

Schema v2: Uses JSONB for setup data, simplified table structure.
"""

import json
import os
from datetime import datetime

import pandas as pd
from config_service import csv_row_to_jsonb
from database import db, get_or_create_default_profile


def migrate_car_configs():
    """Migrate car_configs.csv to vehicles table with JSONB baseline_setup."""
    print("\n📦 Migrating car configs to vehicles table...")

    config_path = os.path.join(os.path.dirname(__file__), "data", "car_configs.csv")

    if not os.path.exists(config_path):
        print("   ⚠️  No car_configs.csv found - skipping")
        return

    # Get default profile
    profile_id = get_or_create_default_profile()
    if not profile_id:
        print("   ❌ Failed to create default profile")
        return

    # Read CSV
    df = pd.read_csv(config_path)
    print(f"   Found {len(df)} car configs")

    # Insert each config
    for _idx, row in df.iterrows():
        car_name = row.get('Car', '')

        # Parse brand/model from car name
        parts = car_name.split(' ', 1)
        brand = parts[0] if len(parts) > 0 else 'Unknown'
        model = parts[1] if len(parts) > 1 else car_name

        # Convert to JSONB format
        setup_json = csv_row_to_jsonb(row.to_dict())

        query = """
            INSERT INTO vehicles (profile_id, brand, model, nickname, baseline_setup)
            VALUES (%(profile_id)s, %(brand)s, %(model)s, %(nickname)s, %(setup)s)
            ON CONFLICT (profile_id, brand, model) DO UPDATE SET
                nickname = EXCLUDED.nickname,
                baseline_setup = EXCLUDED.baseline_setup,
                updated_at = CURRENT_TIMESTAMP
        """

        params = {
            'profile_id': profile_id,
            'brand': brand,
            'model': model,
            'nickname': car_name,
            'setup': json.dumps(setup_json)
        }

        try:
            db.execute_query(query, params, fetch=False)
            print(f"   ✅ Migrated: {car_name}")
        except Exception as e:
            print(f"   ❌ Failed to migrate {car_name}: {e}")


def migrate_master_library():
    """Migrate master_library.csv to database with JSONB setup."""
    print("\n📚 Migrating master library...")

    library_path = os.path.join(os.path.dirname(__file__), "data", "master_library.csv")

    if not os.path.exists(library_path):
        print("   ⚠️  No master_library.csv found - skipping")
        return

    # Read CSV
    df = pd.read_csv(library_path)

    if df.empty:
        print("   ⚠️  master_library.csv is empty - skipping")
        return

    print(f"   Found {len(df)} library baselines")

    # Insert each baseline
    for _idx, row in df.iterrows():
        # Convert to JSONB format
        setup_json = csv_row_to_jsonb(row.to_dict())

        query = """
            INSERT INTO master_library (
                track_name, brand, vehicle_model, surface_condition,
                setup, source, date_created
            ) VALUES (
                %(track)s, %(brand)s, %(vehicle)s, %(condition)s,
                %(setup)s, %(source)s, %(date)s
            )
            ON CONFLICT DO NOTHING
        """

        # Parse date
        try:
            date_val = pd.to_datetime(row.get('Date')).date()
        except (ValueError, TypeError, AttributeError):
            date_val = datetime.now().date()

        params = {
            'track': row.get('Track', ''),
            'brand': row.get('Brand', ''),
            'vehicle': row.get('Vehicle', ''),
            'condition': row.get('Condition', ''),
            'setup': json.dumps(setup_json),
            'source': row.get('Source', 'CSV Import'),
            'date': date_val
        }

        try:
            db.execute_query(query, params, fetch=False)
            print(f"   ✅ Migrated: {row.get('Track', 'Unknown')} - {row.get('Vehicle', 'Unknown')}")
        except Exception as e:
            print(f"   ❌ Failed: {e}")


def migrate_track_logs():
    """Migrate track_logs.csv to database."""
    print("\n📝 Migrating track logs...")

    log_path = os.path.join(os.path.dirname(__file__), "data", "track_logs.csv")

    if not os.path.exists(log_path):
        print("   ⚠️  No track_logs.csv found - skipping")
        return

    # Get default profile
    profile_id = get_or_create_default_profile()
    if not profile_id:
        print("   ❌ Failed to create default profile")
        return

    # Read CSV
    df = pd.read_csv(log_path)

    if df.empty:
        print("   ⚠️  track_logs.csv is empty - skipping")
        return

    print(f"   Found {len(df)} track logs")

    # Check if activity_log table exists (schema v2 uses activity_log instead of track_logs)
    # We'll use the activity_log table for general logging
    count = 0
    for _idx, row in df.iterrows():
        # Parse timestamp
        try:
            timestamp = pd.to_datetime(row.get('Timestamp', datetime.now()))
        except (ValueError, TypeError, AttributeError):
            timestamp = datetime.now()

        query = """
            INSERT INTO activity_log (profile_id, action, details, created_at)
            VALUES (%(profile_id)s, %(action)s, %(details)s, %(timestamp)s)
        """

        details = {
            'track': row.get('Track', ''),
            'car': row.get('Car', ''),
            'event': row.get('Event', ''),
            'note': row.get('Note', '')
        }

        params = {
            'profile_id': profile_id,
            'action': 'track_log_import',
            'details': json.dumps(details),
            'timestamp': timestamp
        }

        try:
            db.execute_query(query, params, fetch=False)
            count += 1
        except Exception as e:
            print(f"   ❌ Failed to migrate log entry: {e}")

    print(f"   ✅ Migrated {count} track logs to activity_log")


def main():
    """Run all migrations."""
    print("=" * 60)
    print("🚀 APEX-AGR-SYSTEM Database Migration (Schema v2)")
    print("=" * 60)

    if not db.is_connected:
        print("\n❌ Database not connected!")
        print("   Make sure DATABASE_URL is set in your environment.")
        print("   Example: export DATABASE_URL='postgresql://user:pass@host:5432/dbname'")
        return

    print("\n✅ Database connected successfully")

    # Initialize schema
    print("\n🔧 Initializing database schema v2...")
    if db.init_schema():
        print("   ✅ Schema initialized")
    else:
        print("   ❌ Schema initialization failed")
        return

    # Run migrations
    migrate_car_configs()
    migrate_master_library()
    migrate_track_logs()

    print("\n" + "=" * 60)
    print("✅ Migration completed!")
    print("=" * 60)
    print("\n📌 Schema v2 Features:")
    print("   - JSONB setup storage (flexible, no schema changes needed)")
    print("   - Simplified table structure (11 tables)")
    print("   - Ready for sessions, race results, media uploads")
    print("   - Team support for Phase 4.2 Multi-Driver Sync")
    print("\n📌 Next steps:")
    print("   1. Verify data in your database")
    print("   2. Test the application with DATABASE_URL set")
    print("   3. Deploy to Railway and test there")
    print("\n")


if __name__ == "__main__":
    main()
