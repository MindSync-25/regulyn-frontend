import { QueryClient } from '@tanstack/react-query';
import { isApiError, getErrorMessage } from '@/lib/api/http';

/**
 * TanStack Query client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (isApiError(error) && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry up to 2 times for 5xx errors
        return failureCount < 2;
      },
      
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Refetch on window focus in production
      refetchOnWindowFocus: import.meta.env.PROD,
      
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    
    mutations: {
      // Retry mutations once on network errors
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (isApiError(error) && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry once for network errors
        return failureCount < 1;
      },
      
      // Log errors globally
      onError: (error) => {
        console.error('[mutation error]', getErrorMessage(error));
      },
    },
  },
});

// Log query cache events in development
if (import.meta.env.DEV) {
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'error') {
      console.error('[query error]', event.query.queryKey, event.action.error);
    }
  });
}
