/**
 * IncidentDetailPage - Incident detail + workflow actions + evidence/audit.
 * Backend: incident-breach-service
 */

import { type ReactNode, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { AuditTimeline } from '@/components/evidence/AuditTimeline';
import { getAuditTimeline } from '@/lib/api/evidence';
import {
  approveIncidentNotification,
  closeIncident,
  createIncidentTask,
  draftIncidentNotification,
  getIncident,
  rejectIncidentNotification,
  sendIncidentNotification,
  transitionIncident,
  type CreateTaskRequest,
  type DraftNotificationRequest,
  type IncidentDetailsResponse,
  type NotificationChannel,
  type TaskType,
  type TransitionToStatus,
} from '@/lib/api/incidentBreach';

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'CRITICAL') return <Badge className="bg-red-100 text-red-900">CRITICAL</Badge>;
  if (severity === 'HIGH') return <Badge className="bg-amber-100 text-amber-900">HIGH</Badge>;
  if (severity === 'MED') return <Badge className="bg-blue-100 text-blue-900">MED</Badge>;
  if (severity === 'LOW') return <Badge variant="secondary">LOW</Badge>;
  return <Badge variant="secondary">{severity}</Badge>;
}

export function IncidentDetailPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const incidentQuery = useQuery({
    queryKey: ['incident', incidentId],
    enabled: Boolean(incidentId),
    queryFn: () => getIncident(incidentId as string),
  });

  const incident: IncidentDetailsResponse | undefined = incidentQuery.data;

  const invalidateIncident = async () => {
    await queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
    await queryClient.invalidateQueries({ queryKey: ['incidents'] });
  };

  // ---------------------------------------------------------------------------
  // Transition
  // ---------------------------------------------------------------------------

  const transitionOptions: TransitionToStatus[] = useMemo(
    () => ['TRIAGED', 'INVESTIGATING', 'NOTIFIED', 'CONTAINED', 'CLOSED'],
    []
  );

  const [toStatus, setToStatus] = useState<TransitionToStatus>('TRIAGED');
  const [transitionReason, setTransitionReason] = useState('');

  const transitionMutation = useMutation({
    mutationFn: (payload: { incidentId: string; toStatus: TransitionToStatus; reason?: string }) =>
      transitionIncident(payload.incidentId, { toStatus: payload.toStatus, reason: payload.reason }),
    onSuccess: async (res) => {
      toast.success(`Status updated: ${res.status}`);
      setTransitionReason('');
      await invalidateIncident();
    },
    onError: (err: any) => {
      toast.error(`Transition failed: ${err?.message ?? String(err)}`);
    },
  });

  // ---------------------------------------------------------------------------
  // Close
  // ---------------------------------------------------------------------------

  const [closureNotes, setClosureNotes] = useState('');
  const [includeEvidenceIds, setIncludeEvidenceIds] = useState('');

  const closeMutation = useMutation({
    mutationFn: (payload: { incidentId: string; closureNotes?: string; includeEvidenceIds?: string[] }) =>
      closeIncident(payload.incidentId, {
        closureNotes: payload.closureNotes,
        includeEvidenceIds: payload.includeEvidenceIds,
      }),
    onSuccess: async (res) => {
      toast.success(`Incident closed: ${res.status}`);
      if (res.evidenceBundleId) toast.message(`Evidence bundle: ${res.evidenceBundleId}`);
      await invalidateIncident();
    },
    onError: (err: any) => {
      toast.error(`Close failed: ${err?.message ?? String(err)}`);
    },
  });

  // ---------------------------------------------------------------------------
  // Tasks (create only; no list endpoint exists)
  // ---------------------------------------------------------------------------

  const [taskType, setTaskType] = useState<TaskType>('IMPACT_ASSESSMENT');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskNotes, setTaskNotes] = useState('');

  const createTaskMutation = useMutation({
    mutationFn: (payload: { incidentId: string; request: CreateTaskRequest }) =>
      createIncidentTask(payload.incidentId, payload.request),
    onSuccess: async (res) => {
      toast.success(`Task created: ${res.taskId}`);
      setTaskNotes('');
      setTaskAssignedTo('');
      await invalidateIncident();
    },
    onError: (err: any) => {
      toast.error(`Create task failed: ${err?.message ?? String(err)}`);
    },
  });

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  const [draftChannel, setDraftChannel] = useState<NotificationChannel>('EMAIL');
  const [draftText, setDraftText] = useState('');
  const [draftMetadataJson, setDraftMetadataJson] = useState('');

  const [notificationIdInput, setNotificationIdInput] = useState('');
  const [approvalReason, setApprovalReason] = useState('');

  const draftMutation = useMutation({
    mutationFn: (payload: { incidentId: string; request: DraftNotificationRequest }) =>
      draftIncidentNotification(payload.incidentId, payload.request),
    onSuccess: async (res) => {
      toast.success(`Draft created: ${res.status}`);
      setNotificationIdInput(res.notificationId);
      await invalidateIncident();
    },
    onError: (err: any) => {
      toast.error(`Draft failed: ${err?.message ?? String(err)}`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (payload: { incidentId: string; notificationId: string; reason?: string }) =>
      approveIncidentNotification(payload.incidentId, payload.notificationId, { reason: payload.reason }),
    onSuccess: async (res) => {
      toast.success(`Approved: ${res.status}`);
      await invalidateIncident();
    },
    onError: (err: any) => {
      toast.error(`Approve failed: ${err?.message ?? String(err)}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { incidentId: string; notificationId: string; reason?: string }) =>
      rejectIncidentNotification(payload.incidentId, payload.notificationId, { reason: payload.reason }),
    onSuccess: async (res) => {
      toast.success(`Rejected: ${res.status}`);
      await invalidateIncident();
    },
    onError: (err: any) => {
      toast.error(`Reject failed: ${err?.message ?? String(err)}`);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (payload: { incidentId: string; notificationId: string }) =>
      sendIncidentNotification(payload.incidentId, payload.notificationId),
    onSuccess: async (res) => {
      toast.success(`Sent: ${res.status}`);
      await invalidateIncident();
    },
    onError: (err: any) => {
      toast.error(`Send failed: ${err?.message ?? String(err)}`);
    },
  });

  // ---------------------------------------------------------------------------
  // Audit timeline (tenant-level only)
  // ---------------------------------------------------------------------------

  const [auditEventType, setAuditEventType] = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const [auditPageSize, setAuditPageSize] = useState(10);

  const auditQuery = useQuery({
    queryKey: ['incident-audit', incidentId, auditPage, auditPageSize, auditEventType],
    queryFn: () =>
      getAuditTimeline({
        page: auditPage,
        size: auditPageSize,
        eventType: auditEventType || undefined,
      }),
  });

  if (!incidentId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="text-sm text-red-800">Missing incidentId in route.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/incidents')} className="px-0">
            ← Back to incidents
          </Button>
          <div className="mt-2 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-gray-900" />
            <h1 className="text-2xl font-bold text-gray-900">Incident</h1>
            {incident ? (
              <>
                <Badge>{incident.status}</Badge>
                <SeverityBadge severity={incident.severity} />
                {incident.notifyOverdue ? <Badge variant="destructive">Notify overdue</Badge> : null}
              </>
            ) : (
              <Badge variant="secondary">Loading…</Badge>
            )}
          </div>
          <div className="mt-1 font-mono text-xs text-gray-600">{incidentId}</div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEvidenceOpen(true)}>
            Evidence <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => incidentQuery.refetch()} disabled={incidentQuery.isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${incidentQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {incidentQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-800">Failed to load incident: {(incidentQuery.error as Error).message}</div>
        </div>
      )}

      {incident && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KV label="Status" value={<Badge>{incident.status}</Badge>} />
            <KV label="Severity" value={<SeverityBadge severity={incident.severity} />} />
            <KV label="Tenant" value={<span className="font-mono text-xs">{incident.tenantId}</span>} />

            <KV label="Opened" value={<span className="text-sm text-gray-700">{formatDate(incident.openedAt)}</span>} />
            <KV label="Updated" value={<span className="text-sm text-gray-700">{formatDate(incident.updatedAt)}</span>} />
            <KV
              label="Notify Due"
              value={
                <div className="space-y-1">
                  <div className="text-sm text-gray-700">{formatDate(incident.notifyDueAt)}</div>
                  {incident.notifyOverdue ? <Badge variant="destructive">Overdue</Badge> : null}
                </div>
              }
            />

            <KV label="Approved By" value={incident.approvedBy ? <span className="font-mono text-xs">{incident.approvedBy}</span> : '-'} />
            <KV label="Approved At" value={<span className="text-sm text-gray-700">{formatDate(incident.approvedAt)}</span>} />
            <KV label="Closed At" value={<span className="text-sm text-gray-700">{formatDate(incident.closedAt)}</span>} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="text-sm font-semibold text-gray-900">Summary</div>
              <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                {incident.summary || '—'}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-900">Evidence Bundle</div>
              <div className="mt-2 flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-3">
                {incident.evidenceBundleId ? (
                  <>
                    <span className="font-mono text-xs break-all">{incident.evidenceBundleId}</span>
                    <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/evidence/bundles/${incident.evidenceBundleId}`)}>
                      View
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-gray-600">—</span>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">Evidence bundle is typically populated when closing an incident via the close endpoint.</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-gray-900">Metadata</div>
            <pre className="mt-2 max-h-64 overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800">
              {JSON.stringify(incident.metadata ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Workflow actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Transition */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-sm font-semibold text-gray-900">Status Transition</div>
          <p className="mt-1 text-xs text-gray-600">Backend: POST /incidents/{'{'}incidentId{'}'}/transition</p>

          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="toStatus">toStatus *</Label>
              <Input
                id="toStatus"
                value={toStatus}
                onChange={(e) => setToStatus(e.target.value as TransitionToStatus)}
                placeholder={transitionOptions.join(' | ')}
              />
              <p className="mt-1 text-xs text-gray-500">Allowed: {transitionOptions.join(', ')}</p>
            </div>

            <div>
              <Label htmlFor="transitionReason">Reason (optional)</Label>
              <Input id="transitionReason" value={transitionReason} onChange={(e) => setTransitionReason(e.target.value)} placeholder="Why are you changing status?" />
            </div>

            <Button
              variant="outline"
              onClick={() => transitionMutation.mutate({ incidentId, toStatus, reason: transitionReason || undefined })}
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending ? 'Updating…' : 'Transition'}
            </Button>
          </div>
        </div>

        {/* Close */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-sm font-semibold text-gray-900">Close Incident</div>
          <p className="mt-1 text-xs text-gray-600">Backend: POST /incidents/{'{'}incidentId{'}'}/close</p>

          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="closureNotes">closureNotes (optional)</Label>
              <Textarea id="closureNotes" value={closureNotes} onChange={(e) => setClosureNotes(e.target.value)} placeholder="Closure notes" />
            </div>

            <div>
              <Label htmlFor="includeEvidenceIds">includeEvidenceIds (optional, comma-separated UUIDs)</Label>
              <Input
                id="includeEvidenceIds"
                value={includeEvidenceIds}
                onChange={(e) => setIncludeEvidenceIds(e.target.value)}
                placeholder="uuid1, uuid2"
              />
              <p className="mt-1 text-xs text-gray-500">If evidence service is unavailable, close may fail (backend dependency).</p>
            </div>

            <Button
              variant="destructive"
              onClick={() => {
                const ids = includeEvidenceIds
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);

                closeMutation.mutate({
                  incidentId,
                  closureNotes: closureNotes || undefined,
                  includeEvidenceIds: ids.length ? ids : undefined,
                });
              }}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? 'Closing…' : 'Close'}
            </Button>
          </div>
        </div>

        {/* Tasks */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-sm font-semibold text-gray-900">Create Task</div>
          <p className="mt-1 text-xs text-gray-600">Backend: POST /incidents/{'{'}incidentId{'}'}/tasks (no list endpoint found)</p>

          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="taskType">taskType *</Label>
              <Input
                id="taskType"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                placeholder="IMPACT_ASSESSMENT | CONTAINMENT | DRAFT_NOTICE | FORENSICS | OTHER"
              />
            </div>

            <div>
              <Label htmlFor="assignedTo">assignedTo (optional UUID)</Label>
              <Input id="assignedTo" value={taskAssignedTo} onChange={(e) => setTaskAssignedTo(e.target.value)} placeholder="User UUID" />
            </div>

            <div>
              <Label htmlFor="taskNotes">notes (optional)</Label>
              <Textarea id="taskNotes" value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} placeholder="Notes" />
            </div>

            <Button
              variant="outline"
              onClick={() =>
                createTaskMutation.mutate({
                  incidentId,
                  request: {
                    taskType,
                    assignedTo: taskAssignedTo || undefined,
                    notes: taskNotes || undefined,
                  },
                })
              }
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? 'Creating…' : 'Create Task'}
            </Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-sm font-semibold text-gray-900">Notification Workflow</div>
          <p className="mt-1 text-xs text-gray-600">Backend: /incidents/{'{'}incidentId{'}'}/notifications/*</p>

          <div className="mt-4 space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-600">Draft</div>

              <div>
                <Label htmlFor="channel">channel *</Label>
                <Input
                  id="channel"
                  value={draftChannel}
                  onChange={(e) => setDraftChannel(e.target.value as NotificationChannel)}
                  placeholder="EMAIL | SMS | WHATSAPP"
                />
              </div>

              <div>
                <Label htmlFor="draftText">draftText *</Label>
                <Textarea id="draftText" value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="Draft notice content" />
              </div>

              <div>
                <Label htmlFor="draftMetadata">metadata (optional JSON object)</Label>
                <Textarea
                  id="draftMetadata"
                  value={draftMetadataJson}
                  onChange={(e) => setDraftMetadataJson(e.target.value)}
                  placeholder='e.g., {"language":"en"}'
                />
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  let metadata: Record<string, unknown> | undefined;
                  if (draftMetadataJson.trim()) {
                    try {
                      const parsed = JSON.parse(draftMetadataJson);
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

                  draftMutation.mutate({
                    incidentId,
                    request: {
                      channel: draftChannel,
                      draftText,
                      metadata,
                    },
                  });
                }}
                disabled={draftMutation.isPending || !draftChannel || !draftText}
              >
                {draftMutation.isPending ? 'Drafting…' : 'Create Draft'}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-600">Approve / Reject / Send</div>

              <div>
                <Label htmlFor="notificationId">notificationId *</Label>
                <Input
                  id="notificationId"
                  value={notificationIdInput}
                  onChange={(e) => setNotificationIdInput(e.target.value)}
                  placeholder="UUID"
                />
                <p className="mt-1 text-xs text-gray-500">The backend does not expose a list-notifications endpoint; paste the ID or use the Draft action above.</p>
              </div>

              <div>
                <Label htmlFor="approvalReason">reason (optional)</Label>
                <Input id="approvalReason" value={approvalReason} onChange={(e) => setApprovalReason(e.target.value)} placeholder="Reason" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => approveMutation.mutate({ incidentId, notificationId: notificationIdInput, reason: approvalReason || undefined })}
                  disabled={approveMutation.isPending || !notificationIdInput}
                >
                  Approve
                </Button>

                <Button
                  variant="outline"
                  onClick={() => rejectMutation.mutate({ incidentId, notificationId: notificationIdInput, reason: approvalReason || undefined })}
                  disabled={rejectMutation.isPending || !notificationIdInput}
                >
                  Reject
                </Button>

                <Button
                  variant="outline"
                  onClick={() => sendMutation.mutate({ incidentId, notificationId: notificationIdInput })}
                  disabled={sendMutation.isPending || !notificationIdInput}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-900" />
              <div className="text-sm font-semibold text-gray-900">Audit Timeline</div>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Tenant audit events. No incident-scoped audit endpoint was found; use eventType to narrow if your backend emits incident-specific events.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="eventType">eventType filter (optional)</Label>
            <Input
              id="eventType"
              value={auditEventType}
              onChange={(e) => {
                setAuditEventType(e.target.value);
                setAuditPage(0);
              }}
              placeholder="e.g., INCIDENT.CLOSED"
            />
          </div>
          <div>
            <Label htmlFor="auditPageSize">Page Size</Label>
            <Input
              id="auditPageSize"
              type="number"
              min={1}
              max={50}
              value={auditPageSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next) && next > 0) {
                  setAuditPageSize(next);
                  setAuditPage(0);
                }
              }}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => auditQuery.refetch()} disabled={auditQuery.isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${auditQuery.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {auditQuery.data && (
            <AuditTimeline
              events={auditQuery.data.content}
              isLoading={auditQuery.isLoading}
              error={auditQuery.error as Error}
              currentPage={auditPage}
              totalPages={auditQuery.data.totalPages}
              pageSize={auditPageSize}
              totalElements={auditQuery.data.totalElements}
              onPageChange={setAuditPage}
              emptyMessage="No audit events found"
            />
          )}
          {!auditQuery.data && auditQuery.isLoading && <div className="text-sm text-gray-500">Loading audit events…</div>}
          {auditQuery.error && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Failed to load audit events: {(auditQuery.error as Error).message}
            </div>
          )}
        </div>
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        objectType="INCIDENT"
        objectId={incidentId}
        bundleId={incident?.evidenceBundleId ?? undefined}
        title={incident ? `Evidence Context — Incident ${incident.incidentId}` : 'Evidence Context — Incident'}
      />

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
        <div className="font-medium text-gray-900 mb-1">Backend endpoints used on this page</div>
        <div className="font-mono">GET /incidents/{'{'}incidentId{'}'}</div>
        <div className="font-mono">POST /incidents/{'{'}incidentId{'}'}/transition</div>
        <div className="font-mono">POST /incidents/{'{'}incidentId{'}'}/close</div>
        <div className="font-mono">POST /incidents/{'{'}incidentId{'}'}/tasks</div>
        <div className="font-mono">POST /incidents/{'{'}incidentId{'}'}/notifications/draft</div>
        <div className="font-mono">POST /incidents/{'{'}incidentId{'}'}/notifications/{'{'}notificationId{'}'}/approve</div>
        <div className="font-mono">POST /incidents/{'{'}incidentId{'}'}/notifications/{'{'}notificationId{'}'}/reject</div>
        <div className="font-mono">POST /incidents/{'{'}incidentId{'}'}/notifications/{'{'}notificationId{'}'}/send</div>
        <div className="mt-2 text-gray-600">Evidence/audit drawer uses evidence-reporting-service endpoints (see Part 6 report for full list).</div>
      </div>
    </div>
  );
}

export default IncidentDetailPage;
