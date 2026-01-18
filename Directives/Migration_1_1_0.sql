-- MIGRATION: A.P.E.X. V3.1 Schema Upgrade
-- From: V1.0.0 (existing)
-- To: V1.1.0 (adds sponsors, classes table, class_id foreign key)
-- Target: Supabase (PostgreSQL 15+)
-- Date: 2026-01-17

-- Phase 1: Add missing JSONB field to racer_profiles
-- Safe: Will not fail if column already exists
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

-- Phase 3: Add class_id foreign key to vehicles if it doesn't exist
DO $$
BEGIN
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN
    NULL;
END $$;

-- Phase 4: Create indexes if they don't exist (for optimization)
CREATE INDEX IF NOT EXISTS idx_classes_profile_id ON classes(profile_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_class_id ON vehicles(class_id);

-- Phase 5: Enable RLS on classes table if not already enabled
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Phase 6: Log migration completion
-- (This is a marker for manual verification - check Supabase logs)
SELECT 'Migration 1.1.0 completed successfully' AS status;
