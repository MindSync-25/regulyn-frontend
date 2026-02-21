import { useEffect, useState } from 'react';
import { FullPageError } from '@/components/FullPageError';
import { ApiException } from '@/api/errors';
import { toast } from 'sonner';
import { HealthKpiRow } from './components/HealthKpiRow';
import { HealthFiltersBar } from './components/HealthFiltersBar';
import { TenantHealthCard } from './components/TenantHealthCard';
import { usePlatformHealthSummaryQuery, useTenantHealthListQuery, isAuthError, isNotExposedError } from './hooks';
import { PaginationBar } from '@/features/tenants/components/PaginationBar';

export function PlatformHealthPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const summaryQuery = usePlatformHealthSummaryQuery();
  const listQuery = useTenantHealthListQuery({ page, size });

  const handleRefresh = () => {
    summaryQuery.refetch();
    listQuery.refetch();
  };

  useEffect(() => {
    const error = summaryQuery.error || listQuery.error;
    if (error instanceof ApiException) {
      if (error.error.status === 409 || error.error.status === 422) {
        toast.error(error.error.message || 'Invalid request. Please check your filters.');
      }
    }
  }, [summaryQuery.error, listQuery.error]);

  if (summaryQuery.error && isAuthError(summaryQuery.error)) {
    const status = summaryQuery.error instanceof ApiException ? summaryQuery.error.error.status : 401;
    return <FullPageError type={status === 403 ? '403' : '401'} />;
  }

  if (listQuery.error && isAuthError(listQuery.error)) {
    const status = listQuery.error instanceof ApiException ? listQuery.error.error.status : 401;
    return <FullPageError type={status === 403 ? '403' : '401'} />;
  }

  if (summaryQuery.error && isNotExposedError(summaryQuery.error)) {
    // TODO: Backend does not expose platform health summary yet.
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Platform Health</h2>
        <p className="text-sm text-gray-600 mt-2">Not exposed by backend yet.</p>
      </div>
    );
  }

  if (listQuery.error && isNotExposedError(listQuery.error)) {
    // TODO: Backend does not expose tenant health list yet.
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Tenant Health</h2>
        <p className="text-sm text-gray-600 mt-2">Not exposed by backend yet.</p>
      </div>
    );
  }

  if (summaryQuery.error || listQuery.error) {
    return <FullPageError type="500" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Platform Health</h1>
          <p className="text-sm text-gray-600 mt-1">Operational health across tenants</p>
        </div>
        <button
          onClick={handleRefresh}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      {summaryQuery.isLoading ? (
        <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
      ) : (
        <HealthKpiRow summary={summaryQuery.data} />
      )}

      <HealthFiltersBar
        pageSize={size}
        onPageSizeChange={(value) => {
          setSize(value);
          setPage(0);
        }}
        onRefresh={handleRefresh}
      />

      {listQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : listQuery.data?.content?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {listQuery.data.content.map((tenant) => (
            <TenantHealthCard key={tenant.tenantId} tenant={tenant} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          No health data yet.
        </div>
      )}

      {listQuery.data && (
        <PaginationBar
          currentPage={listQuery.data.number}
          totalPages={listQuery.data.totalPages}
          pageSize={listQuery.data.size}
          totalItems={listQuery.data.totalElements}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setSize(value);
            setPage(0);
          }}
        />
      )}

      {summaryQuery.data?.incidents && summaryQuery.data.incidents.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Incidents</h2>
          <div className="mt-4 space-y-3">
            {summaryQuery.data.incidents.map((incident, index) => (
              <div key={incident.id || index} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{incident.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'Timestamp unavailable'}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{incident.status || incident.severity || 'UNKNOWN'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
