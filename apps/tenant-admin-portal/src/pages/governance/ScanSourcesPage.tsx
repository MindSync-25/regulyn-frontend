/**
 * ScanSourcesPage — Scanner Data Sources Registry
 * Backend: scanner-service (port 8094)
 * Route: /app/governance/scanner/sources
 * RBAC: TENANT_ADMIN, DPO
 *
 * Features:
 *  - List all scan sources with type/status/owner/lastScanned
 *  - Disable source action (TENANT_ADMIN only — POST /scanner/sources/:id/disable)
 *  - Link to runs for a specific source
 *
 * Limitations:
 *  - Create source UI not provided (configuration is admin-only CLI/API operation)
 *  - No re-enable endpoint in the backend; disable is one-way from this UI
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  RefreshCw,
  Play,
  Power,
  Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { ROLES } from '@/lib/auth/roles';
import { listScanSources, disableScanSource, type ScanSource } from '@/lib/api/scanner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(val?: string | null) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleString();
}

function SourceStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Badge variant="outline">—</Badge>;
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-900',
    DISABLED: 'bg-gray-100 text-gray-700',
    ERROR: 'bg-red-100 text-red-900',
    PENDING: 'bg-yellow-100 text-yellow-900',
  };
  const cls = map[status] ?? 'bg-blue-100 text-blue-900';
  return <Badge className={cls}>{status}</Badge>;
}

function SourceTypeBadge({ type }: { type?: string | null }) {
  if (!type) return <span className="text-muted-foreground">—</span>;
  const map: Record<string, string> = {
    DATABASE: 'bg-blue-100 text-blue-900',
    S3: 'bg-orange-100 text-orange-900',
    API: 'bg-violet-100 text-violet-900',
    FILE_SHARE: 'bg-teal-100 text-teal-900',
  };
  const cls = map[type] ?? 'bg-gray-100 text-gray-700';
  return <Badge variant="outline" className={cls}>{type}</Badge>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScanSourcesPage() {
  const navigate = useNavigate();
  const roles = useAuthStore(state => state.roles);
  const queryClient = useQueryClient();
  const isTenantAdmin = roles.includes(ROLES.TENANT_ADMIN);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [disablingId, setDisablingId] = useState<string | null>(null);

  const sourcesQuery = useQuery({
    queryKey: ['scan-sources', { status: statusFilter }],
    queryFn: () => listScanSources(statusFilter ? { status: statusFilter } : undefined),
  });

  const disableMutation = useMutation({
    mutationFn: (sourceId: string) => disableScanSource(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-sources'] });
      setDisablingId(null);
    },
    onError: () => setDisablingId(null),
  });

  const allSources: ScanSource[] = sourcesQuery.data ?? [];

  const filtered = allSources.filter(s => {
    const q = search.toLowerCase();
    const nameMatch = !q || s.sourceName?.toLowerCase().includes(q) || s.baseUrl?.toLowerCase().includes(q);
    return nameMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-teal-600" />
            Scan Sources
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Data sources registered for privacy scanning
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)}>
            <Filter className="h-4 w-4 mr-1" /> Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sourcesQuery.refetch()}
            disabled={sourcesQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/governance/scanner/runs')}
          >
            <Play className="h-4 w-4 mr-1" /> View Runs
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs mb-1 block">Search by name / host</Label>
              <Input
                placeholder="e.g. prod-db, s3.amazonaws.com"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Status</Label>
              <select
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED</option>
                <option value="ERROR">ERROR</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {!sourcesQuery.isLoading && !sourcesQuery.isError && (
        <p className="text-sm text-muted-foreground">{filtered.length} source{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {/* Error */}
      {sourcesQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Failed to load scan sources</p>
          <p className="text-red-700 mt-1">
            {sourcesQuery.error instanceof Error ? sourcesQuery.error.message : 'Unexpected error.'}
          </p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => sourcesQuery.refetch()}>Retry</Button>
        </div>
      )}

      {/* Loading */}
      {sourcesQuery.isLoading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="animate-pulse h-20 rounded-lg border bg-gray-50" />)}
        </div>
      )}

      {/* Empty */}
      {!sourcesQuery.isLoading && !sourcesQuery.isError && filtered.length === 0 && (
        <div className="flex min-h-[250px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
          <div className="text-center p-6">
            <Database className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="font-semibold">No scan sources found</p>
            <p className="text-sm text-muted-foreground mt-1">Register data sources via the scanner-service API.</p>
          </div>
        </div>
      )}

      {/* Card Grid */}
      {!sourcesQuery.isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((src: ScanSource) => (
            <div key={src.sourceId} className="rounded-lg border bg-card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{src.sourceName}</div>
                  <div className="text-xs text-muted-foreground">{src.baseUrl ?? '—'}</div>
                </div>
                <SourceStatusBadge status={src.status} />
              </div>

              <div className="flex flex-wrap gap-2">
                <SourceTypeBadge type={src.sourceType} />
                {src.authType && src.authType !== 'NONE' && (
                  <Badge variant="outline" className="text-xs">{src.authType}</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-1 text-xs text-muted-foreground">
                <span>Created</span>
                <span className="text-right">{fmtDateTime(src.createdAt)}</span>
                <span>Updated</span>
                <span className="text-right">{fmtDateTime(src.updatedAt)}</span>
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/governance/scanner/runs?sourceId=${src.sourceId}`)}
                >
                  <Play className="h-3 w-3 mr-1" /> Runs
                </Button>
                {isTenantAdmin && src.status !== 'DISABLED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    disabled={disablingId === src.sourceId || disableMutation.isPending}
                    onClick={() => {
                      setDisablingId(src.sourceId);
                      disableMutation.mutate(src.sourceId);
                    }}
                  >
                    <Power className="h-3 w-3 mr-1" />
                    {disablingId === src.sourceId ? 'Disabling…' : 'Disable'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
