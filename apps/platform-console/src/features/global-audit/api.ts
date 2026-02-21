import { apiClient } from '@/api/client';
import { useAuthStore } from '@/auth/authStore';
import type { AuditEvent, PagedResponse } from './types';

export interface AuditSearchParams {
  page: number;
  size: number;
  tenantId?: string;
  actorId?: string;
  eventType?: string;
  correlationId?: string;
  from?: string;
  to?: string;
}

export async function searchAuditEvents(params: AuditSearchParams): Promise<PagedResponse<AuditEvent>> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token');

  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    size: params.size.toString(),
  });

  if (params.tenantId) queryParams.append('tenantId', params.tenantId);
  if (params.actorId) queryParams.append('actorId', params.actorId);
  if (params.eventType) queryParams.append('eventType', params.eventType);
  if (params.correlationId) queryParams.append('correlationId', params.correlationId);
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);

  return apiClient.get<PagedResponse<AuditEvent>>(
    `/admin/platform/audit/events?${queryParams.toString()}`,
    { token }
  );
}
