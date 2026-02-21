import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plug, RefreshCw, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StandardDataTable, type Column } from '@/components/shared/StandardDataTable';
import { getErrorMessage, isApiError } from '@/lib/api/http';
import { listConnectors, type ConnectorResponse } from '@/lib/api/connectors';

export function ConnectorsListPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [q, setQ] = useState('');

  const connectorsQuery = useQuery({
    queryKey: ['connectors', { status, type, q }],
    queryFn: () =>
      listConnectors({
        status: status || undefined,
        type: type || undefined,
        q: q || undefined,
      }),
  });

  const columns: Column<ConnectorResponse>[] = useMemo(
    () => [
      {
        key: 'connectorId',
        header: 'Connector ID',
        render: (row) => <span className="font-mono text-xs">{row.connectorId}</span>,
      },
      {
        key: 'connectorName',
        header: 'Name',
        render: (row) => <span className="text-sm text-gray-900">{row.connectorName}</span>,
      },
      {
        key: 'connectorType',
        header: 'Type',
        render: (row) => <Badge variant="secondary">{row.connectorType}</Badge>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge>{row.status}</Badge>,
      },
    ],
    []
  );

  const errorHint = (() => {
    if (!connectorsQuery.error) return null;
    if (isApiError(connectorsQuery.error) && connectorsQuery.error.status === 403) {
      return (
        <div className="mt-2 text-xs text-red-700">
          Connector-service may require <span className="font-mono">CONNECTOR_AGENT</span> or <span className="font-mono">ADMIN</span> role (per backend).
          The tenant-admin portal roles may not map to backend <span className="font-mono">ADMIN</span>.
        </div>
      );
    }
    return null;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Plug className="h-6 w-6 text-gray-900" />
            <h1 className="text-2xl font-bold text-gray-900">Connectors (Read-only)</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">Registry view from connector-service (no write actions)</p>
        </div>
        <Button variant="outline" onClick={() => connectorsQuery.refetch()} disabled={connectorsQuery.isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${connectorsQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label className="block text-xs font-medium text-gray-700 mb-1">Status</Label>
            <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="ACTIVE" />
          </div>
          <div>
            <Label className="block text-xs font-medium text-gray-700 mb-1">Type</Label>
            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="SHOPIFY" />
          </div>
          <div className="md:col-span-2">
            <Label className="block text-xs font-medium text-gray-700 mb-1">Search</Label>
            <div className="flex gap-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="name contains…" />
              <Button variant="outline" onClick={() => connectorsQuery.refetch()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {connectorsQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-800">Failed to load connectors: {getErrorMessage(connectorsQuery.error)}</div>
          {errorHint}
        </div>
      )}

      <StandardDataTable
        data={connectorsQuery.data ?? []}
        columns={columns}
        isLoading={connectorsQuery.isLoading}
        emptyMessage="No connectors found (or you do not have access)."
        onRowClick={(row) => navigate(`/retention/connectors/${row.connectorId}`)}
      />

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
        <div className="font-medium text-gray-900 mb-1">Backend endpoints</div>
        <div className="font-mono">GET /connectors?status&type&q</div>
        <div className="font-mono">GET /connectors/{'{'}connectorId{'}'}</div>
        <div className="mt-2 text-gray-600">
          Note: Per backend security, connector-service may return 403 unless your user has the required role.
        </div>
      </div>
    </div>
  );
}

export default ConnectorsListPage;
