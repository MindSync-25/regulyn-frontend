import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plug, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api/http';
import { getConnector } from '@/lib/api/connectors';

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value}</div>
    </div>
  );
}

export function ConnectorDetailPage() {
  const navigate = useNavigate();
  const { connectorId } = useParams();

  const [metadataOpen, setMetadataOpen] = useState(false);

  const connectorQuery = useQuery({
    queryKey: ['connector', connectorId],
    enabled: Boolean(connectorId),
    queryFn: () => getConnector(connectorId as string),
  });

  const connector = connectorQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/retention/connectors')}
            className="px-0 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to connectors
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <Plug className="h-6 w-6 text-gray-900" />
            <h1 className="text-2xl font-bold text-gray-900">Connector</h1>
            {connector ? <Badge>{connector.status}</Badge> : <Badge variant="secondary">Loading…</Badge>}
          </div>

          {connectorId && <div className="font-mono text-xs text-gray-600">{connectorId}</div>}
        </div>

        <Button variant="outline" onClick={() => connectorQuery.refetch()} disabled={connectorQuery.isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${connectorQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {connectorQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-800">Failed to load connector: {getErrorMessage(connectorQuery.error)}</div>
        </div>
      )}

      {connector && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <KV label="Name" value={connector.connectorName} />
            <KV label="Type" value={connector.connectorType} />
            <KV label="Status" value={connector.status} />

            <KV label="Tenant" value={connector.tenantId} />
            <KV label="Base URL" value={connector.baseUrl ?? '-'} />
            <KV label="Auth Type" value={connector.authType ?? '-'} />

            <KV label="Auth Ref" value={connector.authRef ?? '-'} />
            <KV label="Created" value={formatDate(connector.createdAt)} />
            <KV label="Updated" value={formatDate(connector.updatedAt)} />
          </div>

          <div className="mt-6">
            <Button variant="outline" onClick={() => setMetadataOpen((s) => !s)}>
              {metadataOpen ? 'Hide' : 'Show'} metadata
            </Button>
            {metadataOpen && (
              <pre className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs overflow-auto">
                {JSON.stringify(connector.metadata, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
        <div className="font-medium text-gray-900 mb-1">Backend endpoint</div>
        <div className="font-mono">GET /connectors/{'{'}connectorId{'}'}</div>
      </div>
    </div>
  );
}

export default ConnectorDetailPage;
