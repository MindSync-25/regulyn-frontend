/**
 * Scanner Service API wrappers
 * Backend: scanner-service — port 8094
 *
 * Base URL: env.scannerServiceUrl
 * All requests carry X-Tenant-Id / X-User-Id / Authorization from http.ts
 *
 * Available endpoints:
 *   ScanSourceController   GET/POST /scanner/sources, POST /scanner/sources/:id/disable
 *   ScanRunController      GET/POST /scanner/runs, GET /scanner/runs/:id, POST /scanner/runs/:id/execute
 *   FindingController      GET /scanner/runs/:id/findings
 *   RemediationTaskCtrl    GET /scanner/tasks, GET /scanner/tasks/:id, POST /scanner/tasks/:id/transition, POST /scanner/tasks/:id/events
 *   ScanRunEvidenceCtrl    POST /scanner/runs/:id/evidence/bundle
 *   ExportController       (TODO: verify exact endpoints)
 */

import { http } from './http';
import { env } from '@/config/env';
import type { SpringPage } from './ropa';

// ─── Scan Sources ─────────────────────────────────────────────────────────────

export type ScanSourceStatus = 'ACTIVE' | 'DISABLED' | 'PENDING';
export type ScanSourceType = 'WEBSITE' | 'API' | 'DATABASE' | 'FILE' | 'OTHER';
export type ScanSourceAuthType = 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY';

export interface ScanSource {
  sourceId: string;
  sourceName: string;
  systemId?: string;
  sourceType: ScanSourceType;
  status: ScanSourceStatus;
  baseUrl?: string;
  authType?: ScanSourceAuthType;
  authRef?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

// ─── Scan Runs ────────────────────────────────────────────────────────────────

export type ScanRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ScanRun {
  runId: string;
  sourceId: string;
  scanMode?: string;
  status: ScanRunStatus;
  sinceAt?: string;
  requestRef?: string;
  queuedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  findingsCount?: number;
  resultHash?: string;
  errorMessage?: string;
}

// ─── Findings ─────────────────────────────────────────────────────────────────

export type FindingRiskLevel = 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';

export interface Finding {
  findingId: string;
  runId: string;
  findingType?: string;
  entityType?: string;
  subjectId?: string;
  fieldName?: string;
  dataCategory?: string;
  riskLevel?: FindingRiskLevel;
  confidence?: number;
  details?: Record<string, unknown>;
  createdAt: string;
}

// ─── Remediation Tasks ────────────────────────────────────────────────────────

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'WAIVED';
export type TaskSeverity = 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';

export interface RemediationTask {
  taskId: string;
  sourceId?: string;
  runId?: string;
  findingPk?: string;
  findingFingerprint?: string;
  title?: string;
  severity?: TaskSeverity;
  ownerUserId?: string;
  ownerEmail?: string;
  dueDate?: string;
  status: TaskStatus;
  closureNotes?: string;
  waivedReason?: string;
  closedAt?: string;
  closedByUserId?: string;
  evidenceArtifactRef?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskTransitionRequest {
  toStatus: TaskStatus;
  notes?: string;
  ownerUserId?: string;
  ownerEmail?: string;
  waivedReason?: string;
  closureNotes?: string;
}

// ─── Evidence Bundle ──────────────────────────────────────────────────────────

export interface RunEvidenceBundleResponse {
  bundleRef?: string;
  runId?: string;
  createdAt?: string;
  /** TODO: confirm full shape from RunEvidenceBundleResponse.java */
}

// ─── API Functions ────────────────────────────────────────────────────────────

const base = () => env.scannerServiceUrl;

// --- Sources ---

/**
 * GET /scanner/sources
 * List all scan sources.
 */
export function listScanSources(params?: {
  status?: string;
  type?: string;
}): Promise<ScanSource[]> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.type) sp.set('type', params.type);
  const qs = sp.toString();
  return http.get<ScanSource[]>(`/scanner/sources${qs ? `?${qs}` : ''}`, { baseUrl: base() });
}

/**
 * POST /scanner/sources/:sourceId/disable
 * Disable a scan source.
 * RBAC: TENANT_ADMIN only (PreAuthorize ADMIN on backend).
 */
export function disableScanSource(sourceId: string): Promise<ScanSource> {
  return http.post<ScanSource>(`/scanner/sources/${sourceId}/disable`, undefined, { baseUrl: base() });
}

// --- Runs ---

/**
 * GET /scanner/runs
 * List scan runs with pagination.
 */
export function listScanRuns(params?: {
  status?: string;
  sourceId?: string;
  page?: number;
  size?: number;
}): Promise<SpringPage<ScanRun>> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.sourceId) sp.set('sourceId', params.sourceId);
  sp.set('page', String(params?.page ?? 0));
  sp.set('size', String(params?.size ?? 20));
  return http.get<SpringPage<ScanRun>>(`/scanner/runs?${sp.toString()}`, { baseUrl: base() });
}

/**
 * GET /scanner/runs/:runId
 * Get a specific scan run.
 */
export function getScanRun(runId: string): Promise<ScanRun> {
  return http.get<ScanRun>(`/scanner/runs/${runId}`, { baseUrl: base() });
}

// --- Findings ---

/**
 * GET /scanner/runs/:runId/findings
 * Get findings for a run (backend returns List<FindingResponse>).
 */
export function getRunFindings(runId: string): Promise<Finding[]> {
  return http.get<Finding[]>(`/scanner/runs/${runId}/findings`, { baseUrl: base() });
}

// --- Tasks ---

/**
 * GET /scanner/tasks
 * List remediation tasks with pagination and filters.
 */
export function listTasks(params?: {
  status?: TaskStatus;
  sourceId?: string;
  runId?: string;
  severity?: TaskSeverity;
  page?: number;
  size?: number;
}): Promise<SpringPage<RemediationTask>> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.sourceId) sp.set('sourceId', params.sourceId);
  if (params?.runId) sp.set('runId', params.runId);
  if (params?.severity) sp.set('severity', params.severity);
  sp.set('page', String(params?.page ?? 0));
  sp.set('size', String(params?.size ?? 20));
  return http.get<SpringPage<RemediationTask>>(`/scanner/tasks?${sp.toString()}`, { baseUrl: base() });
}

/**
 * GET /scanner/tasks/:taskId
 * Get a specific task.
 */
export function getTask(taskId: string): Promise<RemediationTask> {
  return http.get<RemediationTask>(`/scanner/tasks/${taskId}`, { baseUrl: base() });
}

/**
 * POST /scanner/tasks/:taskId/transition
 * Close, waive or transition a task.
 * Requires X-User-ID (injected by http.ts automatically).
 * Optionally accepts X-Idempotency-Key.
 */
export function transitionTask(
  taskId: string,
  request: TaskTransitionRequest,
  idempotencyKey?: string
): Promise<RemediationTask> {
  const extraHeaders: Record<string, string> = {};
  if (idempotencyKey) extraHeaders['X-Idempotency-Key'] = idempotencyKey;
  return http.post<RemediationTask>(
    `/scanner/tasks/${taskId}/transition`,
    request,
    { baseUrl: base(), headers: extraHeaders }
  );
}

/**
 * POST /scanner/runs/:runId/evidence/bundle
 * Create an evidence bundle for a scan run.
 * Requires X-User-ID (injected by http.ts automatically).
 * Optionally accepts X-Idempotency-Key.
 */
export function createRunEvidenceBundle(
  runId: string,
  idempotencyKey?: string
): Promise<RunEvidenceBundleResponse> {
  const extraHeaders: Record<string, string> = {};
  if (idempotencyKey) extraHeaders['X-Idempotency-Key'] = idempotencyKey;
  return http.post<RunEvidenceBundleResponse>(
    `/scanner/runs/${runId}/evidence/bundle`,
    undefined,
    { baseUrl: base(), headers: extraHeaders }
  );
}
