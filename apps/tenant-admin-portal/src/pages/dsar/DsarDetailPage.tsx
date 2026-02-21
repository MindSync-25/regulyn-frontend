/**
 * DsarDetailPage - DSAR detail + attachments + workflow actions + evidence/audit.
 */

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileUp, Link as LinkIcon, Activity, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { ROLES, useHasAnyRole } from '@/lib/auth/roles';

import {
  getDsar,
  listDsarAttachments,
  uploadDsarAttachment,
  referenceDsarAttachment,
  assignDsar,
  transitionDsar,
  approveDsar,
  closeDsar,
  type AttachmentReferenceRequest,
  type DsarDetailResponse,
} from '@/lib/api/dsar';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { AuditTimeline } from '@/components/evidence/AuditTimeline';
import { getAuditTimeline } from '@/lib/api/evidence';

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

type MilestoneTone = 'neutral' | 'success' | 'warning';

function MilestoneRow(props: {
  label: string;
  value: string | null | undefined;
  tone?: MilestoneTone;
  hint?: string;
}) {
  const { label, value, tone = 'neutral', hint } = props;
  const hasValue = Boolean(value);

  const dotClass =
    tone === 'success'
      ? 'bg-green-500'
      : tone === 'warning'
        ? 'bg-amber-500'
        : 'bg-gray-300';

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex flex-col items-center">
        <div className={`h-2 w-2 rounded-full ${hasValue ? dotClass : 'bg-gray-200'}`} />
        <div className="mt-1 h-8 w-px bg-gray-200" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className={`text-sm ${hasValue ? 'text-gray-800' : 'text-gray-500'}`}>{formatDate(value)}</div>
        </div>
        {hint && <div className="mt-1 text-xs text-gray-600">{hint}</div>}
      </div>
    </div>
  );
}

export function DsarDetailPage() {
  const { dsarId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canViewAudit = useHasAnyRole([ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.AUDITOR]);
  const canApprove = useHasAnyRole([ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.REVIEWER]);

  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [auditPage, setAuditPage] = useState(0);
  const [auditPageSize] = useState(20);
  const [auditEventType, setAuditEventType] = useState('');

  // Attachment inputs
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [referenceValue, setReferenceValue] = useState('');
  const [referenceHash, setReferenceHash] = useState('');
  const [referenceFilename, setReferenceFilename] = useState('');
  const [referenceContentType, setReferenceContentType] = useState('');

  // Workflow inputs
  const [assignTo, setAssignTo] = useState('');
  const [toStatus, setToStatus] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [approvalDecision, setApprovalDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [approvalReason, setApprovalReason] = useState('');
  const [closureNotes, setClosureNotes] = useState('');
  const [includeEvidenceIds, setIncludeEvidenceIds] = useState('');

  const id = dsarId ?? '';

  const dsarQuery = useQuery({
    queryKey: ['dsar', id],
    queryFn: () => getDsar(id),
    enabled: !!id,
  });

  const attachmentsQuery = useQuery({
    queryKey: ['dsar-attachments', id],
    queryFn: () => listDsarAttachments(id),
    enabled: !!id,
  });

  const auditQuery = useQuery({
    queryKey: ['dsar-audit', id, auditPage, auditPageSize, auditEventType],
    queryFn: () => {
      return getAuditTimeline({
        page: auditPage,
        size: auditPageSize,
        eventType: auditEventType || undefined,
      });
    },
    enabled: auditDialogOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');
      const idempotencyKey = `dsar-upload-${Date.now()}-${Math.random()}`;
      return uploadDsarAttachment(id, selectedFile, idempotencyKey);
    },
    onSuccess: () => {
      toast.success('Attachment uploaded');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['dsar-attachments', id] });
    },
    onError: (err: Error) => toast.error(`Upload failed: ${err.message}`),
  });

  const referenceMutation = useMutation({
    mutationFn: (req: AttachmentReferenceRequest) => {
      const idempotencyKey = `dsar-ref-${Date.now()}-${Math.random()}`;
      return referenceDsarAttachment(id, req, idempotencyKey);
    },
    onSuccess: () => {
      toast.success('Attachment referenced');
      setReferenceValue('');
      setReferenceHash('');
      setReferenceFilename('');
      setReferenceContentType('');
      queryClient.invalidateQueries({ queryKey: ['dsar-attachments', id] });
    },
    onError: (err: Error) => toast.error(`Reference failed: ${err.message}`),
  });

  const assignMutation = useMutation({
    mutationFn: () => assignDsar(id, { assignedTo: assignTo }),
    onSuccess: () => {
      toast.success('DSAR assigned');
      setAssignTo('');
      queryClient.invalidateQueries({ queryKey: ['dsar', id] });
      queryClient.invalidateQueries({ queryKey: ['dsar-inbox'] });
    },
    onError: (err: Error) => toast.error(`Assign failed: ${err.message}`),
  });

  const transitionMutation = useMutation({
    mutationFn: () => transitionDsar(id, { toStatus, reason: transitionReason || undefined }),
    onSuccess: () => {
      toast.success('DSAR status updated');
      setToStatus('');
      setTransitionReason('');
      queryClient.invalidateQueries({ queryKey: ['dsar', id] });
      queryClient.invalidateQueries({ queryKey: ['dsar-inbox'] });
    },
    onError: (err: Error) => toast.error(`Transition failed: ${err.message}`),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveDsar(id, { decision: approvalDecision, reason: approvalReason || undefined }),
    onSuccess: () => {
      toast.success('Approval recorded');
      setApprovalReason('');
      queryClient.invalidateQueries({ queryKey: ['dsar', id] });
      queryClient.invalidateQueries({ queryKey: ['dsar-inbox'] });
    },
    onError: (err: Error) => toast.error(`Approve failed: ${err.message}`),
  });

  const closeMutation = useMutation({
    mutationFn: () => {
      const ids = includeEvidenceIds
        .split(/\s*,\s*/)
        .map((x) => x.trim())
        .filter(Boolean);

      const idempotencyKey = `dsar-close-${Date.now()}-${Math.random()}`;
      return closeDsar(
        id,
        {
          closureNotes: closureNotes || undefined,
          includeEvidenceIds: ids.length ? ids : undefined,
        },
        idempotencyKey
      );
    },
    onSuccess: (data) => {
      toast.success('DSAR closed');
      queryClient.invalidateQueries({ queryKey: ['dsar', id] });
      queryClient.invalidateQueries({ queryKey: ['dsar-inbox'] });

      if (data.evidenceBundleId) {
        toast.message('Evidence bundle created');
      }
    },
    onError: (err: Error) => toast.error(`Close failed: ${err.message}`),
  });

  const dsar: DsarDetailResponse | undefined = dsarQuery.data;

  const hasEvidenceBundle = Boolean(dsar?.closeEvidenceBundleId);

  const detailsJson = useMemo(() => {
    if (!dsar?.details) return null;
    try {
      return JSON.stringify(dsar.details, null, 2);
    } catch {
      return String(dsar.details);
    }
  }, [dsar?.details]);

  if (!dsarId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Missing DSAR id in route.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/dsar/inbox')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inbox
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">DSAR Detail</h1>
            {dsar?.status && <Badge>{dsar.status}</Badge>}
            {dsar?.requestType && <Badge variant="secondary">{dsar.requestType}</Badge>}
          </div>
          <p className="mt-1 text-sm text-gray-600 font-mono">{dsarId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => dsarQuery.refetch()} disabled={dsarQuery.isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${dsarQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canViewAudit && (
            <Button variant="outline" onClick={() => setAuditDialogOpen(true)}>
              <Activity className="h-4 w-4 mr-2" />
              Audit
            </Button>
          )}
          <Button onClick={() => setEvidenceDrawerOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Evidence
          </Button>
        </div>
      </div>

      {dsarQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Failed to load DSAR: {(dsarQuery.error as Error).message}
        </div>
      )}

      {/* Core detail panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Metadata</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
            <div><span className="text-gray-500">Data Principal:</span> <span className="font-mono text-xs">{dsar?.dataPrincipalId ?? '-'}</span></div>
            <div><span className="text-gray-500">Assignee:</span> <span className="font-mono text-xs">{dsar?.assignedTo ?? '-'}</span></div>
            <div><span className="text-gray-500">Requires Approval:</span> {String(dsar?.requiresApproval ?? false)}</div>
            <div><span className="text-gray-500">Approved By:</span> <span className="font-mono text-xs">{dsar?.approvedBy ?? '-'}</span></div>
            <div><span className="text-gray-500">Approved At:</span> {formatDate(dsar?.approvedAt)}</div>
            <div><span className="text-gray-500">Created:</span> {formatDate(dsar?.createdAt)}</div>
            <div><span className="text-gray-500">Updated:</span> {formatDate(dsar?.updatedAt)}</div>
            <div><span className="text-gray-500">Due:</span> {formatDate(dsar?.dueAt)}</div>
            <div><span className="text-gray-500">SLA Breached:</span> {String(dsar?.slaBreached ?? false)}</div>
            <div><span className="text-gray-500">Closed At:</span> {formatDate(dsar?.closedAt)}</div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Milestones</h2>
          <p className="mt-1 text-xs text-gray-600">
            Derived from timestamps available on the DSAR record (no status-history endpoint required).
          </p>
          <div className="mt-4">
            <MilestoneRow label="Created" value={dsar?.createdAt} tone="success" />
            <MilestoneRow
              label="Due"
              value={dsar?.dueAt}
              tone={dsar?.slaBreached ? 'warning' : 'neutral'}
              hint={dsar?.slaBreached ? 'SLA breached' : undefined}
            />
            <MilestoneRow
              label="Approved / Rejected"
              value={dsar?.approvedAt}
              tone={dsar?.approvedAt ? 'success' : 'neutral'}
              hint={dsar?.approvedBy ? `By ${dsar.approvedBy}` : undefined}
            />
            <MilestoneRow
              label="Closed"
              value={dsar?.closedAt}
              tone={dsar?.closedAt ? 'success' : 'neutral'}
              hint={dsar?.closeEvidenceBundleId ? 'Evidence bundle recorded on close' : undefined}
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Closure & Evidence</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <div className="text-gray-500">Close Notes</div>
              <div className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 text-gray-800">{dsar?.closeNotes ?? '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Evidence Bundle</div>
              <div className="mt-1 font-mono text-xs">{dsar?.closeEvidenceBundleId ?? '-'}</div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEvidenceDrawerOpen(true)}
                  disabled={!hasEvidenceBundle}
                >
                  Open Evidence Drawer
                </Button>
                {dsar?.closeEvidenceBundleId && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/evidence/bundles/${dsar.closeEvidenceBundleId}`)}
                  >
                    View Bundle
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details JSON */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">Request Details</h2>
        <div className="mt-3">
          {detailsJson ? (
            <pre className="rounded bg-gray-50 p-4 text-xs text-gray-800 overflow-auto">{detailsJson}</pre>
          ) : (
            <div className="text-sm text-gray-600">No details provided</div>
          )}
        </div>
      </div>

      {/* Attachments */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Attachments</h2>
          <Button variant="outline" size="sm" onClick={() => attachmentsQuery.refetch()} disabled={attachmentsQuery.isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${attachmentsQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {attachmentsQuery.error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Failed to load attachments: {(attachmentsQuery.error as Error).message}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <FileUp className="h-4 w-4" /> Upload
            </div>
            <div className="mt-3 space-y-3">
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={!selectedFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload attachment'}
              </Button>
              <p className="text-xs text-gray-600">
                Backend enforces file type/size. 422 errors are shown with actionable messages.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> Reference
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="refVal">Reference value *</Label>
                <Input id="refVal" value={referenceValue} onChange={(e) => setReferenceValue(e.target.value)} placeholder="e.g., s3://bucket/object" />
              </div>
              <div>
                <Label htmlFor="refHash">Reference hash (optional)</Label>
                <Input id="refHash" value={referenceHash} onChange={(e) => setReferenceHash(e.target.value)} placeholder="sha256..." />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="refFile">Filename (optional)</Label>
                  <Input id="refFile" value={referenceFilename} onChange={(e) => setReferenceFilename(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="refType">Content-Type (optional)</Label>
                  <Input id="refType" value={referenceContentType} onChange={(e) => setReferenceContentType(e.target.value)} placeholder="application/pdf" />
                </div>
              </div>
              <Button
                onClick={() =>
                  referenceMutation.mutate({
                    referenceValue,
                    referenceHash: referenceHash || undefined,
                    filename: referenceFilename || undefined,
                    contentType: referenceContentType || undefined,
                  })
                }
                disabled={!referenceValue || referenceMutation.isPending}
              >
                {referenceMutation.isPending ? 'Saving...' : 'Add reference'}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900">Existing attachments</h3>
          {attachmentsQuery.isLoading && <div className="mt-2 text-sm text-gray-500">Loading...</div>}
          {attachmentsQuery.data && attachmentsQuery.data.length === 0 && (
            <div className="mt-2 text-sm text-gray-600">No attachments</div>
          )}
          {attachmentsQuery.data && attachmentsQuery.data.length > 0 && (
            <div className="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200">
              {attachmentsQuery.data.map((a) => (
                <div key={a.attachmentId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{a.filename ?? '(no filename)'}</div>
                      <div className="mt-1 text-xs text-gray-600">
                        <span className="font-mono">{a.attachmentId}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 space-y-1">
                        <div>Type: {a.type}</div>
                        <div>Content-Type: {a.contentType ?? '-'}</div>
                        <div>Size: {a.sizeBytes ?? '-'} bytes</div>
                        <div>Created: {formatDate(a.createdAt)}</div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                      {a.artifactRef && (
                        <div>
                          <div className="text-gray-500">Artifact Ref</div>
                          <div className="font-mono break-all max-w-xs">{a.artifactRef}</div>
                        </div>
                      )}
                      {a.recordedEvidenceArtifactRef && (
                        <div className="mt-2">
                          <div className="text-gray-500">Recorded Evidence Ref</div>
                          <div className="font-mono break-all max-w-xs">{a.recordedEvidenceArtifactRef}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
          <div className="font-medium text-gray-900">Backend endpoints</div>
          <div className="font-mono mt-1">GET /dsar/{'{dsarId}'}/attachments</div>
          <div className="font-mono">POST /dsar/{'{dsarId}'}/attachments/upload (multipart)</div>
          <div className="font-mono">POST /dsar/{'{dsarId}'}/attachments/reference</div>
        </div>
      </div>

      {/* Workflow actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900">Workflow Actions</h2>
        <p className="mt-1 text-xs text-gray-600">
          Actions are enabled only for endpoints present in dsar-grievance-service. Invalid transitions return 409/422 (shown as actionable errors).
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-900">Assign</div>
            <p className="mt-1 text-xs text-gray-600">POST /dsar/{'{dsarId}'}/assign</p>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="assignTo">Assign to (userId)</Label>
                <Input id="assignTo" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} placeholder="UUID" />
              </div>
              <Button onClick={() => assignMutation.mutate()} disabled={!assignTo || assignMutation.isPending}>
                {assignMutation.isPending ? 'Assigning...' : 'Assign DSAR'}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-900">Transition status</div>
            <p className="mt-1 text-xs text-gray-600">POST /dsar/{'{dsarId}'}/transition</p>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="toStatus">To status</Label>
                <Input id="toStatus" value={toStatus} onChange={(e) => setToStatus(e.target.value)} placeholder="e.g., IN_REVIEW" />
              </div>
              <div>
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea id="reason" value={transitionReason} onChange={(e) => setTransitionReason(e.target.value)} rows={3} />
              </div>
              <Button onClick={() => transitionMutation.mutate()} disabled={!toStatus || transitionMutation.isPending}>
                {transitionMutation.isPending ? 'Updating...' : 'Update status'}
              </Button>
            </div>
          </div>

          {dsar?.requiresApproval && canApprove && (
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-900">Approve / Reject</div>
              <p className="mt-1 text-xs text-gray-600">POST /dsar/{'{dsarId}'}/approve</p>
              <div className="mt-3 space-y-3">
                <div>
                  <Label>Decision</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={approvalDecision === 'APPROVE' ? 'default' : 'outline'}
                      onClick={() => setApprovalDecision('APPROVE')}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant={approvalDecision === 'REJECT' ? 'destructive' : 'outline'}
                      onClick={() => setApprovalDecision('REJECT')}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="approvalReason">Reason (optional)</Label>
                  <Textarea id="approvalReason" value={approvalReason} onChange={(e) => setApprovalReason(e.target.value)} rows={3} />
                </div>
                <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                  {approveMutation.isPending ? 'Submitting...' : 'Submit decision'}
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-900">Close DSAR</div>
            <p className="mt-1 text-xs text-gray-600">POST /dsar/{'{dsarId}'}/close (idempotent)</p>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="closureNotes">Closure notes</Label>
                <Textarea id="closureNotes" value={closureNotes} onChange={(e) => setClosureNotes(e.target.value)} rows={3} />
              </div>
              <div>
                <Label htmlFor="evidenceIds">Include evidence IDs (optional, comma-separated)</Label>
                <Input id="evidenceIds" value={includeEvidenceIds} onChange={(e) => setIncludeEvidenceIds(e.target.value)} placeholder="uuid1, uuid2" />
              </div>
              <Button variant="destructive" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
                {closeMutation.isPending ? 'Closing...' : 'Close DSAR'}
              </Button>
              <p className="text-xs text-gray-600">
                On success, the backend may create an evidence bundle. If evidence service is unavailable, close can fail.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit dialog */}
      {canViewAudit && (
        <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Audit</DialogTitle>
              <DialogDescription>
                Tenant audit events. No DSAR-scoped audit endpoint was found; use eventType to narrow if your backend emits DSAR-specific events.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label htmlFor="eventType">eventType filter (optional)</Label>
                <Input id="eventType" value={auditEventType} onChange={(e) => setAuditEventType(e.target.value)} placeholder="e.g., DSAR.CLOSED" />
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
              <Button variant="outline" onClick={() => setAuditDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <EvidenceDrawer
        isOpen={evidenceDrawerOpen}
        onClose={() => setEvidenceDrawerOpen(false)}
        objectType="DSAR"
        objectId={dsarId}
        title="Evidence Context: DSAR"
        bundleId={dsar?.closeEvidenceBundleId ?? undefined}
      />
    </div>
  );
}

export default DsarDetailPage;
