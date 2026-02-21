/**
 * Incident + Breach API Client (incident-breach-service)
 *
 * Strict rules:
 * - Tenant scoped only from authenticated context (handled by http client)
 * - X-Tenant-Id header cannot be user-edited (enforced in http client)
 * - Do NOT invent endpoints; matches services/incident-breach-service controllers.
 */

import { http } from './http';

// Local dev base URL (from incident-breach-service application.yml)
// TODO: move to env config if/when frontend introduces per-service base URLs.
const INCIDENT_API_BASE = 'http://localhost:8087';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface IncidentDetailsResponse {
  incidentId: string;
  tenantId: string;
  status: string;
  severity: string;
  openedAt: string | null;
  notifyDueAt: string | null;
  updatedAt: string | null;
  summary: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  closedAt: string | null;
  evidenceBundleId: string | null;
  closureNotes: string | null;
  notifyOverdue: boolean | null;
  metadata: Record<string, unknown> | null;
}

export type IncidentSeverity = 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';

export interface CreateIncidentRequest {
  severity: IncidentSeverity;
  summary?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateIncidentResponse {
  incidentId: string;
  status: string;
  notifyDueAt: string | null;
}

export async function createIncident(request: CreateIncidentRequest): Promise<CreateIncidentResponse> {
  return http.post<CreateIncidentResponse>('/incidents', request, {
    baseUrl: INCIDENT_API_BASE,
  });
}

export interface ListIncidentsParams {
  status?: string;
  severity?: string;
  page?: number;
  size?: number;
}

export async function listIncidents(params: ListIncidentsParams = {}): Promise<PageResponse<IncidentDetailsResponse>> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.severity) search.set('severity', params.severity);
  search.set('page', String(params.page ?? 0));
  search.set('size', String(params.size ?? 20));

  return http.get<PageResponse<IncidentDetailsResponse>>(`/incidents?${search.toString()}`, {
    baseUrl: INCIDENT_API_BASE,
  });
}

export async function getIncident(incidentId: string): Promise<IncidentDetailsResponse> {
  return http.get<IncidentDetailsResponse>(`/incidents/${encodeURIComponent(incidentId)}`, {
    baseUrl: INCIDENT_API_BASE,
  });
}

export type TransitionToStatus = 'TRIAGED' | 'INVESTIGATING' | 'NOTIFIED' | 'CONTAINED' | 'CLOSED';

export interface TransitionRequest {
  toStatus: TransitionToStatus;
  reason?: string;
}

export interface TransitionResponse {
  incidentId: string;
  status: string;
}

export async function transitionIncident(incidentId: string, request: TransitionRequest): Promise<TransitionResponse> {
  return http.post<TransitionResponse>(`/incidents/${encodeURIComponent(incidentId)}/transition`, request, {
    baseUrl: INCIDENT_API_BASE,
  });
}

export type TaskType = 'IMPACT_ASSESSMENT' | 'CONTAINMENT' | 'DRAFT_NOTICE' | 'FORENSICS' | 'OTHER';

export interface CreateTaskRequest {
  taskType: TaskType;
  assignedTo?: string;
  notes?: string;
}

export interface CreateTaskResponse {
  taskId: string;
  status: string;
}

export async function createIncidentTask(incidentId: string, request: CreateTaskRequest): Promise<CreateTaskResponse> {
  return http.post<CreateTaskResponse>(`/incidents/${encodeURIComponent(incidentId)}/tasks`, request, {
    baseUrl: INCIDENT_API_BASE,
  });
}

export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP';

export interface DraftNotificationRequest {
  channel: NotificationChannel;
  draftText: string;
  metadata?: Record<string, unknown>;
}

export interface DraftNotificationResponse {
  notificationId: string;
  status: string;
}

export async function draftIncidentNotification(
  incidentId: string,
  request: DraftNotificationRequest
): Promise<DraftNotificationResponse> {
  return http.post<DraftNotificationResponse>(`/incidents/${encodeURIComponent(incidentId)}/notifications/draft`, request, {
    baseUrl: INCIDENT_API_BASE,
  });
}

export interface ApproveNotificationRequest {
  reason?: string;
}

export interface ApproveNotificationResponse {
  notificationId: string;
  status: string;
}

export async function approveIncidentNotification(
  incidentId: string,
  notificationId: string,
  request: ApproveNotificationRequest
): Promise<ApproveNotificationResponse> {
  return http.post<ApproveNotificationResponse>(
    `/incidents/${encodeURIComponent(incidentId)}/notifications/${encodeURIComponent(notificationId)}/approve`,
    request,
    { baseUrl: INCIDENT_API_BASE }
  );
}

export async function rejectIncidentNotification(
  incidentId: string,
  notificationId: string,
  request: ApproveNotificationRequest
): Promise<ApproveNotificationResponse> {
  return http.post<ApproveNotificationResponse>(
    `/incidents/${encodeURIComponent(incidentId)}/notifications/${encodeURIComponent(notificationId)}/reject`,
    request,
    { baseUrl: INCIDENT_API_BASE }
  );
}

export interface SendNotificationResponse {
  notificationId: string;
  status: string;
  sentAt: string | null;
}

export async function sendIncidentNotification(incidentId: string, notificationId: string): Promise<SendNotificationResponse> {
  return http.post<SendNotificationResponse>(
    `/incidents/${encodeURIComponent(incidentId)}/notifications/${encodeURIComponent(notificationId)}/send`,
    undefined,
    { baseUrl: INCIDENT_API_BASE }
  );
}

export interface CloseIncidentRequest {
  closureNotes?: string;
  includeEvidenceIds?: string[];
}

export interface CloseIncidentResponse {
  incidentId: string;
  status: string;
  evidenceBundleId: string | null;
}

export async function closeIncident(incidentId: string, request: CloseIncidentRequest): Promise<CloseIncidentResponse> {
  return http.post<CloseIncidentResponse>(`/incidents/${encodeURIComponent(incidentId)}/close`, request, {
    baseUrl: INCIDENT_API_BASE,
  });
}

export const INCIDENT_SERVICE_INFO = {
  baseUrl: INCIDENT_API_BASE,
};
