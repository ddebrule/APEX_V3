export type RacerProfile = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email?: string;
  sponsors: string[];
  is_default: boolean;
};

export type Vehicle = {
  id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;
  brand: string;
  model: string;
  transponder?: string;
  baseline_setup: Record<string, unknown>;
};

export type SessionType = 'practice' | 'qualifier' | 'main';
export type SessionStatus = 'draft' | 'active' | 'archived';

export type Session = {
  id: string;
  profile_id: string;
  vehicle_id: string;
  created_at: string;
  updated_at: string;
  event_name: string;
  session_type: SessionType;
  track_context: TrackContext;
  actual_setup: Record<string, unknown>;
  status: SessionStatus;
};

export type TrackContext = {
  name: string;
  surface: string;
  traction: string;
  temperature?: number;
};

export type ChangeStatus = 'pending' | 'accepted' | 'denied' | 'reversed';

export type SetupChange = {
  id: string;
  session_id: string;
  created_at: string;
  parameter: string;
  old_value?: string;
  new_value?: string;
  ai_reasoning?: string;
  driver_feedback?: string;
  status: ChangeStatus;
};

export type RaceResult = {
  id: string;
  session_id: string;
  created_at: string;
  best_lap?: number;
  average_lap?: number;
  consistency_score?: number;
  lap_times?: unknown[];
};

export type SetupEmbedding = {
  id: string;
  session_id: string;
  created_at: string;
  content: string;
  embedding: number[];
};
