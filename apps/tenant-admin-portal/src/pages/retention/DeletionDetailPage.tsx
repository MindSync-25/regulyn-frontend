import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Play,
  Upload,
  CheckCircle2,
  XCircle,
  UserPlus,
  GitBranch,
  Lock,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { AuditTimeline } from '@/components/evidence/AuditTimeline';
import { getErrorMessage } from '@/lib/api/http';
import {
  approveDeletion,
  assignDeletion,
  cascadeExecute,
  closeDeletion,
  getDeletion,
  transitionDeletion,
  uploadDeletionProof,
  type CascadeExecuteResponse,
  type DeletionDetailResponse,
} from '@/lib/api/retentionDeletion';
import { getAuditTimeline } from '@/lib/api/evidence';
import { ROLES, useHasAnyRole } from '@/lib/auth/roles';

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as Crypto).randomUUID();
  return `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <Badge>{status}</Badge>;
}

export function DeletionDetailPage() {
  const navigate = useNavigate();
  const { deletionId } = useParams();

  const canOperate = useHasAnyRole([ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]);
  const canApprove = useHasAnyRole([ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.REVIEWER]);
  const canViewAudit = useHasAnyRole([ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.AUDITOR]);

  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  // Mutations/form state
  const [assignedTo, setAssignedTo] = useState('');
  const [transitionToStatus, setTransitionToStatus] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const [closureNotes, setClosureNotes] = useState('');

  // Cascade execution state (only exists if user executes in UI)
  const [cascadeResult, setCascadeResult] = useState<CascadeExecuteResponse | null>(null);
  const [cascadeIdempotencyKey, setCascadeIdempotencyKey] = useState<string>(() => generateIdempotencyKey());

  // Proof upload
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Audit filters
  const [auditEventType, setAuditEventType] = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const [auditPageSize] = useState(20);

  const deletionQuery = useQuery({
    queryKey: ['deletion', deletionId],
    enabled: Boolean(deletionId),
    queryFn: () => getDeletion(deletionId as string),
  });

  const auditQuery = useQuery({
    queryKey: ['audit', 'retention-deletion', { auditEventType, auditPage, auditPageSize }],
    enabled: auditOpen && canViewAudit,
    queryFn: () =>
      getAuditTimeline({
        eventType: auditEventType || undefined,
        page: auditPage,
        size: auditPageSize,
      }),
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) => assignDeletion(deletionId as string, { assignedTo: userId }),
    onSuccess: () => {
      toast.success('Assigned');
      deletionQuery.refetch();
    },
  });

  const approveMutation = useMutation({
    mutationFn: (decision: 'APPROVE' | 'REJECT') => approveDeletion(deletionId as string, { decision, reason: approvalReason || undefined }),
    onSuccess: () => {
      toast.success('Decision recorded');
      setApprovalReason('');
      deletionQuery.refetch();
    },
  });

  const transitionMutation = useMutation({
    mutationFn: () => transitionDeletion(deletionId as string, { toStatus: transitionToStatus, reason: transitionReason || undefined }),
    onSuccess: () => {
      toast.success('Transitioned');
      setTransitionReason('');
      deletionQuery.refetch();
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => closeDeletion(deletionId as string, { closureNotes: closureNotes || undefined }),
    onSuccess: (res) => {
      toast.success('Closed');
      setClosureNotes('');
      // If backend returns evidence bundle id, refresh to display and make Evidence drawer point to it.
      if (res.evidenceBundleId) toast.message(`Evidence bundle: ${res.evidenceBundleId}`);
      deletionQuery.refetch();
    },
  });

  const cascadeMutation = useMutation({
    mutationFn: () => cascadeExecute(deletionId as string, cascadeIdempotencyKey),
    onSuccess: (res) => {
      toast.success('Cascade execution started');
      setCascadeResult(res);
      deletionQuery.refetch();
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: async () => {
      if (!proofFile) throw new Error('Select a file first');
      return uploadDeletionProof(deletionId as string, proofFile);
    },
    onSuccess: (res) => {
      toast.success(`Proof uploaded: ${res.proofId}`);
      setProofFile(null);
      deletionQuery.refetch();
    },
  });

  const deletion: DeletionDetailResponse | undefined = deletionQuery.data;

  const cascadeColumns = useMemo(
    () =>
      [
        { key: 'systemKey', header: 'System', render: (r: any) => <span className="font-mono text-xs">{r.systemKey}</span> },
        { key: 'status', header: 'Status', render: (r: any) => <Badge variant="secondary">{r.status}</Badge> },
        { key: 'attemptCount', header: 'Attempts', render: (r: any) => <span className="text-sm">{r.attemptCount ?? '-'}</span> },
        { key: 'externalJobRef', header: 'External Ref', render: (r: any) => <span className="font-mono text-xs">{r.externalJobRef ?? '-'}</span> },
        { key: 'subjectRef', header: 'Subject Ref', render: (r: any) => <span className="font-mono text-xs">{r.subjectRef ?? '-'}</span> },
      ] as const,
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/retention/deletions')}
            className="px-0 text-gray-700 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Deletion</h1>
            {deletion?.status ? <StatusBadge status={deletion.status} /> : <Badge variant="secondary">Loading…</Badge>}
            {deletionId && <span className="font-mono text-xs text-gray-600">{deletionId}</span>}
          </div>

          <p className="text-sm text-gray-600">Workflow detail + cascade execution status (no invented endpoints)</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => deletionQuery.refetch()} disabled={deletionQuery.isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${deletionQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setEvidenceOpen(true)} disabled={!deletionId}>
            Evidence <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          {canViewAudit && (
            <Button variant="outline" onClick={() => setAuditOpen(true)}>
              Audit <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {deletionQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-800">Failed to load deletion: {getErrorMessage(deletionQuery.error)}</div>
        </div>
      )}

      {deletion && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <KV label="Subject ID" value={<span className="font-mono text-xs">{deletion.subjectId}</span>} />
            <KV label="Subject Type" value={<Badge variant="secondary">{deletion.subjectType}</Badge>} />
            <KV label="Entity Type" value={<span className="text-sm">{deletion.entityType}</span>} />

            <KV label="Source" value={<span className="text-sm">{deletion.source}</span>} />
            <KV label="Requires Approval" value={<span className="text-sm">{String(deletion.requiresApproval ?? '-')}</span>} />
            <KV label="Proof Required" value={<span className="text-sm">{String(deletion.proofRequired ?? '-')}</span>} />

            <KV label="Assigned To" value={deletion.assignedTo ? <span className="font-mono text-xs">{deletion.assignedTo}</span> : '-'} />
            <KV label="Approved By" value={deletion.approvedBy ? <span className="font-mono text-xs">{deletion.approvedBy}</span> : '-'} />
            <KV label="Approved At" value={formatDate(deletion.approvedAt)} />

            <KV label="Created" value={formatDate(deletion.createdAt)} />
            <KV label="Updated" value={formatDate(deletion.updatedAt)} />
            <KV label="Due" value={formatDate(deletion.dueAt)} />

            <KV label="Closed" value={formatDate(deletion.closedAt)} />
            <KV
              label="Evidence Bundle"
              value={
                deletion.evidenceBundleId ? (
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/evidence/bundles/${deletion.evidenceBundleId}`)}>
                    <span className="font-mono text-xs">{deletion.evidenceBundleId}</span>
                  </Button>
                ) : (
                  '-'
                )
              }
            />
            <KV label="Reason" value={deletion.reason ?? '-'} />
          </div>

          {deletion.metadata && (
            <div className="mt-6">
              <div className="text-xs font-medium text-gray-600">Metadata</div>
              <pre className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs overflow-auto">
                {JSON.stringify(deletion.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div className="text-sm font-semibold text-gray-900">Workflow Actions</div>

          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <UserPlus className="h-4 w-4" /> Assign
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <Label htmlFor="assignedTo" className="text-xs">User ID</Label>
                <Input id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="user UUID" />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => assignMutation.mutate(assignedTo)}
                  disabled={!canOperate || assignMutation.isPending || !assignedTo || !deletionId}
                >
                  Assign
                </Button>
              </div>
            </div>
            {!canOperate && <div className="mt-2 text-xs text-gray-500">Requires role: TENANT_ADMIN/DPO/OPERATOR</div>}
          </div>

          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <CheckCircle2 className="h-4 w-4" /> Approve / <XCircle className="h-4 w-4" /> Reject
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="approvalReason" className="text-xs">Reason (optional)</Label>
                <Input id="approvalReason" value={approvalReason} onChange={(e) => setApprovalReason(e.target.value)} placeholder="Optional" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => approveMutation.mutate('REJECT')}
                  disabled={!canApprove || approveMutation.isPending || !deletionId}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => approveMutation.mutate('APPROVE')}
                  disabled={!canApprove || approveMutation.isPending || !deletionId}
                >
                  Approve
                </Button>
              </div>
              {!canApprove && <div className="text-xs text-gray-500">Requires role: TENANT_ADMIN/DPO/REVIEWER</div>}
            </div>
          </div>

          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <GitBranch className="h-4 w-4" /> Transition
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-1">
                <Label htmlFor="toStatus" className="text-xs">To Status *</Label>
                <Input id="toStatus" value={transitionToStatus} onChange={(e) => setTransitionToStatus(e.target.value)} placeholder="IN_PROGRESS" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="transitionReason" className="text-xs">Reason (optional)</Label>
                <Input id="transitionReason" value={transitionReason} onChange={(e) => setTransitionReason(e.target.value)} placeholder="Optional" />
              </div>
              <div className="md:col-span-3">
                <Button
                  onClick={() => transitionMutation.mutate()}
                  disabled={!canOperate || transitionMutation.isPending || !transitionToStatus || !deletionId}
                >
                  Transition
                </Button>
                {!canOperate && <div className="mt-2 text-xs text-gray-500">Requires role: TENANT_ADMIN/DPO/OPERATOR</div>}
              </div>
            </div>
          </div>

          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Lock className="h-4 w-4" /> Close
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="closureNotes" className="text-xs">Closure Notes (optional)</Label>
                <Textarea id="closureNotes" value={closureNotes} onChange={(e) => setClosureNotes(e.target.value)} placeholder="Optional" />
              </div>
              <Button onClick={() => closeMutation.mutate()} disabled={!canOperate || closeMutation.isPending || !deletionId}>
                Close deletion
              </Button>
              <div className="text-xs text-gray-500">
                Backend calls evidence service during close; if evidence is down you may see a 503.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div className="text-sm font-semibold text-gray-900">Execution</div>

          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Play className="h-4 w-4" /> Cascade Execute
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <Label htmlFor="idemKey" className="text-xs">Idempotency key</Label>
                <Input id="idemKey" value={cascadeIdempotencyKey} onChange={(e) => setCascadeIdempotencyKey(e.target.value)} />
                <div className="mt-1 text-xs text-gray-500">
                  Required by backend. Keep the same key if retrying.
                </div>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={() => setCascadeIdempotencyKey(generateIdempotencyKey())} disabled={!canOperate}>
                  Regenerate
                </Button>
                <Button onClick={() => cascadeMutation.mutate()} disabled={!canOperate || cascadeMutation.isPending || !deletionId}>
                  Execute
                </Button>
              </div>
            </div>

            {cascadeMutation.error && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                Cascade failed: {getErrorMessage(cascadeMutation.error)}
              </div>
            )}

            {cascadeResult && (
              <div className="mt-4 space-y-2">
                <div className="text-xs text-gray-700">
                  Plan: <span className="font-mono">{cascadeResult.planId}</span>
                  {cascadeResult.planVersion !== null ? <span className="ml-2">v{cascadeResult.planVersion}</span> : null}
                </div>

                <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {cascadeColumns.map((c) => (
                          <th key={c.key} className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                            {c.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cascadeResult.systems.map((system) => (
                        <tr key={system.systemKey} className="border-t border-gray-100">
                          {cascadeColumns.map((c) => (
                            <td key={c.key} className="px-3 py-2">
                              {c.render(system)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-xs text-gray-500">
                  Note: The backend does not expose a GET endpoint for cascade executions in the discovered controllers; this table reflects the latest execute response from this UI session.
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Upload className="h-4 w-4" /> Upload Proof
            </div>
            <div className="mt-3 space-y-3">
              <input
                type="file"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                className="block text-sm"
              />
              <Button
                onClick={() => uploadProofMutation.mutate()}
                disabled={!canOperate || uploadProofMutation.isPending || !proofFile || !deletionId}
              >
                Upload
              </Button>
              <div className="text-xs text-gray-500">Endpoint: POST /deletions/{'{'}id{'}'}/proofs (multipart)</div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
            <div className="font-medium text-gray-900 mb-1">Backend endpoints (used on this page)</div>
            <div className="font-mono">GET /deletions/{'{'}id{'}'}</div>
            <div className="font-mono">POST /deletions/{'{'}id{'}'}/assign</div>
            <div className="font-mono">POST /deletions/{'{'}id{'}'}/approve</div>
            <div className="font-mono">POST /deletions/{'{'}id{'}'}/transition</div>
            <div className="font-mono">POST /deletions/{'{'}id{'}'}/cascade-execute (X-Idempotency-Key required)</div>
            <div className="font-mono">POST /deletions/{'{'}id{'}'}/proofs (multipart)</div>
            <div className="font-mono">POST /deletions/{'{'}id{'}'}/close</div>
          </div>
        </div>
      </div>

      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        objectType="DELETION"
        objectId={deletionId}
        title="Evidence Context: Deletion"
        bundleId={deletion?.evidenceBundleId ?? undefined}
      />

      {canViewAudit && (
        <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Audit</DialogTitle>
              <DialogDescription>
                Tenant audit events. No deletion-scoped audit endpoint was found in the discovered controllers; use eventType to narrow if your backend emits deletion-specific events.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label htmlFor="eventType">eventType filter (optional)</Label>
                <Input id="eventType" value={auditEventType} onChange={(e) => setAuditEventType(e.target.value)} placeholder="e.g., DELETION.APPROVED" />
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <AuditTimeline
                  events={auditQuery.data?.content ?? []}
                  isLoading={auditQuery.isLoading}
                  error={(auditQuery.error as Error) ?? null}
                  currentPage={auditPage}
                  totalPages={auditQuery.data?.totalPages ?? 0}
                  pageSize={auditPageSize}
                  totalElements={auditQuery.data?.totalElements ?? 0}
                  onPageChange={setAuditPage}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAuditOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default DeletionDetailPage;
