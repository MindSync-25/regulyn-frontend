export type TenantStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface TenantSummary {
  tenantId: string;
  name?: string;
  status: TenantStatus;
  planCode?: string;
  createdAt: string;
}

export interface TenantDetail {
  tenantId: string;
  name?: string;
  status: TenantStatus;
  planCode?: string;
  createdAt: string;
  updatedAt?: string;
  adminBootstrappedAt?: string;
  hasAdminBootstrap?: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ListTenantsParams {
  page: number;
  size: number;
  status?: TenantStatus | 'ALL';
}
