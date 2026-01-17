"""Database connection and utility module for APEX-AGR-SYSTEM.
Handles PostgreSQL connections with fallback to CSV for local development.
"""

import os
import sys
from contextlib import contextmanager

from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool

# Write to stderr to ensure output isn't suppressed by Streamlit
sys.stderr.write("[DB] Database module loading...\n")
sys.stderr.write(f"[DEBUG] Env Keys: {list(os.environ.keys())}\n")
sys.stderr.flush()
load_dotenv()

class Database:
    """Database connection manager with connection pooling."""

    def __init__(self):
        self.database_url = os.environ.get("DATABASE_URL")
        self.pool = None
        self.is_connected = False

        if self.database_url:
            try:
                # Railway/Heroku provide DATABASE_URL
                # Note: Some platforms use postgres:// but psycopg2 requires postgresql://
                if self.database_url.startswith("postgres://"):
                    self.database_url = self.database_url.replace("postgres://", "postgresql://", 1)

                # Create connection pool (min 1, max 10 connections)
                self.pool = SimpleConnectionPool(1, 10, self.database_url)
                self.is_connected = True
                print("SUCCESS: Database connection pool established")
            except Exception as e:
                print(f"WARNING: Database connection failed: {e}")
                print("   Falling back to CSV mode")
                self.is_connected = False
        else:
            print("INFO: No DATABASE_URL found - using CSV mode")
            self.is_connected = False

    @contextmanager
    def get_connection(self):
        """Context manager for database connections.

        Usage:
            with db.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users")
        """
        if not self.is_connected:
            raise Exception("Database not connected. Use CSV fallback mode.")

        conn = self.pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            self.pool.putconn(conn)

    def execute_query(self, query, params=None, fetch=True):
        """Execute a query and return results.

        Args:
            query: SQL query string
            params: Query parameters (tuple or dict)
            fetch: Whether to fetch results (True for SELECT, False for INSERT/UPDATE/DELETE)

        Returns:
            List of dicts for SELECT queries, None for INSERT/UPDATE/DELETE

        """
        if not self.is_connected:
            raise Exception("Database not connected")

        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params or ())

            if fetch:
                return [dict(row) for row in cursor.fetchall()]
            else:
                return None

    def execute_many(self, query, params_list):
        """Execute a query multiple times with different parameters.
        Useful for bulk inserts.

        Args:
            query: SQL query string
            params_list: List of parameter tuples

        """
        if not self.is_connected:
            raise Exception("Database not connected")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany(query, params_list)

    def init_schema(self):
        """Initialize database schema from schema.sql file."""
        if not self.is_connected:
            print("WARNING: Cannot initialize schema - database not connected")
            return False

        # Use schema.sql
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")

        if not os.path.exists(schema_path):
            print(f"WARNING: Schema file not found: {schema_path}")
            return False

        try:
            with open(schema_path) as f:
                schema_sql = f.read()

            with self.get_connection() as conn:
                cursor = conn.cursor()

                # Split and execute statements individually
                # PostgreSQL requires executing statements separately
                statements = schema_sql.split(';')
                statement_count = 0

                for statement in statements:
                    statement = statement.strip()
                    if statement:  # Skip empty statements
                        try:
                            cursor.execute(statement)
                            statement_count += 1
                        except Exception as e:
                            # Some statements may fail if objects already exist (IF NOT EXISTS)
                            # This is expected and not a problem
                            error_msg = str(e).lower()
                            if "already exists" not in error_msg and "is_default" not in error_msg:
                                print(f"Warning: {e}")  # Log unexpected errors
                            # Continue regardless - IF NOT EXISTS clauses handle most cases

            print("SUCCESS: Database schema initialized successfully")
            print(f"  Executed {statement_count} SQL statements")
            return True
        except Exception as e:
            print(f"ERROR: Schema initialization failed: {e}")
            return False

    def close(self):
        """Close all connections in the pool."""
        if self.pool:
            self.pool.closeall()
            print("Database connection pool closed")

# Singleton instance
sys.stderr.write("[DB] Creating database singleton...\n")
sys.stderr.flush()
db = Database()
sys.stderr.write(f"[DB] Database connected: {db.is_connected}\n")
sys.stderr.flush()

# Run pending migrations on app startup
if db.is_connected:
    sys.stderr.write("[DB] Importing migration manager...\n")
    sys.stderr.flush()
    from Execution.database.migrations.migration_manager import run_pending_migrations, set_db_reference
    sys.stderr.write("[DB] Migration manager imported\n")
    sys.stderr.flush()
    set_db_reference(db)
    sys.stderr.write("[DB] Running pending migrations...\n")
    sys.stderr.flush()
    run_pending_migrations()
    sys.stderr.write("[DB] Migration check complete\n")
    sys.stderr.flush()
else:
    sys.stderr.write("[DB] Database not connected - skipping migrations\n")
    sys.stderr.flush()

# Utility functions for common operations

def get_or_create_default_profile():
    """Get or create a default racer profile for single-user mode (Phase 4.4).

    Refactored to use profile_service for consistency with multi-racer management.
    Returns profile_id (integer).

    Process:
    1. Try to fetch profile marked as is_default = TRUE
    2. If none exists, try to fetch "Default Racer" profile
    3. If that doesn't exist, create "Default Racer" and mark as default
    4. If not connected to DB, return None (CSV fallback)

    Returns:
        int: Profile ID of the default profile, or None if DB disconnected
    """
    if not db.is_connected:
        return None

    try:
        # Import here to avoid circular dependency
        from Execution.services.profile_service import profile_service

        # 1. Try to get profile marked as default
        default_profile = profile_service.get_default_profile()
        if default_profile:
            return default_profile['id']

        # 2. Try to fetch "Default Racer" profile
        profile = db.execute_query(
            "SELECT id FROM racer_profiles WHERE name = %s",
            ("Default Racer",),
            fetch=True
        )

        if profile and len(profile) > 0:
            # Mark it as default
            profile_id = profile[0]['id']
            profile_service.set_default_profile(profile_id)
            return profile_id

        # 3. Create "Default Racer" profile (will auto-default as first profile)
        profile_id, error = profile_service.create_profile(
            name="Default Racer",
            email="default@apex.local",
            facebook="",
            instagram=""
        )

        if profile_id:
            # Update sponsors if using old method
            db.execute_query(
                "UPDATE racer_profiles SET sponsors = %s WHERE id = %s",
                (["AGR Labs", "Tekno RC"], profile_id),
                fetch=False
            )
            return profile_id
        else:
            print(f"Error: Could not create default profile: {error}")
            return None

    except Exception as e:
        print(f"Error getting/creating default profile: {e}")
        return None

def table_exists(table_name):
    """Check if a table exists in the database."""
    if not db.is_connected:
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
        return result[0]['exists']
    except Exception as e:
        print(f"Error checking table existence: {e}")
        return False
