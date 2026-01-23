export type RaceClassMapping = {
  className: string;
  vehicleId: string;
};

export type RacerProfile = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email?: string;
  sponsors: string[];
  is_default: boolean;
};

export type VehicleSetup = {
  [parameter_key: string]: string | number | boolean;
};

export type Vehicle = {
  id: string;
  profile_id: string;
  class_id?: string;
  created_at: string;
  updated_at: string;
  brand: string;
  model: string;
  transponder?: string;
  baseline_setup: VehicleSetup;
};

export type VehicleClass = {
  id: string;
  profile_id: string;
  name: string;
  created_at: string;
};

export type SessionType = 'practice' | 'race';
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
  actual_setup: VehicleSetup;
  status: SessionStatus;
};

export type HistoricSession = Session & {
  final_orp: number;
  total_laps: number;
  conversation_summary_vector?: number[];
};

export type TrackContext = {
  name: string;
  surface: string;
  traction: string;
  temperature?: number | null;
  event_date?: string;
  track_name?: string;
  location?: string;
  num_quals?: number;
  qual_length?: number;
  main_length?: number;
  anticipated_temp?: number;
  race_classes?: RaceClassMapping[];
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

export type HandlingSignal = {
  id: string;
  profile_id: string;
  label: string;
  description?: string;
  created_at: string;
};
