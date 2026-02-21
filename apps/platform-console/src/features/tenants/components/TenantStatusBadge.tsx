import type { TenantStatus } from '../types';

interface TenantStatusBadgeProps {
  status: TenantStatus;
}

const statusStyles: Record<TenantStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200',
  DELETED: 'bg-slate-100 text-slate-500 border-slate-200',
};

export function TenantStatusBadge({ status }: TenantStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        statusStyles[status] || statusStyles.DRAFT
      }`}
    >
      {status}
    </span>
  );
}
