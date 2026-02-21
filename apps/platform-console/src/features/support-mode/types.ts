import type { PagedResponse } from '@/features/tenants/types';

export interface SupportAuditPayload {
  tenantId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  correlationId?: string | null;
  notes?: string | null;
}

export interface TenantAuditEvent {
  occurredAt: string;
  eventType: string;
  actorId?: string | null;
  correlationId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
}

export interface EvidenceBundle {
  bundleId: string;
  type?: string | null;
  createdAt: string;
  status?: string | null;
}

export type TenantAuditPage = PagedResponse<TenantAuditEvent>;
export type EvidenceBundlePage = PagedResponse<EvidenceBundle>;
