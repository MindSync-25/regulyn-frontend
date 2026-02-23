import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getNominee,
  getClaimsByNominee,
  verifyNominee,
  rejectNominee,
  disableNominee,
  requestNomineeExport,
  type Nominee,
  type Claim,
} from '@/lib/api/nominee';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  VERIFIED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXCEPTION: 'bg-orange-100 text-orange-800',
  OPEN: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

function Badge({ label }: { label: string }) {
  const cls = STATUS_COLORS[label] ?? 'bg-gray-100 text-gray-600';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

export default function NomineesPage() {
  const qc = useQueryClient();
  const [nomineeId, setNomineeId] = useState('');
  const [activeId, setActiveId] = useState('');

  // Verify/reject form
  const [showVerify, setShowVerify] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyMode, setVerifyMode] = useState<'approve' | 'reject'>('approve');

  const nomineeQuery = useQuery({
    queryKey: ['nominee', activeId],
    queryFn: () => getNominee(activeId),
    enabled: Boolean(activeId),
  });

  const claimsQuery = useQuery({
    queryKey: ['nominee-claims', activeId],
    queryFn: () => getClaimsByNominee(activeId),
    enabled: Boolean(activeId),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: 'approve' | 'reject' }) =>
      mode === 'approve'
        ? verifyNominee(id, { verificationStatus: 'VERIFIED' })
        : rejectNominee(id, { rejectionReason: rejectReason }),
    onSuccess: () => {
      toast.success(verifyMode === 'approve' ? 'Nominee verified' : 'Nominee rejected');
      qc.invalidateQueries({ queryKey: ['nominee', activeId] });
      setShowVerify(false);
      setRejectReason('');
    },
    onError: () => toast.error('Action failed'),
  });

  const disableMutation = useMutation({
    mutationFn: disableNominee,
    onSuccess: () => {
      toast.success('Nominee disabled');
      qc.invalidateQueries({ queryKey: ['nominee', activeId] });
    },
    onError: () => toast.error('Disable failed'),
  });

  const exportMutation = useMutation({
    mutationFn: requestNomineeExport,
    onSuccess: () => toast.success('Export requested'),
    onError: () => toast.error('Export failed'),
  });

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = nomineeId.trim();
    if (!id) return;
    setActiveId(id);
  }

  const nominee: Nominee | undefined = nomineeQuery.data;
  const claims: Claim[] = claimsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nominee Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Look up nominees by ID to view their verification status and claims. Verify, reject, or
          disable nominees.
        </p>
      </div>

      {/* ⚠️ RBAC note */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Note:</strong> Nominee service uses internal role strings ("ADMIN", "NOMINEE") not
        present in this portal's role system. Actions are shown but the backend will return 403 if
        you lack the required backend role.
      </div>

      {/* Lookup form */}
      <form onSubmit={handleLookup} className="flex gap-3">
        <input
          className="w-full max-w-sm rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter Nominee UUID"
          value={nomineeId}
          onChange={(e) => setNomineeId(e.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Look Up
        </button>
        {activeId && (
          <button
            type="button"
            onClick={() => { setActiveId(''); setNomineeId(''); }}
            className="rounded border px-4 py-2 text-sm hover:bg-accent"
          >
            Clear
          </button>
        )}
      </form>

      {/* Results */}
      {activeId && (
        <>
          {nomineeQuery.isLoading && (
            <div className="text-sm text-muted-foreground">Loading nominee…</div>
          )}
          {nomineeQuery.error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Nominee not found or service unavailable.
            </div>
          )}

          {nominee && (
            <div className="space-y-4">
              {/* Nominee card */}
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{nominee.fullName}</h2>
                    <p className="text-sm text-muted-foreground">{nominee.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={nominee.verificationStatus} />
                    {!nominee.enabled && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Disabled
                      </span>
                    )}
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="font-medium text-muted-foreground">Nominee ID</dt>
                  <dd className="font-mono text-xs">{nominee.nomineeId}</dd>
                  <dt className="font-medium text-muted-foreground">Data Principal</dt>
                  <dd className="font-mono text-xs">{nominee.dataPrincipalId}</dd>
                  <dt className="font-medium text-muted-foreground">Phone</dt>
                  <dd>{nominee.phone || '—'}</dd>
                  <dt className="font-medium text-muted-foreground">Relationship</dt>
                  <dd>{nominee.relationship}</dd>
                  <dt className="font-medium text-muted-foreground">Verified At</dt>
                  <dd>{nominee.verifiedAt ? new Date(nominee.verifiedAt).toLocaleString() : '—'}</dd>
                  <dt className="font-medium text-muted-foreground">Rejection Reason</dt>
                  <dd>{nominee.rejectionReason || '—'}</dd>
                  <dt className="font-medium text-muted-foreground">Created</dt>
                  <dd>{new Date(nominee.createdAt).toLocaleString()}</dd>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  {nominee.verificationStatus === 'PENDING' && (
                    <>
                      <button
                        onClick={() => { setVerifyMode('approve'); setShowVerify(true); }}
                        className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => { setVerifyMode('reject'); setShowVerify(true); }}
                        className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {nominee.enabled && (
                    <button
                      onClick={() => {
                        if (confirm('Disable this nominee?')) disableMutation.mutate(nominee.nomineeId);
                      }}
                      disabled={disableMutation.isPending}
                      className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Disable
                    </button>
                  )}
                  <button
                    onClick={() => exportMutation.mutate(nominee.nomineeId)}
                    disabled={exportMutation.isPending}
                    className="rounded border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
                  >
                    {exportMutation.isPending ? 'Requesting…' : 'Request Export'}
                  </button>
                </div>
              </div>

              {/* Claims table */}
              <div className="rounded-lg border bg-white shadow-sm">
                <div className="border-b px-4 py-3">
                  <h3 className="font-semibold">Claims</h3>
                </div>
                {claimsQuery.isLoading ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">Loading claims…</div>
                ) : claims.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No claims found for this nominee.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Claim ID</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {claims.map((c: Claim) => (
                        <tr key={c.claimId} className="hover:bg-muted/20">
                          <td className="px-4 py-3 font-mono text-xs">{c.claimId.slice(0, 8)}…</td>
                          <td className="px-4 py-3">{c.type}</td>
                          <td className="px-4 py-3"><Badge label={c.status} /></td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/hr/nominees/${c.claimId}`}
                              className="rounded border px-2 py-1 text-xs hover:bg-accent"
                            >
                              Detail →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Verify/Reject modal */}
      {showVerify && nominee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">
              {verifyMode === 'approve' ? 'Verify Nominee' : 'Reject Nominee'}
            </h2>
            {verifyMode === 'reject' && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium">Rejection Reason</label>
                <textarea
                  className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowVerify(false); setRejectReason(''); }}
                className="rounded border px-4 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => verifyMutation.mutate({ id: nominee.nomineeId, mode: verifyMode })}
                disabled={verifyMutation.isPending || (verifyMode === 'reject' && !rejectReason.trim())}
                className={`rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  verifyMode === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {verifyMutation.isPending ? 'Processing…' : `Confirm ${verifyMode === 'approve' ? 'Verify' : 'Reject'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
