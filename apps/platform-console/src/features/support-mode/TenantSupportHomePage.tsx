import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/auth/authStore';
import { SUPPORT_AUDIT_ENABLED, SUPPORT_EVIDENCE_BUNDLES_ENABLED, SUPPORT_TENANT_AUDIT_ENABLED } from '@/config/env';
import { PaginationBar } from '@/features/tenants/components/PaginationBar';
import { useTenantDetailQuery } from '@/features/tenants/hooks';
import { CopyCell } from '@/features/global-audit/components/CopyCell';
import { emitSupportAudit, useSupportModeStore } from './store';
import type { EvidenceBundlePage, TenantAuditPage } from './types';
import { PlaceholderNotExposed } from './components/PlaceholderNotExposed';
import { ReadOnlyBadge } from './components/ReadOnlyBadge';
import { SupportAuditBadge } from './components/SupportAuditBadge';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

export function TenantSupportHomePage() {
  const { tenantId: routeTenantId } = useParams();
  const [activeTab, setActiveTab] = useState<'config' | 'audit' | 'evidence'>('config');
  const [auditPage, setAuditPage] = useState(0);
  const [auditSize, setAuditSize] = useState(10);
  const [evidencePage, setEvidencePage] = useState(0);
  const [evidenceSize, setEvidenceSize] = useState(10);

  const { isActive, tenantId, correlationId, reason } = useSupportModeStore();

  const shouldFetchConfig = isActive && tenantId === routeTenantId && !!routeTenantId;
  const safeTenantId = shouldFetchConfig ? routeTenantId! : '';

  const { data: tenantDetail, isLoading: tenantLoading, error: tenantError } = useTenantDetailQuery(safeTenantId);

  const token = useAuthStore.getState().token;

  const fetchTenantAuditEvents = async () => {
    if (!token || !routeTenantId) throw new Error('Missing tenant context');
    const query = new URLSearchParams({
      page: auditPage.toString(),
      size: auditSize.toString(),
    });
    return apiClient.get<TenantAuditPage>(
      `/admin/platform/tenants/${routeTenantId}/audit/events?${query.toString()}`,
      { token }
    );
  };

  const fetchEvidenceBundles = async () => {
    if (!token || !routeTenantId) throw new Error('Missing tenant context');
    const query = new URLSearchParams({
      page: evidencePage.toString(),
      size: evidenceSize.toString(),
    });
    return apiClient.get<EvidenceBundlePage>(
      `/admin/platform/tenants/${routeTenantId}/evidence/bundles?${query.toString()}`,
      { token }
    );
  };

  const auditEnabled = SUPPORT_TENANT_AUDIT_ENABLED && shouldFetchConfig;
  const evidenceEnabled = SUPPORT_EVIDENCE_BUNDLES_ENABLED && shouldFetchConfig;

  const { data: auditData, isLoading: auditLoading, error: auditError } = useQuery({
    queryKey: ['supportTenantAudit', routeTenantId, auditPage, auditSize],
    queryFn: fetchTenantAuditEvents,
    enabled: auditEnabled,
  });

  const { data: evidenceData, isLoading: evidenceLoading, error: evidenceError } = useQuery({
    queryKey: ['supportEvidenceBundles', routeTenantId, evidencePage, evidenceSize],
    queryFn: fetchEvidenceBundles,
    enabled: evidenceEnabled,
  });

  const currentTabLabel = useMemo(() => {
    switch (activeTab) {
      case 'config':
        return 'support_mode.view_tenant_config';
      case 'audit':
        return 'support_mode.view_tenant_audit_timeline';
      case 'evidence':
        return 'support_mode.view_evidence_bundles';
      default:
        return 'support_mode.view_tenant_config';
    }
  }, [activeTab]);

  useEffect(() => {
    if (!shouldFetchConfig || !routeTenantId) return;

    emitSupportAudit({
      tenantId: routeTenantId,
      action: currentTabLabel,
      resourceType: activeTab,
      resourceId: routeTenantId,
      correlationId,
      notes: reason,
    });
  }, [currentTabLabel, activeTab, shouldFetchConfig, routeTenantId, correlationId, reason]);

  if (!routeTenantId) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Support Mode</h2>
        <p className="mt-2 text-sm text-gray-600">No tenant selected.</p>
        <Link to="/support-mode" className="mt-4 inline-flex text-sm font-medium text-primary">
          Go to Support Mode
        </Link>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Support Mode inactive</h2>
        <p className="mt-2 text-sm text-gray-600">Enter support mode to view tenant data.</p>
        <Link to="/support-mode" className="mt-4 inline-flex text-sm font-medium text-primary">
          Enter Support Mode
        </Link>
      </div>
    );
  }

  if (tenantId && tenantId !== routeTenantId) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Support Mode tenant mismatch</h2>
        <p className="mt-2 text-sm text-gray-600">
          Active session is locked to tenant <span className="font-semibold text-gray-900">{tenantId}</span>.
          Exit support mode or return to the active tenant.
        </p>
        <Link
          to={`/support-mode/tenant/${tenantId}`}
          className="mt-4 inline-flex text-sm font-medium text-primary"
        >
          Go to active tenant
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Support Mode — Tenant {routeTenantId}</h1>
          <ReadOnlyBadge />
          <SupportAuditBadge />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CopyCell value={routeTenantId} label="Tenant ID" />
          {correlationId && <CopyCell value={correlationId} label="Correlation ID" />}
        </div>
        {!SUPPORT_AUDIT_ENABLED && (
          <div className="text-sm text-amber-700">Auditing endpoint not implemented.</div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          { key: 'config', label: 'Tenant Config' },
          { key: 'audit', label: 'Tenant Audit Timeline' },
          { key: 'evidence', label: 'Evidence Bundles' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-white shadow">
        {activeTab === 'config' && (
          <div className="p-6 space-y-4">
            {tenantLoading && <div className="text-sm text-gray-500">Loading tenant configuration...</div>}
            {tenantError && <div className="text-sm text-red-600">Failed to load tenant configuration.</div>}

            {tenantDetail && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase text-gray-500">Status</div>
                  <div className="text-sm font-semibold text-gray-900">{tenantDetail.status}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-500">Plan</div>
                  <div className="text-sm font-semibold text-gray-900">{tenantDetail.planCode || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-500">Created</div>
                  <div className="text-sm font-semibold text-gray-900">{formatDate(tenantDetail.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-500">Updated</div>
                  <div className="text-sm font-semibold text-gray-900">{formatDate(tenantDetail.updatedAt)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-500">Admin Bootstrapped</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {tenantDetail.hasAdminBootstrap ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-500">Admin Bootstrapped At</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(tenantDetail.adminBootstrappedAt)}
                  </div>
                </div>
              </div>
            )}

            {tenantDetail && (tenantDetail as any).limits && (
              <div>
                <div className="text-xs uppercase text-gray-500">Limits</div>
                <pre className="mt-2 rounded-lg bg-slate-50 p-4 text-xs text-slate-700 overflow-x-auto">
                  {JSON.stringify((tenantDetail as any).limits, null, 2)}
                </pre>
              </div>
            )}

            {tenantDetail && (tenantDetail as any).featureFlags && (
              <div>
                <div className="text-xs uppercase text-gray-500">Feature Flags</div>
                <pre className="mt-2 rounded-lg bg-slate-50 p-4 text-xs text-slate-700 overflow-x-auto">
                  {JSON.stringify((tenantDetail as any).featureFlags, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="p-6 space-y-4">
            {!SUPPORT_TENANT_AUDIT_ENABLED ? (
              <PlaceholderNotExposed
                title="Tenant Audit Timeline"
                description="This endpoint is not exposed by the backend yet."
                todo="Implement GET /admin/platform/tenants/{tenantId}/audit/events"
              />
            ) : (
              <>
                {auditLoading && <div className="text-sm text-gray-500">Loading tenant audit timeline...</div>}
                {auditError && <div className="text-sm text-red-600">Failed to load tenant audit timeline.</div>}

                {auditData && (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Occurred</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Event</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Actor</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Correlation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {auditData.content.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                              No audit events found.
                            </td>
                          </tr>
                        ) : (
                          auditData.content.map((event, index) => (
                            <tr key={`${event.occurredAt}-${index}`}>
                              <td className="px-4 py-3 text-gray-700">{formatDate(event.occurredAt)}</td>
                              <td className="px-4 py-3 text-gray-700">{event.eventType}</td>
                              <td className="px-4 py-3 text-gray-700">{event.actorId || '—'}</td>
                              <td className="px-4 py-3 text-gray-700">{event.correlationId || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <PaginationBar
                      currentPage={auditData.number}
                      totalPages={auditData.totalPages}
                      pageSize={auditData.size}
                      totalItems={auditData.totalElements}
                      onPageChange={setAuditPage}
                      onPageSizeChange={setAuditSize}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="p-6 space-y-4">
            {!SUPPORT_EVIDENCE_BUNDLES_ENABLED ? (
              <PlaceholderNotExposed
                title="Evidence Bundles"
                description="This endpoint is not exposed by the backend yet."
                todo="Implement GET /admin/platform/tenants/{tenantId}/evidence/bundles"
              />
            ) : (
              <>
                {evidenceLoading && <div className="text-sm text-gray-500">Loading evidence bundles...</div>}
                {evidenceError && <div className="text-sm text-red-600">Failed to load evidence bundles.</div>}

                {evidenceData && (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Bundle ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Created</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {evidenceData.content.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                              No evidence bundles found.
                            </td>
                          </tr>
                        ) : (
                          evidenceData.content.map((bundle) => (
                            <tr key={bundle.bundleId}>
                              <td className="px-4 py-3 text-gray-700">{bundle.bundleId}</td>
                              <td className="px-4 py-3 text-gray-700">{bundle.type || '—'}</td>
                              <td className="px-4 py-3 text-gray-700">{formatDate(bundle.createdAt)}</td>
                              <td className="px-4 py-3 text-gray-700">{bundle.status || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <PaginationBar
                      currentPage={evidenceData.number}
                      totalPages={evidenceData.totalPages}
                      pageSize={evidenceData.size}
                      totalItems={evidenceData.totalElements}
                      onPageChange={setEvidencePage}
                      onPageSizeChange={setEvidenceSize}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
