import type { PlatformHealthSummary } from '../types';
import { ServiceStatusPill } from './ServiceStatusPill';

interface HealthKpiRowProps {
  summary?: PlatformHealthSummary;
}

export function HealthKpiRow({ summary }: HealthKpiRowProps) {
  const kpis = [
    {
      label: 'Platform Status',
      value: summary?.platformStatus,
      isStatus: true,
    },
    {
      label: 'Tenants UP',
      value: summary?.tenantsUp,
    },
    {
      label: 'Tenants DOWN',
      value: summary?.tenantsDown,
    },
    {
      label: 'Total Tenants',
      value: summary?.totalTenants,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">{kpi.label}</p>
          <div className="mt-3">
            {kpi.isStatus ? (
              <ServiceStatusPill status={kpi.value as string | undefined} />
            ) : (
              <p className="text-2xl font-semibold text-gray-900">{kpi.value ?? '-'}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
