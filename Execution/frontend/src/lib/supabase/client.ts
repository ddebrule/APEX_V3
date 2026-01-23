import { createBrowserClient } from '@supabase/ssr';

// ============================================================================
// Supabase Browser Client
// ============================================================================
// Purpose: Client-side Supabase instance for use in React components
// ============================================================================

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
