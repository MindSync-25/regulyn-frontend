import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPORT_AUDIT_ENABLED } from '@/config/env';
import { useTenantsListQuery } from '@/features/tenants/hooks';
import { ReadOnlyBadge } from './components/ReadOnlyBadge';
import { SupportAuditBadge } from './components/SupportAuditBadge';
import { EnterSupportModeDialog } from './components/EnterSupportModeDialog';
import { emitSupportAudit, useSupportModeStore } from './store';

export function SupportModePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [reason, setReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { enter } = useSupportModeStore();

  const { data, isLoading, error } = useTenantsListQuery({
    page: 0,
    size: 50,
    status: 'ALL',
  });

  const tenants = data?.content ?? [];

  const filteredTenants = useMemo(() => {
    if (!search.trim()) return tenants;
    const term = search.trim().toLowerCase();
    return tenants.filter((tenant) =>
      tenant.tenantId.toLowerCase().includes(term) ||
      (tenant.name || '').toLowerCase().includes(term)
    );
  }, [search, tenants]);

  const selectedTenant = tenants.find((tenant) => tenant.tenantId === selectedTenantId);

  const handleConfirm = async () => {
    if (!selectedTenantId || reason.trim().length < 10) return;

    enter(selectedTenantId, reason.trim());
    const { correlationId } = useSupportModeStore.getState();

    await emitSupportAudit({
      tenantId: selectedTenantId,
      action: 'support_mode.enter',
      resourceType: 'tenant',
      resourceId: selectedTenantId,
      correlationId,
      notes: reason.trim(),
    });

    setDialogOpen(false);
    navigate(`/support-mode/tenant/${selectedTenantId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Support Mode</h1>
        <p className="text-gray-600">Explicit, read-only access for cross-tenant support.</p>
        <div className="flex items-center gap-2">
          <ReadOnlyBadge />
          <SupportAuditBadge />
        </div>
      </div>

      {!SUPPORT_AUDIT_ENABLED && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Auditing endpoint not implemented. Support mode actions will not be recorded until enabled.
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search tenant</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Search by tenant ID or name"
            />
          </div>

          {isLoading && <div className="text-sm text-gray-500">Loading tenants...</div>}
          {error && <div className="text-sm text-red-600">Failed to load tenants.</div>}

          {!isLoading && !error && (
            <div className="max-h-[320px] overflow-y-auto rounded-lg border border-gray-200">
              {filteredTenants.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No tenants match your search.</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredTenants.map((tenant) => (
                    <li key={tenant.tenantId} className="p-4">
                      <label className="flex cursor-pointer items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {tenant.name || 'Unnamed tenant'}
                          </div>
                          <div className="text-xs text-gray-500">{tenant.tenantId}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            Status: {tenant.status} · Plan: {tenant.planCode || 'N/A'}
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="tenant"
                          value={tenant.tenantId}
                          checked={selectedTenantId === tenant.tenantId}
                          onChange={() => setSelectedTenantId(tenant.tenantId)}
                          className="h-4 w-4 text-primary"
                        />
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedTenant ? (
                <span>
                  Selected: <span className="font-semibold text-gray-900">{selectedTenant.name || selectedTenant.tenantId}</span>
                </span>
              ) : (
                'Select a tenant to continue.'
              )}
            </div>
            <button
              onClick={() => setDialogOpen(true)}
              disabled={!selectedTenantId}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enter Support Mode
            </button>
          </div>
        </div>
      </div>

      <EnterSupportModeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tenants={tenants}
        selectedTenantId={selectedTenantId}
        reason={reason}
        onTenantChange={setSelectedTenantId}
        onReasonChange={setReason}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
