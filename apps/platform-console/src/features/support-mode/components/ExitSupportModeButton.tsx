import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@/features/tenants/components/ConfirmDialog';
import { emitSupportAudit, useSupportModeStore } from '../store';

export function ExitSupportModeButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { tenantId, correlationId, reason, exit } = useSupportModeStore();

  const handleExit = async () => {
    if (tenantId) {
      await emitSupportAudit({
        tenantId,
        action: 'support_mode.exit',
        resourceType: 'tenant',
        resourceId: tenantId,
        correlationId,
        notes: reason,
      });
    }

    exit();
    useSupportModeStore.persist?.clearStorage?.();
    navigate('/support-mode');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
      >
        Exit Support Mode
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Exit Support Mode"
        description="This will end the current support session and clear the read-only context."
        confirmText="Exit"
        variant="destructive"
        onConfirm={handleExit}
      />
    </>
  );
}
