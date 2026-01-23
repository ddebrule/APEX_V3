-- Migration: Update session_type_enum to restrict to 'practice' and 'race'
-- Author: Claude (via handoff)
-- Date: 2026-01-22

BEGIN;

-- Create new enum type with restricted values
CREATE TYPE session_type_enum_new AS ENUM ('practice', 'race');

-- Update all existing sessions column to use new enum
-- Map 'qualifier' and 'main' to 'race'
ALTER TABLE sessions ALTER COLUMN session_type TYPE session_type_enum_new
USING (
  CASE
    WHEN session_type = 'practice' THEN 'practice'::session_type_enum_new
    ELSE 'race'::session_type_enum_new
  END
);

-- Drop old enum type
DROP TYPE session_type_enum;

-- Rename new enum type to original name
ALTER TYPE session_type_enum_new RENAME TO session_type_enum;

COMMIT;
