import { Link, useParams } from 'react-router-dom';
import { FullPageError } from '@/components/FullPageError';
import { ApiException } from '@/api/errors';
import { useTenantHealthDetailQuery, isAuthError, isNotExposedError } from './hooks';
import { ServiceStatusPill } from './components/ServiceStatusPill';

export function TenantHealthDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const query = useTenantHealthDetailQuery(tenantId || '');

  if (query.error && isAuthError(query.error)) {
    const status = query.error instanceof ApiException ? query.error.error.status : 401;
    return <FullPageError type={status === 403 ? '403' : '401'} />;
  }

  if (query.error && isNotExposedError(query.error)) {
    // TODO: Backend does not expose tenant health details yet.
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Tenant Health</h2>
        <p className="text-sm text-gray-600 mt-2">Not exposed by backend yet.</p>
      </div>
    );
  }

  if (query.error) {
    return <FullPageError type="500" />;
  }

  if (query.isLoading) {
    return <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />;
  }

  const tenant = query.data;

  if (!tenant) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">No data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link to="/platform-health" className="hover:text-gray-900">Platform Health</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{tenant.tenantId}</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Tenant ID</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{tenant.tenantId}</p>
          </div>
          <ServiceStatusPill status={tenant.status} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Service Status</h2>
        {tenant.services && tenant.services.length > 0 ? (
          <div className="mt-4 space-y-3">
            {tenant.services.map((service, index) => (
              <div key={`${service.name}-${index}`} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                    {service.lastCheckAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last check: {new Date(service.lastCheckAt).toLocaleString()}
                      </p>
                    )}
                    {service.message && (
                      <p className="text-xs text-gray-500 mt-1">{service.message}</p>
                    )}
                  </div>
                  <ServiceStatusPill status={service.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Per-service details not exposed by backend yet.
          </div>
        )}
      </div>
    </div>
  );
}
