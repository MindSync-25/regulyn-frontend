/**
 * ROPA (Records of Processing Activities) API wrappers
 * Backend: ropa-inventory-service — port 8085
 *
 * Base URL: env.ropaServiceUrl
 * All requests carry X-Tenant-Id and Authorization from http.ts
 */

import { http } from './http';
import { env } from '@/config/env';

// ─── Shared page envelope ─────────────────────────────────────────────────────

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // current page (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
}

// ─── ROPA Activity (matches RopaActivityVersion entity) ───────────────────────

export type ActivityStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';
export type LawfulBasis =
  | 'CONSENT'
  | 'CONTRACT'
  | 'LEGAL_OBLIGATION'
  | 'VITAL_INTERESTS'
  | 'PUBLIC_TASK'
  | 'LEGITIMATE_INTERESTS'
  | 'OTHER';
export type DataPrincipalType = 'CUSTOMER' | 'EMPLOYEE' | 'VENDOR' | 'CHILD' | 'OTHER';
export type RiskLevel = 'LOW' | 'MED' | 'HIGH';

export interface RopaActivity {
  versionId: string;
  tenantId: string;
  activityId: string;
  versionNumber: number;
  status: ActivityStatus;
  activityName: string;
  purpose: string;
  lawfulBasis: LawfulBasis;
  dataPrincipalType: DataPrincipalType;
  description?: string;
  retentionPolicy?: string;
  retentionDays?: number;
  riskLevel: RiskLevel;
  enabled: boolean;
  metadata?: Record<string, unknown>;
  publishedAt?: string;
  createdAt: string;
}

/** GET /activities/:id returns Map<String,Object> – use loose type */
export type RopaActivityDetail = Record<string, unknown>;

// ─── Systems ──────────────────────────────────────────────────────────────────

export type SystemType =
  | 'APPLICATION'
  | 'DATABASE'
  | 'API'
  | 'FILE_SYSTEM'
  | 'EXTERNAL_SERVICE'
  | 'OTHER';
export type SystemCriticality = 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
export type SystemStatus = 'ACTIVE' | 'DISABLED';

export interface RopaSystem {
  systemId: string;
  tenantId: string;
  systemName: string;
  type?: SystemType;
  criticality?: SystemCriticality;
  status?: SystemStatus;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

// ─── Data Categories ──────────────────────────────────────────────────────────

export interface RopaDataCategory {
  categoryId: string;
  tenantId: string;
  categoryName: string;
  sensitivity?: string;
  description?: string;
  createdAt: string;
}

// ─── Cross-Border Transfers ───────────────────────────────────────────────────

export interface CrossBorderTransfer {
  transferId?: string;
  tenantId?: string;
  sourceRegion?: string;
  destinationRegion?: string;
  vendorId?: string;
  systemId?: string;
  activityId?: string;
  transferMechanism?: string;
  transferFrequency?: string;
  active?: boolean;
  dataCategories?: Array<{ categoryId: string; categoryName?: string }>;
  purposeVersions?: Array<{ purposeVersionId: string }>;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export interface CreateRopaExportRequest {
  /** TODO: confirm exact DTO fields from CreateRopaExportRequest.java */
  format?: 'CSV' | 'XLSX' | 'JSON';
  activityIds?: string[];
}

export interface RopaExportResponse {
  exportId: string;
  status?: string;
  createdAt?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

const base = () => env.ropaServiceUrl;

/**
 * GET /activities
 * List ROPA activities with server-side pagination and filters.
 */
export function listActivities(params: {
  status?: ActivityStatus;
  riskLevel?: RiskLevel;
  lawfulBasis?: LawfulBasis;
  q?: string;
  systemId?: string;
  dataCategoryId?: string;
  page?: number;
  size?: number;
}): Promise<SpringPage<RopaActivity>> {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.riskLevel) sp.set('riskLevel', params.riskLevel);
  if (params.lawfulBasis) sp.set('lawfulBasis', params.lawfulBasis);
  if (params.q) sp.set('q', params.q);
  if (params.systemId) sp.set('systemId', params.systemId);
  if (params.dataCategoryId) sp.set('dataCategoryId', params.dataCategoryId);
  sp.set('page', String(params.page ?? 0));
  sp.set('size', String(params.size ?? 20));
  const qs = sp.toString();
  return http.get<SpringPage<RopaActivity>>(`/activities${qs ? `?${qs}` : ''}`, {
    baseUrl: base(),
  });
}

/**
 * GET /activities/:activityId
 * Get full activity detail (Map<String,Object> on backend).
 */
export function getActivity(activityId: string): Promise<RopaActivityDetail> {
  return http.get<RopaActivityDetail>(`/activities/${activityId}`, { baseUrl: base() });
}

/**
 * GET /systems
 * List systems (no pagination on backend – returns List).
 */
export function listSystems(params?: {
  type?: SystemType;
  criticality?: SystemCriticality;
  q?: string;
}): Promise<RopaSystem[]> {
  const sp = new URLSearchParams();
  if (params?.type) sp.set('type', params.type);
  if (params?.criticality) sp.set('criticality', params.criticality);
  if (params?.q) sp.set('q', params.q);
  const qs = sp.toString();
  return http.get<RopaSystem[]>(`/systems${qs ? `?${qs}` : ''}`, { baseUrl: base() });
}

/**
 * GET /data-categories
 * List data categories (no pagination on backend – returns List).
 */
export function listDataCategories(): Promise<RopaDataCategory[]> {
  return http.get<RopaDataCategory[]>('/data-categories', { baseUrl: base() });
}

/**
 * POST /exports/ropa
 * Trigger a ROPA export job.
 */
export function createRopaExport(request: CreateRopaExportRequest): Promise<RopaExportResponse> {
  return http.post<RopaExportResponse>('/exports/ropa', request, { baseUrl: base() });
}

/**
 * GET /ropa/exports/:exportId/download
 * Returns raw bytes – caller handles as blob/download.
 * NOTE: Use window.open or fetch-blob pattern; this returns string URL.
 */
export function buildRopaExportDownloadUrl(exportId: string): string {
  return `${base()}/ropa/exports/${exportId}/download`;
}

/**
 * GET /cross-border/transfers
 * List cross-border transfers with optional filters.
 */
export function listCrossBorderTransfers(params?: {
  vendorId?: string;
  systemId?: string;
  activityId?: string;
  sourceRegion?: string;
  destinationRegion?: string;
  activeOnly?: boolean;
}): Promise<CrossBorderTransfer[]> {
  const sp = new URLSearchParams();
  if (params?.vendorId) sp.set('vendorId', params.vendorId);
  if (params?.systemId) sp.set('systemId', params.systemId);
  if (params?.activityId) sp.set('activityId', params.activityId);
  if (params?.sourceRegion) sp.set('sourceRegion', params.sourceRegion);
  if (params?.destinationRegion) sp.set('destinationRegion', params.destinationRegion);
  if (params?.activeOnly != null) sp.set('activeOnly', String(params.activeOnly));
  const qs = sp.toString();
  return http.get<CrossBorderTransfer[]>(`/cross-border/transfers${qs ? `?${qs}` : ''}`, {
    baseUrl: base(),
  });
}
