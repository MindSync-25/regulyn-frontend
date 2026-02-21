import { CopyCell } from '@/features/global-audit/components/CopyCell';
import { SUPPORT_AUDIT_ENABLED } from '@/config/env';
import { useSupportModeStore } from '../store';
import { ExitSupportModeButton } from '@/features/support-mode/components/ExitSupportModeButton';
import { ReadOnlyBadge } from '@/features/support-mode/components/ReadOnlyBadge';
import { SupportAuditBadge } from '@/features/support-mode/components/SupportAuditBadge';

const truncate = (value: string, max = 90) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
};

export function SupportModeBanner() {
  const { isActive, tenantId, reason, enteredAt, correlationId } = useSupportModeStore();

  if (!isActive || !tenantId) return null;

  const formattedEnteredAt = enteredAt ? new Date(enteredAt).toLocaleString() : 'Unknown';
  const displayedReason = reason ? truncate(reason) : 'No reason provided';

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex w-full flex-col gap-3 px-6 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-amber-900">
              Support Mode: TENANT {tenantId}
            </span>
            <ReadOnlyBadge />
            <SupportAuditBadge />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-amber-800">
            <span>Entered: {formattedEnteredAt}</span>
            <span className="max-w-[520px] truncate">Reason: {displayedReason}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CopyCell value={tenantId} label="Tenant ID" />
            {correlationId && <CopyCell value={correlationId} label="Correlation ID" />}
          </div>
          {!SUPPORT_AUDIT_ENABLED && (
            <div className="text-xs font-medium text-amber-700">
              Auditing endpoint not implemented.
            </div>
          )}
        </div>
        <ExitSupportModeButton />
      </div>
    </div>
  );
}
