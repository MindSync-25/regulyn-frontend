/**
 * employee-data-service API wrapper (port 8091)
 * Covers: employees, HR purposes, employee data records, exit/workflow requests, exports
 */
import { http } from './http';
import { env } from '@/config/env';

const BASE = env.employeeServiceUrl;

// ─── Enum-like types (defensive — exact backend values may vary) ──────────────
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | string;
export type RequestStatus =
  | 'RECEIVED'
  | 'IN_REVIEW'
  | 'NEEDS_INFO'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CLOSED'
  | string;
export type RequestType = 'ACCESS' | 'CORRECT' | 'DELETE' | 'WITHDRAW' | string;
export type DataCategory = 'RESUME' | 'HR_DOC' | 'PAYROLL' | 'IDENTITY' | 'HEALTH' | string;
export type LawfulBasis =
  | 'CONTRACT'
  | 'LEGAL_OBLIGATION'
  | 'LEGITIMATE_INTEREST'
  | 'CONSENT'
  | string;

// ─── Response types ───────────────────────────────────────────────────────────
export interface Employee {
  employeeId: string;
  tenantId: string;
  employeeRef: string;
  fullName: string;
  email: string;
  department: string;
  status: EmployeeStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface HRPurpose {
  purposeId: string;
  tenantId: string;
  purposeKey: string;
  description: string;
  lawfulBasis: LawfulBasis;
  retentionDays: number;
  sensitive: boolean;
  metadata: Record<string, unknown>;
}

export interface EmployeeDataRecord {
  recordId: string;
  employeeId: string;
  dataCategory: DataCategory;
  hrPurposeId: string;
  systemId: string;
  notes: string;
  retentionDaysOverride: number | null;
  metadata: Record<string, unknown>;
}

export interface EmployeeRequest {
  requestId: string;
  employeeId: string;
  requestType: RequestType;
  status: RequestStatus;
  requiresApproval: boolean;
  details: Record<string, unknown>;
  assignedTo: string | null;
  approvedBy: string | null;
  decision: string | null;
  reason: string | null;
  closureNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeRequestPage {
  items: EmployeeRequest[];
  total: number;
  page: number;
  size: number;
}

export interface EmployeeExport {
  exportId: string;
  bundleId: string;
  evidenceExportId: string;
  downloadPath: string;
  createdAt: string;
}

// ─── Employees ────────────────────────────────────────────────────────────────
export interface ListEmployeesParams {
  q?: string;
  status?: EmployeeStatus;
}

export function listEmployees(params?: ListEmployeesParams): Promise<Employee[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.status) qs.set('status', params.status);
  const query = qs.toString();
  return http.get(`/api/employees${query ? '?' + query : ''}`, { baseUrl: BASE });
}

export interface CreateEmployeeRequest {
  employeeRef: string;
  fullName: string;
  email: string;
  department: string;
  status: EmployeeStatus;
  metadata?: Record<string, unknown>;
}

export function createEmployee(body: CreateEmployeeRequest): Promise<Employee> {
  return http.post('/api/employees', body, { baseUrl: BASE });
}

// ─── HR Purposes ──────────────────────────────────────────────────────────────
export function listHRPurposes(): Promise<HRPurpose[]> {
  return http.get('/api/hr-purposes', { baseUrl: BASE });
}

export interface CreateHRPurposeRequest {
  purposeKey: string;
  description: string;
  lawfulBasis: LawfulBasis;
  retentionDays: number;
  sensitive: boolean;
  metadata?: Record<string, unknown>;
}

export function createHRPurpose(body: CreateHRPurposeRequest): Promise<HRPurpose> {
  return http.post('/api/hr-purposes', body, { baseUrl: BASE });
}

// ─── Employee Data Records ────────────────────────────────────────────────────
export interface ListEmployeeDataRecordsParams {
  employeeId?: string;
  dataCategory?: DataCategory;
  hrPurposeId?: string;
  systemId?: string;
}

export function listEmployeeDataRecords(
  params?: ListEmployeeDataRecordsParams
): Promise<EmployeeDataRecord[]> {
  const qs = new URLSearchParams();
  if (params?.employeeId) qs.set('employeeId', params.employeeId);
  if (params?.dataCategory) qs.set('dataCategory', params.dataCategory);
  if (params?.hrPurposeId) qs.set('hrPurposeId', params.hrPurposeId);
  if (params?.systemId) qs.set('systemId', params.systemId);
  const query = qs.toString();
  return http.get(`/api/employee-data-records${query ? '?' + query : ''}`, { baseUrl: BASE });
}

// ─── Employee Requests ────────────────────────────────────────────────────────
export interface ListEmployeeRequestsParams {
  status?: RequestStatus;
  requestType?: RequestType;
  employeeId?: string;
  page?: number;
  size?: number;
}

export function listEmployeeRequests(
  params?: ListEmployeeRequestsParams
): Promise<EmployeeRequestPage> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.requestType) qs.set('requestType', params.requestType);
  if (params?.employeeId) qs.set('employeeId', params.employeeId);
  if (params?.page !== undefined) qs.set('page', String(params.page));
  if (params?.size !== undefined) qs.set('size', String(params.size));
  const query = qs.toString();
  return http.get(`/api/employee-requests${query ? '?' + query : ''}`, { baseUrl: BASE });
}

export function getEmployeeRequest(id: string): Promise<EmployeeRequest> {
  return http.get(`/api/employee-requests/${id}`, { baseUrl: BASE });
}

export interface ApproveEmployeeRequestBody {
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}

export function approveEmployeeRequest(
  id: string,
  body: ApproveEmployeeRequestBody
): Promise<EmployeeRequest> {
  return http.post(`/api/employee-requests/${id}/approve`, body, { baseUrl: BASE });
}

export interface TransitionEmployeeRequestBody {
  toStatus: RequestStatus;
  reason?: string;
}

export function transitionEmployeeRequest(
  id: string,
  body: TransitionEmployeeRequestBody
): Promise<EmployeeRequest> {
  return http.post(`/api/employee-requests/${id}/transition`, body, { baseUrl: BASE });
}

export interface CloseEmployeeRequestBody {
  closureNotes?: string;
  includeEvidenceIds?: string[];
}

export function closeEmployeeRequest(
  id: string,
  body: CloseEmployeeRequestBody
): Promise<EmployeeRequest> {
  return http.post(`/api/employee-requests/${id}/close`, body, { baseUrl: BASE });
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export interface CreateEmployeeExportRequest {
  title: string;
  periodFrom: string; // ISO date YYYY-MM-DD
  periodTo: string; // ISO date YYYY-MM-DD
}

export function createEmployeeExport(body: CreateEmployeeExportRequest): Promise<EmployeeExport> {
  return http.post('/api/exports/employee-compliance', body, { baseUrl: BASE });
}
