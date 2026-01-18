# A.P.E.X. V3.1 Schema Migration Guide

## Overview
This document explains how to safely apply the V3.1 schema upgrades to your Supabase PostgreSQL database.

## Pre-Migration Checklist
- [ ] Backup your Supabase database (optional but recommended)
- [ ] Ensure no active sessions are being modified during migration
- [ ] Keep this terminal window open for reference

## Migration Steps

### Step 1: Access Supabase SQL Editor
1. Go to: https://app.supabase.com/
2. Select your project: **APEX_V3**
3. Navigate to: **SQL Editor** (left sidebar)
4. Click: **New Query**

### Step 2: Copy and Paste Migration Script
1. Open: `Directives/Migration_1_1_0.sql` (in this project)
2. Copy ALL content
3. Paste into Supabase SQL Editor query window
4. Click: **Run** button (or Ctrl+Enter)

### Step 3: Verify Migration Success
You should see output:
```
| status                             |
| ---------------------------------- |
| Migration 1.1.0 completed successfully |
```

### Step 4: Verify Schema Changes (Optional but Recommended)
Run this query in Supabase SQL Editor to confirm changes:

```sql
-- Check racer_profiles has sponsors column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'racer_profiles' AND column_name = 'sponsors';

-- Check classes table exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'classes' AND table_schema = 'public';

-- Check vehicles has class_id column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehicles' AND column_name = 'class_id';
```

## Migration Details

### What Changed

**1. racer_profiles table:**
- Added `sponsors JSONB DEFAULT '[]'` column
- Format: `[{"brand": "JConcepts", "category": "Tires"}]`

**2. classes table (NEW):**
- Enables vehicle classification (e.g., "1/8 Expert Nitro Buggy")
- Foreign key to racer_profiles
- Indexed for performance

**3. vehicles table:**
- Added `class_id UUID` foreign key to classes table
- Optional: vehicles can exist without a class assignment (ON DELETE SET NULL)

**4. Performance Indexes:**
- `idx_classes_profile_id` - enables fast lookups by racer
- `idx_vehicles_class_id` - enables fast lookups by class

### Why These Changes

1. **Sponsors JSONB** - Enables brand/category filtering in AI Advisor recommendations
2. **Classes Table** - Supports structured vehicle classification system
3. **class_id Foreign Key** - Enables UI to display vehicle classes in Race Control tabs
4. **Indexes** - Query performance optimization for production use

## Post-Migration

### For Frontend Developers
- No immediate frontend changes required
- Phase 2.1 components (EventIdentity, SessionLockSlider, TrackIntelligence) continue to work without modification
- New V3.1 components can now reference sponsors and class_id data

### For Testing
1. Create a test racer profile with sponsors:
```sql
INSERT INTO racer_profiles (name, email, sponsors, is_default)
VALUES (
  'Test Racer',
  'test@racing.io',
  '[{"brand": "JConcepts", "category": "Tires"}, {"brand": "Castle", "category": "Motor"}]',
  false
);
```

2. Create a test class:
```sql
INSERT INTO classes (profile_id, name)
VALUES ((SELECT id FROM racer_profiles WHERE name = 'Test Racer'), '1/8 Expert Nitro Buggy');
```

3. Assign vehicle to class:
```sql
UPDATE vehicles
SET class_id = (SELECT id FROM classes WHERE name = '1/8 Expert Nitro Buggy')
WHERE brand = 'Associated' AND model = 'RC8B4e';
```

## Rollback Plan (If Needed)

If you need to revert these changes:

```sql
-- Remove class_id from vehicles (if migration failed partway)
ALTER TABLE vehicles DROP COLUMN IF EXISTS class_id;

-- Drop classes table
DROP TABLE IF EXISTS classes;

-- Remove sponsors from racer_profiles
ALTER TABLE racer_profiles DROP COLUMN IF EXISTS sponsors;
```

**Note:** Do NOT run the rollback unless instructed. The migration is designed to be idempotent (safe to run multiple times).

## Support

If you encounter any errors:

1. **Duplicate column error** - Safe to ignore, column already exists
2. **Foreign key constraint error** - Indicates existing data inconsistency, contact architect
3. **Permission denied** - Use Supabase service role key, not anon key

## Files Reference
- **Migration Script:** `Directives/Migration_1_1_0.sql`
- **Master Schema:** `Directives/Master_Schema.sql`
- **This Guide:** `MIGRATION_INSTRUCTIONS.md`
