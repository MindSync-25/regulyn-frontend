/**
 * RopaListPage — Records of Processing Activities
 * Backend: ropa-inventory-service (port 8085)
 * Route: /app/governance/ropa
 * RBAC: TENANT_ADMIN, DPO, REVIEWER
 *
 * Features:
 *  - Server-side pagination (Spring Page)
 *  - Filters: status, riskLevel, lawfulBasis, free-text q
 *  - Row click → /app/governance/ropa/:activityId
 *  - Export trigger (POST /exports/ropa)
 *  - Full loading / error / empty states
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Filter,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  listActivities,
  createRopaExport,
  type ActivityStatus,
  type LawfulBasis,
  type RiskLevel,
  type RopaActivity,
} from '@/lib/api/ropa';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(val?: string | null) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString();
}

function StatusBadge({ status }: { status: ActivityStatus }) {
  if (status === 'PUBLISHED')
    return <Badge className="bg-green-100 text-green-900">PUBLISHED</Badge>;
  if (status === 'DRAFT')
    return <Badge className="bg-amber-100 text-amber-900">DRAFT</Badge>;
  if (status === 'RETIRED')
    return <Badge variant="secondary">RETIRED</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  if (risk === 'HIGH') return <Badge className="bg-red-100 text-red-900">HIGH</Badge>;
  if (risk === 'MED') return <Badge className="bg-amber-100 text-amber-900">MED</Badge>;
  return <Badge className="bg-blue-100 text-blue-900">LOW</Badge>;
}

function LegalBadge({ basis }: { basis: LawfulBasis }) {
  const labels: Record<LawfulBasis, string> = {
    CONSENT: 'Consent',
    CONTRACT: 'Contract',
    LEGAL_OBLIGATION: 'Legal Obligation',
    VITAL_INTERESTS: 'Vital Interests',
    PUBLIC_TASK: 'Public Task',
    LEGITIMATE_INTERESTS: 'Legit. Interests',
    OTHER: 'Other',
  };
  return <Badge variant="outline" className="text-xs">{labels[basis] ?? basis}</Badge>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RopaListPage() {
  const navigate = useNavigate();

  // Filters
  const [status, setStatus] = useState<ActivityStatus | ''>('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | ''>('');
  const [lawfulBasis, setLawfulBasis] = useState<LawfulBasis | ''>('');
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  // Pagination
  const [page, setPage] = useState(0);
  const size = 20;

  // Export state
  const [exporting, setExporting] = useState(false);

  const activitiesQuery = useQuery({
    queryKey: ['ropa-activities', { status, riskLevel, lawfulBasis, q, page, size }],
    queryFn: () =>
      listActivities({
        status: status || undefined,
        riskLevel: riskLevel || undefined,
        lawfulBasis: lawfulBasis || undefined,
        q: q || undefined,
        page,
        size,
      }),
  });

  const data = activitiesQuery.data;
  const activities = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  function applyFilters() {
    setPage(0);
    activitiesQuery.refetch();
  }

  function clearFilters() {
    setStatus('');
    setRiskLevel('');
    setLawfulBasis('');
    setQ('');
    setPage(0);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await createRopaExport({ format: 'CSV' });
      toast.success(`Export triggered. Export ID: ${res.exportId}`);
    } catch {
      toast.error('Failed to trigger ROPA export.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Records of Processing Activities
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalElements > 0 ? `${totalElements} activities` : 'All processing activities across your organisation'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(f => !f)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => activitiesQuery.refetch()}
            disabled={activitiesQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${activitiesQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" variant="secondary" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-1" />
            {exporting ? 'Exporting…' : 'Export ROPA'}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Status</Label>
              <select
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                value={status}
                onChange={e => setStatus(e.target.value as ActivityStatus | '')}
              >
                <option value="">All</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Risk Level</Label>
              <select
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                value={riskLevel}
                onChange={e => setRiskLevel(e.target.value as RiskLevel | '')}
              >
                <option value="">All</option>
                <option value="LOW">Low</option>
                <option value="MED">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Lawful Basis</Label>
              <select
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                value={lawfulBasis}
                onChange={e => setLawfulBasis(e.target.value as LawfulBasis | '')}
              >
                <option value="">All</option>
                <option value="CONSENT">Consent</option>
                <option value="CONTRACT">Contract</option>
                <option value="LEGAL_OBLIGATION">Legal Obligation</option>
                <option value="VITAL_INTERESTS">Vital Interests</option>
                <option value="PUBLIC_TASK">Public Task</option>
                <option value="LEGITIMATE_INTERESTS">Legitimate Interests</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Search</Label>
              <Input
                placeholder="Activity name…"
                value={q}
                onChange={e => setQ(e.target.value)}
                className="h-9 text-sm"
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={applyFilters}>Apply</Button>
            <Button size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {activitiesQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Failed to load processing activities</p>
          <p className="mt-1 text-red-700">
            {activitiesQuery.error instanceof Error
              ? activitiesQuery.error.message
              : 'An unexpected error occurred. Please try again.'}
          </p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => activitiesQuery.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {activitiesQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse rounded-lg border bg-gray-50 h-14" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!activitiesQuery.isLoading && !activitiesQuery.isError && activities.length === 0 && (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
          <div className="text-center max-w-md p-6">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="font-semibold text-lg mb-1">No Processing Activities</h3>
            <p className="text-sm text-muted-foreground">
              No ROPA entries match your current filters. Try adjusting filters or create activities via the backend.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {!activitiesQuery.isLoading && activities.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Activity Name</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Lawful Basis</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Risk</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Data Principal</th>
                <th className="text-left px-4 py-2 font-medium hidden xl:table-cell">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activities.map((activity: RopaActivity) => (
                <tr
                  key={activity.versionId}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/app/governance/ropa/${activity.activityId}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{activity.activityName}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{activity.purpose}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={activity.status} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <LegalBadge basis={activity.lawfulBasis} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <RiskBadge risk={activity.riskLevel} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {activity.dataPrincipalType}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">
                    {fmtDate(activity.publishedAt)}
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
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages} ({totalElements} total)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || activitiesQuery.isFetching}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || activitiesQuery.isFetching}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
