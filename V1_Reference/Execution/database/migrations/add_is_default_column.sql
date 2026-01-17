-- ============================================
-- Migration: Add is_default column to racer_profiles
-- Phase 4.4: Multi-Racer Profile Management
-- ============================================
-- Description: Adds support for marking a single profile as the default,
-- which will be loaded automatically when the app starts.
--
-- Behavior:
-- - New column: is_default BOOLEAN DEFAULT FALSE
-- - Ensures only one profile is marked as default (via application logic)
-- - If running this on existing database with profiles, the first profile
--   or 'Default Racer' will be marked as default
-- ============================================

-- Add the is_default column if it doesn't exist
ALTER TABLE racer_profiles
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Ensure the 'Default Racer' profile is marked as default (if it exists)
UPDATE racer_profiles
SET is_default = TRUE
WHERE id = (
    SELECT id FROM racer_profiles
    WHERE name = 'Default Racer'
    LIMIT 1
)
AND NOT EXISTS (
    SELECT 1 FROM racer_profiles WHERE is_default = TRUE
);

-- If no 'Default Racer' and no default set, mark the oldest profile as default
UPDATE racer_profiles
SET is_default = TRUE
WHERE id = (
    SELECT id FROM racer_profiles
    ORDER BY created_at ASC
    LIMIT 1
)
AND NOT EXISTS (
    SELECT 1 FROM racer_profiles WHERE is_default = TRUE
);

-- Create index for efficient default profile queries
CREATE INDEX IF NOT EXISTS idx_racer_profiles_is_default ON racer_profiles(is_default)
WHERE is_default = TRUE;
