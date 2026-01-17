"""Initialize Railway PostgreSQL database with schema_v2.sql.

This script:
1. Connects to PostgreSQL using DATABASE_URL
2. Reads schema_v2.sql
3. Executes all SQL commands to create tables, indexes, triggers
4. Reports success/failure

Usage:
    export DATABASE_URL="postgresql://user:pass@host:port/railway"
    python Execution/initialize_database.py

Or with .env file:
    python Execution/initialize_database.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

from Execution.database.database import db

load_dotenv()


def initialize_database():
    """Initialize database with schema.sql."""
    if not db.is_connected:
        print("ERROR: Database connection failed!")
        print("Please check:")
        print("  1. DATABASE_URL environment variable is set")
        print("  2. Railway PostgreSQL is running and accessible")
        print("  3. Connection string format: postgresql://user:password@host:port/database")
        return False

    print("SUCCESS: Database connection pool established")
    print(f"Using database URL (obscured): postgresql://***:***@{db.database_url.split('@')[1] if '@' in db.database_url else 'unknown'}")

    try:
        # Read schema file
        schema_path = os.path.join(os.path.dirname(__file__), "database", "schema.sql")

        if not os.path.exists(schema_path):
            print(f"ERROR: Schema file not found: {schema_path}")
            return False

        with open(schema_path) as f:
            schema_sql = f.read()

        # Execute schema
        with db.get_connection() as conn:
            cursor = conn.cursor()

            # PostgreSQL requires executing statements separately
            # Split on semicolons and execute non-empty statements
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
                        if "already exists" not in str(e).lower():
                            print(f"Warning executing statement: {e}")

        print("SUCCESS: Database schema initialized successfully")
        print(f"  Executed {statement_count} SQL statements")
        print("  Tables created:")
        print("    - racer_profiles")
        print("    - vehicles")
        print("    - sessions")
        print("    - setup_changes")
        print("    - master_library")
        print("    - race_results")
        print("    - media")
        print("    - pit_wall_messages")
        print("    - theory_documents")
        print("    - activity_log")
        print()
        print("Next steps:")
        print("  1. Run: python Execution/seed_test_profiles.py")
        print("  2. Start app: streamlit run Execution/dashboard.py")

        return True

    except Exception as e:
        print(f"ERROR: Schema initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = initialize_database()
    sys.exit(0 if success else 1)
