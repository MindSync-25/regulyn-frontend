import { useState } from 'react';
import type { TenantDetail } from '../types';
import {
  useActivateTenantMutation,
  useResumeTenantMutation,
  useSuspendTenantMutation,
} from '../hooks';
import { ConfirmDialog } from './ConfirmDialog';

interface TenantLifecycleActionsProps {
  tenant: TenantDetail;
}

export function TenantLifecycleActions({ tenant }: TenantLifecycleActionsProps) {
  const [confirmAction, setConfirmAction] = useState<'activate' | 'suspend' | 'resume' | null>(null);

  const activateMutation = useActivateTenantMutation();
  const suspendMutation = useSuspendTenantMutation();
  const resumeMutation = useResumeTenantMutation();

  const handleActivate = () => {
    activateMutation.mutate(tenant.tenantId);
  };

  const handleSuspend = () => {
    suspendMutation.mutate(tenant.tenantId);
  };

  const handleResume = () => {
    resumeMutation.mutate(tenant.tenantId);
  };

  const isLoading = activateMutation.isPending || suspendMutation.isPending || resumeMutation.isPending;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Lifecycle Actions</h3>
      <div className="flex gap-3">
        {tenant.status === 'DELETED' && (
          <span className="text-sm text-gray-500">No actions available for deleted tenants.</span>
        )}
        {tenant.status === 'DRAFT' && (
          <button
            onClick={() => setConfirmAction('activate')}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activateMutation.isPending ? 'Activating...' : 'Activate'}
          </button>
        )}

        {tenant.status === 'ACTIVE' && (
          <button
            onClick={() => setConfirmAction('suspend')}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suspendMutation.isPending ? 'Suspending...' : 'Suspend'}
          </button>
        )}

        {tenant.status === 'SUSPENDED' && (
          <button
            onClick={() => setConfirmAction('resume')}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resumeMutation.isPending ? 'Resuming...' : 'Resume'}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmAction === 'activate'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Confirm Activation"
        description={`Are you sure you want to activate tenant ${tenant.tenantId}? This will make the tenant operational.`}
        confirmText="Activate"
        onConfirm={handleActivate}
      />

      <ConfirmDialog
        open={confirmAction === 'suspend'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Confirm Suspension"
        description={`Are you sure you want to suspend tenant ${tenant.tenantId}? This will block all tenant operations.`}
        confirmText="Suspend"
        variant="destructive"
        onConfirm={handleSuspend}
      />

      <ConfirmDialog
        open={confirmAction === 'resume'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Confirm Resume"
        description={`Are you sure you want to resume tenant ${tenant.tenantId}? This will restore tenant operations.`}
        confirmText="Resume"
        onConfirm={handleResume}
      />
    </div>
  );
}
