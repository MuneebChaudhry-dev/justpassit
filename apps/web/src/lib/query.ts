import { QueryClient } from '@tanstack/react-query';

/**
 * App-wide TanStack Query client. Server state lives here; we deliberately add no
 * other global state library (AGENTS.md §9). Sensible defaults — tune per-query later.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
