-- ============================================================================
-- APEX V3: Row Level Security (RLS) Policies
-- ============================================================================
-- Purpose: Secure database tables so users only access their own data
-- ============================================================================

-- First, we need to link racer_profiles to Supabase auth users
-- Add auth_user_id column if it doesn't exist
ALTER TABLE racer_profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Create unique index to ensure one profile per auth user
CREATE UNIQUE INDEX IF NOT EXISTS racer_profiles_auth_user_id_idx ON racer_profiles(auth_user_id);

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================
ALTER TABLE racer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_embeddings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for racer_profiles
-- ============================================================================
CREATE POLICY "Users can view own profile" ON racer_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON racer_profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON racer_profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can delete own profile" ON racer_profiles
  FOR DELETE USING (auth.uid() = auth_user_id);

-- ============================================================================
-- RLS Policies for classes
-- ============================================================================
CREATE POLICY "Users can view own classes" ON classes
  FOR SELECT USING (
    profile_id IN (SELECT id FROM racer_profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage own classes" ON classes
  FOR ALL USING (
    profile_id IN (SELECT id FROM racer_profiles WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- RLS Policies for vehicles
-- ============================================================================
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (
    profile_id IN (SELECT id FROM racer_profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage own vehicles" ON vehicles
  FOR ALL USING (
    profile_id IN (SELECT id FROM racer_profiles WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- RLS Policies for sessions
-- ============================================================================
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (
    profile_id IN (SELECT id FROM racer_profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (
    profile_id IN (SELECT id FROM racer_profiles WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- RLS Policies for setup_changes
-- ============================================================================
CREATE POLICY "Users can view own setup_changes" ON setup_changes
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN racer_profiles rp ON s.profile_id = rp.id
      WHERE rp.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own setup_changes" ON setup_changes
  FOR ALL USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN racer_profiles rp ON s.profile_id = rp.id
      WHERE rp.auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS Policies for race_results
-- ============================================================================
CREATE POLICY "Users can view own race_results" ON race_results
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN racer_profiles rp ON s.profile_id = rp.id
      WHERE rp.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own race_results" ON race_results
  FOR ALL USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN racer_profiles rp ON s.profile_id = rp.id
      WHERE rp.auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS Policies for setup_embeddings
-- ============================================================================
CREATE POLICY "Users can view own embeddings" ON setup_embeddings
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN racer_profiles rp ON s.profile_id = rp.id
      WHERE rp.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own embeddings" ON setup_embeddings
  FOR ALL USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN racer_profiles rp ON s.profile_id = rp.id
      WHERE rp.auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- IMPORTANT: Link existing data to your auth user
-- ============================================================================
-- After you log in for the first time, run this to link your existing data:
-- UPDATE racer_profiles SET auth_user_id = auth.uid() WHERE email = 'your-email@example.com';
-- ============================================================================
