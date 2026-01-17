# Security Spec: Row Level Security (RLS) Policies

## Overview
To move A.P.E.X. V3 from a single-user local app to a multi-tenant cloud app, we must enforce data isolation at the database level.

## Required Policies

### 1. Racer Profiles
- **SELECT:** `auth.uid() = id` (User can only see their own profile).
- **INSERT:** Allowed if `auth.uid()` matches the new record.
- **UPDATE:** `auth.uid() = id`.

### 2. Vehicles & Sessions
- **SELECT/INSERT/UPDATE:** Must join to `racer_profiles` where `profile_id = auth.uid()`.

### 3. Setup Changes & Results
- **SELECT/INSERT/UPDATE:** Must join through `sessions` to `racer_profiles` where `profile_id = auth.uid()`.

## Implementation Priority
> [!IMPORTANT]
> These policies should be implemented **after** the initial UI scaffolding is complete and Supabase Auth is enabled. During early development, we will use the `service_role` key (bypassing RLS) to ensure speed of iteration.
