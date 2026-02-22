/**
 * Evidence API Client
 * Provides typed wrappers for evidence-reporting-service endpoints
 * 
 * NOTE: Evidence service runs on port 8095 (separate from identity service on 8081)
 */

import { useAuthStore } from '@/store/authStore';
import { http } from './http';
import { env } from '@/config/env';

const EVIDENCE_API_BASE = env.evidenceServiceUrl;

/**
 * Evidence-specific HTTP client with auth/tenant injection
 */
async function evidenceRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const authState = useAuthStore.getState();
  const { token, tenantId } = authState;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  // Add auth header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Add tenant header if tenantId exists
  if (tenantId) {
    const headerTenantId = headers.get('X-Tenant-Id');
    const headerTenantIdCompat = headers.get('X-Tenant-ID');
    if (
      (headerTenantId && headerTenantId !== tenantId) ||
      (headerTenantIdCompat && headerTenantIdCompat !== tenantId)
    ) {
      authState.clearAuth();
      window.location.href = '/login?error=tenant_mismatch';
      throw new Error('Tenant header mismatch - forced logout for security');
    }

    headers.set('X-Tenant-Id', tenantId);
    headers.set('X-Tenant-ID', tenantId);
  }

  const response = await fetch(`${EVIDENCE_API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// ============================================================================
// TypeScript Types (matching backend DTOs exactly)
// ============================================================================

export interface EvidenceBundleSummary {
  bundleId: string;
  type: string;
  createdAt: string; // ISO 8601
  status: string;
}

export interface EvidenceBundlePageResponse {
  content: EvidenceBundleSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface BundleItem {
  itemId: string;
  itemType: 'EVIDENCE' | 'ARTIFACT';
  evidenceId: string | null;
  artifactId: string | null;
  itemHash: string;
  itemMeta: Record<string, unknown>;
}

export interface BundleManifestResponse {
  bundleId: string;
  bundleType: string;
  referenceType: string;
  referenceId: string;
  title: string;
  description: string;
  bundleHash: string;
  status: string;
  createdAt: string; // ISO 8601
  createdBy: string;
  items: BundleItem[];
  metadata: Record<string, unknown>;
}

export interface ExportResponse {
  exportId: string;
  status: string;
  downloadPath: string;
  exportHash: string;
}

export interface VerifyResponse {
  bundleId: string;
  valid: boolean;
  problems: string[];
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  actorId: string | null;
  eventType: string;
  correlationId: string | null;
  occurredAt: string; // ISO 8601
  summary: string;
}

export interface AuditPageResponse {
  content: AuditEvent[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ============================================================================
// Evidence Bundle API
// ============================================================================

/**
 * List bundles for authenticated tenant (server-side pagination)
 * Endpoint: GET /admin/tenants/{tenantId}/evidence/bundles
 * Note: tenantId must come from authenticated UI context (e.g. auth store), not user input.
 */
export async function listBundles(params: {
  tenantId: string;
  page?: number;
  size?: number;
}): Promise<EvidenceBundlePageResponse> {
  const { tenantId, page = 0, size = 20 } = params;

  if (!tenantId || tenantId.trim().length === 0) {
    throw new Error('TENANT_CONTEXT_REQUIRED');
  }
  
  return evidenceRequest<EvidenceBundlePageResponse>(
    `/admin/tenants/${tenantId}/evidence/bundles?page=${page}&size=${size}`
  );
}

/**
 * Get bundle manifest by ID
 * Endpoint: GET /bundles/{bundleId}
 */
export async function getBundle(bundleId: string): Promise<BundleManifestResponse> {
  return evidenceRequest<BundleManifestResponse>(`/bundles/${bundleId}`);
}

/**
 * Export bundle as downloadable package
 * Endpoint: POST /bundles/{bundleId}/export
 */
export async function exportBundle(bundleId: string): Promise<ExportResponse> {
  return evidenceRequest<ExportResponse>(`/bundles/${bundleId}/export`, {
    method: 'POST',
  });
}

/**
 * Verify bundle integrity
 * Endpoint: POST /bundles/{bundleId}/verify
 */
export async function verifyBundle(bundleId: string): Promise<VerifyResponse> {
  return evidenceRequest<VerifyResponse>(`/bundles/${bundleId}/verify`, {
    method: 'POST',
  });
}

// ============================================================================
// Audit API
// ============================================================================

/**
 * Get audit timeline for authenticated tenant
 * Endpoint: GET /admin/audit-events
 * Requires: TENANT_ADMIN role (tenant-scoped, uses authenticated context)
 */
export async function getAuditTimeline(params: {
  page?: number;
  size?: number;
  userId?: string;
  eventType?: string;
}): Promise<AuditPageResponse> {
  const { page = 0, size = 20, userId, eventType } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  
  if (userId) queryParams.append('userId', userId);
  if (eventType) queryParams.append('eventType', eventType);
  
  return http.get<AuditPageResponse>(`/admin/audit-events?${queryParams.toString()}`);
}

// ============================================================================
// Artifact API
// ============================================================================

/**
 * TODO: No artifact list endpoint found in backend.
 * Artifacts appear to be accessed only through bundle items.
 * For now, artifacts list page will show message about accessing via bundles.
 * 
 * If backend adds GET /artifacts endpoint later, add wrapper here.
 */

export interface ArtifactListPlaceholder {
  message: string;
  available: boolean;
}

export async function listArtifacts(): Promise<ArtifactListPlaceholder> {
  // Placeholder until backend provides artifacts list endpoint
  return {
    message: 'Artifacts are currently accessible through Evidence Bundles only',
    available: false,
  };
}
