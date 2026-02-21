import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Trash2, Filter, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { StandardDataTable, type Column } from '@/components/shared/StandardDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/api/http';
import {
  createDeletion,
  searchDeletions,
  type CreateDeletionRequest,
  type DeletionDetailResponse,
} from '@/lib/api/retentionDeletion';

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatAgeDays(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  return `${days}d`;
}

type SlaStatus = 'ON_TRACK' | 'NEARING_BREACH' | 'BREACHED' | 'UNKNOWN';

function getSlaStatus(item: DeletionDetailResponse): SlaStatus {
  if (!item.dueAt) return 'UNKNOWN';
  const due = new Date(item.dueAt).getTime();
  if (Number.isNaN(due)) return 'UNKNOWN';

  const remainingMs = due - Date.now();
  if (remainingMs < 0) return 'BREACHED';

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (remainingMs <= sevenDaysMs) return 'NEARING_BREACH';

  return 'ON_TRACK';
}

function SlaBadge({ deletion }: { deletion: DeletionDetailResponse }) {
  const sla = getSlaStatus(deletion);
  if (sla === 'BREACHED') return <Badge variant="destructive">Breached</Badge>;
  if (sla === 'NEARING_BREACH') return <Badge className="bg-amber-100 text-amber-900">Nearing</Badge>;
  if (sla === 'ON_TRACK') return <Badge className="bg-green-100 text-green-900">On track</Badge>;
  return <Badge variant="secondary">N/A</Badge>;
}

function safeJsonOrNull(value: string): Record<string, unknown> | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = JSON.parse(trimmed);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  throw new Error('Metadata must be a JSON object');
}

export function DeletionsListPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [showFilters, setShowFilters] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);

  // Create form state (fields strictly from CreateDeletionRequest)
  const [subjectId, setSubjectId] = useState('');
  const [subjectType, setSubjectType] = useState('');
  const [entityType, setEntityType] = useState('');
  const [reason, setReason] = useState('');
  const [source, setSource] = useState('ADMIN');
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [proofRequired, setProofRequired] = useState(true);
  const [dueInDays, setDueInDays] = useState<number>(30);
  const [metadataJson, setMetadataJson] = useState('');

  const deletionsQuery = useQuery({
    queryKey: ['deletions', { status, page, size }],
    queryFn: () =>
      searchDeletions({
        status: status || undefined,
        page,
        size,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (req: CreateDeletionRequest) => createDeletion(req),
    onSuccess: (res) => {
      toast.success(`Deletion created: ${res.deletionId}`);
      setCreateOpen(false);
      setSubjectId('');
      setSubjectType('');
      setEntityType('');
      setReason('');
      setSource('ADMIN');
      setRequiresApproval(true);
      setProofRequired(true);
      setDueInDays(30);
      setMetadataJson('');
      navigate(`/retention/deletions/${res.deletionId}`);
    },
  });

  const columns: Column<DeletionDetailResponse>[] = useMemo(
    () => [
      {
        key: 'deletionId',
        header: 'Deletion ID',
        render: (row) => <span className="font-mono text-xs">{row.deletionId}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge>{row.status}</Badge>,
      },
      {
        key: 'sla',
        header: 'SLA',
        render: (row) => <SlaBadge deletion={row} />,
      },
      {
        key: 'subjectType',
        header: 'Subject',
        render: (row) => <Badge variant="secondary">{row.subjectType}</Badge>,
      },
      {
        key: 'entityType',
        header: 'Entity',
        render: (row) => <span className="text-sm text-gray-800">{row.entityType}</span>,
      },
      {
        key: 'createdAt',
        header: 'Age',
        render: (row) => <span className="text-sm text-gray-700">{formatAgeDays(row.createdAt)}</span>,
      },
      {
        key: 'dueAt',
        header: 'Due',
        render: (row) => <span className="text-sm text-gray-700">{formatDate(row.dueAt)}</span>,
      },
    ],
    []
  );

  function handleCreateDeletion() {
    let metadata: Record<string, unknown> | null = null;
    try {
      metadata = safeJsonOrNull(metadataJson);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid metadata JSON');
      return;
    }

    const req: CreateDeletionRequest = {
      subjectId,
      subjectType,
      entityType,
      reason: reason || undefined,
      source,
      requiresApproval,
      proofRequired,
      dueInDays,
      metadata,
    };

    createMutation.mutate(req);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-gray-900" />
            <h1 className="text-2xl font-bold text-gray-900">Deletion Requests</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">Tenant-scoped deletion workflows with server-side pagination</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters((s) => !s)}>
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button variant="outline" onClick={() => deletionsQuery.refetch()} disabled={deletionsQuery.isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${deletionsQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">Status</Label>
              <Input
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                placeholder="e.g., PENDING"
              />
              <p className="mt-1 text-xs text-gray-500">Filter supported by backend: `status`</p>
            </div>

            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">Page Size</Label>
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
                  setPage(0);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletionsQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-800">Failed to load deletions: {getErrorMessage(deletionsQuery.error)}</div>
        </div>
      )}

      <StandardDataTable
        data={deletionsQuery.data?.content ?? []}
        columns={columns}
        isLoading={deletionsQuery.isLoading}
        emptyMessage="No deletion requests found for this tenant. Create one using your backend creation endpoint(s) or seed data."
        onRowClick={(row) => navigate(`/retention/deletions/${row.deletionId}`)}
      />

      {deletionsQuery.data && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {deletionsQuery.data.number + 1} of {deletionsQuery.data.totalPages} ({deletionsQuery.data.totalElements} total)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min((deletionsQuery.data?.totalPages ?? 1) - 1, p + 1))}
              disabled={page >= deletionsQuery.data.totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
        <div className="font-medium text-gray-900 mb-1">Backend endpoint</div>
        <div className="font-mono">GET /deletions?status&page&size</div>
        <div className="mt-1 text-gray-600">
          Other filters (system, date range, requester) are not implemented because the current backend controller only exposes `status` plus pageable.
        </div>
      </div>

      {/* Create deletion dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Deletion Request</DialogTitle>
            <DialogDescription>
              Creates a new deletion workflow (server-side). Uses <span className="font-mono">X-Idempotency-Key</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="subjectId">Subject ID *</Label>
              <Input id="subjectId" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="UUID" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subjectType">Subject Type *</Label>
                <Input id="subjectType" value={subjectType} onChange={(e) => setSubjectType(e.target.value)} placeholder="CUSTOMER" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entityType">Entity Type *</Label>
                <Input id="entityType" value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="orders" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="ADMIN" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueInDays">Due in days</Label>
                <Input
                  id="dueInDays"
                  type="number"
                  min={1}
                  value={dueInDays}
                  onChange={(e) => setDueInDays(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Requires Approval</Label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} />
                  <span className="text-sm text-gray-700">Approval required</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Proof Required</Label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" checked={proofRequired} onChange={(e) => setProofRequired(e.target.checked)} />
                  <span className="text-sm text-gray-700">Manual proof may be required</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata (JSON object)</Label>
              <Textarea id="metadata" value={metadataJson} onChange={(e) => setMetadataJson(e.target.value)} placeholder='{"key":"value"}' />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateDeletion}
              disabled={createMutation.isPending || !subjectId || !subjectType || !entityType || !source}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DeletionsListPage;
