-- Migration: Add driver_name column to master_library table
-- Phase 4.2 - Sprint 2
-- This enables organizing setups by racer name in the library

-- Add driver_name column
ALTER TABLE master_library
ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);

-- Add index for filtering by driver name
CREATE INDEX IF NOT EXISTS idx_master_library_driver ON master_library(driver_name);

-- Update existing records with default value (optional)
-- UPDATE master_library SET driver_name = 'Unknown' WHERE driver_name IS NULL;

-- Verify migration
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'master_library' AND column_name = 'driver_name';
