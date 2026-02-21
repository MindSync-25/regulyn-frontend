import { apiClient } from '@/api/client';
import { useAuthStore } from '@/auth/authStore';
import type { PagedResponse, PlatformHealthSummary, TenantHealthSummary } from './types';

export async function getPlatformHealthSummary(): Promise<PlatformHealthSummary> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token');

  return apiClient.get<PlatformHealthSummary>('/admin/platform/health/summary', { token });
}

export async function listTenantHealth(params: {
  page: number;
  size: number;
}): Promise<PagedResponse<TenantHealthSummary>> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token');

  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    size: params.size.toString(),
  });

  return apiClient.get<PagedResponse<TenantHealthSummary>>(
    `/admin/platform/health/tenants?${queryParams.toString()}`,
    { token }
  );
}

export async function getTenantHealth(tenantId: string): Promise<TenantHealthSummary> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token');

  return apiClient.get<TenantHealthSummary>(`/admin/platform/health/tenants/${tenantId}`, { token });
}
