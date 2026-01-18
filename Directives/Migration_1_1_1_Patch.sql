-- MIGRATION PATCH 1.1.1
-- Objective: Ensure 'baseline_setup' JSONB column exists in 'vehicles' table.
-- Context: This was present in Master_Schema.sql but missing from Migration_1_1_0.sql.

DO $$
BEGIN
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS baseline_setup JSONB DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN
    NULL;
END $$;

SELECT 'Migration Patch 1.1.1 (Baseline Setup) completed successfully' AS status;
