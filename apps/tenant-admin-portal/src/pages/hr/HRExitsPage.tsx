import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listEmployeeRequests,
  approveEmployeeRequest,
  closeEmployeeRequest,
  type EmployeeRequest,
  type RequestStatus,
} from '@/lib/api/employee';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';

const STATUS_OPTIONS: RequestStatus[] = [
  'RECEIVED',
  'IN_REVIEW',
  'NEEDS_INFO',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'CLOSED',
];

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-purple-100 text-purple-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  NEEDS_INFO: 'bg-orange-100 text-orange-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-teal-100 text-teal-800',
  REJECTED: 'bg-red-100 text-red-800',
  FAILED: 'bg-red-200 text-red-900',
  CLOSED: 'bg-gray-100 text-gray-600',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
  );
}

interface DetailModal {
  request: EmployeeRequest;
  mode: 'view' | 'approve' | 'reject' | 'close';
}

export default function HRExitsPage() {
  const qc = useQueryClient();
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('DELETE');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [modal, setModal] = useState<DetailModal | null>(null);

  // Approve/reject form
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  // Close form
  const [closureNotes, setClosureNotes] = useState('');

  const PAGE_SIZE = 20;

  const queryKey = ['employee-requests', filterStatus, filterType, filterEmployee, page];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      listEmployeeRequests({
        status: filterStatus || undefined,
        requestType: filterType || undefined,
        employeeId: filterEmployee || undefined,
        page,
        size: PAGE_SIZE,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, decision, reason }: { id: string; decision: 'APPROVE' | 'REJECT'; reason?: string }) =>
      approveEmployeeRequest(id, { decision, reason }),
    onSuccess: () => {
      toast.success(`Request ${decision === 'APPROVE' ? 'approved' : 'rejected'}`);
      qc.invalidateQueries({ queryKey: ['employee-requests'] });
      setModal(null);
      setReason('');
    },
    onError: () => toast.error('Action failed'),
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      closeEmployeeRequest(id, { closureNotes: notes }),
    onSuccess: () => {
      toast.success('Request closed');
      qc.invalidateQueries({ queryKey: ['employee-requests'] });
      setModal(null);
      setClosureNotes('');
    },
    onError: () => toast.error('Close failed'),
  });

  const requests = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function openDetail(req: EmployeeRequest, mode: DetailModal['mode']) {
    setModal({ request: req, mode });
    setDecision('APPROVE');
    setReason('');
    setClosureNotes('');
  }

  function handleApprove() {
    if (!modal) return;
    approveMutation.mutate({ id: modal.request.requestId, decision, reason: reason || undefined });
  }

  function handleClose() {
    if (!modal) return;
    closeMutation.mutate({ id: modal.request.requestId, notes: closureNotes });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HR Exit Workflows</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Employee request workflows — review, approve, reject, or close requests.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEvidenceOpen(true)}
          className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
          aria-label="Open evidence and audit drawer"
        >
          🔍 Evidence / Audit
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Filter by employee ID"
          value={filterEmployee}
          onChange={(e) => { setFilterEmployee(e.target.value); setPage(0); }}
        />
        <select
          className="rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
        >
          <option value="">All types</option>
          <option value="ACCESS">ACCESS</option>
          <option value="CORRECT">CORRECT</option>
          <option value="DELETE">DELETE</option>
          <option value="WITHDRAW">WITHDRAW</option>
        </select>
        <select
          className="rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading requests…</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">
            Failed to load requests. Is employee-data-service running?
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No requests found.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Request ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((req: EmployeeRequest) => (
                  <tr key={req.requestId} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {req.requestId.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{req.employeeId.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                        {req.requestType}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetail(req, 'view')}
                          className="rounded border px-2 py-1 text-xs hover:bg-accent"
                        >
                          View
                        </button>
                        {req.requiresApproval && ['PENDING', 'IN_PROGRESS'].includes(req.status) && (
                          <button
                            onClick={() => openDetail(req, 'approve')}
                            className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                          >
                            Decide
                          </button>
                        )}
                        {!['CLOSED', 'REJECTED'].includes(req.status) && (
                          <button
                            onClick={() => openDetail(req, 'close')}
                            className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {total} total • page {page + 1} of {Math.max(totalPages, 1)}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="rounded border px-3 py-1 text-xs disabled:opacity-40 hover:bg-accent"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="rounded border px-3 py-1 text-xs disabled:opacity-40 hover:bg-accent"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            {modal.mode === 'view' && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Request Detail</h2>
                <dl className="space-y-2 text-sm">
                  {[
                    ['Request ID', modal.request.requestId],
                    ['Employee ID', modal.request.employeeId],
                    ['Type', modal.request.requestType],
                    ['Status', modal.request.status],
                    ['Decision', modal.request.decision ?? '—'],
                    ['Reason', modal.request.reason ?? '—'],
                    ['Assigned To', modal.request.assignedTo ?? '—'],
                    ['Approved By', modal.request.approvedBy ?? '—'],
                    ['Closure Notes', modal.request.closureNotes ?? '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="grid grid-cols-3 gap-2">
                      <dt className="font-medium text-muted-foreground">{label}</dt>
                      <dd className="col-span-2 font-mono text-xs">{val}</dd>
                    </div>
                  ))}
                  {Object.keys(modal.request.details ?? {}).length > 0 && (
                    <div>
                      <dt className="font-medium text-muted-foreground mb-1">Details</dt>
                      <dd>
                        <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-40">
                          {JSON.stringify(modal.request.details, null, 2)}
                        </pre>
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setModal(null)} className="rounded border px-4 py-2 text-sm hover:bg-accent">
                    Close
                  </button>
                </div>
              </>
            )}

            {modal.mode === 'approve' && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Approve / Reject Request</h2>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    {(['APPROVE', 'REJECT'] as const).map((d) => (
                      <label key={d} className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="radio"
                          name="decision"
                          value={d}
                          checked={decision === d}
                          onChange={() => setDecision(d)}
                        />
                        <span className={d === 'APPROVE' ? 'text-green-700' : 'text-red-700'}>{d}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Reason (optional)</label>
                    <textarea
                      className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setModal(null)} className="rounded border px-4 py-2 text-sm hover:bg-accent">
                      Cancel
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                      className={`rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${decision === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {approveMutation.isPending ? 'Processing…' : `Confirm ${decision}`}
                    </button>
                  </div>
                </div>
              </>
            )}

            {modal.mode === 'close' && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Close Request</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Closure Notes</label>
                    <textarea
                      className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      placeholder="Enter closure notes…"
                      value={closureNotes}
                      onChange={(e) => setClosureNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setModal(null)} className="rounded border px-4 py-2 text-sm hover:bg-accent">
                      Cancel
                    </button>
                    <button
                      onClick={handleClose}
                      disabled={closeMutation.isPending}
                      className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {closeMutation.isPending ? 'Closing…' : 'Close Request'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        objectType="EMPLOYEE_REQUEST"
        title="Employee Requests — Evidence & Audit"
      />
    </div>
  );
}
