/**
 * Retention + Deletion API Client (retention-deletion-service)
 *
 * Strict rules:
 * - Tenant scoped only from authenticated context (handled by http client)
 * - X-Tenant-Id header cannot be user-edited (enforced in http client)
 * - Do NOT invent endpoints; mirrors services/retention-deletion-service controllers.
 */

import { http, type ApiError } from './http';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

// Local dev base URL (from retention-deletion-service application.yml)
// TODO: move to env config if/when frontend introduces per-service base URLs.
const RETENTION_API_BASE = 'http://localhost:8086';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

function generateIdempotencyKey(): string {
  // crypto.randomUUID is available in modern browsers.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function requireIdempotencyKey(idempotencyKey?: string): string {
  return idempotencyKey?.trim() || generateIdempotencyKey();
}

// ============================================================================
// Retention Rules
// ============================================================================

export interface CreateRetentionRuleRequest {
  ruleName: string;
  subjectType: string;
  entityType: string;
  retentionDays: number;
  action: string;
  enabled?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface RetentionRuleResponse {
  ruleId: string;
  enabled: boolean;
}

export async function listRetentionRules(): Promise<RetentionRuleResponse[]> {
  return http.get<RetentionRuleResponse[]>('/retention/rules', { baseUrl: RETENTION_API_BASE });
}

export async function createRetentionRule(request: CreateRetentionRuleRequest): Promise<RetentionRuleResponse> {
  return http.post<RetentionRuleResponse>('/retention/rules', request, { baseUrl: RETENTION_API_BASE });
}

export async function disableRetentionRule(ruleId: string): Promise<void> {
  return http.post<void>(`/retention/rules/${encodeURIComponent(ruleId)}/disable`, undefined, {
    baseUrl: RETENTION_API_BASE,
  });
}

// ============================================================================
// Deletion Requests
// ============================================================================

export interface DeletionDetailResponse {
  deletionId: string;
  subjectId: string;
  subjectType: string;
  entityType: string;
  status: string;
  source: string;
  reason: string | null;
  requiresApproval: boolean | null;
  proofRequired: boolean | null;
  assignedTo: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  dueAt: string | null;
  closedAt: string | null;
  evidenceBundleId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface SearchDeletionsParams {
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export async function searchDeletions(params: SearchDeletionsParams = {}): Promise<PageResponse<DeletionDetailResponse>> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 20));
  if (params.sort) query.set('sort', params.sort);

  return http.get<PageResponse<DeletionDetailResponse>>(`/deletions?${query.toString()}`, {
    baseUrl: RETENTION_API_BASE,
  });
}

export async function getDeletion(deletionId: string): Promise<DeletionDetailResponse> {
  return http.get<DeletionDetailResponse>(`/deletions/${encodeURIComponent(deletionId)}`, {
    baseUrl: RETENTION_API_BASE,
  });
}

export interface CreateDeletionRequest {
  subjectId: string;
  subjectType: string;
  entityType: string;
  reason?: string;
  source: string;
  requiresApproval?: boolean;
  proofRequired?: boolean;
  dueInDays?: number;
  metadata?: Record<string, unknown> | null;
}

export interface CreateDeletionResponse {
  deletionId: string;
  status: string;
  dueAt: string | null;
}

export async function createDeletion(request: CreateDeletionRequest, idempotencyKey?: string): Promise<CreateDeletionResponse> {
  const key = requireIdempotencyKey(idempotencyKey);
  return http.post<CreateDeletionResponse>('/deletions', request, {
    baseUrl: RETENTION_API_BASE,
    headers: { 'X-Idempotency-Key': key },
  });
}

export interface AssignDeletionRequest {
  assignedTo: string;
}

export interface AssignDeletionResponse {
  deletionId: string;
  status: string;
  assignedTo: string;
}

export async function assignDeletion(deletionId: string, request: AssignDeletionRequest): Promise<AssignDeletionResponse> {
  return http.post<AssignDeletionResponse>(`/deletions/${encodeURIComponent(deletionId)}/assign`, request, {
    baseUrl: RETENTION_API_BASE,
  });
}

export interface ApproveDeletionRequest {
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface ApproveDeletionResponse {
  deletionId: string;
  status: string;
}

export async function approveDeletion(deletionId: string, request: ApproveDeletionRequest): Promise<ApproveDeletionResponse> {
  return http.post<ApproveDeletionResponse>(`/deletions/${encodeURIComponent(deletionId)}/approve`, request, {
    baseUrl: RETENTION_API_BASE,
  });
}

export interface TransitionDeletionRequest {
  toStatus: string;
  reason?: string;
}

export interface TransitionDeletionResponse {
  deletionId: string;
  status: string;
}

export async function transitionDeletion(deletionId: string, request: TransitionDeletionRequest): Promise<TransitionDeletionResponse> {
  return http.post<TransitionDeletionResponse>(`/deletions/${encodeURIComponent(deletionId)}/transition`, request, {
    baseUrl: RETENTION_API_BASE,
  });
}

export interface CloseDeletionRequest {
  closureNotes?: string;
}

export interface CloseDeletionResponse {
  deletionId: string;
  status: string;
  evidenceBundleId: string | null;
}

export async function closeDeletion(deletionId: string, request: CloseDeletionRequest): Promise<CloseDeletionResponse> {
  return http.post<CloseDeletionResponse>(`/deletions/${encodeURIComponent(deletionId)}/close`, request, {
    baseUrl: RETENTION_API_BASE,
  });
}

export interface UploadProofResponse {
  proofId: string;
  artifactHash: string;
  artifactRef: string;
}

/**
 * Upload deletion proof (multipart/form-data)
 * Endpoint: POST /deletions/{deletionId}/proofs
 */
export async function uploadDeletionProof(deletionId: string, file: File): Promise<UploadProofResponse> {
  const authState = useAuthStore.getState();
  const { token, tenantId, userId } = authState;

  const url = `${RETENTION_API_BASE}/deletions/${encodeURIComponent(deletionId)}/proofs`;

  const form = new FormData();
  form.append('file', file);

  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (tenantId) {
    headers.set('X-Tenant-Id', tenantId);
    headers.set('X-Tenant-ID', tenantId);
  }
  if (userId) {
    headers.set('X-User-Id', userId);
    headers.set('X-User-ID', userId);
  }

  // SECURITY GUARD: prevent tenant header mismatch (mirrors shared http client behavior)
  const headerTenantId = headers.get('X-Tenant-Id');
  const headerTenantIdCompat = headers.get('X-Tenant-ID');
  const authTenantId = authState.tenantId;
  if (
    authTenantId &&
    ((headerTenantId && headerTenantId !== authTenantId) ||
      (headerTenantIdCompat && headerTenantIdCompat !== authTenantId))
  ) {
    console.error('[retention] SECURITY VIOLATION: X-Tenant-Id mismatch', {
      authTenant: authTenantId,
      headerTenant: headerTenantId,
      headerTenantCompat: headerTenantIdCompat,
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
    const message = (payload as any)?.message || (payload as any)?.error || `Request failed with status ${response.status}.`;

    if (response.status === 409) toast.error(message);
    if (response.status === 422) toast.error(message);
    if (response.status >= 500) toast.error('Server error. Please try again later.');

    throw { status: response.status, message } satisfies ApiError;
  }

  return payload as UploadProofResponse;
}

// ============================================================================
// Cascade execution
// ============================================================================

export interface CascadeSystemExecutionResponse {
  systemKey: string;
  subjectRef: string;
  status: string;
  attemptCount: number | null;
  externalJobRef: string | null;
}

export interface CascadeExecuteResponse {
  deletionId: string;
  planId: string;
  planVersion: number | null;
  planHash: string | null;
  systems: CascadeSystemExecutionResponse[];
}

export async function cascadeExecute(deletionId: string, idempotencyKey?: string): Promise<CascadeExecuteResponse> {
  const key = requireIdempotencyKey(idempotencyKey);
  return http.post<CascadeExecuteResponse>(`/deletions/${encodeURIComponent(deletionId)}/cascade-execute`, undefined, {
    baseUrl: RETENTION_API_BASE,
    headers: { 'X-Idempotency-Key': key },
  });
}

export const RETENTION_SERVICE_INFO = {
  baseUrl: RETENTION_API_BASE,
  note: 'Local dev base URL; production may differ depending on gateway deployment.',
};
