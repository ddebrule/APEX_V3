/**
 * TanStack Query Hooks for Racers and Vehicles
 * Replaces manual useEffect fetching with cached, optimized queries
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllRacers,
  getVehiclesByProfileId,
  createRacerProfile,
  createVehicle,
} from '@/lib/queries';
import type { RacerProfile, Vehicle } from '@/types/database';

// ============================================================================
// Query Keys (for cache management)
// ============================================================================

export const racerKeys = {
  all: ['racers'] as const,
};

export const vehicleKeys = {
  all: ['vehicles'] as const,
  byRacer: (racerId: string) => ['vehicles', racerId] as const,
};

// ============================================================================
// Racer Queries
// ============================================================================

/**
 * Fetch all racers (cached globally)
 */
export function useRacers() {
  return useQuery({
    queryKey: racerKeys.all,
    queryFn: getAllRacers,
  });
}

/**
 * Create a new racer profile
 */
export function useCreateRacer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newRacer: {
      name: string;
      email?: string;
      sponsors?: any;
      is_default?: boolean;
    }) => createRacerProfile(newRacer as any),
    onSuccess: () => {
      // Invalidate racers cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: racerKeys.all });
    },
  });
}

// ============================================================================
// Vehicle Queries (Dependent on Racer Selection)
// ============================================================================

/**
 * Fetch vehicles for a specific racer (dependent query)
 * Only fetches when racerId is provided
 */
export function useVehiclesByRacer(racerId: string | undefined) {
  return useQuery({
    queryKey: vehicleKeys.byRacer(racerId || ''),
    queryFn: () => getVehiclesByProfileId(racerId!),
    enabled: !!racerId, // Only fetch when racerId exists
  });
}

/**
 * Create a new vehicle
 */
export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newVehicle: {
      brand: string;
      model: string;
      profile_id: string;
      transponder?: string;
      baseline_setup?: any;
    }) => createVehicle(newVehicle as any),
    onSuccess: (_, variables) => {
      // Invalidate vehicle cache for this racer
      queryClient.invalidateQueries({
        queryKey: vehicleKeys.byRacer(variables.profile_id),
      });
    },
  });
}
