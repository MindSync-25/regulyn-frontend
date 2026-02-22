/**
 * TenantAuditExplorerPage - Dedicated tenant-scoped audit event explorer
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Filter, Calendar } from 'lucide-react';
import { getAuditEvents, type GetAuditEventsParams, type AuditEvent as IdentityAuditEvent } from '@/lib/api/identity';
import { AuditTimeline } from '@/components/evidence/AuditTimeline';
import { type AuditEvent as EvidenceAuditEvent } from '@/lib/api/evidence';

// Adapter function to convert Identity AuditEvent to Evidence AuditEvent format
function toEvidenceAuditEvent(event: IdentityAuditEvent): EvidenceAuditEvent {
  return {
    id: event.eventId,
    tenantId: event.tenantId,
    actorId: event.actorId,
    eventType: event.action ?? event.service ?? 'UNKNOWN',
    correlationId: null,
    occurredAt: event.occurredAt,
    summary: [
      event.action,
      event.entityType && event.entityId ? `${event.entityType}:${event.entityId}` : event.entityType,
    ].filter(Boolean).join(' — ') || 'Audit event',
  };
}

export function TenantAuditExplorerPage() {
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [filters, setFilters] = useState<GetAuditEventsParams>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch audit events
  const auditQuery = useQuery({
    queryKey: ['audit-events', page, pageSize, filters],
    queryFn: () => {
      return getAuditEvents({
        ...filters,
        page,
        size: pageSize,
      });
    },
  });

  const handleFilterChange = (key: keyof GetAuditEventsParams, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(0); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Audit Explorer</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and search all audit events for your tenant
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Filter Audit Events</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="userId" className="block text-xs font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                id="userId"
                value={filters.userId || ''}
                onChange={e => handleFilterChange('userId', e.target.value)}
                placeholder="UUID"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="eventType" className="block text-xs font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <input
                type="text"
                id="eventType"
                value={filters.eventType || ''}
                onChange={e => handleFilterChange('eventType', e.target.value)}
                placeholder="e.g., user.login"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="from" className="block text-xs font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="datetime-local"
                id="from"
                value={filters.from || ''}
                onChange={e => handleFilterChange('from', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="to" className="block text-xs font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="datetime-local"
                id="to"
                value={filters.to || ''}
                onChange={e => handleFilterChange('to', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <div className="text-sm text-gray-600 flex items-center">
              {Object.keys(filters).length > 0 && (
                <span>{Object.keys(filters).length} filter(s) active</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audit Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gray-900" />
          <h2 className="text-lg font-semibold text-gray-900">Audit Events</h2>
          {auditQuery.data && (
            <span className="text-sm text-gray-600">
              ({auditQuery.data.total} total)
            </span>
          )}
        </div>

        {auditQuery.data && (
          <AuditTimeline
            events={(auditQuery.data.items ?? []).map(toEvidenceAuditEvent)}
            isLoading={auditQuery.isLoading}
            error={auditQuery.error as Error}
            currentPage={page}
            totalPages={Math.ceil(auditQuery.data.total / pageSize)}
            pageSize={pageSize}
            totalElements={auditQuery.data.total}
            onPageChange={setPage}
          />
        )}

        {!auditQuery.data && auditQuery.isLoading && (
          <div className="text-sm text-gray-500">Loading audit events...</div>
        )}

        {auditQuery.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Failed to load audit events: {auditQuery.error.message}
            </p>
          </div>
        )}

        {auditQuery.data && auditQuery.data.items.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600">
              No audit events found
              {Object.keys(filters).length > 0 && ' matching your filters'}
            </p>
          </div>
        )}
      </div>

      {/* Endpoint Info */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="text-sm font-medium text-gray-900">Backend Endpoint</h3>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Available
            </span>
            <code className="text-xs">GET /admin/audit-events</code> - Tenant-scoped audit query
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Supports filters: userId, eventType, from, to
          </p>
          <p className="text-xs text-gray-600">
            RBAC: TENANT_ADMIN role required
          </p>
        </div>
      </div>
    </div>
  );
}

export default TenantAuditExplorerPage;
