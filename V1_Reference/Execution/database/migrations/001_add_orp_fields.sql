-- =============================================================
-- Phase 5 Sprint 2: ORP Engine Field Additions
-- Adds experience_level and driving_style to racer_profiles
-- Adds practice_rounds and qualifying_rounds to sessions
-- =============================================================

-- IMPORTANT: Run database backup before executing this migration
-- pg_dump $DATABASE_URL > backup_before_sprint2.sql

BEGIN;

-- ========== MIGRATION 1: racer_profiles Extensions ==========

-- Add experience_level column (Sportsman, Intermediate, Pro)
ALTER TABLE racer_profiles
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50) DEFAULT 'Intermediate';

-- Add driving_style column (custom notes about driver's approach)
ALTER TABLE racer_profiles
ADD COLUMN IF NOT EXISTS driving_style VARCHAR(255);

-- Verify columns were added
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name='racer_profiles' AND column_name IN ('experience_level', 'driving_style');

-- ========== MIGRATION 2: sessions Extensions ==========

-- Add practice_rounds column (0-5+, or NULL for "Unlimited")
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS practice_rounds INTEGER DEFAULT 0;

-- Add qualifying_rounds column (typically 1-6)
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS qualifying_rounds INTEGER DEFAULT 0;

-- Verify columns were added
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name='sessions' AND column_name IN ('practice_rounds', 'qualifying_rounds');

COMMIT;

-- ========== VERIFICATION QUERIES ==========
-- Run these after migration to confirm success:

-- Check racer_profiles columns:
-- \d racer_profiles

-- Check sessions columns:
-- \d sessions

-- Count total racer profiles (should match before/after):
-- SELECT COUNT(*) as total_profiles FROM racer_profiles;

-- Check for any NULL experience_level values:
-- SELECT COUNT(*) as default_intermediate FROM racer_profiles WHERE experience_level = 'Intermediate';

-- ========== ROLLBACK PROCEDURE (if needed) ==========
-- ALTER TABLE racer_profiles DROP COLUMN experience_level;
-- ALTER TABLE racer_profiles DROP COLUMN driving_style;
-- ALTER TABLE sessions DROP COLUMN practice_rounds;
-- ALTER TABLE sessions DROP COLUMN qualifying_rounds;
