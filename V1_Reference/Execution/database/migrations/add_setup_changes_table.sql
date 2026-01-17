-- Migration: Add setup_changes table for Sprint 4 X-Factor integration
-- Purpose: Track package copy operations and log changes for impact measurement
-- Date: December 28, 2025

CREATE TABLE IF NOT EXISTS setup_changes (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    package_name VARCHAR(50) NOT NULL,
    parameter_name VARCHAR(50) NOT NULL,
    value_before VARCHAR(100),
    value_after VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Index for fast lookups by session_id (used at session closeout for impact analysis)
CREATE INDEX IF NOT EXISTS idx_setup_changes_session ON setup_changes(session_id);

-- Index for fast lookups by package_name (used for package-specific analysis)
CREATE INDEX IF NOT EXISTS idx_setup_changes_package ON setup_changes(package_name);

-- Index for chronological analysis
CREATE INDEX IF NOT EXISTS idx_setup_changes_timestamp ON setup_changes(timestamp);
