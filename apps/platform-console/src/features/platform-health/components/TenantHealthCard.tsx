import { Copy, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { TenantHealthSummary } from '../types';
import { ServiceStatusPill } from './ServiceStatusPill';

interface TenantHealthCardProps {
  tenant: TenantHealthSummary;
}

export function TenantHealthCard({ tenant }: TenantHealthCardProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const usage = tenant.evidenceUsagePct !== undefined
    ? `${tenant.evidenceUsagePct}%`
    : tenant.evidenceUsageBytes !== undefined
      ? `${tenant.evidenceUsageBytes} bytes`
      : '-';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <code className="rounded-md bg-slate-100/70 px-2 py-1 text-xs font-mono text-slate-900">
              {tenant.tenantId}
            </code>
            <button
              onClick={() => copyToClipboard(tenant.tenantId)}
              className="text-slate-400 hover:text-slate-600"
              title="Copy tenant ID"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2">
            <ServiceStatusPill status={tenant.status} />
          </div>
        </div>
        <Link
          to={`/platform-health/tenants/${tenant.tenantId}`}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
        >
          View
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Connector failures</span>
          <span className="font-medium">{tenant.connectorFailures ?? '-'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Notification failures</span>
          <span className="font-medium">{tenant.notificationFailures ?? '-'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Evidence usage</span>
          <span className="font-medium">{usage}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Last updated</span>
          <span className="font-medium">{formatDate(tenant.lastUpdated)}</span>
        </div>
      </div>
    </div>
  );
}
