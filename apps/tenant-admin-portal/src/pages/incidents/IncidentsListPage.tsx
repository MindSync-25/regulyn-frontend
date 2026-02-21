/**
 * IncidentsListPage - Incident & breach management list (server-side pagination & filters).
 * Backend: incident-breach-service
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Filter, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { StandardDataTable, type Column } from '@/components/shared/StandardDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  createIncident,
  listIncidents,
  type CreateIncidentRequest,
  type IncidentDetailsResponse,
  type IncidentSeverity,
} from '@/lib/api/incidentBreach';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'CRITICAL') return <Badge className="bg-red-100 text-red-900">CRITICAL</Badge>;
  if (severity === 'HIGH') return <Badge className="bg-amber-100 text-amber-900">HIGH</Badge>;
  if (severity === 'MED') return <Badge className="bg-blue-100 text-blue-900">MED</Badge>;
  if (severity === 'LOW') return <Badge variant="secondary">LOW</Badge>;
  return <Badge variant="secondary">{severity}</Badge>;
}

export function IncidentsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [showFilters, setShowFilters] = useState(true);

  const incidentsQuery = useQuery({
    queryKey: ['incidents', { status, severity, page, size }],
    queryFn: () =>
      listIncidents({
        status: status || undefined,
        severity: severity || undefined,
        page,
        size,
      }),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createSeverity, setCreateSeverity] = useState<IncidentSeverity>('LOW');
  const [createSummary, setCreateSummary] = useState('');
  const [createMetadataJson, setCreateMetadataJson] = useState('');

  const createMutation = useMutation({
    mutationFn: (request: CreateIncidentRequest) => createIncident(request),
    onSuccess: async (res) => {
      toast.success('Incident created');
      setCreateOpen(false);
      setCreateSummary('');
      setCreateMetadataJson('');
      await queryClient.invalidateQueries({ queryKey: ['incidents'] });
      navigate(`/incidents/${res.incidentId}`);
    },
    onError: (err: any) => {
      toast.error(`Failed to create incident: ${err?.message ?? String(err)}`);
    },
  });

  const columns: Column<IncidentDetailsResponse>[] = useMemo(
    () => [
      {
        key: 'incidentId',
        header: 'Incident ID',
        render: (row) => <span className="font-mono text-xs">{row.incidentId}</span>,
      },
      {
        key: 'severity',
        header: 'Severity',
        render: (row) => <SeverityBadge severity={row.severity} />,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge>{row.status}</Badge>,
      },
      {
        key: 'notifyDueAt',
        header: 'Notify Due',
        render: (row) => (
          <div className="space-y-1">
            <div className="text-sm text-gray-700">{formatDate(row.notifyDueAt)}</div>
            {row.notifyOverdue ? <Badge variant="destructive">Overdue</Badge> : null}
          </div>
        ),
      },
      {
        key: 'openedAt',
        header: 'Opened',
        render: (row) => <span className="text-sm text-gray-700">{formatDate(row.openedAt)}</span>,
      },
      {
        key: 'updatedAt',
        header: 'Updated',
        render: (row) => <span className="text-sm text-gray-700">{formatDate(row.updatedAt)}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-gray-900" />
            <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">Security incidents and breach handling (tenant-scoped)</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters((s) => !s)}>
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>

          <Button variant="outline" onClick={() => incidentsQuery.refetch()} disabled={incidentsQuery.isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${incidentsQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Incident
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Incident</DialogTitle>
                <DialogDescription>Fields are strictly from the backend CreateIncidentRequest DTO.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="severity">Severity *</Label>
                  <Input
                    id="severity"
                    value={createSeverity}
                    onChange={(e) => setCreateSeverity(e.target.value as IncidentSeverity)}
                    placeholder="LOW | MED | HIGH | CRITICAL"
                  />
                  <p className="mt-1 text-xs text-gray-500">Allowed: LOW, MED, HIGH, CRITICAL</p>
                </div>

                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea id="summary" value={createSummary} onChange={(e) => setCreateSummary(e.target.value)} placeholder="Short description" />
                </div>

                <div>
                  <Label htmlFor="metadata">Metadata (optional JSON object)</Label>
                  <Textarea
                    id="metadata"
                    value={createMetadataJson}
                    onChange={(e) => setCreateMetadataJson(e.target.value)}
                    placeholder='e.g., {"source":"siem","ticket":"INC-123"}'
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    let metadata: Record<string, unknown> | undefined;
                    if (createMetadataJson.trim()) {
                      try {
                        const parsed = JSON.parse(createMetadataJson);
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                          metadata = parsed as Record<string, unknown>;
                        } else {
                          throw new Error('metadata must be a JSON object');
                        }
                      } catch (e: any) {
                        toast.error(`Invalid metadata JSON: ${e?.message ?? String(e)}`);
                        return;
                      }
                    }

                    const request: CreateIncidentRequest = {
                      severity: createSeverity,
                      summary: createSummary || undefined,
                      metadata,
                    };

                    createMutation.mutate(request);
                  }}
                  disabled={createMutation.isPending || !createSeverity}
                >
                  {createMutation.isPending ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                placeholder="e.g., OPEN"
              />
              <p className="mt-1 text-xs text-gray-500">Filter supported by backend: `status`</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
              <Input
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value);
                  setPage(0);
                }}
                placeholder="LOW | MED | HIGH | CRITICAL"
              />
              <p className="mt-1 text-xs text-gray-500">Filter supported by backend: `severity`</p>
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

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatus('');
                  setSeverity('');
                  setPage(0);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {incidentsQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-800">Failed to load incidents: {(incidentsQuery.error as Error).message}</div>
        </div>
      )}

      <StandardDataTable
        data={incidentsQuery.data?.content ?? []}
        columns={columns}
        isLoading={incidentsQuery.isLoading}
        emptyMessage="No incidents found for this tenant. Create one using the New Incident action or seed data."
        onRowClick={(row) => navigate(`/incidents/${row.incidentId}`)}
      />

      {incidentsQuery.data && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {incidentsQuery.data.number + 1} of {incidentsQuery.data.totalPages} ({incidentsQuery.data.totalElements} total)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min((incidentsQuery.data?.totalPages ?? 1) - 1, p + 1))}
              disabled={page >= incidentsQuery.data.totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
        <div className="font-medium text-gray-900 mb-1">Backend endpoint</div>
        <div className="font-mono">GET /incidents?status&severity&page&size</div>
        <div className="mt-1 text-gray-600">Search, date-range filters, and assignee filters are not exposed by the current backend and are therefore not implemented.</div>
      </div>
    </div>
  );
}

export default IncidentsListPage;
