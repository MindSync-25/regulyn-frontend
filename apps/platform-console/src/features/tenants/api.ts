import { apiClient } from '@/api/client';
import { useAuthStore } from '@/auth/authStore';
import type { ListTenantsParams, PagedResponse, TenantDetail, TenantSummary } from './types';

export async function listTenants(params: ListTenantsParams): Promise<PagedResponse<TenantSummary>> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token');

  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    size: params.size.toString(),
  });

  // Only add status if not "ALL"
  if (params.status && params.status !== 'ALL') {
    queryParams.append('status', params.status);
  }

  const response = await apiClient.get<PagedResponse<TenantSummary>>(
    `/admin/platform/tenants?${queryParams.toString()}`,
    { token }
  );

  return response;
}

export async function getTenant(tenantId: string): Promise<TenantDetail> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token');

  return apiClient.get<TenantDetail>(
    `/admin/platform/tenants/${tenantId}`,
    { token }
  );
}

export async function activateTenant(tenantId: string): Promise<void> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token');

  await apiClient.post(
    `/admin/platform/tenants/${tenantId}/activate`,
    undefined,
    { token }
  );
}

export async function suspendTenant(tenantId: string): Promise<void> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token');

  await apiClient.post(
    `/admin/platform/tenants/${tenantId}/suspend`,
    undefined,
    { token }
  );
}

export async function resumeTenant(tenantId: string): Promise<void> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token');

  await apiClient.post(
    `/admin/platform/tenants/${tenantId}/resume`,
    undefined,
    { token }
  );
}
