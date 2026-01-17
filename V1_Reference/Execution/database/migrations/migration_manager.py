"""Migration manager for applying pending database migrations automatically.

This module checks for pending migrations and applies them on app startup.
Currently manages the Phase 4.4 is_default column migration.
"""

# Database connection will be passed in when called
db = None


def set_db_reference(database_connection):
    """Set reference to database connection object.

    Args:
        database_connection: The db singleton instance
    """
    global db
    db = database_connection


def column_exists(table_name, column_name):
    """Check if a column exists in a PostgreSQL table.

    Args:
        table_name (str): Table name
        column_name (str): Column name

    Returns:
        bool: True if column exists, False otherwise
    """
    if not db or not db.is_connected:
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


def migrate_add_is_default_column():
    """Apply Phase 4.4 migration: Add is_default column to racer_profiles.

    Returns:
        bool: True if successful or already applied, False otherwise
    """
    if not db or not db.is_connected:
        return True  # Skip in CSV mode

    print("[MIGRATION] Checking for pending migrations...")

    try:
        # 1. Check if column already exists
        if column_exists("racer_profiles", "is_default"):
            print("[MIGRATION] is_default column already exists")
            return True

        print("   Applying Phase 4.4 migration: Add is_default column...")

        # 2. Add the column with DEFAULT FALSE
        db.execute_query(
            """
            ALTER TABLE racer_profiles
            ADD COLUMN is_default BOOLEAN DEFAULT FALSE
            """,
            fetch=False
        )
        print("   [OK] Column added successfully.")

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
        print("   [OK] Default profile set.")

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
        print("   [OK] Index created.")

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
            print(f"[OK] Phase 4.4 migration completed successfully!")
            print(f"   - is_default column added")
            print(f"   - Exactly 1 profile marked as default")
            print(f"   - Index created for efficient queries")
            return True
        else:
            print(f"[WARN] Migration completed, but unexpected default count: {default_count}")
            print("   Expected: 1 profile marked as default")
            return False

    except Exception as e:
        print(f"[ERROR] Migration failed: {str(e)}")
        return False


def table_exists(table_name):
    """Check if a table exists in the database."""
    if not db or not db.is_connected:
        print(f"   [WARN] Cannot check table '{table_name}' - database not connected")
        return False

    try:
        result = db.execute_query(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = %s
            )
            """,
            (table_name,)
        )
        exists = result[0][0] if result else False
        print(f"   [INFO] Table '{table_name}' exists: {exists}")
        return exists
    except Exception as e:
        print(f"   [WARN] Error checking table '{table_name}': {e}")
        return False


def run_pending_migrations():
    """Check and apply all pending migrations.

    Returns:
        bool: True if all migrations successful, False otherwise
    """
    if not db or not db.is_connected:
        print("[INFO] No database connection - migrations will be skipped")
        return True

    try:
        # 1. Check if schema needs initialization (tables don't exist)
        if not table_exists("racer_profiles"):
            print("[DB] Database tables not found. Initializing schema...")
            if not db.init_schema():
                print("[ERROR] Failed to initialize database schema")
                return False
            print("[OK] Database schema initialized successfully\n")

        # 2. Apply Phase 4.4 migration
        success = migrate_add_is_default_column()

        if success:
            print("[OK] All migrations applied successfully\n")
        else:
            print("[ERROR] One or more migrations failed\n")

        return success

    except Exception as e:
        print(f"[ERROR] Error running migrations: {e}\n")
        return False
