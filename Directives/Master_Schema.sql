-- MASTER SCHEMA: A.P.E.X. V3 (HARDENED)
-- Target: Supabase (PostgreSQL 15+)
-- Version: 1.1.0

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. ENUMS
CREATE TYPE session_type_enum AS ENUM ('practice', 'race');
CREATE TYPE change_status_enum AS ENUM ('pending', 'accepted', 'denied', 'reversed');
CREATE TYPE session_status_enum AS ENUM ('draft', 'active', 'archived');

-- 3. IDENTITY & FLEET
CREATE TABLE racer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    sponsors JSONB DEFAULT '[]', -- [{"brand": "JConcepts", "category": "Tires"}]
    is_default BOOLEAN DEFAULT FALSE,
    CONSTRAINT email_valid CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES racer_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "1/8 Expert Nitro Buggy"
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES racer_profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL, -- Many-to-One: Vehicles -> Class
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    transponder TEXT CONSTRAINT transponder_unique UNIQUE,
    baseline_setup JSONB DEFAULT '{}'
);

-- 4. ACTIVE SESSIONS
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES racer_profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    event_name TEXT NOT NULL,
    session_type session_type_enum DEFAULT 'practice',
    track_context JSONB DEFAULT '{
        "name": "",
        "surface": "clay",
        "traction": "medium",
        "temperature": null
    }',
    actual_setup JSONB DEFAULT '{}',
    pit_notes TEXT,
    class_name TEXT,
    status session_status_enum DEFAULT 'draft'
);

-- 5. THE AUDIT TRAIL
CREATE TABLE setup_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    parameter TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ai_reasoning TEXT,
    driver_feedback TEXT,
    status change_status_enum DEFAULT 'pending'
);

-- 6. TELEMETRY & RECORDS
CREATE TABLE race_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    best_lap DECIMAL(6,3), -- Up to 999.999s
    average_lap DECIMAL(6,3),
    consistency_score DECIMAL(5,2), -- 00.00 to 99.99%
    lap_times JSONB,
    CONSTRAINT consistency_score_valid CHECK (consistency_score >= 0 AND consistency_score <= 100)
);

-- 7. INSTITUTIONAL MEMORY
CREATE TABLE setup_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    content TEXT,
    embedding VECTOR(1536)
);

CREATE TABLE handling_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES racer_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    label TEXT NOT NULL,
    description TEXT
);

-- 8. PERFORMANCE INDEXES (High Severity Fix)
-- Foreign Key Indexes
CREATE INDEX idx_vehicles_profile_id ON vehicles(profile_id);
CREATE INDEX idx_sessions_profile_id ON sessions(profile_id);
CREATE INDEX idx_sessions_vehicle_id ON sessions(vehicle_id);
CREATE INDEX idx_setup_changes_session_id ON setup_changes(session_id);
CREATE INDEX idx_race_results_session_id ON race_results(session_id);
CREATE INDEX idx_setup_embeddings_session_id ON setup_embeddings(session_id);
CREATE INDEX idx_handling_signals_profile_id ON handling_signals(profile_id);

-- Operational Indexes
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_profile_status ON sessions(profile_id, status);
CREATE INDEX idx_setup_changes_created_at ON setup_changes(created_at DESC);

-- Vector Search Index (HNSW for semantic search)
CREATE INDEX setup_embeddings_embedding_idx
ON setup_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 9. SECURITY (Scaffold)
ALTER TABLE racer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE handling_signals ENABLE ROW LEVEL SECURITY;

-- 10. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_racer_profiles_updated_at BEFORE UPDATE ON racer_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 11. VECTOR SEARCH RPC (OPTIMIZED)
-- Semantic search with session metadata enrichment via JOIN
CREATE OR REPLACE FUNCTION match_setup_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  similarity FLOAT,
  event_name TEXT,
  session_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.id,
    se.session_id,
    se.content,
    se.created_at,
    1 - (se.embedding <=> query_embedding) AS similarity,
    s.event_name,
    s.created_at AS session_created_at
  FROM setup_embeddings se
  INNER JOIN sessions s ON s.id = se.session_id
  WHERE 1 - (se.embedding <=> query_embedding) > match_threshold
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
