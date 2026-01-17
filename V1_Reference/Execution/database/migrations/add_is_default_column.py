"""
Migration: Add is_default column to racer_profiles table
Phase 4.4: Multi-Racer Profile Management

This script safely adds the is_default column if it doesn't already exist,
and ensures exactly one profile is marked as default.

Usage:
    python Execution/database/migrations/add_is_default_column.py

Safety:
    - Idempotent: Safe to run multiple times
    - Checks if column exists before adding
    - Handles both PostgreSQL and CSV environments gracefully
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from Execution.database.database import db


def column_exists(table_name, column_name):
    """Check if a column exists in a PostgreSQL table.

    Args:
        table_name (str): Table name
        column_name (str): Column name

    Returns:
        bool: True if column exists, False otherwise
    """
    if not db.is_connected:
        return False

    try:
        result = db.execute_query(
            """
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = %s AND column_name = %s
            )
            """,
            (table_name, column_name),
            fetch=True
        )
        return result[0][0] if result else False
    except Exception as e:
        print(f"Error checking column existence: {e}")
        return False


def run_migration():
    """Execute the migration to add is_default column.

    Returns:
        bool: True if successful, False otherwise
    """
    if not db.is_connected:
        print("❌ Database not connected. Running in CSV mode (migration not needed).")
        return True

    print("🔄 Starting migration: Add is_default column to racer_profiles...")

    try:
        # 1. Check if column already exists
        if column_exists("racer_profiles", "is_default"):
            print("✅ Column is_default already exists. Nothing to do.")
            return True

        print("   Adding is_default column...")
        # 2. Add the column with DEFAULT FALSE
        db.execute_query(
            """
            ALTER TABLE racer_profiles
            ADD COLUMN is_default BOOLEAN DEFAULT FALSE
            """,
            fetch=False
        )
        print("   ✅ Column added successfully.")

        # 3. Set 'Default Racer' as default if it exists
        print("   Setting default profile...")
        db.execute_query(
            """
            UPDATE racer_profiles
            SET is_default = TRUE
            WHERE id = (
                SELECT id FROM racer_profiles
                WHERE name = 'Default Racer'
                LIMIT 1
            )
            AND NOT EXISTS (
                SELECT 1 FROM racer_profiles WHERE is_default = TRUE
            )
            """,
            fetch=False
        )

        # 4. If no 'Default Racer' and still no default, mark oldest profile as default
        db.execute_query(
            """
            UPDATE racer_profiles
            SET is_default = TRUE
            WHERE id = (
                SELECT id FROM racer_profiles
                ORDER BY created_at ASC
                LIMIT 1
            )
            AND NOT EXISTS (
                SELECT 1 FROM racer_profiles WHERE is_default = TRUE
            )
            """,
            fetch=False
        )
        print("   ✅ Default profile set.")

        # 5. Create index
        print("   Creating index...")
        db.execute_query(
            """
            CREATE INDEX IF NOT EXISTS idx_racer_profiles_is_default
            ON racer_profiles(is_default)
            WHERE is_default = TRUE
            """,
            fetch=False
        )
        print("   ✅ Index created.")

        # 6. Verify
        result = db.execute_query(
            """
            SELECT COUNT(*) as count
            FROM racer_profiles
            WHERE is_default = TRUE
            """,
            fetch=True
        )
        default_count = result[0][0] if result else 0

        if default_count == 1:
            print(f"\n✅ Migration completed successfully!")
            print(f"   - is_default column added")
            print(f"   - Exactly 1 profile marked as default")
            print(f"   - Index created for efficient queries")
            return True
        else:
            print(f"\n⚠️  Migration completed, but unexpected default count: {default_count}")
            print("   Expected: 1 profile marked as default")
            return False

    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        print("   Please check your database connection and try again.")
        return False


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
