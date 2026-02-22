import { http } from '@/lib/api/http';
import { env } from '@/config/env';

const CONSENT_API_BASE = env.consentServiceUrl;

// ============================================================================
// Types (mirror backend DTOs)
// ============================================================================

export type CommunicationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP';

export interface ActiveNoticeResponse {
  noticeId: string;
  versionId: string;
  versionNumber: number;
  purpose: string;
  language: string;
  content: string;
  contentHash: string;
  publishedAt: string;
}

export interface ActiveDualNoticeResponse {
  noticeId: string;
  versionId: string;
  versionNumber: number;
  purpose: string;
  region: string;
  english: {
    language: string;
    languageTextId: string;
    content: string;
    contentHash: string;
  };
  regional: {
    language: string;
    languageTextId: string;
    content: string;
    contentHash: string;
  };
  publishedAt: string;
}

export interface CreateNoticeRequest {
  purpose: string;
  title: string;
  category: string;
  defaultLanguage: string;
}

export interface CreateNoticeResponse {
  noticeId: string;
}

export interface CreateVersionRequest {
  changeSummary: string;
}

export interface CreateVersionResponse {
  versionId: string;
  versionNumber: number;
}

export interface AddLanguageRequest {
  language: string;
  content: string;
}

export interface AddLanguageResponse {
  languageId: string;
  contentHash: string;
}

export interface PurposeScopeDto {
  dataCategories: string[] | null;
  dataFields: string[] | null;
  recipients: string[] | null;
  legalBasis: string | null;
  retentionDays: number | null;
  processingActivities: string[] | null;
  extensions: Record<string, unknown> | null;
}

export interface PublishVersionRequest {
  purposeScope: PurposeScopeDto;
}

export interface PublishVersionResponse {
  published: boolean;
  publishedAt: string;
}

export interface ActivePurposeVersionResponse {
  purposeVersionId: string;
  versionNum: number;
  scopeHash: string;
  noticeVersionId: string;
  publishedAt: string;
}

export interface PurposeVersionListItem {
  purposeVersionId: string;
  purposeKey: string;
  versionNum: number;
  scopeHash: string;
  legalBasis: string | null;
  retentionDays: number | null;
  dataCategories: string[];
  dataFields: string[];
  processingActivities: string[];
  noticeId: string;
  noticeVersionId: string | null;
  createdAt: string;
}

export interface NoticeListItem {
  noticeId: string;
  purpose: string;
  title: string;
  category: string;
  defaultLanguage: string;
  createdAt: string;
  /** Status of the most recent version: DRAFT | PUBLISHED | RETIRED | null (no version yet) */
  latestVersionStatus: string | null;
  latestVersionId: string | null;
  latestVersionNumber: number | null;
}

export interface ConsentReceiptDto {
  receiptId: string;
  dataPrincipalId: string;
  purpose: string;
  source: string;
  status: string;
  noticeId: string;
  versionId: string;
  versionNumber: number;
  language: string;
  contentHash: string;
  receiptHash: string;
  clientRef: string | null;
  grantedAt: string;
  withdrawnAt: string | null;
}

export interface CommunicationConsentStatusResponse {
  tenantId: string;
  dataPrincipalId: string;
  channel: string;
  state: string;
  effectiveAt: string;
  ledgerId: string;
  consentTextHashSha256: string | null;
}

export interface CommunicationConsentBatchRequest {
  channel: string;
  recipients: Array<{ dataPrincipalId: string }>;
}

export interface CommunicationConsentBatchResult {
  dataPrincipalId: string;
  state: string;
  allowed: boolean;
  reason: string | null;
  ledgerId: string | null;
  effectiveAt: string | null;
}

export interface CommunicationConsentBatchResponse {
  channel: string;
  failClosed: boolean;
  results: CommunicationConsentBatchResult[];
}

// ============================================================================
// Endpoints (consent-service)
// ============================================================================

export function listNotices() {
  return http.get<NoticeListItem[]>(`/api/v2/consent/notices`, {
    baseUrl: CONSENT_API_BASE,
  });
}

export function getActiveNotice(params: { purpose: string; language?: string }) {
  const query = new URLSearchParams({
    purpose: params.purpose,
    language: params.language ?? 'en',
  });

  return http.get<ActiveNoticeResponse>(`/api/v2/consent/notices/active?${query.toString()}`, {
    baseUrl: CONSENT_API_BASE,
  });
}

export function getActiveNoticeDual(params: { purpose: string; region: string }) {
  const query = new URLSearchParams({
    purpose: params.purpose,
    region: params.region,
  });

  return http.get<ActiveDualNoticeResponse>(
    `/api/v2/consent/notices/active-dual?${query.toString()}`,
    {
      baseUrl: CONSENT_API_BASE,
    }
  );
}

export function createNotice(request: CreateNoticeRequest) {
  return http.post<CreateNoticeResponse>(`/api/v2/consent/notices`, request, {
    baseUrl: CONSENT_API_BASE,
  });
}

export function createNoticeVersion(params: { noticeId: string; request: CreateVersionRequest }) {
  return http.post<CreateVersionResponse>(
    `/api/v2/consent/notices/${params.noticeId}/versions`,
    params.request,
    { baseUrl: CONSENT_API_BASE }
  );
}

export function addNoticeVersionLanguage(params: {
  noticeId: string;
  versionId: string;
  request: AddLanguageRequest;
}) {
  return http.post<AddLanguageResponse>(
    `/api/v2/consent/notices/${params.noticeId}/versions/${params.versionId}/languages`,
    params.request,
    { baseUrl: CONSENT_API_BASE }
  );
}

export function publishNoticeVersion(params: {
  noticeId: string;
  versionId: string;
  request?: PublishVersionRequest;
}) {
  return http.post<PublishVersionResponse>(
    `/api/v2/consent/notices/${params.noticeId}/versions/${params.versionId}/publish`,
    params.request,
    { baseUrl: CONSENT_API_BASE }
  );
}

export function getActivePurposeVersion(params: { noticeId: string; purposeKey: string }) {
  return http.get<ActivePurposeVersionResponse>(
    `/api/v2/consent/notices/${params.noticeId}/purposes/${params.purposeKey}/active-version`,
    { baseUrl: CONSENT_API_BASE }
  );
}

export function listPurposeVersions() {
  return http.get<PurposeVersionListItem[]>(`/api/v2/consent/admin/purposes`, {
    baseUrl: CONSENT_API_BASE,
  });
}

export interface ReconsentRequirementItem {
  id: string;
  dataPrincipalId: string;
  purposeKey: string;
  noticeId: string;
  requiredPurposeVersionId: string;
  status: 'REQUIRED' | 'SATISFIED';
  createdAt: string;
  satisfiedAt: string | null;
  satisfiedByConsentReceiptId: string | null;
}

export function listReconsentRequirements() {
  return http.get<ReconsentRequirementItem[]>(`/api/v2/consent/admin/reconsent`, {
    baseUrl: CONSENT_API_BASE,
  });
}

export function listConsentReceipts(params: { dataPrincipalId: string; purpose?: string }) {
  const query = new URLSearchParams({
    dataPrincipalId: params.dataPrincipalId,
  });
  if (params.purpose) query.append('purpose', params.purpose);

  return http.get<ConsentReceiptDto[]>(`/api/v2/consent/consents?${query.toString()}`, {
    baseUrl: CONSENT_API_BASE,
  });
}

export function getCommunicationConsentStatus(params: {
  channel: CommunicationChannel;
  dataPrincipalId: string;
}) {
  const query = new URLSearchParams({ dataPrincipalId: params.dataPrincipalId });
  return http.get<CommunicationConsentStatusResponse>(
    `/api/v2/consent/communication/channels/${params.channel}/status?${query.toString()}`,
    { baseUrl: CONSENT_API_BASE }
  );
}

export function batchCommunicationConsentStatus(params: {
  channel: CommunicationChannel;
  dataPrincipalIds: string[];
}) {
  const request: CommunicationConsentBatchRequest = {
    channel: params.channel,
    recipients: params.dataPrincipalIds.map((id) => ({ dataPrincipalId: id })),
  };

  return http.post<CommunicationConsentBatchResponse>(
    `/api/v2/consent/communication/batch/status`,
    request,
    { baseUrl: CONSENT_API_BASE }
  );
}
