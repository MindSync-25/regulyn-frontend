import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listAgeRules,
  upsertAgeRule,
  getEffectiveAgeRule,
  type AgeRule,
  type AgeRuleEffective,
} from '@/lib/api/children';

const EMPTY_FORM = {
  countryCode: '',
  stateCode: '',
  ageThreshold: 16,
  effectiveFrom: new Date().toISOString().slice(0, 10),
};

export default function AgeRulesPage() {
  const qc = useQueryClient();
  const [showUpsert, setShowUpsert] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Effective rule lookup
  const [lookupCountry, setLookupCountry] = useState('');
  const [lookupState, setLookupState] = useState('');
  const [lookupKey, setLookupKey] = useState<{ country: string; state?: string } | null>(null);

  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ['age-rules'],
    queryFn: listAgeRules,
  });

  const effectiveQuery = useQuery<AgeRuleEffective>({
    queryKey: ['age-rule-effective', lookupKey],
    queryFn: () => getEffectiveAgeRule(lookupKey!.country, lookupKey?.state),
    enabled: Boolean(lookupKey),
  });

  const upsertMutation = useMutation({
    mutationFn: upsertAgeRule,
    onSuccess: () => {
      toast.success('Age rule saved');
      qc.invalidateQueries({ queryKey: ['age-rules'] });
      setShowUpsert(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error('Failed to save age rule'),
  });

  function handleUpsert(e: React.FormEvent) {
    e.preventDefault();
    const cc = form.countryCode.trim().toUpperCase();
    if (cc.length !== 2) {
      toast.error('Country code must be exactly 2 characters (ISO 3166-1 alpha-2)');
      return;
    }
    if (form.ageThreshold < 13 || form.ageThreshold > 18) {
      toast.error('Age threshold must be between 13 and 18');
      return;
    }
    upsertMutation.mutate({
      countryCode: cc,
      stateCode: form.stateCode.trim() || undefined,
      ageThreshold: form.ageThreshold,
      effectiveFrom: form.effectiveFrom,
    });
  }

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const c = lookupCountry.trim().toUpperCase();
    if (c.length !== 2) {
      toast.error('Enter a 2-character country code');
      return;
    }
    setLookupKey({ country: c, state: lookupState.trim() || undefined });
  }

  function editRule(rule: AgeRule) {
    setForm({
      countryCode: rule.countryCode,
      stateCode: rule.stateCode ?? '',
      ageThreshold: rule.ageThreshold,
      effectiveFrom: rule.effectiveFrom,
    });
    setShowUpsert(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Age Rules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure age thresholds and consent models per country/region for child data processing.
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowUpsert(true); }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Add / Update Rule
        </button>
      </div>

      {/* Effective rule lookup */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Lookup Effective Rule</h2>
        <form onSubmit={handleLookup} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Country Code</label>
            <input
              maxLength={2}
              className="w-24 rounded border px-3 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="IN"
              value={lookupCountry}
              onChange={(e) => setLookupCountry(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">State (optional)</label>
            <input
              className="w-32 rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. GJ"
              value={lookupState}
              onChange={(e) => setLookupState(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="rounded bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Lookup
          </button>
        </form>

        {lookupKey && (
          <div className="mt-4">
            {effectiveQuery.isLoading && (
              <div className="text-sm text-muted-foreground">Looking up rule…</div>
            )}
            {effectiveQuery.error && (
              <div className="text-sm text-red-600">No effective rule found for {lookupKey.country}.</div>
            )}
            {effectiveQuery.data && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm">
                <p className="font-medium text-green-800">
                  Effective rule for{' '}
                  <strong>{effectiveQuery.data.countryCode}{effectiveQuery.data.stateCode ? '/' + effectiveQuery.data.stateCode : ''}</strong>
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-700">
                  <dt>Age Threshold</dt><dd className="font-bold">{effectiveQuery.data.ageThreshold} years</dd>
                  <dt>Consent Model</dt><dd>{effectiveQuery.data.consentModel}</dd>
                  <dt>Effective From</dt><dd>{effectiveQuery.data.effectiveFrom}</dd>
                  <dt>Resolved From</dt><dd>{effectiveQuery.data.resolvedFrom}</dd>
                </dl>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rules table */}
      <div className="rounded-lg border bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading age rules…</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">
            Failed to load rules. Is children-guardian-service running on port 8089?
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No age rules configured. Click "+ Add / Update Rule" to create the first one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Country</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">State</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Age Threshold</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Consent Model</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Effective From</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Effective To</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(rules as AgeRule[]).map((r) => (
                <tr key={r.ruleId} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono font-semibold">{r.countryCode}</td>
                  <td className="px-4 py-3 font-mono">{r.stateCode || '—'}</td>
                  <td className="px-4 py-3 font-bold">{r.ageThreshold}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      {r.consentModel}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.effectiveFrom}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.effectiveTo || 'Active'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => editRule(r)}
                      className="rounded border px-2 py-1 text-xs hover:bg-accent"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upsert modal */}
      {showUpsert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Add / Update Age Rule</h2>
            <form onSubmit={handleUpsert} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Country Code <span className="text-muted-foreground">(ISO 2-char)</span>
                  </label>
                  <input
                    maxLength={2}
                    className="w-full rounded border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="IN"
                    value={form.countryCode}
                    onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">State Code (optional)</label>
                  <input
                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="GJ"
                    value={form.stateCode}
                    onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Age Threshold (13–18)</label>
                  <input
                    type="number"
                    min={13}
                    max={18}
                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.ageThreshold}
                    onChange={(e) => setForm({ ...form, ageThreshold: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Effective From</label>
                  <input
                    type="date"
                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.effectiveFrom}
                    onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowUpsert(false); setForm(EMPTY_FORM); }}
                  className="rounded border px-4 py-2 text-sm hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {upsertMutation.isPending ? 'Saving…' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
