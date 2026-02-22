/**
 * ScanRunDetailPage — Single Scan Run: metadata + findings + remediation tasks + evidence
 * Backend: scanner-service (port 8094)
 * Route: /app/governance/scanner/runs/:runId
 * RBAC: TENANT_ADMIN, DPO
 *
 * Features:
 *  - Run metadata card (source, status, timing)
 *  - Findings list (grouped by riskLevel)
 *  - Remediation Tasks board with status transition (TENANT_ADMIN)
 *  - Create Evidence Bundle action
 *  - EvidenceDrawer for bundles
 *
 * Limitations:
 *  - taskTransition requires TENANT_ADMIN (gated client-side)
 *  - Evidence bundle creation is idempotent (backend handles de-dupe)
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  ArrowLeft,
  AlertTriangle,
  ClipboardList,
  Package,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { useAuthStore } from '@/store/authStore';
import { ROLES } from '@/lib/auth/roles';
import {
  getScanRun,
  getRunFindings,
  listTasks,
  transitionTask,
  createRunEvidenceBundle,
  type ScanRun,
  type Finding,
  type RemediationTask,
  type TaskStatus,
} from '@/lib/api/scanner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(val?: string | null) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleString();
}

function durationLabel(startedAt?: string | null, completedAt?: string | null) {
  if (!startedAt || !completedAt) return 'In progress';
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
  return <Badge className={map[status] ?? 'bg-blue-100 text-blue-900'}>{status}</Badge>;
}

function FindingRiskBadge({ level }: { level?: string | null }) {
  if (!level) return <Badge variant="outline">—</Badge>;
  const map: Record<string, string> = {
    CRITICAL: 'bg-red-600 text-white',
    HIGH: 'bg-red-100 text-red-900',
    MEDIUM: 'bg-orange-100 text-orange-900',
    LOW: 'bg-yellow-100 text-yellow-800',
    INFO: 'bg-blue-100 text-blue-900',
  };
  return <Badge className={map[level] ?? 'bg-gray-100 text-gray-700'}>{level}</Badge>;
}

function TaskStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Badge variant="outline">—</Badge>;
  const map: Record<string, string> = {
    OPEN: 'bg-yellow-100 text-yellow-900',
    IN_PROGRESS: 'bg-blue-100 text-blue-900',
    RESOLVED: 'bg-green-100 text-green-900',
    WONT_FIX: 'bg-gray-100 text-gray-700',
    CLOSED: 'bg-gray-100 text-gray-700',
  };
  return <Badge className={map[status] ?? 'bg-gray-100 text-gray-700'}>{status}</Badge>;
}

const TASK_TRANSITIONS: Record<string, TaskStatus[]> = {
  OPEN: ['IN_PROGRESS', 'WAIVED'],
  IN_PROGRESS: ['CLOSED', 'OPEN'],
  CLOSED: [],
  WAIVED: [],
};

type ActiveTab = 'findings' | 'tasks';

// ─── Component ────────────────────────────────────────────────────────────────

export function ScanRunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const roles = useAuthStore(state => state.roles);
  const queryClient = useQueryClient();
  const isTenantAdmin = roles.includes(ROLES.TENANT_ADMIN);

  const [activeTab, setActiveTab] = useState<ActiveTab>('findings');
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [riskFilter, setRiskFilter] = useState('');
  const [bundleCreating, setBundleCreating] = useState(false);
  const [bundleMsg, setBundleMsg] = useState('');

  const runQuery = useQuery({
    queryKey: ['scan-run', runId],
    queryFn: () => getScanRun(runId!),
    enabled: !!runId,
  });

  const findingsQuery = useQuery({
    queryKey: ['scan-run-findings', runId],
    queryFn: () => getRunFindings(runId!),
    enabled: !!runId && activeTab === 'findings',
  });

  const tasksQuery = useQuery({
    queryKey: ['scan-tasks', runId],
    queryFn: () => listTasks({ runId, page: 0, size: 100 }),
    enabled: !!runId && activeTab === 'tasks',
  });

  const transitionMutation = useMutation({
    mutationFn: ({ taskId, toStatus }: { taskId: string; toStatus: TaskStatus }) =>
      transitionTask(taskId, { toStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-tasks', runId] });
    },
  });

  const run: ScanRun | undefined = runQuery.data;
  const findings: Finding[] = findingsQuery.data ?? [];
  const tasks: RemediationTask[] = tasksQuery.data?.content ?? [];

  const filteredFindings = riskFilter
    ? findings.filter(f => f.riskLevel === riskFilter)
    : findings;

  async function handleCreateBundle() {
    if (!runId) return;
    setBundleCreating(true);
    setBundleMsg('');
    try {
      await createRunEvidenceBundle(runId);
      setBundleMsg('Evidence bundle created successfully.');
      setEvidenceOpen(true);
    } catch (e) {
      setBundleMsg('Failed to create evidence bundle.');
    } finally {
      setBundleCreating(false);
    }
  }

  // ── Error / Loading ──────────────────────────────────────────────────────────
  if (runQuery.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p className="font-semibold">Failed to load scan run</p>
        <p className="mt-1">{runQuery.error instanceof Error ? runQuery.error.message : 'Unexpected error.'}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>
    );
  }

  if (runQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-48 rounded bg-gray-200" />
        <div className="animate-pulse h-40 rounded-lg border bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <button
            onClick={() => navigate('/governance/scanner/runs')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Scan Runs
          </button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-teal-600" />
            Scan Run
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{runId}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { runQuery.refetch(); findingsQuery.refetch(); tasksQuery.refetch(); }}
            disabled={runQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateBundle}
            disabled={bundleCreating}
          >
            <Package className="h-4 w-4 mr-1" />
            {bundleCreating ? 'Creating…' : 'Create Evidence Bundle'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEvidenceOpen(true)}>
            <Package className="h-4 w-4 mr-1" /> View Evidence
          </Button>
        </div>
      </div>

      {bundleMsg && (
        <div className={`rounded-lg border p-3 text-sm ${bundleMsg.includes('success') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {bundleMsg}
        </div>
      )}

      {/* Run Metadata Card */}
      {run && (
        <div className="rounded-lg border bg-card p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <RunStatusBadge status={run.status} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Source ID</div>
            <div className="font-mono text-xs">{run.sourceId ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Started</div>
            <div className="text-sm">{fmtDateTime(run.startedAt)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Duration</div>
            <div className="text-sm">{durationLabel(run.startedAt, run.finishedAt)}</div>
          </div>
          {run.findingsCount != null && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Findings</div>
              <div className={`text-sm font-semibold ${run.findingsCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {run.findingsCount}
              </div>
            </div>
          )}
          {run.requestRef && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Request Ref</div>
              <div className="text-xs font-mono">{run.requestRef}</div>
            </div>
          )}
          {run.errorMessage && (
            <div className="col-span-full">
              <div className="text-xs text-muted-foreground mb-1">Error</div>
              <div className="text-sm text-red-700 bg-red-50 rounded p-2">{run.errorMessage}</div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { id: 'findings', label: 'Findings', icon: AlertTriangle },
          { id: 'tasks', label: 'Remediation Tasks', icon: ClipboardList },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── FINDINGS TAB ── */}
      {activeTab === 'findings' && (
        <>
          {/* Risk filter */}
          <div className="flex gap-2 flex-wrap">
            {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  riskFilter === lvl ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {lvl || 'All'}
              </button>
            ))}
          </div>

          {findingsQuery.isLoading && (
            <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="animate-pulse h-14 rounded-lg border bg-gray-50" />)}</div>
          )}

          {findingsQuery.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Failed to load findings.
              <Button size="sm" variant="outline" className="ml-2" onClick={() => findingsQuery.refetch()}>Retry</Button>
            </div>
          )}

          {!findingsQuery.isLoading && !findingsQuery.isError && filteredFindings.length === 0 && (
            <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No findings found</p>
              </div>
            </div>
          )}

          {!findingsQuery.isLoading && filteredFindings.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Risk</th>
                    <th className="text-left px-4 py-2 font-medium">Category</th>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                    <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredFindings.map((f: Finding, idx) => (
                    <tr key={f.findingId ?? idx} className="hover:bg-muted/20">
                      <td className="px-4 py-3"><FindingRiskBadge level={f.riskLevel} /></td>
                      <td className="px-4 py-3">{f.findingType ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{f.entityType ?? f.findingId.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground">{f.fieldName ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{f.dataCategory ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── TASKS TAB ── */}
      {activeTab === 'tasks' && (
        <>
          {tasksQuery.isLoading && (
            <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="animate-pulse h-14 rounded-lg border bg-gray-50" />)}</div>
          )}

          {tasksQuery.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Failed to load tasks.
              <Button size="sm" variant="outline" className="ml-2" onClick={() => tasksQuery.refetch()}>Retry</Button>
            </div>
          )}

          {!tasksQuery.isLoading && !tasksQuery.isError && tasks.length === 0 && (
            <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
              <div className="text-center">
                <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No remediation tasks</p>
                <p className="text-xs text-muted-foreground mt-1">Tasks are created automatically from critical/high findings.</p>
              </div>
            </div>
          )}

          {!tasksQuery.isLoading && tasks.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Title</th>
                    <th className="text-left px-4 py-2 font-medium">Severity</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Assignee</th>
                    {isTenantAdmin && <th className="text-left px-4 py-2 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tasks.map((t: RemediationTask) => {
                    const transitions = TASK_TRANSITIONS[t.status ?? ''] ?? [];
                    return (
                      <tr key={t.taskId} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="font-medium">{t.title ?? t.taskId.slice(0, 8)}</div>
                          <div className="text-xs text-muted-foreground">{t.closureNotes ?? t.waivedReason ?? '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <FindingRiskBadge level={t.severity} />
                        </td>
                        <td className="px-4 py-3"><TaskStatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{t.ownerEmail ?? t.ownerUserId ?? '—'}</td>
                        {isTenantAdmin && (
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {transitions.map(next => (
                                <Button
                                  key={next}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7"
                                  disabled={transitionMutation.isPending}
                                  onClick={() => transitionMutation.mutate({ taskId: t.taskId, toStatus: next })}
                                >
                                  {next} <ChevronRight className="h-3 w-3 ml-0.5" />
                                </Button>
                              ))}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        objectType="scan_run"
        objectId={runId}
        title="Scan Run Evidence & Audit"
      />
    </div>
  );
}
