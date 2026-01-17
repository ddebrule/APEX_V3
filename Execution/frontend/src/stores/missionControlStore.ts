import { create } from 'zustand';
import type { RacerProfile, Vehicle, Session, TrackContext } from '@/types/database';

export interface MissionControlState {
  // Selection state
  selectedRacer: RacerProfile | null;
  selectedVehicle: Vehicle | null;
  selectedSession: Session | null;

  // Data state
  racers: RacerProfile[];
  vehicles: Vehicle[];
  sessions: Session[];

  // UI state
  isInitializing: boolean;
  isLocked: boolean;
  error: string | null;

  // Actions
  setSelectedRacer: (racer: RacerProfile | null) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  setSelectedSession: (session: Session | null) => void;
  setRacers: (racers: RacerProfile[]) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setSessions: (sessions: Session[]) => void;
  setIsInitializing: (isInitializing: boolean) => void;
  setIsLocked: (isLocked: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  isReadyToLock: () => boolean;
  reset: () => void;
}

export const useMissionControlStore = create<MissionControlState>((set, get) => ({
  selectedRacer: null,
  selectedVehicle: null,
  selectedSession: null,
  racers: [],
  vehicles: [],
  sessions: [],
  isInitializing: false,
  isLocked: false,
  error: null,

  setSelectedRacer: (racer) => set({ selectedRacer: racer }),
  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
  setSelectedSession: (session) => set({ selectedSession: session }),
  setRacers: (racers) => set({ racers }),
  setVehicles: (vehicles) => set({ vehicles }),
  setSessions: (sessions) => set({ sessions }),
  setIsInitializing: (isInitializing) => set({ isInitializing }),
  setIsLocked: (isLocked) => set({ isLocked }),
  setError: (error) => set({ error }),

  isReadyToLock: () => {
    const { selectedRacer, selectedVehicle } = get();
    return selectedRacer !== null && selectedVehicle !== null;
  },

  reset: () => set({
    selectedRacer: null,
    selectedVehicle: null,
    selectedSession: null,
    isInitializing: false,
    isLocked: false,
    error: null,
  }),
}));
