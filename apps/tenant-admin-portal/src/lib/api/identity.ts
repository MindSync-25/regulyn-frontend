/**
 * Identity & Org API Client
 * Tenant-scoped endpoints for users, API keys, feature flags, and plan limits
 */

import { http } from './http';

// ===== TYPE DEFINITIONS =====

export interface User {
  userId: string;
  tenantId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  enabled: boolean;
  roles: string[];
  lockedAt: string | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateUserResponse {
  userId: string;
  tenantId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  enabled: boolean;
}

// Invites
export interface CreateInviteRequest {
  email: string;
  roles: string[];
  expiresInMinutes?: number;
}

export interface InviteResponse {
  inviteId: string;
  tenantId: string;
  email: string;
  roles: string[];
  expiresAt: string;
  token: string; // Shown once
}

export interface LockUserRequest {
  reason?: string;
}

export interface UnlockUserRequest {
  reason?: string;
}

export interface LockUserResponse {
  userId: string;
  locked: boolean;
  reason?: string;
}

export interface UnlockUserResponse {
  userId: string;
  locked: boolean;
}

// API Keys
export interface ApiKey {
  apiKeyId: string;
  tenantId: string;
  keyName: string;
  prefix: string;
  enabled: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface ApiKeyListItem {
  apiKeyId: string;
  keyName: string;
  prefix: string | null;
  enabled: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string | null;
  keyVersion: number;
}

export interface ApiKeyCreateRequest {
  keyName: string;
  expiresAt?: string;
}

export interface ApiKeyCreateResponse {
  apiKeyId: string;
  tenantId: string;
  keyName: string;
  prefix: string;
  expiresAt: string | null;
  apiKey: string; // Full key shown once
}

export interface ApiKeyRotateResponse {
  apiKeyId: string;
  tenantId: string;
  keyName: string;
  prefix: string;
  expiresAt: string | null;
  apiKey: string; // New key shown once
}

export interface ApiKeyRevokeRequest {
  reason?: string;
}

export interface ApiKeyRevokeResponse {
  apiKeyId: string;
  revoked: boolean;
  revokedAt: string;
}

// Feature Flags
export interface FeatureFlag {
  flagKey: string;
  enabled: boolean;
  value: unknown;
}

export interface FeatureFlagRequest {
  enabled: boolean;
  value?: unknown;
}

// Plan Limits
export interface PlanLimits {
  maxUsers: number;
  dsarPerMonth: number;
  exportsPerMonth: number;
  yearMonth: number;
  dsarCount: number;
  exportCount: number;
  enabledUsers: number;
  readOnly: boolean;
  readOnlyReason: string | null;
}

export interface PlanLimitsRequest {
  maxUsers: number;
  dsarPerMonth: number;
  exportsPerMonth: number;
}

// Audit Events
export interface AuditEvent {
  eventId: string;
  tenantId: string;
  occurredAt: string;
  actorId: string | null;
  actorType: string | null;
  service: string | null;
  action: string | null;
  entityType: string | null;
  entityId: string | null;
  payloadHash: string | null;
  evidenceId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditPageResponse {
  items: AuditEvent[];
  page: number;
  size: number;
  total: number;
}

// ===== API FUNCTIONS =====

// Users
export async function getUsers(emailFilter?: string): Promise<User[]> {
  const params = emailFilter ? `?email=${encodeURIComponent(emailFilter)}` : '';
  return http.get<User[]>(`/users${params}`);
}

export async function createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
  return http.post<CreateUserResponse>('/users', request);
}

export async function inviteUser(request: CreateInviteRequest, idempotencyKey?: string): Promise<InviteResponse> {
  return http.post<InviteResponse>('/users/invites', request, {
    headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined,
  });
}

export async function lockUser(userId: string, request?: LockUserRequest): Promise<LockUserResponse> {
  return http.post<LockUserResponse>(`/users/${userId}/lock`, request || {});
}

export async function unlockUser(userId: string, request?: UnlockUserRequest): Promise<UnlockUserResponse> {
  return http.post<UnlockUserResponse>(`/users/${userId}/unlock`, request || {});
}

// API Keys
export async function getApiKeys(): Promise<ApiKeyListItem[]> {
  return http.get<ApiKeyListItem[]>('/api-keys');
}

export async function assignRoles(userId: string, roles: string[]): Promise<void> {
  return http.post<void>(`/users/${userId}/roles`, { roles });
}

export async function createApiKey(request: ApiKeyCreateRequest, idempotencyKey?: string): Promise<ApiKeyCreateResponse> {
  return http.post<ApiKeyCreateResponse>('/api-keys', request, {
    headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined,
  });
}

export async function rotateApiKey(apiKeyId: string, request: ApiKeyCreateRequest, idempotencyKey?: string): Promise<ApiKeyRotateResponse> {
  return http.post<ApiKeyRotateResponse>(`/api-keys/${apiKeyId}/rotate`, request, {
    headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined,
  });
}

export async function revokeApiKey(apiKeyId: string, request?: ApiKeyRevokeRequest): Promise<ApiKeyRevokeResponse> {
  return http.post<ApiKeyRevokeResponse>(`/api-keys/${apiKeyId}/revoke`, request || {});
}

// Feature Flags
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  return http.get<FeatureFlag[]>('/tenants/feature-flags');
}

export async function upsertFeatureFlag(flagKey: string, request: FeatureFlagRequest): Promise<FeatureFlag> {
  return http.put<FeatureFlag>(`/tenants/feature-flags/${flagKey}`, request);
}

// Plan Limits
export async function getPlanLimits(): Promise<PlanLimits> {
  return http.get<PlanLimits>('/tenants/plan-limits');
}

export async function updatePlanLimits(request: PlanLimitsRequest): Promise<PlanLimits> {
  return http.put<PlanLimits>('/tenants/plan-limits', request);
}

// Audit Events
export interface GetAuditEventsParams {
  userId?: string;
  eventType?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export async function getAuditEvents(params: GetAuditEventsParams = {}): Promise<AuditPageResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.userId) searchParams.set('userId', params.userId);
  if (params.eventType) searchParams.set('eventType', params.eventType);
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  searchParams.set('page', String(params.page ?? 0));
  searchParams.set('size', String(params.size ?? 50));

  const url = `/admin/audit-events?${searchParams.toString()}`;
  return http.get<AuditPageResponse>(url);
}
