import type { TenantSummary } from '@/features/tenants/types';

interface EnterSupportModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenants: TenantSummary[];
  selectedTenantId: string;
  reason: string;
  onTenantChange: (tenantId: string) => void;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
}

export function EnterSupportModeDialog({
  open,
  onOpenChange,
  tenants,
  selectedTenantId,
  reason,
  onTenantChange,
  onReasonChange,
  onConfirm,
}: EnterSupportModeDialogProps) {
  if (!open) return null;

  const isValid = selectedTenantId && reason.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Enter Support Mode</h3>
        <p className="mt-1 text-sm text-gray-600">
          Read-only access. All actions audited.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tenant</label>
            <select
              value={selectedTenantId}
              onChange={(event) => onTenantChange(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select a tenant...</option>
              {tenants.map((tenant) => (
                <option key={tenant.tenantId} value={tenant.tenantId}>
                  {tenant.name ? `${tenant.name} (${tenant.tenantId})` : tenant.tenantId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason (min 10 chars)</label>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Describe the support issue..."
            />
            {reason.trim().length > 0 && reason.trim().length < 10 && (
              <div className="mt-1 text-xs text-amber-600">Reason must be at least 10 characters.</div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isValid}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enter Support Mode
          </button>
        </div>
      </div>
    </div>
  );
}
