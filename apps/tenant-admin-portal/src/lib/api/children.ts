/**
 * children-guardian-service API wrapper (port 8089)
 * Covers: age rules, children, guardians, consents, e-sign, exports
 *
 * Note: Most endpoints are write-only or action-based. There are no list
 * endpoints for children or consents — all operations use IDs.
 */
import { http } from './http';
import { env } from '@/config/env';

const BASE = env.childrenServiceUrl;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AgeRule {
  ruleId: string;
  tenantId: string;
  countryCode: string;
  stateCode: string | null;
  ageThreshold: number;
  consentModel: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface AgeRuleEffective extends AgeRule {
  resolvedFrom: string;
}

export interface Child {
  childId: string;
  guardianId: string;
  fullName: string;
  dateOfBirth: string;
  regionCountryCode: string;
  majorityDate: string;
  consentDocumentRef: string | null;
  createdAt: string;
}

export interface MajorityCheckResponse {
  childId: string;
  majorityDate: string;
  reached: boolean;
  transitionStatus: string;
  resolvedFrom: string;
  error: string | null;
}

export interface Guardian {
  guardianId: string;
  tenantId: string;
  fullName: string;
  email: string;
  phone: string | null;
  relationship: string;
  verifiedAt: string | null;
  createdAt: string;
}

export interface Consent {
  consentId: string;
  childId: string;
  guardianId: string;
  consentType: number;
  jurisdiction: string | null;
  purposeIds: string[];
  status: string;
  createdAt: string;
}

export interface EsignRequest {
  requestId: string;
  esignRef: string;
  status: string;
  providerUrl: string | null;
}

export interface GuardianConsentExport {
  exportId: string;
  status: string;
  bundleRef: string | null;
  bundleSha256: string | null;
  createdAt: string;
}

// ─── Age Rules ────────────────────────────────────────────────────────────────
export function listAgeRules(): Promise<AgeRule[]> {
  return http.get('/age-rules', { baseUrl: BASE });
}

export interface UpsertAgeRuleRequest {
  /** ISO 3166-1 alpha-2 country code, exactly 2 chars */
  countryCode: string;
  stateCode?: string;
  /** Must be between 13 and 18 */
  ageThreshold: number;
  /** ISO date YYYY-MM-DD */
  effectiveFrom: string;
}

export function upsertAgeRule(body: UpsertAgeRuleRequest): Promise<AgeRule> {
  return http.put('/age-rules', body, { baseUrl: BASE });
}

export function getEffectiveAgeRule(country: string, state?: string): Promise<AgeRuleEffective> {
  const qs = new URLSearchParams({ country });
  if (state) qs.set('state', state);
  return http.get(`/age-rules/effective?${qs.toString()}`, { baseUrl: BASE });
}

// ─── Children ─────────────────────────────────────────────────────────────────
export interface CreateChildRequest {
  fullName: string;
  /** UUID of the guardian */
  guardianId: string;
  /** LocalDate YYYY-MM-DD, must be in the past */
  dateOfBirth: string;
  regionCountryCode: string;
  regionStateCode?: string;
  jurisdiction?: string;
  consentDocumentRef?: string;
  consentDocumentSha256?: string;
  metadata?: Record<string, unknown>;
}

export function createChild(body: CreateChildRequest): Promise<Child> {
  return http.post('/children', body, { baseUrl: BASE });
}

export interface MajorityCheckRequest {
  /** Optional override date for evaluation (LocalDate YYYY-MM-DD) */
  evaluationDate?: string;
}

export function majorityCheck(
  childId: string,
  body?: MajorityCheckRequest
): Promise<MajorityCheckResponse> {
  return http.post(`/children/${childId}/majority-check`, body ?? {}, { baseUrl: BASE });
}

// ─── Guardians ────────────────────────────────────────────────────────────────
export interface CreateGuardianRequest {
  fullName: string;
  email: string;
  phone?: string;
  relationship: string;
  metadata?: Record<string, unknown>;
}

export function createGuardian(body: CreateGuardianRequest): Promise<Guardian> {
  return http.post('/guardians', body, { baseUrl: BASE });
}

export function verifyGuardian(guardianId: string): Promise<Guardian> {
  return http.post(`/guardians/${guardianId}/verify`, {}, { baseUrl: BASE });
}

// ─── Consents ─────────────────────────────────────────────────────────────────
export interface CreateConsentRequest {
  childId: string;
  guardianId: string;
  consentType: number;
  jurisdiction?: string;
  purposeIds?: string[];
}

export function createConsent(body: CreateConsentRequest): Promise<Consent> {
  return http.post('/consents', body, { baseUrl: BASE });
}

export function approveConsent(consentId: string): Promise<Consent> {
  return http.post(`/consents/${consentId}/approve`, {}, { baseUrl: BASE });
}

export function revokeConsent(consentId: string): Promise<Consent> {
  return http.post(`/consents/${consentId}/revoke`, {}, { baseUrl: BASE });
}

export interface CreateEsignRequestBody {
  provider: string;
  guardianEmail: string;
  guardianName: string;
}

export function createEsignRequest(
  consentId: string,
  body: CreateEsignRequestBody,
  idempotencyKey: string
): Promise<EsignRequest> {
  return http.post(`/consents/${consentId}/esign-requests`, body, {
    baseUrl: BASE,
    headers: { 'X-Idempotency-Key': idempotencyKey },
  });
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export function createGuardianConsentExport(
  scope?: Record<string, unknown>
): Promise<GuardianConsentExport> {
  return http.post('/exports/guardian-consents', scope ?? {}, { baseUrl: BASE });
}
