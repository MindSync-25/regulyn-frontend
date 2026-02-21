/**
 * BundlesListPage - Server-paginated list of evidence bundles
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Download, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { listBundles } from '@/lib/api/evidence';
import { getUserFacingError } from '@/lib/api/errorMessages';
import { requireTenantId, useTenantId } from '@/lib/auth/tenantContext';

export function BundlesListPage() {
  const navigate = useNavigate();
  const tenantId = useTenantId();
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  if (!tenantId) {
    const uiError = getUserFacingError(new Error('TENANT_CONTEXT_REQUIRED'));
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evidence Bundles</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tamper-proof evidence packages for compliance and legal purposes
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">{uiError.title}</h3>
              <p className="mt-1 text-sm text-red-700">{uiError.message}</p>
              <div className="mt-3 flex gap-2">
                {uiError.primaryAction && (
                  <button
                    type="button"
                    onClick={() => {
                      if (uiError.primaryAction!.kind === 'refresh') {
                        window.location.reload();
                        return;
                      }
                      navigate('/login');
                    }}
                    className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                  >
                    {uiError.primaryAction.label}
                  </button>
                )}
                {uiError.secondaryAction && (
                  <button
                    type="button"
                    onClick={() => {
                      if (uiError.secondaryAction!.kind === 'refresh') {
                        window.location.reload();
                        return;
                      }
                      navigate('/login');
                    }}
                    className="rounded border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-50"
                  >
                    {uiError.secondaryAction.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['evidence-bundles', tenantId, page, pageSize],
    queryFn: () => {
      return listBundles({ tenantId: requireTenantId(tenantId), page, size: pageSize });
    },
    enabled: !!tenantId,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evidence Bundles</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tamper-proof evidence packages for compliance and legal purposes
          </p>
        </div>

        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg border border-gray-200 p-6">
              <div className="h-5 w-1/4 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
              <div className="mt-3 flex gap-4">
                <div className="h-3 w-20 rounded bg-gray-100" />
                <div className="h-3 w-24 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const uiError = getUserFacingError(error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evidence Bundles</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tamper-proof evidence packages for compliance and legal purposes
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">{uiError.title}</h3>
              <p className="mt-1 text-sm text-red-700">{uiError.message}</p>
              <div className="mt-3 flex gap-2">
                {uiError.primaryAction && (
                  <button
                    type="button"
                    onClick={() => {
                      if (uiError.primaryAction!.kind === 'refresh') {
                        window.location.reload();
                        return;
                      }
                      navigate('/login');
                    }}
                    className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                  >
                    {uiError.primaryAction.label}
                  </button>
                )}
                {uiError.secondaryAction && (
                  <button
                    type="button"
                    onClick={() => {
                      if (uiError.secondaryAction!.kind === 'refresh') {
                        window.location.reload();
                        return;
                      }
                      navigate('/login');
                    }}
                    className="rounded border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-50"
                  >
                    {uiError.secondaryAction.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.content.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evidence Bundles</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tamper-proof evidence packages for compliance and legal purposes
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <Package className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No evidence bundles found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Evidence bundles are created automatically by the system when collecting evidence for
            compliance activities.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evidence Bundles</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tamper-proof evidence packages for compliance and legal purposes
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Total Bundles</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{data.totalElements}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Current Page</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">
            {page + 1} / {data.totalPages || 1}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Showing</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{data.content.length}</div>
        </div>
      </div>

      {/* Bundles list */}
      <div className="space-y-4">
        {data.content.map(bundle => (
          <button
            key={bundle.bundleId}
            type="button"
            onClick={() => navigate(`/evidence/bundles/${bundle.bundleId}`)}
            className="w-full rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">{bundle.type}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      bundle.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : bundle.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {bundle.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">ID:</span>
                    <span className="font-mono text-xs">{bundle.bundleId}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Created:</span>
                    <span>
                      {formatDistanceToNow(new Date(bundle.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              <Download className="h-5 w-5 text-gray-400" />
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{page * pageSize + 1}</span> to{' '}
            <span className="font-medium">{Math.min((page + 1) * pageSize, data.totalElements)}</span> of{' '}
            <span className="font-medium">{data.totalElements}</span> bundles
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
              disabled={page >= data.totalPages - 1}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
