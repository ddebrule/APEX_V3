'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

// ============================================================================
// TanStack Query Provider
// ============================================================================
// Purpose: Manage server state caching and synchronization
// Configuration: Optimized for "Bloomberg Terminal" instant feel
// ============================================================================

export default function QueryProvider({ children }: { children: ReactNode }) {
  // Create QueryClient with optimized defaults for the APEX use case
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Treat cached data as fresh for 5 minutes
            staleTime: 5 * 60 * 1000, // 5 min

            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000, // 10 min (was cacheTime in v4)

            // Don't refetch when window regains focus
            // (User may be switching between telemetry and browser)
            refetchOnWindowFocus: false,

            // Only retry failed requests once
            retry: 1,

            // Don't refetch on component mount if data exists
            refetchOnMount: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
