/**
 * EvidenceDrawer - Reusable right-side drawer for evidence context
 * Can be used from any module to show evidence bundles and audit timeline.
 * Part 10: keyboard escape close, accessible roles, human-readable bundle view.
 */

import { useState, useEffect, useRef } from 'react';
import { X, Package, FileText, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listBundles, getAuditTimeline } from '@/lib/api/evidence';
import { getUserFacingError } from '@/lib/api/errorMessages';
import { requireTenantId, useTenantId } from '@/lib/auth/tenantContext';
import { AuditTimeline } from './AuditTimeline';
import { formatDistanceToNow } from 'date-fns';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  objectType?: string; // Future use: filter by object type
  objectId?: string;   // Future use: filter by object ID
  bundleId?: string;   // Future use: pre-select bundle tab
  title?: string;
}

type TabType = 'bundles' | 'audit';

export function EvidenceDrawer({
  isOpen,
  onClose,
  objectType,
  objectId,
  bundleId,
  title = 'Evidence Context',
}: EvidenceDrawerProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>(bundleId ? 'bundles' : 'bundles');
  const [bundlesPage, setBundlesPage] = useState(0);
  const [auditPage, setAuditPage] = useState(0);
  const pageSize = 10;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard: Escape closes drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus the close button when the drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const tenantId = useTenantId();

  // Fetch bundles
  const bundlesQuery = useQuery({
    queryKey: ['evidence-bundles', tenantId, bundlesPage, pageSize, objectType, objectId],
    queryFn: () => {
      return listBundles({ tenantId: requireTenantId(tenantId), page: bundlesPage, size: pageSize });
    },
    enabled: isOpen && activeTab === 'bundles' && !!tenantId,
  });

  // Fetch audit timeline
  const auditQuery = useQuery({
    queryKey: ['audit-timeline', auditPage, pageSize],
    queryFn: () => {
      return getAuditTimeline({ page: auditPage, size: pageSize });
    },
    enabled: isOpen && activeTab === 'audit',
  });

  const tenantContextUiError = getUserFacingError(new Error('TENANT_CONTEXT_REQUIRED'));
  const bundlesUiError = bundlesQuery.error ? getUserFacingError(bundlesQuery.error) : null;

  const runAction = (action: { kind: 'refresh' | 'login' }) => {
    if (action.kind === 'refresh') {
      window.location.reload();
      return;
    }
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900" id="evidence-drawer-title">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close evidence drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Context info (if available) */}
        {(objectType || objectId) && (
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 text-sm text-gray-700">
            {objectType && <span className="font-medium">Type:</span>} {objectType}
            {objectId && (
              <>
                {' • '}
                <span className="font-medium">ID:</span> {objectId}
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200" role="tablist" aria-label="Evidence sections">
          <nav className="flex gap-8 px-6">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'bundles'}
              aria-controls="evidence-panel-bundles"
              onClick={() => setActiveTab('bundles')}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'bundles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              Evidence Bundles
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'audit'}
              aria-controls="evidence-panel-audit"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'audit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Activity className="h-4 w-4" aria-hidden="true" />
              Audit Timeline
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'bundles' && (
            <div id="evidence-panel-bundles" role="tabpanel" aria-label="Evidence Bundles" className="space-y-4">
              {!tenantId && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <>
                    <p className="font-medium">{tenantContextUiError.title}</p>
                    <p className="mt-1 text-red-700">{tenantContextUiError.message}</p>
                    <div className="mt-3 flex gap-2">
                      {tenantContextUiError.primaryAction && (
                        <button
                          type="button"
                          onClick={() => runAction(tenantContextUiError.primaryAction!)}
                          className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                        >
                          {tenantContextUiError.primaryAction.label}
                        </button>
                      )}
                      {tenantContextUiError.secondaryAction && (
                        <button
                          type="button"
                          onClick={() => runAction(tenantContextUiError.secondaryAction!)}
                          className="rounded border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-50"
                        >
                          {tenantContextUiError.secondaryAction.label}
                        </button>
                      )}
                    </div>
                  </>
                </div>
              )}

              {bundlesQuery.isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse rounded-lg border border-gray-200 p-4">
                      <div className="h-4 w-1/3 rounded bg-gray-200" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
              )}

              {bundlesQuery.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {bundlesUiError && (
                    <>
                      <p className="font-medium">{bundlesUiError.title}</p>
                      <p className="mt-1 text-red-700">{bundlesUiError.message}</p>
                      <div className="mt-3 flex gap-2">
                        {bundlesUiError.primaryAction && (
                          <button
                            type="button"
                            onClick={() => runAction(bundlesUiError.primaryAction!)}
                            className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                          >
                            {bundlesUiError.primaryAction.label}
                          </button>
                        )}
                        {bundlesUiError.secondaryAction && (
                          <button
                            type="button"
                            onClick={() => runAction(bundlesUiError.secondaryAction!)}
                            className="rounded border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-50"
                          >
                            {bundlesUiError.secondaryAction.label}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {bundlesQuery.data && bundlesQuery.data.content.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                  <Package className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                  <p className="mt-4 text-sm font-medium text-gray-700">No evidence bundles found</p>
                  <p className="mt-1 text-xs text-gray-500">No data for this tenant yet — bundles are created when evidence is collected.</p>
                </div>
              )}

              {bundlesQuery.data && bundlesQuery.data.content.length > 0 && (
                <>
                  <div className="space-y-3">
                    {bundlesQuery.data.content.map(bundle => {
                      const statusColor =
                        bundle.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        bundle.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        bundle.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-700';
                      return (
                        <div
                          key={bundle.bundleId}
                          className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                                <span className="font-medium text-gray-900 truncate">{bundle.type}</span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span className={`rounded-full px-2 py-0.5 font-medium ${statusColor}`}>
                                  {bundle.status}
                                </span>
                                <span className="text-gray-500">
                                  {formatDistanceToNow(new Date(bundle.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="mt-1.5 text-xs font-mono text-gray-400 truncate" title={bundle.bundleId}>
                                ID: {bundle.bundleId}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {bundlesQuery.data.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="text-sm text-gray-700">
                        Page {bundlesPage + 1} of {bundlesQuery.data.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBundlesPage(p => p - 1)}
                          disabled={bundlesPage === 0}
                          className="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setBundlesPage(p => p + 1)}
                          disabled={bundlesPage >= bundlesQuery.data.totalPages - 1}
                          className="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div id="evidence-panel-audit" role="tabpanel" aria-label="Audit Timeline">
              {auditQuery.data && (
                <AuditTimeline
                  events={auditQuery.data.content}
                  isLoading={auditQuery.isLoading}
                  error={auditQuery.error as Error}
                  currentPage={auditPage}
                  totalPages={auditQuery.data.totalPages}
                  pageSize={pageSize}
                  totalElements={auditQuery.data.totalElements}
                  onPageChange={setAuditPage}
                  emptyMessage="No audit events found — try a different object context or check service availability."
                />
              )}
              {!auditQuery.data && auditQuery.isLoading && (
                <div className="text-sm text-gray-500">Loading audit timeline…</div>
              )}
              {auditQuery.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <p className="font-medium">Failed to load audit timeline</p>
                  <p className="mt-1 text-red-700">{(auditQuery.error as Error).message}</p>
                  {(auditQuery.error as Error).message?.includes('403') && (
                    <p className="mt-2 text-xs text-red-600">
                      You may not have the required TENANT_ADMIN permission to view audit events.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => auditQuery.refetch()}
                    className="mt-3 rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!auditQuery.data && !auditQuery.isLoading && !auditQuery.error && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                  <p className="mt-4 text-sm font-medium text-gray-700">Audit Timeline</p>
                  <p className="mt-1 text-xs text-gray-500">Not available in current backend — audit service integration pending.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
