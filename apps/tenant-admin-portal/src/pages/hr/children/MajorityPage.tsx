import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { majorityCheck, type MajorityCheckResponse } from '@/lib/api/children';

export default function MajorityPage() {
  const [childId, setChildId] = useState('');
  const [evaluationDate, setEvaluationDate] = useState('');
  const [result, setResult] = useState<MajorityCheckResponse | null>(null);

  const checkMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date?: string }) =>
      majorityCheck(id, date ? { evaluationDate: date } : undefined),
    onSuccess: (data) => {
      setResult(data);
      toast.success('Majority check completed');
    },
    onError: () => toast.error('Majority check failed — verify the child ID is correct'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = childId.trim();
    if (!id) { toast.error('Child ID is required'); return; }
    setResult(null);
    checkMutation.mutate({ id, date: evaluationDate || undefined });
  }

  function clearAll() {
    setChildId('');
    setEvaluationDate('');
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Majority Transition Check</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Run a majority transition check for a child. Determines whether the child has reached
          legal majority and triggers any configured status transitions.
        </p>
      </div>

      {/* Info */}
      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>How it works:</strong> The service uses the child's date of birth and the applicable
        age rule for their region to compute the majority date. If an evaluation date is provided,
        the check is performed as-of that date; otherwise today is used.
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Run Majority Check</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Child ID (UUID)</label>
            <input
              className="w-full max-w-md rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter child UUID"
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Evaluation Date{' '}
              <span className="text-muted-foreground font-normal">(optional — defaults to today)</span>
            </label>
            <input
              type="date"
              className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={checkMutation.isPending}
              className="rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {checkMutation.isPending ? 'Checking…' : 'Run Check'}
            </button>
            {(result || childId) && (
              <button
                type="button"
                onClick={clearAll}
                className="rounded border px-4 py-2 text-sm hover:bg-accent"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg border p-6 shadow-sm ${
            result.error
              ? 'border-red-200 bg-red-50'
              : result.reached
              ? 'border-green-200 bg-green-50'
              : 'border-yellow-200 bg-yellow-50'
          }`}
        >
          <h3 className={`mb-3 text-base font-semibold ${
            result.error ? 'text-red-800' : result.reached ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {result.error
              ? '⚠ Error in majority check'
              : result.reached
              ? '✓ Majority Reached'
              : '⏳ Not Yet Majority'}
          </h3>

          {result.error && (
            <p className="mb-3 text-sm text-red-700">{result.error}</p>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="font-medium text-muted-foreground">Child ID</dt>
            <dd className="font-mono text-xs">{result.childId}</dd>
            <dt className="font-medium text-muted-foreground">Majority Date</dt>
            <dd className="font-semibold">{result.majorityDate}</dd>
            <dt className="font-medium text-muted-foreground">Reached</dt>
            <dd>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                result.reached ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {result.reached ? 'YES' : 'NO'}
              </span>
            </dd>
            <dt className="font-medium text-muted-foreground">Transition Status</dt>
            <dd className="font-mono text-xs">{result.transitionStatus}</dd>
            <dt className="font-medium text-muted-foreground">Resolved From</dt>
            <dd className="text-xs text-muted-foreground">{result.resolvedFrom}</dd>
          </dl>

          {result.reached && (
            <div className="mt-4 rounded-md border border-green-300 bg-white px-3 py-2 text-sm text-green-700">
              This child has reached legal majority. Any consent flows requiring guardian approval
              may now transition to direct consent from the data principal.
            </div>
          )}
        </div>
      )}

      {/* Usage notes */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm font-medium text-muted-foreground">API Notes</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Endpoint: <code className="text-xs">POST /children/&#123;childId&#125;/majority-check</code></li>
          <li>• Service: children-guardian-service (port 8089)</li>
          <li>• If no age rule exists for the child's region, the check may fail</li>
          <li>• <code className="text-xs">transitionStatus</code> reflects any downstream state changes triggered</li>
        </ul>
      </div>
    </div>
  );
}
