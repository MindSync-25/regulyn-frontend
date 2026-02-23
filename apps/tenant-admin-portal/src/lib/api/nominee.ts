/**
 * nominee-service API wrapper (port 8088)
 * Covers: nominees, claims, documents, exports
 *
 * ⚠️  RBAC NOTE: This service uses role strings "ADMIN" and "NOMINEE" which
 *     do NOT match roles.ts constants. The backend enforces access; the frontend
 *     will show actions and let the backend return 403 on unauthorized calls.
 *     "X-User-ID" is automatically set by the http client from auth state.
 */
import { http } from './http';
import { env } from '@/config/env';

const BASE = env.nomineeServiceUrl;

// ─── Types ────────────────────────────────────────────────────────────────────
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXCEPTION' | string;
export type ClaimStatus = 'OPEN' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED' | string;

export interface Nominee {
  nomineeId: string;
  tenantId: string;
  dataPrincipalId: string;
  fullName: string;
  email: string;
  phone: string;
  relationship: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  enabled: boolean;
  createdAt: string;
}

export interface NomineeDocument {
  documentId: string;
  nomineeId: string;
  tenantId: string;
  verificationStep: string;
  artifactRef: string;
  sha256Hash: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  claimId: string | null;
  createdAt: string;
}

export interface Claim {
  claimId: string;
  nomineeId: string;
  status: ClaimStatus;
  type: string;
  details: Record<string, unknown>;
  approvedBy: string | null;
  approvedAt: string | null;
  closedBy: string | null;
  closedAt: string | null;
  closureNotes: string | null;
}

export interface NomineeExport {
  exportId: string;
  nomineeId: string;
  tenantId: string;
  status: string;
  exportRef: string | null;
  createdAt: string;
}

// ─── Nominees ─────────────────────────────────────────────────────────────────
export function getNominee(id: string): Promise<Nominee> {
  return http.get(`/nominees/${id}`, { baseUrl: BASE });
}

export interface VerifyNomineeBody {
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  notes?: string;
}

export function verifyNominee(id: string, body: VerifyNomineeBody): Promise<Nominee> {
  return http.post(`/nominees/${id}/verify`, body, { baseUrl: BASE });
}

export interface RejectNomineeBody {
  rejectionReason: string;
  rejectedAt?: string;
}

export function rejectNominee(id: string, body: RejectNomineeBody): Promise<Nominee> {
  return http.post(`/nominees/${id}/verify/reject`, body, { baseUrl: BASE });
}

export function disableNominee(id: string): Promise<void> {
  return http.delete(`/nominees/${id}`, { baseUrl: BASE });
}

// ─── Claims ───────────────────────────────────────────────────────────────────
export function getClaim(id: string): Promise<Claim> {
  return http.get(`/claims/${id}`, { baseUrl: BASE });
}

export function getClaimsByNominee(nomineeId: string): Promise<Claim[]> {
  return http.get(`/claims/nominee/${nomineeId}`, { baseUrl: BASE });
}

export interface ApproveClaimBody {
  decision: string;
  notes?: string;
}

export function approveClaim(id: string, body: ApproveClaimBody): Promise<Claim> {
  return http.post(`/claims/${id}/approve`, body, { baseUrl: BASE });
}

export interface CloseClaimBody {
  closureNotes?: string;
  includeEvidenceIds?: string[];
}

export function closeClaim(id: string, body: CloseClaimBody): Promise<Claim> {
  return http.post(`/claims/${id}/close`, body, { baseUrl: BASE });
}

export interface TransitionClaimBody {
  toStatus: ClaimStatus;
  reason?: string;
}

export function transitionClaim(id: string, body: TransitionClaimBody): Promise<Claim> {
  return http.post(`/claims/${id}/transition`, body, { baseUrl: BASE });
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export function getExportsByNominee(nomineeId: string): Promise<NomineeExport[]> {
  return http.get(`/exports/nominee/${nomineeId}`, { baseUrl: BASE });
}

export function requestNomineeExport(nomineeId: string): Promise<NomineeExport> {
  return http.post('/exports/nominee', { nomineeId }, { baseUrl: BASE });
}
