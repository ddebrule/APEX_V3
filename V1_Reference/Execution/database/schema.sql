-- APEX-AGR-SYSTEM Database Schema
-- PostgreSQL Database Schema for Multi-User RC Racing System

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgvector extension - optional, required for semantic search
-- Will gracefully fail if not available on the PostgreSQL instance
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION WHEN OTHERS THEN
    -- pgvector not available - semantic search features will be disabled
    -- This is OK for basic functionality
    RAISE NOTICE 'pgvector extension not available - vector search disabled';
END $$;

-- Users table (for future authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Racer Profiles
CREATE TABLE IF NOT EXISTS racer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    transponder VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sponsors
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES racer_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles (User Fleet)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES racer_profiles(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Car Configs (Shop Master Baselines)
CREATE TABLE IF NOT EXISTS car_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES racer_profiles(id) ON DELETE CASCADE,
    car VARCHAR(255) NOT NULL,

    -- Diffs
    df INTEGER,
    dc INTEGER,
    dr INTEGER,

    -- Front Suspension
    so_f INTEGER,
    sp_f VARCHAR(50),
    sb_f DECIMAL(10,2),
    p_f VARCHAR(50),
    toe_f DECIMAL(10,2),
    rh_f DECIMAL(10,2),
    c_f DECIMAL(10,2),
    st_f INTEGER,

    -- Rear Suspension
    so_r INTEGER,
    sp_r VARCHAR(50),
    sb_r DECIMAL(10,2),
    p_r VARCHAR(50),
    toe_r DECIMAL(10,2),
    rh_r DECIMAL(10,2),
    c_r DECIMAL(10,2),
    st_r INTEGER,

    -- Tires
    tread VARCHAR(100),
    compound VARCHAR(50),

    -- Power
    venturi DECIMAL(10,2),
    pipe VARCHAR(100),
    clutch VARCHAR(100),
    bell INTEGER,
    spur INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(profile_id, car)
);

-- Master Library (Community Baselines)
CREATE TABLE IF NOT EXISTS master_library (
    id SERIAL PRIMARY KEY,
    track VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    vehicle VARCHAR(100) NOT NULL,
    condition VARCHAR(255),
    date DATE NOT NULL,
    source VARCHAR(255) DEFAULT 'User Upload',
    driver_name VARCHAR(255),  -- Phase 4.2: Racer name for library organization

    -- Diffs
    df INTEGER,
    dc INTEGER,
    dr INTEGER,

    -- Front Suspension
    so_f INTEGER,
    sp_f VARCHAR(50),
    sb_f DECIMAL(10,2),
    p_f VARCHAR(50),
    toe_f DECIMAL(10,2),
    rh_f DECIMAL(10,2),
    c_f DECIMAL(10,2),
    st_f INTEGER,

    -- Rear Suspension
    so_r INTEGER,
    sp_r VARCHAR(50),
    sb_r DECIMAL(10,2),
    p_r VARCHAR(50),
    toe_r DECIMAL(10,2),
    rh_r DECIMAL(10,2),
    c_r DECIMAL(10,2),
    st_r INTEGER,

    -- Tires
    tread VARCHAR(100),
    compound VARCHAR(50),

    -- Power
    venturi DECIMAL(10,2),
    pipe VARCHAR(100),
    clutch VARCHAR(100),
    bell INTEGER,
    spur INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(track, brand, vehicle, condition, date)
);

-- Track Logs (Session Activity)
CREATE TABLE IF NOT EXISTS track_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES racer_profiles(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    track VARCHAR(255),
    car VARCHAR(255),
    event VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Theory Library Documents (For AI Knowledge Base)
CREATE TABLE IF NOT EXISTS theory_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    category VARCHAR(100),
    content TEXT,
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add vector column if pgvector is available
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='theory_documents' AND column_name='embedding'
    ) THEN
        ALTER TABLE theory_documents ADD COLUMN embedding vector(1536);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- pgvector not available, skip vector column
    NULL;
END $$;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_car_configs_profile ON car_configs(profile_id);
CREATE INDEX IF NOT EXISTS idx_master_library_track ON master_library(track);
CREATE INDEX IF NOT EXISTS idx_master_library_vehicle ON master_library(brand, vehicle);
CREATE INDEX IF NOT EXISTS idx_master_library_driver ON master_library(driver_name);  -- Phase 4.2
CREATE INDEX IF NOT EXISTS idx_track_logs_profile ON track_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_track_logs_timestamp ON track_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_theory_category ON theory_documents(category);

-- Vector similarity search index (pgvector) - only if vector column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='theory_documents' AND column_name='embedding'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_theory_embedding ON theory_documents
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- pgvector not available or index creation failed
    NULL;
END $$;

-- ============================================================
-- SESSIONS & X-FACTOR PROTOCOL TABLES (Phase 2.5 / 3.3)
-- ============================================================

-- Sessions table with multi-day persistence and status tracking
-- Supports events that span 1-7 days with state persistence
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES racer_profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id),
    session_name VARCHAR(255),
    session_type VARCHAR(50),  -- Practice, Qualifying, Main, Club Race
    start_date DATE,
    end_date DATE,  -- For multi-day events (nullable until closed)
    track_name VARCHAR(255),
    track_size VARCHAR(50),  -- Small, Medium, Large
    traction VARCHAR(50),     -- Low, Medium, High
    surface_type VARCHAR(50), -- Dusty, Dry, Wet, Muddy
    surface_condition VARCHAR(50), -- Smooth, Bumpy, Rutted
    actual_setup JSONB,  -- Current Digital Twin state (persisted across days)
    status VARCHAR(20) DEFAULT 'active',  -- active, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Setup changes with impact tracking
-- Tracks all AI recommendations and their outcomes
CREATE TABLE IF NOT EXISTS setup_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    parameter VARCHAR(50) NOT NULL,  -- e.g., "SO_F", "Compound"
    old_value VARCHAR(100),
    new_value VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, denied
    ai_reasoning TEXT,  -- Why the AI recommended this change
    lap_time_before DECIMAL(6,3),  -- Best lap before change
    lap_time_after DECIMAL(6,3),   -- Best lap after change
    impact_status VARCHAR(20),  -- SUCCESS, FAILURE, NEUTRAL (from X-Factor audit)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- X-Factor audit data linked to session closeout
-- The "black box" that transforms driver feel into searchable data
CREATE TABLE IF NOT EXISTS x_factor_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    change_id UUID REFERENCES setup_changes(id),  -- Optional, for per-change ratings
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    -- For ratings 1-2 (FAILURE): What went wrong?
    symptom_category VARCHAR(50),  -- Front-end wash, Rear loose, Stability (bumpy), Rotation (tight)
    -- For ratings 4-5 (SUCCESS): What improved?
    gain_category VARCHAR(50),     -- Corner Entry, Corner Exit, Jumping/Landing, Consistency
    observation TEXT,              -- Final open-ended "binder note"
    best_lap_at_audit DECIMAL(6,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Race results from LiveRC or manual entry
CREATE TABLE IF NOT EXISTS race_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    heat_name VARCHAR(100),  -- e.g., "Q1", "A-Main"
    position INTEGER,
    laps_completed INTEGER,
    total_time DECIMAL(10,3),
    best_lap DECIMAL(6,3),
    consistency DECIMAL(6,3),  -- Lap time variance
    liverc_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR NEW TABLES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sessions_profile ON sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_track ON sessions(track_name);
CREATE INDEX IF NOT EXISTS idx_sessions_dates ON sessions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_setup_changes_session ON setup_changes(session_id);
CREATE INDEX IF NOT EXISTS idx_setup_changes_status ON setup_changes(status);
CREATE INDEX IF NOT EXISTS idx_setup_changes_impact ON setup_changes(impact_status);
CREATE INDEX IF NOT EXISTS idx_x_factor_session ON x_factor_audits(session_id);
CREATE INDEX IF NOT EXISTS idx_x_factor_rating ON x_factor_audits(rating);
CREATE INDEX IF NOT EXISTS idx_race_results_session ON race_results(session_id);

-- ============================================================
-- TRIGGER FUNCTION & TRIGGERS
-- ============================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_racer_profiles_updated_at BEFORE UPDATE ON racer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_car_configs_updated_at BEFORE UPDATE ON car_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PHASE 5: ORP ENGINE - RUN LOGS TABLE
-- ============================================================

-- Granular lap-level data for ORP calculations
-- Stores individual lap times extracted from LiveRC or manual entry
CREATE TABLE IF NOT EXISTS run_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    heat_name VARCHAR(100),  -- e.g., "Q1", "A-Main", "Practice 1"
    lap_number INTEGER NOT NULL,
    lap_time DECIMAL(6,3) NOT NULL,  -- Lap time in seconds (e.g., 58.245)
    confidence_rating INTEGER CHECK (confidence_rating >= 1 AND confidence_rating <= 5),  -- From X-Factor audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for common ORP queries
CREATE INDEX IF NOT EXISTS idx_run_logs_session ON run_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_run_logs_heat ON run_logs(heat_name);
CREATE INDEX IF NOT EXISTS idx_run_logs_created ON run_logs(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_run_logs_updated_at BEFORE UPDATE ON run_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
