import { ArrowLeft, Calendar, CheckCircle, Copy, FileText, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTenantDetailQuery } from '../hooks';
import { TenantLifecycleActions } from '../components/TenantLifecycleActions';
import { TenantStatusBadge } from '../components/TenantStatusBadge';

export function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { data: tenant, isLoading, error } = useTenantDetailQuery(tenantId!);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-slate-700"></div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <p className="text-red-800">Failed to load tenant details. Please try again.</p>
          <Link to="/tenants" className="text-primary hover:underline mt-4 inline-block">
            ← Back to tenants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/tenants"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenants
        </Link>
      </div>

      <div className="rounded-2xl border bg-gradient-to-r from-[#003B8E] via-[#0047AB] to-[#1A66D9] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{tenant.name || 'Unnamed Tenant'}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="rounded-md bg-white/5 px-3 py-1 text-xs font-mono text-white/80">
                {tenant.tenantId}
              </code>
              <button
                onClick={() => copyToClipboard(tenant.tenantId)}
                className="rounded-full bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/15"
                title="Copy tenant ID"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TenantStatusBadge status={tenant.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tenant Information
          </h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Plan Code</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{tenant.planCode || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created At
              </dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{formatDate(tenant.createdAt)}</dd>
            </div>
            {tenant.adminBootstrappedAt && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Admin Bootstrapped At
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {formatDate(tenant.adminBootstrappedAt)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Configuration</h3>
          <dl className="space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-xs uppercase tracking-wide text-gray-500">Admin Bootstrap Status</dt>
              <dd className="text-sm">
                {tenant.hasAdminBootstrap ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle className="h-4 w-4" />
                    Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-500">
                    <XCircle className="h-4 w-4" />
                    Pending
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <TenantLifecycleActions tenant={tenant} />
    </div>
  );
}
