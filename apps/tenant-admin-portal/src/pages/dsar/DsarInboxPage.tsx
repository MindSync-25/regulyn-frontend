/**
 * DsarInboxPage - DSAR Operations inbox with server-side pagination & filters.
 * Backend: dsar-grievance-service
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Inbox, Filter, RefreshCw } from 'lucide-react';
import { StandardDataTable, type Column } from '@/components/shared/StandardDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchDsars, type DsarDetailResponse } from '@/lib/api/dsar';

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

type SlaStatus = 'ON_TRACK' | 'NEARING_BREACH' | 'BREACHED' | 'UNKNOWN';

function getSlaStatus(dsar: DsarDetailResponse): SlaStatus {
  if (dsar.slaBreached === true) return 'BREACHED';
  if (!dsar.dueAt) return 'UNKNOWN';

  const due = new Date(dsar.dueAt).getTime();
  if (Number.isNaN(due)) return 'UNKNOWN';

  const now = Date.now();
  const remainingMs = due - now;

  if (remainingMs < 0) return 'BREACHED';

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (remainingMs <= sevenDaysMs) return 'NEARING_BREACH';

  return 'ON_TRACK';
}

function SlaBadge({ dsar }: { dsar: DsarDetailResponse }) {
  const sla = getSlaStatus(dsar);
  if (sla === 'BREACHED') return <Badge variant="destructive">Breached</Badge>;
  if (sla === 'NEARING_BREACH') return <Badge className="bg-amber-100 text-amber-900">Nearing</Badge>;
  if (sla === 'ON_TRACK') return <Badge className="bg-green-100 text-green-900">On track</Badge>;
  return <Badge variant="secondary">N/A</Badge>;
}

export function DsarInboxPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState('');
  const [requestType, setRequestType] = useState('');
  const [dataPrincipalId, setDataPrincipalId] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [showFilters, setShowFilters] = useState(true);

  const dsarsQuery = useQuery({
    queryKey: ['dsar-inbox', { status, requestType, dataPrincipalId, page, size }],
    queryFn: () =>
      searchDsars({
        status: status || undefined,
        requestType: requestType || undefined,
        dataPrincipalId: dataPrincipalId || undefined,
        page,
        size,
      }),
  });

  const columns: Column<DsarDetailResponse>[] = useMemo(
    () => [
      {
        key: 'dsarId',
        header: 'DSAR ID',
        render: (row) => <span className="font-mono text-xs">{row.dsarId}</span>,
      },
      {
        key: 'requestType',
        header: 'Type',
        render: (row) => <Badge variant="secondary">{row.requestType}</Badge>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge>{row.status}</Badge>,
      },
      {
        key: 'sla',
        header: 'SLA',
        render: (row) => <SlaBadge dsar={row} />,
      },
      {
        key: 'dueAt',
        header: 'Due',
        render: (row) => <span className="text-sm text-gray-700">{formatDate(row.dueAt)}</span>,
      },
      {
        key: 'assignedTo',
        header: 'Assignee',
        render: (row) => (row.assignedTo ? <span className="font-mono text-xs">{row.assignedTo}</span> : '-'),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="h-6 w-6 text-gray-900" />
            <h1 className="text-2xl font-bold text-gray-900">DSAR Inbox</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">Tenant-scoped DSAR requests with SLA indicators</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters((s) => !s)}>
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            variant="outline"
            onClick={() => dsarsQuery.refetch()}
            disabled={dsarsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${dsarsQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <Input
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                placeholder="e.g., RECEIVED"
              />
              <p className="mt-1 text-xs text-gray-500">Filter supported by backend: `status`</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Request Type</label>
              <Input
                value={requestType}
                onChange={(e) => {
                  setRequestType(e.target.value);
                  setPage(0);
                }}
                placeholder="e.g., ACCESS"
              />
              <p className="mt-1 text-xs text-gray-500">Filter supported by backend: `requestType`</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Requester (Data Principal ID)</label>
              <Input
                value={dataPrincipalId}
                onChange={(e) => {
                  setDataPrincipalId(e.target.value);
                  setPage(0);
                }}
                placeholder="UUID"
              />
              <p className="mt-1 text-xs text-gray-500">Filter supported by backend: `dataPrincipalId`</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Page Size</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={size}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isFinite(next) && next > 0) {
                    setSize(next);
                    setPage(0);
                  }
                }}
              />
              <p className="mt-1 text-xs text-gray-500">Backend supports `page`/`size`</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStatus('');
                setRequestType('');
                setDataPrincipalId('');
                setPage(0);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {dsarsQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-800">Failed to load DSARs: {(dsarsQuery.error as Error).message}</div>
        </div>
      )}

      <StandardDataTable
        data={dsarsQuery.data?.content ?? []}
        columns={columns}
        isLoading={dsarsQuery.isLoading}
        emptyMessage="No DSARs found for this tenant. Create one using your DSAR intake flow or seed data."
        onRowClick={(row) => navigate(`/dsar/${row.dsarId}`)}
      />

      {dsarsQuery.data && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {dsarsQuery.data.number + 1} of {dsarsQuery.data.totalPages} ({dsarsQuery.data.totalElements} total)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min((dsarsQuery.data?.totalPages ?? 1) - 1, p + 1))}
              disabled={page >= (dsarsQuery.data.totalPages - 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
        <div className="font-medium text-gray-900 mb-1">Backend endpoint</div>
        <div className="font-mono">GET /dsar?status&requestType&dataPrincipalId&page&size</div>
        <div className="mt-1 text-gray-600">
          Other filters (priority, assignee name, SLA bucket/date-range) are not exposed by the current backend and are therefore not implemented.
        </div>
      </div>
    </div>
  );
}

export default DsarInboxPage;
