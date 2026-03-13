import { http } from './http';
import { env } from '@/config/env';

const BASE = env.dsarServiceUrl;

export interface DsarSummary {
  dsarId: string;
  requestType: string;
  status: string;
  createdAt: string | null;
  dueAt: string | null;
  closedAt: string | null;
  slaBreached: boolean | null;
}

export interface DsarDetail extends DsarSummary {
  dataPrincipalId: string;
  details: Record<string, unknown> | null;
  requiresApproval: boolean | null;
  assignedTo: string | null;
  approvedAt: string | null;
  closeNotes: string | null;
  closeEvidenceBundleId: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateDsarRequest {
  requestType: 'ACCESS' | 'CORRECTION' | 'DELETION' | 'PORTABILITY' | 'NOMINATION';
  details?: Record<string, unknown>;
}

export interface WithdrawDsarRequest {
  reason?: string;
}

export const dsarApi = {
  list: (params: { status?: string; requestType?: string; page?: number; size?: number } = {}): Promise<PageResponse<DsarSummary>> => {
    const search = new URLSearchParams();
    if (params.status) search.set('status', params.status);
    if (params.requestType) search.set('requestType', params.requestType);
    search.set('page', String(params.page ?? 0));
    search.set('size', String(params.size ?? 20));
    return http.get(`/dsar?${search}`, { baseUrl: BASE });
  },

  get: (dsarId: string): Promise<DsarDetail> =>
    http.get(`/dsar/${encodeURIComponent(dsarId)}`, { baseUrl: BASE }),

  create: (request: CreateDsarRequest): Promise<DsarDetail> =>
    http.post('/dsar', request, { baseUrl: BASE }),

  withdraw: (dsarId: string, request?: WithdrawDsarRequest): Promise<{ dsarId: string; status: string }> =>
    http.post(`/dsar/${encodeURIComponent(dsarId)}/transition`, { toStatus: 'WITHDRAWN', reason: request?.reason }, { baseUrl: BASE }),
};
