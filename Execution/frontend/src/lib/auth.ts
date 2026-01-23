import { createClient } from '@/lib/supabase/client';

// ============================================================================
// Authentication Helpers
// ============================================================================
// Purpose: Auto-profile creation and user management
// ============================================================================

export interface RacerProfile {
  id: string;
  auth_user_id: string;
  racer_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

/**
 * Creates or retrieves a racer profile for the authenticated user
 *
 * @param authUserId - Supabase auth.users.id
 * @param email - User's email address
 * @returns RacerProfile or null if operation fails
 */
export async function createOrGetProfile(
  authUserId: string,
  email: string
): Promise<RacerProfile | null> {
  const supabase = createClient();

  try {
    // ========================================================================
    // 1. Check if profile already exists
    // ========================================================================
    const { data: existingProfile, error: fetchError } = await supabase
      .from('racer_profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = "not found", which is expected for new users
      console.error('[Auth] Error fetching profile:', fetchError);
      throw fetchError;
    }

    if (existingProfile) {
      console.log('[Auth] Profile found:', existingProfile.id);
      return existingProfile as RacerProfile;
    }

    // ========================================================================
    // 2. Create new profile
    // ========================================================================
    console.log('[Auth] Creating new profile for user:', authUserId);

    // Extract name from email (before @)
    const racerName = email.split('@')[0] || 'Racer';

    const { data: newProfile, error: insertError } = await supabase
      .from('racer_profiles')
      .insert({
        auth_user_id: authUserId,
        racer_name: racerName,
        email: email,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Auth] Error creating profile:', insertError);
      throw insertError;
    }

    console.log('[Auth] Profile created:', newProfile.id);
    return newProfile as RacerProfile;

  } catch (error: any) {
    console.error('[Auth] createOrGetProfile failed:', error);
    return null;
  }
}

/**
 * Gets the current user's profile
 *
 * @returns RacerProfile or null if not authenticated
 */
export async function getCurrentProfile(): Promise<RacerProfile | null> {
  const supabase = createClient();

  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return null;
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('racer_profiles')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single();

    if (profileError) {
      console.error('[Auth] Error fetching current profile:', profileError);
      return null;
    }

    return profile as RacerProfile;

  } catch (error: any) {
    console.error('[Auth] getCurrentProfile failed:', error);
    return null;
  }
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
