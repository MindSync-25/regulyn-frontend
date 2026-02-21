/**
 * PlanLimitsPage - Tenant plan limits and usage tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Info, AlertCircle, Save } from 'lucide-react';
import { getPlanLimits, updatePlanLimits, type PlanLimitsRequest } from '@/lib/api/identity';
import { toast } from 'sonner';
import { useState } from 'react';

export function PlanLimitsPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<PlanLimitsRequest>({
    maxUsers: 0,
    dsarPerMonth: 0,
    exportsPerMonth: 0,
  });

  // Fetch plan limits
  const { data: limits, isLoading, error } = useQuery({
    queryKey: ['plan-limits'],
    queryFn: getPlanLimits,
  });

  // Update plan limits mutation
  const updateMutation = useMutation({
    mutationFn: (request: PlanLimitsRequest) => updatePlanLimits(request),
    onSuccess: () => {
      toast.success('Plan limits updated successfully');
      queryClient.invalidateQueries({ queryKey: ['plan-limits'] });
      setIsEditing(false);
    },
    onError: (err: Error) => {
      toast.error(`Failed to update plan limits: ${err.message}`);
    },
  });

  const handleEdit = () => {
    if (limits) {
      setEditValues({
        maxUsers: limits.maxUsers,
        dsarPerMonth: limits.dsarPerMonth,
        exportsPerMonth: limits.exportsPerMonth,
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(editValues);
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.min(Math.round((current / max) * 100), 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-amber-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan Limits</h1>
          <p className="mt-1 text-sm text-gray-600">Loading...</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan Limits</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-800">Failed to load plan limits: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!limits) return null;

  const userPercentage = getUsagePercentage(limits.enabledUsers, limits.maxUsers);
  const dsarPercentage = getUsagePercentage(limits.dsarCount, limits.dsarPerMonth);
  const exportPercentage = getUsagePercentage(limits.exportCount, limits.exportsPerMonth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan Limits & Usage</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor resource usage and manage plan limits
          </p>
        </div>
        {!isEditing && !limits.readOnly && (
          <button
            type="button"
            onClick={handleEdit}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit Limits
          </button>
        )}
      </div>

      {/* Read-Only Banner */}
      {limits.readOnly && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Read-Only Mode</p>
              {limits.readOnlyReason && (
                <p className="mt-1">{limits.readOnlyReason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Usage Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Users */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Enabled Users</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{limits.enabledUsers}</span>
              <span className="text-sm text-gray-600">/ {isEditing ? (
                <input
                  type="number"
                  value={editValues.maxUsers}
                  onChange={e => setEditValues({ ...editValues, maxUsers: parseInt(e.target.value) || 0 })}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              ) : limits.maxUsers}</span>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${userPercentage}%` }}
                />
              </div>
              <p className={`mt-1 text-xs font-medium ${getUsageColor(userPercentage)}`}>
                {userPercentage}% used
              </p>
            </div>
          </div>
        </div>

        {/* DSAR Per Month */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">DSAR This Month</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{limits.dsarCount}</span>
              <span className="text-sm text-gray-600">/ {isEditing ? (
                <input
                  type="number"
                  value={editValues.dsarPerMonth}
                  onChange={e => setEditValues({ ...editValues, dsarPerMonth: parseInt(e.target.value) || 0 })}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              ) : limits.dsarPerMonth}</span>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-purple-600 transition-all"
                  style={{ width: `${dsarPercentage}%` }}
                />
              </div>
              <p className={`mt-1 text-xs font-medium ${getUsageColor(dsarPercentage)}`}>
                {dsarPercentage}% used
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-500">Period: {limits.yearMonth}</p>
          </div>
        </div>

        {/* Exports Per Month */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Exports This Month</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{limits.exportCount}</span>
              <span className="text-sm text-gray-600">/ {isEditing ? (
                <input
                  type="number"
                  value={editValues.exportsPerMonth}
                  onChange={e => setEditValues({ ...editValues, exportsPerMonth: parseInt(e.target.value) || 0 })}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              ) : limits.exportsPerMonth}</span>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-600 transition-all"
                  style={{ width: `${exportPercentage}%` }}
                />
              </div>
              <p className={`mt-1 text-xs font-medium ${getUsageColor(exportPercentage)}`}>
                {exportPercentage}% used
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-500">Period: {limits.yearMonth}</p>
          </div>
        </div>
      </div>

      {/* Edit Actions */}
      {isEditing && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={updateMutation.isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">About Plan Limits</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Monthly limits reset on the 1st of each month</li>
              <li>Usage counts are updated in real-time</li>
              <li>Exceeding limits may block certain operations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Endpoint Info */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="text-sm font-medium text-gray-900">Backend Endpoints</h3>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Available
            </span>
            <code className="text-xs">GET /tenants/plan-limits</code> - Get limits
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Available
            </span>
            <code className="text-xs">PUT /tenants/plan-limits</code> - Update limits
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-600">
          RBAC: TENANT_ADMIN role required
        </p>
      </div>
    </div>
  );
}

export default PlanLimitsPage;
