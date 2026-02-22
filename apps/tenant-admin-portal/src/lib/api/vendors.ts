/**
 * Vendor & Data Sharing API wrappers
 * Backend: vendor-sharing-service — port 8090
 *
 * Base URL: env.vendorServiceUrl
 * All requests carry X-Tenant-Id / X-User-Id / Authorization from http.ts
 */

import { http } from './http';
import { env } from '@/config/env';
import type { SpringPage } from './ropa';

// ─── Vendor ───────────────────────────────────────────────────────────────────

export type VendorType = 'PROCESSOR' | 'SUB_PROCESSOR' | 'SERVICE_PROVIDER' | 'PARTNER' | 'OTHER';
export type HostingRegion = 'INDIA' | 'US' | 'EU' | 'OTHER';
export type VendorRiskLevel = 'LOW' | 'MED' | 'HIGH';

export interface VendorItem {
  vendorId: string;
  vendorName: string;
  vendorType: VendorType;
  contactEmail?: string;
  country: string;
  hostingRegion: HostingRegion;
  enabled: boolean;
  riskLevel: VendorRiskLevel;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

// ─── Agreements ───────────────────────────────────────────────────────────────

export type AgreementType = 'DPA' | 'NDA' | 'SLA' | 'CONTRACT' | 'OTHER';
export type AgreementStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'TERMINATED';

export interface AgreementItem {
  agreementId: string;
  vendorId: string;
  agreementType: AgreementType;
  status: AgreementStatus;
  signedAt?: string;
  expiresAt?: string;
  documentRef?: string;
  notes?: string;
  createdAt: string;
}

// ─── Sharing Records ──────────────────────────────────────────────────────────

export type SharingLawfulBasis =
  | 'CONSENT'
  | 'CONTRACT'
  | 'LEGAL_OBLIGATION'
  | 'LEGITIMATE_INTERESTS'
  | 'OTHER';
export type SharingFrequency = 'CONTINUOUS' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ON_REQUEST';
export type SharingStatus = 'ACTIVE' | 'DISABLED';

export interface SharingRecordItem {
  sharingId: string;
  vendorId: string;
  activityId?: string;
  systemId?: string;
  sharingPurpose: string;
  lawfulBasis: SharingLawfulBasis;
  dataCategories?: string[];
  frequency?: SharingFrequency;
  transferCrossBorder?: boolean;
  transferToRegions?: string[];
  transferNotes?: string;
  startAt?: string;
  endAt?: string;
  enabled: boolean;
  metadata?: Record<string, unknown>;
  status?: SharingStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface SharingRecordDetail extends SharingRecordItem {
  /** TODO: verify if backend returns additional nested data in detail endpoint */
  statusHistory?: Array<{ status: string; changedAt: string; reason?: string }>;
}

// ─── Vendor Access Telemetry ──────────────────────────────────────────────────

export interface VendorAccessEvent {
  eventId?: string;
  vendorId?: string;
  subjectRef?: string;
  systemName?: string;
  accessType?: string;
  result?: string;
  correlationId?: string;
  accessedAt: string;
  receivedAt?: string;
  rawRef?: string;
}

export interface VendorAccessEventsPage {
  content: VendorAccessEvent[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface VendorAccessSummary {
  vendorId: string;
  fromAt?: string;
  toAt?: string;
  totalEvents?: number;
  byAccessType?: Array<{ accessType: string; count: number }>;
  byResult?: Array<{ result: string; count: number }>;
  bySystem?: Array<{ systemName: string; count: number }>;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export interface VendorExportResponse {
  exportId: string;
  status?: string;
  createdAt?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

const base = () => env.vendorServiceUrl;

/**
 * GET /vendor/vendors
 * List vendors (backend returns List, not paginated).
 */
export function listVendors(params?: {
  enabled?: boolean;
  riskLevel?: VendorRiskLevel;
  q?: string;
}): Promise<VendorItem[]> {
  const sp = new URLSearchParams();
  if (params?.enabled != null) sp.set('enabled', String(params.enabled));
  if (params?.riskLevel) sp.set('riskLevel', params.riskLevel);
  if (params?.q) sp.set('q', params.q);
  const qs = sp.toString();
  return http.get<VendorItem[]>(`/vendor/vendors${qs ? `?${qs}` : ''}`, { baseUrl: base() });
}

/**
 * GET /vendor/vendors/:vendorId/agreements
 * List agreements for a vendor (backend returns List).
 */
export function listVendorAgreements(vendorId: string): Promise<AgreementItem[]> {
  return http.get<AgreementItem[]>(`/vendor/vendors/${vendorId}/agreements`, { baseUrl: base() });
}

/**
 * GET /vendor/sharing-records
 * List sharing records with pagination (Spring Page).
 */
export function listSharingRecords(params: {
  vendorId?: string;
  activityId?: string;
  systemId?: string;
  enabled?: boolean;
  dataCategory?: string;
  transferCrossBorder?: boolean;
  page?: number;
  size?: number;
}): Promise<SpringPage<SharingRecordItem>> {
  const sp = new URLSearchParams();
  if (params.vendorId) sp.set('vendorId', params.vendorId);
  if (params.activityId) sp.set('activityId', params.activityId);
  if (params.systemId) sp.set('systemId', params.systemId);
  if (params.enabled != null) sp.set('enabled', String(params.enabled));
  if (params.dataCategory) sp.set('dataCategory', params.dataCategory);
  if (params.transferCrossBorder != null) sp.set('transferCrossBorder', String(params.transferCrossBorder));
  sp.set('page', String(params.page ?? 0));
  sp.set('size', String(params.size ?? 20));
  const qs = sp.toString();
  return http.get<SpringPage<SharingRecordItem>>(`/vendor/sharing-records?${qs}`, { baseUrl: base() });
}

/**
 * GET /vendor/sharing-records/:sharingId
 * Get a single sharing record detail.
 */
export function getSharingRecord(sharingId: string): Promise<SharingRecordDetail> {
  return http.get<SharingRecordDetail>(`/vendor/sharing-records/${sharingId}`, { baseUrl: base() });
}

/**
 * GET /vendor/access-events
 * Query vendor access telemetry.
 * REQUIRED: vendorId or subjectRef, from, to (all ISO-8601 strings).
 */
export function queryAccessEvents(params: {
  vendorId?: string;
  subjectRef?: string;
  from: string;
  to: string;
  systemName?: string;
  accessType?: string;
  result?: string;
  page?: number;
  size?: number;
}): Promise<VendorAccessEventsPage> {
  const sp = new URLSearchParams();
  if (params.vendorId) sp.set('vendorId', params.vendorId);
  if (params.subjectRef) sp.set('subjectRef', params.subjectRef);
  sp.set('from', params.from);
  sp.set('to', params.to);
  if (params.systemName) sp.set('systemName', params.systemName);
  if (params.accessType) sp.set('accessType', params.accessType);
  if (params.result) sp.set('result', params.result);
  sp.set('page', String(params.page ?? 0));
  sp.set('size', String(params.size ?? 50));
  return http.get<VendorAccessEventsPage>(`/vendor/access-events?${sp.toString()}`, { baseUrl: base() });
}

/**
 * GET /vendor/access-events/vendors/:vendorId/summary
 * Summary stats for a vendor's access events within a date range.
 * REQUIRED: from, to (ISO-8601 strings).
 * MAX range: 90 days.
 */
export function getVendorAccessSummary(
  vendorId: string,
  params: { from: string; to: string; systemName?: string; accessType?: string; result?: string }
): Promise<VendorAccessSummary> {
  const sp = new URLSearchParams();
  sp.set('from', params.from);
  sp.set('to', params.to);
  if (params.systemName) sp.set('systemName', params.systemName);
  if (params.accessType) sp.set('accessType', params.accessType);
  if (params.result) sp.set('result', params.result);
  return http.get<VendorAccessSummary>(
    `/vendor/access-events/vendors/${vendorId}/summary?${sp.toString()}`,
    { baseUrl: base() }
  );
}

/**
 * POST /vendor/exports/vendor-sharing
 * Trigger a vendor-sharing export.
 * TODO: confirm CreateVendorExportRequest fields.
 */
export function createVendorExport(request: Record<string, unknown>): Promise<VendorExportResponse> {
  return http.post<VendorExportResponse>('/vendor/exports/vendor-sharing', request, { baseUrl: base() });
}

/**
 * Build download URL for vendor export.
 * Use window.open(url) or anchor click to trigger download.
 */
export function buildVendorExportDownloadUrl(exportId: string): string {
  return `${base()}/vendor/exports/${exportId}/download`;
}
