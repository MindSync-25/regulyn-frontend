export interface AuditEvent {
  id?: string;
  tenantId: string;
  actorId?: string;
  eventType: string;
  correlationId?: string;
  occurredAt: string;
  summary?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
