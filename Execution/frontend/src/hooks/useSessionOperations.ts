/**
 * TanStack Query Hooks for Session Operations
 * Handles race/practice session management with caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSessionsByProfileId,
  getSessionById,
  createSession,
  updateSession,
} from '@/lib/queries';
import type { Session } from '@/types/database';

// ============================================================================
// Query Keys (for cache management)
// ============================================================================

export const sessionKeys = {
  all: ['sessions'] as const,
  byRacer: (racerId: string) => ['sessions', racerId] as const,
  byId: (sessionId: string) => ['sessions', 'detail', sessionId] as const,
};

// ============================================================================
// Session Queries
// ============================================================================

/**
 * Fetch all sessions for a specific racer (dependent query)
 * Only fetches when racerId is provided
 */
export function useSessionsByRacer(racerId: string | undefined) {
  return useQuery({
    queryKey: sessionKeys.byRacer(racerId || ''),
    queryFn: () => getSessionsByProfileId(racerId!),
    enabled: !!racerId, // Only fetch when racerId exists
  });
}

/**
 * Fetch a single session by ID (dependent query)
 * Only fetches when sessionId is provided
 */
export function useSessionById(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionKeys.byId(sessionId || ''),
    queryFn: () => getSessionById(sessionId!),
    enabled: !!sessionId, // Only fetch when sessionId exists
  });
}

// ============================================================================
// Session Mutations
// ============================================================================

/**
 * Create a new session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newSession: Omit<Session, 'id' | 'created_at' | 'updated_at'>) =>
      createSession(newSession),
    onSuccess: (_, variables) => {
      // Invalidate sessions cache for this racer
      queryClient.invalidateQueries({
        queryKey: sessionKeys.byRacer(variables.profile_id),
      });
      // Also invalidate all sessions cache
      queryClient.invalidateQueries({
        queryKey: sessionKeys.all,
      });
    },
  });
}

/**
 * Update an existing session
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      updates,
    }: {
      sessionId: string;
      updates: Partial<Session>;
    }) => updateSession(sessionId, updates),
    onSuccess: (data, variables) => {
      // Invalidate the specific session cache
      queryClient.invalidateQueries({
        queryKey: sessionKeys.byId(variables.sessionId),
      });
      // Invalidate all sessions caches (in case session list needs refresh)
      queryClient.invalidateQueries({
        queryKey: sessionKeys.all,
      });
    },
  });
}
