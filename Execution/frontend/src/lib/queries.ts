import { supabase } from './supabase';
import type { RacerProfile, Vehicle, Session } from '@/types/database';

// ========== RACER PROFILES ==========

export async function getAllRacers(): Promise<RacerProfile[]> {
  const { data, error } = await supabase
    .from('racer_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching racers:', error);
    throw error;
  }

  return data || [];
}

export async function getRacerById(id: string): Promise<RacerProfile | null> {
  const { data, error } = await supabase
    .from('racer_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching racer:', error);
  }

  return data || null;
}

export async function getDefaultRacer(): Promise<RacerProfile | null> {
  const { data, error } = await supabase
    .from('racer_profiles')
    .select('*')
    .eq('is_default', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching default racer:', error);
  }

  return data || null;
}

// ========== VEHICLES ==========

export async function getVehiclesByProfileId(profileId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }

  return data || [];
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching vehicle:', error);
  }

  return data || null;
}

// ========== SESSIONS ==========

export async function getSessionsByProfileId(profileId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }

  return data || [];
}

export async function getActiveSessions(profileId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active sessions:', error);
    throw error;
  }

  return data || [];
}

export async function getSessionById(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching session:', error);
  }

  return data || null;
}

export async function createSession(session: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .insert([session])
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    throw error;
  }

  return data || null;
}

export async function updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating session:', error);
    throw error;
  }

  return data || null;
}

// ========== INSTITUTIONAL MEMORY (EMBEDDINGS) ==========

export async function getSessionEmbeddings(sessionId: string) {
  const { data, error } = await supabase
    .from('setup_embeddings')
    .select('*')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching embeddings:', error);
    throw error;
  }

  return data || [];
}

export async function getInstitutionalMemory(profileId: string, limit = 5) {
  const { data, error } = await supabase
    .from('setup_embeddings')
    .select('setup_embeddings.*, sessions(event_name, track_context, race_results(average_lap))')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching institutional memory:', error);
    throw error;
  }

  return data || [];
}

// ========== SETUP CHANGES (AUDIT TRAIL) ==========

export async function getSetupChanges(sessionId: string) {
  const { data, error } = await supabase
    .from('setup_changes')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching setup changes:', error);
    throw error;
  }

  return data || [];
}

export async function insertSetupChange(setupChange: {
  session_id: string;
  parameter: string;
  old_value?: string | null;
  new_value?: string | null;
  ai_reasoning: string;
  status: 'pending' | 'accepted' | 'denied';
}) {
  const { data, error } = await supabase
    .from('setup_changes')
    .insert([setupChange])
    .select()
    .single();

  if (error) {
    console.error('Error inserting setup change:', error);
    throw error;
  }

  return data;
}

// ========== RACE RESULTS ==========

export async function getRaceResults(sessionId: string) {
  const { data, error } = await supabase
    .from('race_results')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching race results:', error);
  }

  return data || null;
}
