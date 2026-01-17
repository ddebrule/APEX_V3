import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# This script is a "Technical Spike" to verify the plumbing for A.P.E.X. V3.
# It assumes you have a .env file or environment variables set.

def test_supabase_connectivity():
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL or SUPABASE_KEY not found in environment.")
        return

    try:
        supabase: Client = create_client(url, key)
        print("[OK] Successfully initialized Supabase Client.")
        
        # Test basic query
        # This might fail if the table doesn't exist, which is a positive connectivity sign.
        try:
            response = supabase.table("racer_profiles").select("*").limit(1).execute()
            print(f"[OK] Connection verified. Found {len(response.data)} profiles.")
        except Exception as table_err:
            if "relation" in str(table_err).lower() and "does not exist" in str(table_err).lower():
                print("[OK] Connection verified! (Database is reachable, but tables are not yet initialized).")
            else:
                raise table_err
        
        # Test pgvector readiness (Placeholder for V3 memory)
        print("[INFO] pgvector verification will be added in Phase 2.2.")

    except Exception as e:
        print(f"[ERROR] Connection failed: {str(e)}")

if __name__ == "__main__":
    test_supabase_connectivity()
