import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RacerProfile, Vehicle, Session, TrackContext } from '@/types/database';
import { ScrapedTelemetry } from '@/lib/LiveRCScraper';
import { ORP_Result, calculateORP } from '@/lib/ORPService';
import { getVehiclesByProfileId } from '@/lib/queries';

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
  sessionStatus: 'draft' | 'active';
  error: string | null;
  uiScale: number;

  // ===== NEW: LiveRC & ORP Integration =====
  liveRcUrl: string; // LiveRC event URL (e.g., https://peakview.liverc.com/results/?p=view_event&id=485348)
  sessionTelemetry: ScrapedTelemetry | null; // Current session lap telemetry
  currentORP: ORP_Result | null; // Calculated ORP score
  racerLapsSnapshot: Record<string, any> | null; // Full racerLaps for Top 5 calculation

  // Actions
  setSelectedRacer: (racer: RacerProfile | null) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  setSelectedSession: (session: Session | null) => void;
  setRacers: (racers: RacerProfile[]) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setSessions: (sessions: Session[]) => void;
  refreshVehicles: () => Promise<void>;
  setIsInitializing: (isInitializing: boolean) => void;
  setIsLocked: (isLocked: boolean) => void;
  setSessionStatus: (status: 'draft' | 'active') => void;
  setError: (error: string | null) => void;
  setUiScale: (uiScale: number) => void;

  // ===== NEW: LiveRC & ORP Actions =====
  setLiveRcUrl: (url: string) => void;
  setSessionTelemetry: (telemetry: ScrapedTelemetry | null) => void;
  setRacerLapsSnapshot: (racerLaps: Record<string, any> | null) => void;
  calculateORP: (driverId: string) => void; // Calculate ORP from current telemetry

  // Computed
  isReadyToLock: () => boolean;
  reset: () => void;
}

export const useMissionControlStore = create<MissionControlState>()(
  persist(
    (set, get) => ({
      selectedRacer: null,
      selectedVehicle: null,
      selectedSession: null,
      racers: [],
      vehicles: [],
      sessions: [],
      isInitializing: false,
      isLocked: false,
      sessionStatus: 'draft',
      error: null,
      uiScale: 100,

      // ===== NEW: LiveRC & ORP State =====
      liveRcUrl: '',
      sessionTelemetry: null,
      currentORP: null,
      racerLapsSnapshot: null,

      setSelectedRacer: async (racer) => {
        set({ selectedRacer: racer });
        // Fetch and populate vehicles when racer is selected
        if (racer) {
          try {
            const vehicles = await getVehiclesByProfileId(racer.id);
            set({ vehicles });
          } catch (error) {
            console.error('Failed to fetch vehicles for racer:', error);
            set({ vehicles: [] });
          }
        } else {
          set({ vehicles: [] });
        }
      },
      setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
      setSelectedSession: (session) => {
        // Sync sessionStatus with the session's status field
        const newStatus = session?.status === 'active' ? 'active' : 'draft';
        set({ selectedSession: session, sessionStatus: newStatus });
      },
      setRacers: (racers) => set({ racers }),
      setVehicles: (vehicles) => set({ vehicles }),
      setSessions: (sessions) => set({ sessions }),
      setIsInitializing: (isInitializing) => set({ isInitializing }),
      setIsLocked: (isLocked) => {
        // Sync isLocked with sessionStatus
        const newStatus = isLocked ? 'active' : 'draft';
        set({ isLocked, sessionStatus: newStatus });
      },
      setSessionStatus: (status) => set({ sessionStatus: status, isLocked: status === 'active' }),
      setError: (error) => set({ error }),
      setUiScale: (uiScale) => set({ uiScale: uiScale }),

      refreshVehicles: async () => {
        const { selectedRacer } = get();
        if (selectedRacer) {
          try {
            const vehicles = await getVehiclesByProfileId(selectedRacer.id);
            set({ vehicles });
          } catch (error) {
            console.error('Failed to refresh vehicles:', error);
          }
        }
      },

      // ===== NEW: LiveRC & ORP Actions =====
      setLiveRcUrl: (url) => set({ liveRcUrl: url }),
      setSessionTelemetry: (telemetry) => set({ sessionTelemetry: telemetry }),
      setRacerLapsSnapshot: (racerLaps) => set({ racerLapsSnapshot: racerLaps }),
      calculateORP: (driverId) => {
        const { sessionTelemetry, racerLapsSnapshot } = get();
        if (!sessionTelemetry || !racerLapsSnapshot) {
          set({ currentORP: null });
          return;
        }

        try {
          const orp = calculateORP({
            lapTimes: sessionTelemetry.lap_history,
            racerLaps: racerLapsSnapshot,
            driverId,
          });
          set({ currentORP: orp });
        } catch (error) {
          console.error('ORP calculation error:', error);
          set({ currentORP: null });
        }
      },

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
        liveRcUrl: '',
        sessionTelemetry: null,
        currentORP: null,
        racerLapsSnapshot: null,
      }),
    }),
    {
      name: 'mission-control-storage',
      partialize: (state) => ({ uiScale: state.uiScale }),
    }
  )
);
