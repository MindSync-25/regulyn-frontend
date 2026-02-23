import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { getClaim, approveClaim, closeClaim, type Claim } from '@/lib/api/nominee';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

function Badge({ label }: { label: string }) {
  const cls = STATUS_COLORS[label] ?? 'bg-gray-100 text-gray-600';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

export default function NomineeDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const qc = useQueryClient();
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [closureNotes, setClosureNotes] = useState('');
  const [showApprove, setShowApprove] = useState(false);
  const [showClose, setShowClose] = useState(false);

  const { data: claim, isLoading, error } = useQuery<Claim>({
    queryKey: ['claim', claimId],
    queryFn: () => getClaim(claimId!),
    enabled: Boolean(claimId),
  });

  const approveMutation = useMutation({
    mutationFn: ({ decision }: { decision: string }) =>
      approveClaim(claimId!, { decision, notes: approveNotes || undefined }),
    onSuccess: () => {
      toast.success('Claim decision recorded');
      qc.invalidateQueries({ queryKey: ['claim', claimId] });
      setShowApprove(false);
      setApproveNotes('');
    },
    onError: () => toast.error('Action failed'),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeClaim(claimId!, { closureNotes: closureNotes || undefined }),
    onSuccess: () => {
      toast.success('Claim closed');
      qc.invalidateQueries({ queryKey: ['claim', claimId] });
      setShowClose(false);
      setClosureNotes('');
    },
    onError: () => toast.error('Close failed'),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">Loading claim details…</div>
    );
  }

  if (error || !claim) {
    return (
      <div className="space-y-4">
        <Link to="/hr/nominees" className="text-sm text-primary hover:underline">
          ← Back to Nominees
        </Link>
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Claim not found or nominee service is unavailable.
        </div>
      </div>
    );
  }

  const canDecide = ['OPEN', 'IN_REVIEW'].includes(claim.status);
  const canClose = !['CLOSED', 'REJECTED'].includes(claim.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/hr/nominees" className="text-sm text-primary hover:underline">
          ← Back to Nominees
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Claim Detail</h1>
            <Badge label={claim.status} />
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
      </div>

      {/* Claim info */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Claim Information</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="font-medium text-muted-foreground">Claim ID</dt>
          <dd className="font-mono text-xs">{claim.claimId}</dd>
          <dt className="font-medium text-muted-foreground">Nominee ID</dt>
          <dd className="font-mono text-xs">{claim.nomineeId}</dd>
          <dt className="font-medium text-muted-foreground">Type</dt>
          <dd>{claim.type}</dd>
          <dt className="font-medium text-muted-foreground">Status</dt>
          <dd><Badge label={claim.status} /></dd>
          <dt className="font-medium text-muted-foreground">Approved By</dt>
          <dd className="font-mono text-xs">{claim.approvedBy || '—'}</dd>
          <dt className="font-medium text-muted-foreground">Approved At</dt>
          <dd>{claim.approvedAt ? new Date(claim.approvedAt).toLocaleString() : '—'}</dd>
          <dt className="font-medium text-muted-foreground">Closed By</dt>
          <dd className="font-mono text-xs">{claim.closedBy || '—'}</dd>
          <dt className="font-medium text-muted-foreground">Closed At</dt>
          <dd>{claim.closedAt ? new Date(claim.closedAt).toLocaleString() : '—'}</dd>
          <dt className="font-medium text-muted-foreground">Closure Notes</dt>
          <dd>{claim.closureNotes || '—'}</dd>
        </dl>

        {/* Claim details */}
        {claim.details && Object.keys(claim.details).length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Claim Details</p>
            <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(claim.details, null, 2)}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
          {canDecide && (
            <button
              onClick={() => setShowApprove(true)}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Approve / Reject
            </button>
          )}
          {canClose && (
            <button
              onClick={() => setShowClose(true)}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Close Claim
            </button>
          )}
        </div>
      </div>

      {/* Approve/Reject modal */}
      {showApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Approve or Reject Claim</h2>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowApprove(false); setApproveNotes(''); }}
                className="rounded border px-4 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => approveMutation.mutate({ decision: 'REJECT' })}
                disabled={approveMutation.isPending}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => approveMutation.mutate({ decision: 'APPROVE' })}
                disabled={approveMutation.isPending}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Processing…' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close modal */}
      {showClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Close Claim</h2>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Closure Notes</label>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Enter reason for closing…"
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowClose(false); setClosureNotes(''); }}
                className="rounded border px-4 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {closeMutation.isPending ? 'Closing…' : 'Close Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        objectType="NOMINEE_CLAIM"
        objectId={claimId}
        title="Nominee Claim — Evidence & Audit"
      />
    </div>
  );
}
