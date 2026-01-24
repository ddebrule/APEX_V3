/**
 * TanStack Query Hooks for Racer Garage
 * Extends useRacersAndVehicles with classes and handling signals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClassesByProfileId,
  getHandlingSignalsByProfileId,
  createClass,
  deleteClass,
  createHandlingSignal,
  deleteHandlingSignal,
  updateRacerProfile,
  updateVehicle,
  deleteRacerProfile,
} from '@/lib/queries';
import type { VehicleClass, HandlingSignal } from '@/types/database';

// Re-export hooks from useRacersAndVehicles for convenience
export {
  useRacers,
  useVehiclesByRacer,
  useCreateRacer,
  useCreateVehicle,
  racerKeys,
  vehicleKeys,
} from './useRacersAndVehicles';

// ============================================================================
// Query Keys (for cache management)
// ============================================================================

export const classKeys = {
  all: ['classes'] as const,
  byRacer: (racerId: string) => ['classes', racerId] as const,
};

export const handlingSignalKeys = {
  all: ['handling-signals'] as const,
  byRacer: (racerId: string) => ['handling-signals', racerId] as const,
};

// ============================================================================
// Class Queries (Dependent on Racer Selection)
// ============================================================================

/**
 * Fetch classes for a specific racer (dependent query)
 * Only fetches when racerId is provided
 */
export function useClassesByRacer(racerId: string | undefined) {
  return useQuery({
    queryKey: classKeys.byRacer(racerId || ''),
    queryFn: () => getClassesByProfileId(racerId!),
    enabled: !!racerId, // Only fetch when racerId exists
  });
}

/**
 * Create a new class
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newClass: {
      name: string;
      profile_id: string;
    }) => createClass(newClass as any),
    onSuccess: (_, variables) => {
      // Invalidate class cache for this racer
      queryClient.invalidateQueries({
        queryKey: classKeys.byRacer(variables.profile_id),
      });
    },
  });
}

/**
 * Delete a class
 */
export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, racerId }: { classId: string; racerId: string }) => deleteClass(classId),
    onSuccess: (_, variables) => {
      // Invalidate class cache for this racer
      queryClient.invalidateQueries({
        queryKey: classKeys.byRacer(variables.racerId),
      });
    },
  });
}

// ============================================================================
// Handling Signal Queries (Dependent on Racer Selection)
// ============================================================================

/**
 * Fetch handling signals for a specific racer (dependent query)
 * Only fetches when racerId is provided
 */
export function useHandlingSignals(racerId: string | undefined) {
  return useQuery({
    queryKey: handlingSignalKeys.byRacer(racerId || ''),
    queryFn: () => getHandlingSignalsByProfileId(racerId!),
    enabled: !!racerId, // Only fetch when racerId exists
  });
}

/**
 * Create a new handling signal
 */
export function useCreateHandlingSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newSignal: {
      label: string;
      description?: string;
      profile_id: string;
    }) => createHandlingSignal(newSignal as any),
    onSuccess: (_, variables) => {
      // Invalidate handling signals cache for this racer
      queryClient.invalidateQueries({
        queryKey: handlingSignalKeys.byRacer(variables.profile_id),
      });
    },
  });
}

/**
 * Delete a handling signal
 */
export function useDeleteHandlingSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ signalId, racerId }: { signalId: string; racerId: string }) =>
      deleteHandlingSignal(signalId),
    onSuccess: (_, variables) => {
      // Invalidate handling signals cache for this racer
      queryClient.invalidateQueries({
        queryKey: handlingSignalKeys.byRacer(variables.racerId),
      });
    },
  });
}

// ============================================================================
// Racer Update/Delete Mutations (Extended from useRacersAndVehicles)
// ============================================================================

/**
 * Update a racer profile
 */
export function useUpdateRacer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ racerId, updates }: { racerId: string; updates: any }) =>
      updateRacerProfile(racerId, updates),
    onSuccess: () => {
      // Invalidate racers cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['racers'] });
    },
  });
}

/**
 * Delete a racer profile
 */
export function useDeleteRacer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (racerId: string) => deleteRacerProfile(racerId),
    onSuccess: () => {
      // Invalidate all racer-related caches
      queryClient.invalidateQueries({ queryKey: ['racers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['handling-signals'] });
    },
  });
}

// ============================================================================
// Vehicle Update Mutation (Extended from useRacersAndVehicles)
// ============================================================================

/**
 * Update a vehicle
 */
export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vehicleId, updates }: { vehicleId: string; updates: any }) =>
      updateVehicle(vehicleId, updates),
    onSuccess: (_, variables) => {
      // Invalidate vehicle cache for all racers (we don't know which racer this vehicle belongs to)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
