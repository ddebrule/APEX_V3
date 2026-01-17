-- ============================================
-- APEX-AGR-SYSTEM Database Schema v2
-- Designed for: Project Manifest + Roadmap Features
-- PostgreSQL with JSONB for flexibility
-- ============================================

-- ============================================
-- 1. TEAMS (For Phase 4.2 Multi-Driver Sync)
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. RACER PROFILES (Manifest §2)
-- ============================================
CREATE TABLE IF NOT EXISTS racer_profiles (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,  -- For Phase 4.2

    -- Identity
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),

    -- Social Media (Manifest §2)
    facebook VARCHAR(255),
    instagram VARCHAR(255),

    -- Sponsors as array (simpler than separate table, expandable via UI)
    sponsors TEXT[] DEFAULT '{}',

    -- Multi-Racer Management (Phase 4.4)
    -- Only one profile per user/instance should have is_default=TRUE
    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. VEHICLES / FLEET (Manifest §2)
-- Transponder attached to specific car
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES racer_profiles(id) ON DELETE CASCADE,

    -- Vehicle Identity (Critical for template parsing - Manifest §4)
    brand VARCHAR(100) NOT NULL,        -- e.g., "Tekno", "Associated", "Xray"
    model VARCHAR(100) NOT NULL,        -- e.g., "NB48 2.2", "RC10B74.2"
    nickname VARCHAR(255),              -- e.g., "Race Buggy", "Practice Truggy"

    -- Transponder per car (Manifest §2)
    transponder VARCHAR(100),

    -- Shop Master Baseline (JSONB for flexibility)
    baseline_setup JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(profile_id, brand, model)
);

-- JSONB baseline_setup structure:
-- {
--   "diffs": {"front": 7000, "center": 7000, "rear": 5000},
--   "front": {
--     "shock_oil": 450, "spring": "Green", "sway_bar": 2.3,
--     "pistons": "1.2x4", "toe": -1.0, "ride_height": 27.0,
--     "camber": -2.0, "droop": 1.5
--   },
--   "rear": {
--     "shock_oil": 400, "spring": "Yellow", "sway_bar": 2.5,
--     "pistons": "1.7x4", "toe": 3.0, "ride_height": 28.0,
--     "camber": -3.0, "droop": 1.5
--   },
--   "tires": {"tread": "Kosmos", "compound": "Green"},
--   "power": {
--     "engine": "REDS R7", "pipe": "REDS 2143",
--     "clutch": "4-Shoe Med", "bell": 13, "spur": 48
--   }
-- }

-- ============================================
-- 4. SESSIONS (Manifest §3 - Tab 1: Event Setup)
-- Each practice/race session with Digital Twin
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES racer_profiles(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Session Identity (Manifest Tab 1)
    session_name VARCHAR(255),
    session_type VARCHAR(50) NOT NULL DEFAULT 'Practice',  -- 'Practice' or 'Race'
    session_date DATE DEFAULT CURRENT_DATE,

    -- Track Context (Manifest Tab 1)
    track_name VARCHAR(255),
    track_size VARCHAR(50),             -- Small, Medium, Large
    traction VARCHAR(50),               -- Low, Medium, High
    surface_type VARCHAR(50),           -- Dusty, Dry, Wet, Muddy
    surface_condition VARCHAR(50),      -- Smooth, Bumpy, Rutted

    -- Racing Classes (for LiveRC filtering)
    racing_classes TEXT[],              -- e.g., ['Expert Nitro Buggy', 'Pro Truggy']

    -- Digital Twin: Actual Setup (Roadmap 2.3)
    -- Starts as copy of baseline, updated as changes are accepted
    actual_setup JSONB DEFAULT '{}',

    -- Weather data (from API)
    weather JSONB,

    -- LiveRC event URL (for Phase 2.1)
    liverc_url VARCHAR(500),

    -- Status
    status VARCHAR(50) DEFAULT 'active',  -- active, draft, completed, archived

    -- Draft metadata (Phase 4.3: Auto-Save)
    device_info VARCHAR(255),              -- Browser/device identifier for multi-device tracking
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. SETUP CHANGES (Manifest Tab 2 Accept/Deny)
-- Track every change recommendation and outcome
-- ============================================
CREATE TABLE IF NOT EXISTS setup_changes (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

    -- Change Details
    parameter VARCHAR(100) NOT NULL,    -- e.g., "front.shock_oil", "tires.compound"
    old_value VARCHAR(255),
    new_value VARCHAR(255),

    -- Source of recommendation
    source VARCHAR(50) DEFAULT 'ai',    -- 'ai', 'manual', 'library_import'
    ai_reasoning TEXT,                  -- AI's explanation for the change

    -- Accept/Deny tracking (Manifest Tab 2)
    status VARCHAR(50) DEFAULT 'pending',  -- pending, accepted, denied

    -- Performance context
    lap_time_before DECIMAL(10,3),      -- Best lap before change
    lap_time_after DECIMAL(10,3),       -- Best lap after change (if accepted)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP                -- When accepted/denied
);

-- ============================================
-- 6. MASTER LIBRARY (Manifest §4, Roadmap 4.1)
-- Community/Pro Baselines
-- ============================================
CREATE TABLE IF NOT EXISTS master_library (
    id SERIAL PRIMARY KEY,

    -- Track/Condition Context
    track_name VARCHAR(255) NOT NULL,
    track_size VARCHAR(50),
    traction VARCHAR(50),
    surface_type VARCHAR(50),
    surface_condition VARCHAR(50),

    -- Vehicle Match
    brand VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,

    -- Setup Data (JSONB - same structure as vehicle.baseline_setup)
    setup JSONB NOT NULL,

    -- Provenance
    source VARCHAR(255) DEFAULT 'User Upload',  -- 'Pro Sheet', 'User Upload', 'Promoted Session'
    submitted_by INTEGER REFERENCES racer_profiles(id),
    driver_name VARCHAR(255),           -- Pro driver name if from setup sheet
    event_name VARCHAR(255),            -- e.g., "2024 ROAR Nationals"

    -- Community validation (future)
    verified BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,

    date_created DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. RACE RESULTS (Roadmap 2.1 - LiveRC Data)
-- Telemetry from LiveRC harvester
-- ============================================
CREATE TABLE IF NOT EXISTS race_results (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL REFERENCES racer_profiles(id) ON DELETE CASCADE,

    -- Heat/Race Identity
    heat_name VARCHAR(255),             -- e.g., "A Main", "Heat 2"
    race_class VARCHAR(255),

    -- Results
    position INTEGER,
    laps_completed INTEGER,
    total_time INTERVAL,
    best_lap DECIMAL(10,3),
    average_lap DECIMAL(10,3),
    consistency DECIMAL(10,3),          -- Std deviation of lap times

    -- Raw lap times (for Phase 5.1 predictive modeling)
    lap_times JSONB,                    -- Array of lap times

    -- LiveRC metadata
    liverc_event_id VARCHAR(100),
    liverc_driver_id VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. MEDIA (Roadmap 2.2 - Photos/Videos)
-- Track walk photos, tire wear analysis, race photos
-- ============================================
CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL REFERENCES racer_profiles(id) ON DELETE CASCADE,

    -- File info
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),              -- 'image/jpeg', 'image/png', 'video/mp4'
    file_url VARCHAR(500),              -- Cloud storage URL (S3, etc.)
    file_size INTEGER,

    -- Context
    media_type VARCHAR(50),             -- 'track_walk', 'tire_wear', 'chassis', 'race_photo'
    description TEXT,

    -- AI Analysis results (Vision Engine)
    ai_analysis JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. PIT WALL (Roadmap 4.2 - Team Coordination)
-- Real-time team communication during events
-- ============================================
CREATE TABLE IF NOT EXISTS pit_wall_messages (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL REFERENCES racer_profiles(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,

    -- Message
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'note',  -- 'note', 'alert', 'setup_share', 'lap_time'

    -- Optional structured data
    data JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. THEORY DOCUMENTS (Manifest §4 - Knowledge Base)
-- For AI retrieval and semantic search
-- ============================================
CREATE TABLE IF NOT EXISTS theory_documents (
    id SERIAL PRIMARY KEY,

    -- Document Identity
    filename VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255),
    category VARCHAR(100),              -- 'suspension', 'tires', 'engine', 'general'

    -- Content (extracted from PDF)
    content TEXT,

    -- For semantic search (Phase 5+)
    -- Requires pgvector extension: CREATE EXTENSION vector;
    -- embedding VECTOR(1536),

    -- Metadata
    author VARCHAR(255),
    source VARCHAR(255),                -- e.g., "Hudy Setup Guide", "JQ Products"

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 11. ACTIVITY LOG (General audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES racer_profiles(id) ON DELETE SET NULL,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,       -- 'session_started', 'setup_changed', 'report_generated'
    details JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_team ON racer_profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_default ON racer_profiles(is_default) WHERE is_default = TRUE;

-- Vehicle lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_profile ON vehicles(profile_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model ON vehicles(brand, model);

-- Session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_profile ON sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_sessions_vehicle ON sessions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sessions_track ON sessions(track_name);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Draft queries (Phase 4.3: Auto-Save)
CREATE INDEX IF NOT EXISTS idx_sessions_profile_status ON sessions(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_draft_updated ON sessions(profile_id, last_updated DESC) WHERE status = 'draft';

-- Setup changes
CREATE INDEX IF NOT EXISTS idx_changes_session ON setup_changes(session_id);
CREATE INDEX IF NOT EXISTS idx_changes_status ON setup_changes(status);

-- Master library search
CREATE INDEX IF NOT EXISTS idx_library_track ON master_library(track_name);
CREATE INDEX IF NOT EXISTS idx_library_vehicle ON master_library(brand, vehicle_model);

-- Race results
CREATE INDEX IF NOT EXISTS idx_results_session ON race_results(session_id);
CREATE INDEX IF NOT EXISTS idx_results_profile ON race_results(profile_id);

-- Media
CREATE INDEX IF NOT EXISTS idx_media_session ON media(session_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);

-- Pit wall
CREATE INDEX IF NOT EXISTS idx_pitwall_team ON pit_wall_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_pitwall_created ON pit_wall_messages(created_at DESC);

-- Theory documents
CREATE INDEX IF NOT EXISTS idx_theory_category ON theory_documents(category);

-- Activity log
CREATE INDEX IF NOT EXISTS idx_activity_profile ON activity_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- JSONB indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_vehicles_setup ON vehicles USING GIN(baseline_setup);
CREATE INDEX IF NOT EXISTS idx_sessions_setup ON sessions USING GIN(actual_setup);
CREATE INDEX IF NOT EXISTS idx_library_setup ON master_library USING GIN(setup);

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER racer_profiles_updated_at
    BEFORE UPDATE ON racer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- DEFAULT DATA
-- ============================================
INSERT INTO racer_profiles (name, email, sponsors)
VALUES ('Default Racer', 'default@apex.local', ARRAY['AGR Labs', 'Tekno RC'])
ON CONFLICT DO NOTHING;
