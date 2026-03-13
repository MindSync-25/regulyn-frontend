import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: (failureCount, error) => {
        const apiError = error as { status?: number };
        if (apiError?.status === 401 || apiError?.status === 403 || apiError?.status === 404) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
