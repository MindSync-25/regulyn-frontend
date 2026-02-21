/**
 * ApiKeysListPage - Tenant-scoped API keys management
 * 
 * LIMITATION: No backend list endpoint exists yet.
 * This page provides create/rotate/revoke actions only.
 * A full list view requires GET /api-keys endpoint implementation.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, Info, AlertTriangle } from 'lucide-react';
import { createApiKey, rotateApiKey, revokeApiKey, type ApiKeyCreateRequest } from '@/lib/api/identity';
import { toast } from 'sonner';

export function ApiKeysListPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createdKey, setCreatedKey] = useState<{ keyName: string; apiKey: string } | null>(null);
  const [rotateApiKeyId, setRotateApiKeyId] = useState('');
  const [rotateKeyName, setRotateKeyName] = useState('');
  const [rotateExpiresAt, setRotateExpiresAt] = useState('');
  const [revokeApiKeyId, setRevokeApiKeyId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

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
      setRotateApiKeyId('');
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
      setRevokeApiKeyId('');
      setRevokeReason('');
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

      {/* Backend Limitation Notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <Info className="h-6 w-6 shrink-0 text-amber-600" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-amber-900">
              API Keys List View Not Available
            </h3>
            <p className="mt-2 text-sm text-amber-800">
              The backend does not currently expose a GET /api-keys endpoint for listing keys.
              You can create new keys, but the list view requires backend implementation.
            </p>
            <p className="mt-3 text-sm text-amber-800">
              <span className="font-medium">Available actions:</span> Create, Rotate (by ID), Revoke (by ID)
            </p>
            <p className="mt-2 text-xs text-amber-700">
              To rotate or revoke a key, you'll need the API Key ID from creation time or audit logs.
            </p>
          </div>
        </div>
      </div>

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

      {/* Rotate/Revoke by ID (since no list endpoint) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Rotate API Key (by ID)</h2>
          <p className="mt-1 text-xs text-gray-600">Requires API key ID (from creation time or audit logs).</p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">API Key ID</label>
              <input
                type="text"
                value={rotateApiKeyId}
                onChange={(e) => setRotateApiKeyId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="UUID"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Key Name</label>
              <input
                type="text"
                value={rotateKeyName}
                onChange={(e) => setRotateKeyName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Production API Key"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Expiration (optional)</label>
              <input
                type="datetime-local"
                value={rotateExpiresAt}
                onChange={(e) => setRotateExpiresAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              disabled={rotateMutation.isPending || !rotateApiKeyId || !rotateKeyName}
              onClick={() =>
                rotateMutation.mutate({
                  apiKeyId: rotateApiKeyId,
                  request: {
                    keyName: rotateKeyName,
                    expiresAt: rotateExpiresAt || undefined,
                  },
                })
              }
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {rotateMutation.isPending ? 'Rotating...' : 'Rotate Key'}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Revoke API Key (by ID)</h2>
          <p className="mt-1 text-xs text-gray-600">Revocation cannot be undone.</p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">API Key ID</label>
              <input
                type="text"
                value={revokeApiKeyId}
                onChange={(e) => setRevokeApiKeyId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="UUID"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Reason (optional)</label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Key compromised"
              />
            </div>

            <button
              type="button"
              disabled={revokeMutation.isPending || !revokeApiKeyId}
              onClick={() => revokeMutation.mutate({ apiKeyId: revokeApiKeyId, reason: revokeReason || undefined })}
              className="mt-2 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Revoke Key'}
            </button>
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <CreateApiKeyDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSubmit={request => createMutation.mutate(request)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Technical Details */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="text-sm font-medium text-gray-900">Backend Endpoints</h3>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Available
            </span>
            <code className="text-xs">POST /api-keys</code> - Create key
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Available
            </span>
            <code className="text-xs">POST /api-keys/{'{apiKeyId}'}/rotate</code> - Rotate key
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Available
            </span>
            <code className="text-xs">POST /api-keys/{'{apiKeyId}'}/revoke</code> - Revoke key
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              Missing
            </span>
            <code className="text-xs">GET /api-keys</code> - List keys (not implemented)
          </div>
        </div>
      </div>
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
