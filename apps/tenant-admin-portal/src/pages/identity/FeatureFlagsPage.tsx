/**
 * FeatureFlagsPage - Tenant feature flags management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, Info } from 'lucide-react';
import { getFeatureFlags, upsertFeatureFlag, type FeatureFlag, type FeatureFlagRequest } from '@/lib/api/identity';
import { toast } from 'sonner';

export function FeatureFlagsPage() {
  const queryClient = useQueryClient();

  // Fetch feature flags
  const { data: flags, isLoading, error } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: getFeatureFlags,
  });

  // Update feature flag mutation
  const updateMutation = useMutation({
    mutationFn: ({ flagKey, request }: { flagKey: string; request: FeatureFlagRequest }) => {
      return upsertFeatureFlag(flagKey, request);
    },
    onSuccess: (data) => {
      toast.success(`Feature flag "${data.flagKey}" updated`);
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to update feature flag: ${err.message}`);
    },
  });

  const handleToggle = (flag: FeatureFlag) => {
    updateMutation.mutate({
      flagKey: flag.flagKey,
      request: {
        enabled: !flag.enabled,
        value: flag.value,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
          <p className="mt-1 text-sm text-gray-600">Loading...</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-800">Failed to load feature flags: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure optional features and capabilities for your tenant
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Feature flags control tenant-specific functionality</p>
            <p className="mt-1">
              Changes take effect immediately. Disabling a feature may affect running processes.
            </p>
          </div>
        </div>
      </div>

      {/* Flags List */}
      {flags && flags.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <Flag className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm text-gray-600">No feature flags configured</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flags?.map(flag => (
            <div
              key={flag.flagKey}
              className="rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-gray-900">{flag.flagKey}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        flag.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {flag.value !== null && flag.value !== undefined && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Value:</p>
                      <pre className="mt-1 rounded bg-gray-50 p-2 text-xs text-gray-700">
                        {JSON.stringify(flag.value, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(flag)}
                    disabled={updateMutation.isPending}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      flag.enabled
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {flag.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Endpoint Info */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="text-sm font-medium text-gray-900">Backend Endpoints</h3>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Available
            </span>
            <code className="text-xs">GET /tenants/feature-flags</code> - List flags
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Available
            </span>
            <code className="text-xs">PUT /tenants/feature-flags/{'{flagKey}'}</code> - Upsert flag
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-600">
          RBAC: TENANT_ADMIN role required
        </p>
      </div>
    </div>
  );
}

export default FeatureFlagsPage;
