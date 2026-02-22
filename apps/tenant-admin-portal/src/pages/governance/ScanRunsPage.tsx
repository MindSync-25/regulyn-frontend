/**
 * ScanRunsPage — Scanner Run History
 * Backend: scanner-service (port 8094)
 * Route: /app/governance/scanner/runs
 * RBAC: TENANT_ADMIN, DPO
 *
 * Features:
 *  - Paginated list of scan runs with status/source/started/duration filters
 *  - Row click → ScanRunDetailPage
 *
 * Limitations:
 *  - Trigger new scan run: not exposed here (backend side only)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlayCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { listScanRuns, listScanSources, type ScanRun } from '@/lib/api/scanner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(val?: string | null) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleString();
}

function durationLabel(startedAt?: string | null, completedAt?: string | null) {
  if (!startedAt || !completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return '—';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

function RunStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Badge variant="outline">—</Badge>;
  const map: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-900',
    RUNNING: 'bg-blue-100 text-blue-900',
    FAILED: 'bg-red-100 text-red-900',
    CANCELLED: 'bg-gray-100 text-gray-700',
    QUEUED: 'bg-yellow-100 text-yellow-900',
    PARTIAL: 'bg-orange-100 text-orange-900',
  };
  const cls = map[status] ?? 'bg-blue-100 text-blue-900';
  return <Badge className={cls}>{status}</Badge>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScanRunsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSourceId = searchParams.get('sourceId') ?? '';

  const [statusFilter, setStatusFilter] = useState('');
  const [sourceIdFilter, setSourceIdFilter] = useState(initialSourceId);
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  const sourcesQuery = useQuery({
    queryKey: ['scan-sources'],
    queryFn: () => listScanSources(),
  });

  const runsQuery = useQuery({
    queryKey: ['scan-runs', { status: statusFilter, sourceId: sourceIdFilter, page }],
    queryFn: () =>
      listScanRuns({
        status: statusFilter || undefined,
        sourceId: sourceIdFilter || undefined,
        page,
        size: 25,
      }),
  });

  const runsData = runsQuery.data;
  const runs: ScanRun[] = runsData?.content ?? [];
  const totalPages = runsData?.totalPages ?? 0;
  const totalElements = runsData?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-teal-600" />
            Scan Runs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Historical and in-progress scanner executions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)}>
            <Filter className="h-4 w-4 mr-1" /> Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runsQuery.refetch()}
            disabled={runsQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Source</Label>
              <select
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                value={sourceIdFilter}
                onChange={e => { setSourceIdFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Sources</option>
                {(sourcesQuery.data ?? []).map(s => (
                  <option key={s.sourceId} value={s.sourceId}>{s.sourceName}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Status</Label>
              <select
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Statuses</option>
                <option value="QUEUED">QUEUED</option>
                <option value="RUNNING">RUNNING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="FAILED">FAILED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {!runsQuery.isLoading && !runsQuery.isError && (
        <p className="text-sm text-muted-foreground">{totalElements} run{totalElements !== 1 ? 's' : ''}</p>
      )}

      {/* Error */}
      {runsQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Failed to load scan runs</p>
          <p className="text-red-700 mt-1">
            {runsQuery.error instanceof Error ? runsQuery.error.message : 'Unexpected error.'}
          </p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => runsQuery.refetch()}>Retry</Button>
        </div>
      )}

      {/* Loading */}
      {runsQuery.isLoading && (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="animate-pulse h-14 rounded-lg border bg-gray-50" />)}
        </div>
      )}

      {/* Empty */}
      {!runsQuery.isLoading && !runsQuery.isError && runs.length === 0 && (
        <div className="flex min-h-[250px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
          <div className="text-center p-6">
            <PlayCircle className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="font-semibold">No scan runs found</p>
            <p className="text-sm text-muted-foreground mt-1">Trigger runs via the scanner-service API or adjust filters.</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!runsQuery.isLoading && runs.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Source</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Started</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Duration</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Findings</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {runs.map((r: ScanRun) => (
                <tr
                  key={r.runId}
                  className="hover:bg-muted/20 cursor-pointer"
                  onClick={() => navigate(`/governance/scanner/runs/${r.runId}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium font-mono text-xs">{r.sourceId}</div>
                    <div className="text-xs text-muted-foreground">{r.runId.slice(0, 8)}…</div>
                  </td>
                  <td className="px-4 py-3"><RunStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{fmtDateTime(r.startedAt)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{durationLabel(r.startedAt, r.finishedAt)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {r.findingsCount != null ? (
                      <span className={r.findingsCount > 0 ? 'text-orange-700 font-medium' : 'text-muted-foreground'}>
                        {r.findingsCount}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ArrowRight className="h-4 w-4 text-muted-foreground inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
