/**
 * DSAR API Client (dsar-grievance-service)
 *
 * Strict rules:
 * - Tenant scoped only from authenticated context (handled by http client)
 * - X-Tenant-Id header cannot be user-edited (enforced in http client)
 * - Do NOT invent endpoints; matches services/dsar-grievance-service controllers.
 */

import { http, type ApiError } from './http';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

// Local dev base URL (documented in dsar-grievance-service README)
// TODO: move to env config if/when frontend introduces per-service base URLs.
const DSAR_API_BASE = 'http://localhost:8084';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface DsarDetailResponse {
  dsarId: string;
  tenantId: string;
  dataPrincipalId: string;
  requestType: string;
  status: string;
  details: Record<string, unknown> | null;
  requiresApproval: boolean | null;
  assignedTo: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  dueAt: string | null;
  closedAt: string | null;
  closeEvidenceBundleId: string | null;
  closeNotes: string | null;
  slaBreached: boolean | null;
}

export interface SearchDsarsParams {
  status?: string;
  requestType?: string;
  dataPrincipalId?: string;
  page?: number;
  size?: number;
}

export async function searchDsars(params: SearchDsarsParams = {}): Promise<PageResponse<DsarDetailResponse>> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.requestType) search.set('requestType', params.requestType);
  if (params.dataPrincipalId) search.set('dataPrincipalId', params.dataPrincipalId);
  search.set('page', String(params.page ?? 0));
  search.set('size', String(params.size ?? 20));

  return http.get<PageResponse<DsarDetailResponse>>(`/dsar?${search.toString()}`, {
    baseUrl: DSAR_API_BASE,
  });
}

export async function getDsar(dsarId: string): Promise<DsarDetailResponse> {
  return http.get<DsarDetailResponse>(`/dsar/${encodeURIComponent(dsarId)}`, {
    baseUrl: DSAR_API_BASE,
  });
}

export interface AssignDsarRequest {
  assignedTo: string;
}
export interface AssignDsarResponse {
  dsarId: string;
  assignedTo: string;
  status: string;
}

export async function assignDsar(dsarId: string, request: AssignDsarRequest): Promise<AssignDsarResponse> {
  return http.post<AssignDsarResponse>(`/dsar/${encodeURIComponent(dsarId)}/assign`, request, {
    baseUrl: DSAR_API_BASE,
  });
}

export interface TransitionDsarRequest {
  toStatus: string;
  reason?: string;
}
export interface TransitionDsarResponse {
  dsarId: string;
  status: string;
}

export async function transitionDsar(dsarId: string, request: TransitionDsarRequest): Promise<TransitionDsarResponse> {
  return http.post<TransitionDsarResponse>(`/dsar/${encodeURIComponent(dsarId)}/transition`, request, {
    baseUrl: DSAR_API_BASE,
  });
}

export interface ApproveDsarRequest {
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}
export interface ApproveDsarResponse {
  dsarId: string;
  approved: boolean;
  status: string;
}

export async function approveDsar(dsarId: string, request: ApproveDsarRequest): Promise<ApproveDsarResponse> {
  return http.post<ApproveDsarResponse>(`/dsar/${encodeURIComponent(dsarId)}/approve`, request, {
    baseUrl: DSAR_API_BASE,
  });
}

export interface CloseDsarRequest {
  closureNotes?: string;
  includeEvidenceIds?: string[];
}
export interface CloseDsarResponse {
  dsarId: string;
  status: string;
  evidenceBundleId: string | null;
}

export async function closeDsar(dsarId: string, request: CloseDsarRequest, idempotencyKey?: string): Promise<CloseDsarResponse> {
  return http.post<CloseDsarResponse>(`/dsar/${encodeURIComponent(dsarId)}/close`, request, {
    baseUrl: DSAR_API_BASE,
    headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined,
  });
}

// Attachments
export interface AttachmentResponse {
  attachmentId: string;
  dsarId: string;
  type: string;
  version: number;
  filename: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  sha256: string | null;
  artifactRef: string | null;
  referenceHash: string | null;
  recordedEvidenceArtifactRef: string | null;
  createdAt: string | null;
  createdBy: string | null;
}

export interface AttachmentReferenceRequest {
  referenceValue: string;
  referenceHash?: string;
  filename?: string;
  contentType?: string;
}

export async function listDsarAttachments(dsarId: string): Promise<AttachmentResponse[]> {
  return http.get<AttachmentResponse[]>(`/dsar/${encodeURIComponent(dsarId)}/attachments`, {
    baseUrl: DSAR_API_BASE,
  });
}

export async function referenceDsarAttachment(
  dsarId: string,
  request: AttachmentReferenceRequest,
  idempotencyKey?: string
): Promise<AttachmentResponse> {
  return http.post<AttachmentResponse>(`/dsar/${encodeURIComponent(dsarId)}/attachments/reference`, request, {
    baseUrl: DSAR_API_BASE,
    headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined,
  });
}

/**
 * Upload DSAR attachment (multipart/form-data)
 * Uses fetch directly since the shared http client is JSON-centric.
 */
export async function uploadDsarAttachment(
  dsarId: string,
  file: File,
  idempotencyKey?: string
): Promise<AttachmentResponse> {
  const authState = useAuthStore.getState();
  const { token, tenantId } = authState;

  const url = `${DSAR_API_BASE}/dsar/${encodeURIComponent(dsarId)}/attachments/upload`;

  const form = new FormData();
  form.append('file', file);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-Id'] = tenantId;
  if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;

  // SECURITY GUARD: prevent tenant header mismatch (mirrors shared http client behavior)
  const headerTenantId = headers['X-Tenant-Id'];
  const authTenantId = authState.tenantId;
  if (authTenantId && headerTenantId && headerTenantId !== authTenantId) {
    console.error('[dsar] SECURITY VIOLATION: X-Tenant-Id mismatch', {
      authTenant: authTenantId,
      headerTenant: headerTenantId,
    });
    authState.clearAuth();
    window.location.href = '/login?error=tenant_mismatch';
    throw new Error('Tenant header mismatch - forced logout for security');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: form,
  });

  // Mirror global handling semantics as closely as practical
  if (response.status === 401) {
    const currentToken = useAuthStore.getState().token;
    if (currentToken) {
      toast.error('Session expired. Please log in again.');
      useAuthStore.getState().clearAuth();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    throw { status: 401, message: 'Authentication required. Please log in.' } satisfies ApiError;
  }

  if (response.status === 403) {
    toast.error('Access denied. You do not have permission to perform this action.');
    throw { status: 403, message: 'Forbidden' } satisfies ApiError;
  }

  let payload: unknown = undefined;
  try {
    payload = await response.json();
  } catch {
    // ignore
  }

  if (!response.ok) {
    const message =
      (payload as any)?.message ||
      (payload as any)?.error ||
      `Request failed with status ${response.status}.`;

    if (response.status === 409) toast.error(message);
    if (response.status === 422) toast.error(message);
    if (response.status >= 500) toast.error('Server error. Please try again later.');

    throw { status: response.status, message } satisfies ApiError;
  }

  return payload as AttachmentResponse;
}

export const DSAR_SERVICE_INFO = {
  baseUrl: DSAR_API_BASE,
  docsUrl: `${env.apiBaseUrl}`,
};
