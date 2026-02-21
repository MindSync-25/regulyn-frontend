import { useEffect, useMemo, useState } from 'react';
import { FullPageError } from '@/components/FullPageError';
import { ApiException } from '@/api/errors';
import { toast } from 'sonner';
import { AuditFiltersBar } from './components/AuditFiltersBar';
import { AuditTable } from './components/AuditTable';
import { useAuditSearchQuery, isAuthError, isNotExposedError } from './hooks';

export function GlobalAuditPage() {
  const [filters, setFilters] = useState<{
    tenantId: string;
    actorId: string;
    eventType: string;
    correlationId: string;
    from?: string;
    to?: string;
    size: number;
  }>({
    tenantId: '',
    actorId: '',
    eventType: '',
    correlationId: '',
    from: undefined as string | undefined,
    to: undefined as string | undefined,
    size: 50,
  });

  const [page, setPage] = useState(0);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const params = useMemo(
    () => ({
      page,
      size: filters.size,
      tenantId: filters.tenantId || undefined,
      actorId: filters.actorId || undefined,
      eventType: filters.eventType || undefined,
      correlationId: filters.correlationId || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [filters, page]
  );

  const query = useAuditSearchQuery(params, searchTriggered);

  useEffect(() => {
    if (query.error instanceof ApiException) {
      if (query.error.error.status === 409 || query.error.error.status === 422) {
        toast.error(query.error.error.message || 'Invalid filters. Please check your input.');
      }
    }
  }, [query.error]);

  const handleSearch = () => {
    setPage(0);
    setSearchTriggered(true);
    query.refetch();
  };

  const handleClear = () => {
    setFilters({
      tenantId: '',
      actorId: '',
      eventType: '',
      correlationId: '',
      from: undefined,
      to: undefined,
      size: 50,
    });
    setPage(0);
    setSearchTriggered(false);
  };

  if (query.error && isAuthError(query.error)) {
    const status = query.error instanceof ApiException ? query.error.error.status : 401;
    return <FullPageError type={status === 403 ? '403' : '401'} />;
  }

  if (query.error && isNotExposedError(query.error)) {
    // TODO: Backend does not expose global audit endpoint yet.
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Global Audit</h2>
        <p className="text-sm text-gray-600 mt-2">Not exposed by backend yet.</p>
      </div>
    );
  }

  if (query.error) {
    return <FullPageError type="500" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Global Audit</h1>
        <p className="text-sm text-gray-600 mt-1">Cross-tenant audit trail (metadata only)</p>
      </div>

      <AuditFiltersBar
        tenantId={filters.tenantId}
        actorId={filters.actorId}
        eventType={filters.eventType}
        correlationId={filters.correlationId}
        from={filters.from}
        to={filters.to}
        size={filters.size}
        onChange={(value) => setFilters(value)}
        onSearch={handleSearch}
        onClear={handleClear}
      />

      {!searchTriggered ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Set filters and click Search to view audit events.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <AuditTable events={query.data?.content || []} isLoading={query.isLoading} />
        </div>
      )}

      {query.data && searchTriggered && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Page <span className="font-semibold text-slate-900">{query.data.number + 1}</span> of{' '}
            <span className="font-semibold text-slate-900">{query.data.totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={query.data.number === 0}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, query.data.totalPages - 1))}
              disabled={query.data.number >= query.data.totalPages - 1}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
