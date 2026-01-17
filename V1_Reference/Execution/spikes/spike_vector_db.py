"""
Spike 2: Vector Database Capability Test

Goal: Test if Railway Postgres supports the pgvector extension.

Instructions:
1. Ensure DATABASE_URL is set in your .env file
2. Run: python Execution/spikes/spike_vector_db.py
3. Check output for success/failure

Success Criteria:
✅ PASS: "CREATE EXTENSION vector" succeeds
❌ FAIL: Permission denied or extension not available

Fallback: If FAIL → Use ChromaDB instead (persisted to /app/data volume)
"""

import os
import sys
from dotenv import load_dotenv

# Load environment
load_dotenv()

def test_pgvector_support():
    """Test if Railway Postgres supports pgvector extension."""

    print("\n" + "="*70)
    print("SPIKE 2: Vector Database Capability Test")
    print("="*70)

    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("\n❌ ERROR: DATABASE_URL not set in .env")
        print("   → Skipping Spike 2 (local development mode)")
        print("   → For Railway testing, set DATABASE_URL in .env")
        return {"status": "SKIPPED", "reason": "DATABASE_URL not set"}

    print(f"\n📌 Database URL found (ending with: ...{database_url[-20:]})")

    try:
        import psycopg2
        from psycopg2 import sql
    except ImportError:
        print("\n❌ ERROR: psycopg2 not installed")
        print("   → Install: pip install psycopg2-binary")
        return {"status": "ERROR", "reason": "psycopg2 not installed"}

    # Parse DATABASE_URL
    try:
        from urllib.parse import urlparse
        parsed = urlparse(database_url)

        connection_params = {
            "host": parsed.hostname,
            "port": parsed.port or 5432,
            "database": parsed.path.lstrip("/"),
            "user": parsed.username,
            "password": parsed.password,
        }

        print(f"\n🔗 Attempting connection to: {connection_params['host']}:{connection_params['port']}")

        # Connect
        conn = psycopg2.connect(**connection_params)
        cursor = conn.cursor()

        print("✅ Connected to Postgres successfully")

        # Test: Create extension
        print("\n📊 Testing: CREATE EXTENSION vector;")
        try:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            conn.commit()
            print("✅ SUCCESS: pgvector extension is supported!")
            print("   → Use Plan A: pgvector for vector storage")

            # Verify extension
            cursor.execute("""
                SELECT extname FROM pg_extension
                WHERE extname = 'vector';
            """)
            result = cursor.fetchone()
            if result:
                print("   → Verified: 'vector' extension loaded")

            cursor.close()
            conn.close()

            return {"status": "PASS", "reason": "pgvector extension available"}

        except Exception as e:
            error_msg = str(e)
            print(f"❌ FAILED: {error_msg}")

            if "permission" in error_msg.lower():
                print("   → Reason: Permission denied (Railway user lacks superuser)")
                print("   → Fallback: Use ChromaDB instead (Plan B)")
            elif "not found" in error_msg.lower() or "does not exist" in error_msg.lower():
                print("   → Reason: Extension not available on this Postgres version")
                print("   → Fallback: Use ChromaDB instead (Plan B)")
            else:
                print("   → Check extension availability with your Postgres admin")

            cursor.close()
            conn.close()

            return {"status": "FAIL", "reason": error_msg}

    except Exception as e:
        print(f"\n❌ Connection Error: {e}")
        print("   → Check DATABASE_URL is valid")
        print("   → Check network connectivity to Railway")
        return {"status": "ERROR", "reason": str(e)}


def main():
    """Run Spike 2 test."""
    result = test_pgvector_support()

    print("\n" + "="*70)
    print("SPIKE 2 RESULT")
    print("="*70)
    print(f"Status: {result['status']}")
    print(f"Reason: {result['reason']}")
    print("="*70 + "\n")

    if result["status"] == "PASS":
        print("✅ DECISION: Proceed with pgvector (Plan A)")
        print("   → Phase 6.5.3 will use pgvector on Railway Postgres")
        return 0
    elif result["status"] == "FAIL":
        print("⚠️  DECISION: Use ChromaDB (Plan B)")
        print("   → Phase 6.5.3 will persist ChromaDB to /app/data volume")
        return 1
    else:
        print("ℹ️  DECISION: Cannot determine (local development mode)")
        print("   → Recommend testing on Railway production DB")
        return 2


if __name__ == "__main__":
    sys.exit(main())
