import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from './queryClient';
import { router } from './router';
import { AppErrorBoundary } from '@/components/error/AppErrorBoundary';
import { Toaster } from '@/components/ui/toaster';

/**
 * AppProviders wraps the application with all necessary providers
 */
export function AppProviders() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
