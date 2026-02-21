import { SUPPORT_AUDIT_ENABLED } from '@/config/env';

interface SupportAuditBadgeProps {
  compact?: boolean;
}

export function SupportAuditBadge({ compact }: SupportAuditBadgeProps) {
  if (SUPPORT_AUDIT_ENABLED) {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ${compact ? 'text-[11px]' : ''}`}>
        Auditing On
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ${compact ? 'text-[11px]' : ''}`}>
      Auditing Off
    </span>
  );
}
