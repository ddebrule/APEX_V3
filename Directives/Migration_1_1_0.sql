-- MIGRATION: A.P.E.X. V3.1 Schema Upgrade (For Existing v1.0 Databases ONLY)
-- From: V1.0.0 (existing database with tables)
-- To: V1.1.0 (adds sponsors, classes table, class_id foreign key)
-- Target: Supabase (PostgreSQL 15+)
-- Date: 2026-01-17

-- ⚠️  IMPORTANT: Only use this script if tables already exist!
-- If you get "relation does not exist" error, use Master_Schema.sql instead.
-- This script is for upgrading existing databases, not initial setup.

-- Phase 1: Add missing JSONB field to racer_profiles (if not already present)
DO $$
BEGIN
    ALTER TABLE racer_profiles ADD COLUMN IF NOT EXISTS sponsors JSONB DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN
    NULL;
END $$;

-- Phase 2: Create classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES racer_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "1/8 Expert Nitro Buggy"
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 3: Add class_id foreign key to vehicles (if not already present)
DO $$
BEGIN
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN
    NULL;
END $$;

-- Phase 4: Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_classes_profile_id ON classes(profile_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_class_id ON vehicles(class_id);

-- Phase 5: Enable RLS on classes table
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Phase 6: Completion marker
SELECT 'Migration 1.1.0 completed successfully' AS status;
