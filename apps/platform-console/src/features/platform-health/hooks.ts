import { useQuery } from '@tanstack/react-query';
import { ApiException } from '@/api/errors';
import { getPlatformHealthSummary, getTenantHealth, listTenantHealth } from './api';

export function usePlatformHealthSummaryQuery() {
  return useQuery({
    queryKey: ['platformHealthSummary'],
    queryFn: getPlatformHealthSummary,
  });
}

export function useTenantHealthListQuery(params: { page: number; size: number }) {
  return useQuery({
    queryKey: ['platformHealthTenants', params.page, params.size],
    queryFn: () => listTenantHealth(params),
  });
}

export function useTenantHealthDetailQuery(tenantId: string) {
  return useQuery({
    queryKey: ['platformHealthTenant', tenantId],
    queryFn: () => getTenantHealth(tenantId),
    enabled: !!tenantId,
  });
}

export function isAuthError(error: unknown): boolean {
  return error instanceof ApiException && (error.error.status === 401 || error.error.status === 403);
}

export function isNotExposedError(error: unknown): boolean {
  return error instanceof ApiException && (error.error.status === 404 || error.error.status === 501);
}
