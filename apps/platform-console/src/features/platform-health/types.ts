export type ServiceStatus = 'UP' | 'DOWN' | 'UNKNOWN';

export interface TenantHealthSummary {
  tenantId: string;
  status?: ServiceStatus | string;
  services?: Array<{
    name: string;
    status: ServiceStatus;
    lastCheckAt?: string;
    message?: string;
  }>;
  connectorFailures?: number;
  notificationFailures?: number;
  evidenceUsageBytes?: number;
  evidenceUsagePct?: number;
  lastUpdated?: string;
}

export interface PlatformHealthSummary {
  platformStatus?: ServiceStatus;
  tenantsUp?: number;
  tenantsDown?: number;
  totalTenants?: number;
  incidents?: Array<{
    id?: string;
    title: string;
    severity?: string;
    createdAt?: string;
    status?: string;
  }>;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
