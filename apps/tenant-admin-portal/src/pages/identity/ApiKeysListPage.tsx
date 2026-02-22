/**
 * ApiKeysListPage - Tenant-scoped API keys management
 * 
 * LIMITATION: No backend list endpoint exists yet.
 * This page provides create/rotate/revoke actions only.
 * A full list view requires GET /api-keys endpoint implementation.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, AlertTriangle, KeyRound, RefreshCw, XCircle } from 'lucide-react';
import { createApiKey, rotateApiKey, revokeApiKey, getApiKeys, type ApiKeyCreateRequest, type ApiKeyListItem } from '@/lib/api/identity';
import { toast } from 'sonner';

export function ApiKeysListPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createdKey, setCreatedKey] = useState<{ keyName: string; apiKey: string } | null>(null);
  const [rotateTarget, setRotateTarget] = useState<ApiKeyListItem | null>(null);
  const [rotateKeyName, setRotateKeyName] = useState('');
  const [rotateExpiresAt, setRotateExpiresAt] = useState('');

  // Fetch existing API keys
  const keysQuery = useQuery({
    queryKey: ['api-keys'],
    queryFn: getApiKeys,
  });

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: (request: ApiKeyCreateRequest) => {
      const idempotencyKey = `create-apikey-${Date.now()}-${Math.random()}`;
      return createApiKey(request, idempotencyKey);
    },
    onSuccess: data => {
      toast.success(`API key "${data.keyName}" created`);
      setCreatedKey({ keyName: data.keyName, apiKey: data.apiKey });
      setShowCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to create API key: ${err.message}`);
    },
  });

  const rotateMutation = useMutation({
    mutationFn: ({ apiKeyId, request }: { apiKeyId: string; request: ApiKeyCreateRequest }) => {
      const idempotencyKey = `rotate-apikey-${Date.now()}-${Math.random()}`;
      return rotateApiKey(apiKeyId, request, idempotencyKey);
    },
    onSuccess: data => {
      toast.success(`API key "${data.keyName}" rotated`);
      setCreatedKey({ keyName: data.keyName, apiKey: data.apiKey });
      setRotateTarget(null);
      setRotateKeyName('');
      setRotateExpiresAt('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to rotate API key: ${err.message}`);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: ({ apiKeyId, reason }: { apiKeyId: string; reason?: string }) => {
      return revokeApiKey(apiKeyId, reason ? { reason } : undefined);
    },
    onSuccess: () => {
      toast.success('API key revoked');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to revoke API key: ${err.message}`);
    },
  });

  const handleCopyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey.apiKey);
      toast.success('API key copied to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage API keys for programmatic access to Regulyn services
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create API Key
        </button>
      </div>

      {/* API Keys List */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">All API Keys</h2>
          {keysQuery.data && (
            <span className="ml-auto text-xs text-gray-500">{keysQuery.data.length} key{keysQuery.data.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {keysQuery.isLoading && (
          <div className="p-8 text-center text-sm text-gray-500">Loading API keys…</div>
        )}
        {keysQuery.error && (
          <div className="p-8 text-center text-sm text-red-600">Failed to load API keys: {(keysQuery.error as Error).message}</div>
        )}
        {keysQuery.data && keysQuery.data.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">No API keys yet. Create one to get started.</div>
        )}
        {keysQuery.data && keysQuery.data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Prefix</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Ver.</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
                <th className="text-left px-4 py-3 font-medium">Last Used</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keysQuery.data.map((key) => {
                const isRevoked = !!key.revokedAt;
                const isExpired = !isRevoked && !!key.expiresAt && new Date(key.expiresAt) < new Date();
                const isActive = !isRevoked && !isExpired && key.enabled;
                return (
                  <tr key={key.apiKeyId} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{key.keyName}</div>
                      <div className="text-xs text-gray-400 font-mono">{key.apiKeyId.slice(0, 8)}…</div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{key.prefix ?? '—'}</code>
                    </td>
                    <td className="px-4 py-3">
                      {isRevoked ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Revoked</span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Expired</span>
                      ) : isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Disabled</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">v{key.keyVersion}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{key.expiresAt ? new Date(key.expiresAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">
                      {!isRevoked && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setRotateTarget(key); setRotateKeyName(key.keyName); setRotateExpiresAt(''); }}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                          >
                            <RefreshCw className="h-3 w-3" /> Rotate
                          </button>
                          <button
                            type="button"
                            disabled={revokeMutation.isPending}
                            onClick={() => {
                              if (confirm(`Revoke "${key.keyName}"? This cannot be undone.`)) {
                                revokeMutation.mutate({ apiKeyId: key.apiKeyId, reason: undefined });
                              }
                            }}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" /> Revoke
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Rotate Dialog */}
      {rotateTarget && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setRotateTarget(null)}>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Rotate API Key</h3>
                <p className="mt-1 text-sm text-gray-500">Rotating <strong>{rotateTarget.keyName}</strong> will immediately invalidate the old key.</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Key Name</label>
                  <input
                    type="text"
                    value={rotateKeyName}
                    onChange={e => setRotateKeyName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiration (optional)</label>
                  <input
                    type="datetime-local"
                    value={rotateExpiresAt}
                    onChange={e => setRotateExpiresAt(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setRotateTarget(null)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button
                    type="button"
                    disabled={rotateMutation.isPending || !rotateKeyName}
                    onClick={() => rotateMutation.mutate({ apiKeyId: rotateTarget.apiKeyId, request: { keyName: rotateKeyName, expiresAt: rotateExpiresAt || undefined } })}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {rotateMutation.isPending ? 'Rotating…' : 'Rotate Key'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Created Key Display (show once) */}
      {createdKey && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 shrink-0 text-green-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900">
                API Key Created: {createdKey.keyName}
              </h3>
              <p className="mt-2 text-sm text-green-800">
                <strong>⚠️ Save this key now</strong> - it will not be shown again.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <code className="flex-1 rounded bg-white p-3 font-mono text-xs text-gray-900 border border-green-300">
                  {createdKey.apiKey}
                </code>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCreatedKey(null)}
                className="mt-4 text-sm text-green-700 hover:text-green-800 underline"
              >
                I've saved the key, dismiss this message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <CreateApiKeyDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSubmit={request => createMutation.mutate(request)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

// Create Dialog Component
interface CreateApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ApiKeyCreateRequest) => void;
  isLoading: boolean;
}

function CreateApiKeyDialog({ isOpen, onClose, onSubmit, isLoading }: CreateApiKeyDialogProps) {
  const [keyName, setKeyName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      keyName,
      expiresAt: expiresAt || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Create API Key</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="keyName" className="block text-sm font-medium text-gray-700">
                Key Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="keyName"
                required
                value={keyName}
                onChange={e => setKeyName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Production API Key"
              />
            </div>
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                Expiration Date (optional)
              </label>
              <input
                type="datetime-local"
                id="expiresAt"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty for no expiration
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ApiKeysListPage;
