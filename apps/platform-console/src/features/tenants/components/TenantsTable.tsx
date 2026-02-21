import { Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { TenantSummary } from '../types';
import { TenantStatusBadge } from './TenantStatusBadge';

interface TenantsTableProps {
  tenants: TenantSummary[];
  isLoading?: boolean;
}

export function TenantsTable({ tenants, isLoading }: TenantsTableProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-xl">🏢</div>
        <p className="text-gray-700 font-medium">No tenants found</p>
        <p className="text-sm text-gray-500 mt-1">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-[#F6F7F9]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tenant ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Plan
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Created At
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {tenants.map((tenant) => (
            <tr key={tenant.tenantId} className="hover:bg-[#F8FAFC] transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-slate-900 bg-slate-100/70 px-2 py-1 rounded-md">
                    {tenant.tenantId.slice(0, 8)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(tenant.tenantId)}
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                    title="Copy full ID"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                {tenant.name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <TenantStatusBadge status={tenant.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tenant.planCode || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(tenant.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <Link
                  to={`/tenants/${tenant.tenantId}`}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
