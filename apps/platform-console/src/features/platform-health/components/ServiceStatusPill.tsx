import type { ServiceStatus } from '../types';

interface ServiceStatusPillProps {
  status?: ServiceStatus | string;
}

const styles: Record<string, string> = {
  UP: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DOWN: 'bg-rose-50 text-rose-700 border-rose-200',
  UNKNOWN: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function ServiceStatusPill({ status }: ServiceStatusPillProps) {
  const value = (status || 'UNKNOWN').toString().toUpperCase();
  const className = styles[value] || styles.UNKNOWN;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {value}
    </span>
  );
}
