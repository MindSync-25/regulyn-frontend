import { useQuery } from '@tanstack/react-query';
import { ApiException } from '@/api/errors';
import { searchAuditEvents, type AuditSearchParams } from './api';

export function useAuditSearchQuery(params: AuditSearchParams, enabled: boolean) {
  return useQuery({
    queryKey: ['globalAudit', params],
    queryFn: () => searchAuditEvents(params),
    enabled,
    retry: (failureCount, error) => {
      if (error instanceof ApiException && (error.error.status === 401 || error.error.status === 403)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function isAuthError(error: unknown): boolean {
  return error instanceof ApiException && (error.error.status === 401 || error.error.status === 403);
}

export function isNotExposedError(error: unknown): boolean {
  return error instanceof ApiException && (error.error.status === 404 || error.error.status === 501);
}
