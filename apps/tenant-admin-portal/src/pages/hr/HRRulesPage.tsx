import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listHRPurposes,
  createHRPurpose,
  type HRPurpose,
  type LawfulBasis,
} from '@/lib/api/employee';

const LAWFUL_BASIS_OPTIONS: LawfulBasis[] = [
  'CONTRACT',
  'LEGAL_OBLIGATION',
  'LEGITIMATE_INTEREST',
  'CONSENT',
];

const emptyForm = {
  purposeKey: '',
  description: '',
  lawfulBasis: 'CONTRACT' as LawfulBasis,
  retentionDays: 365,
  sensitive: false,
};

export default function HRRulesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: purposes = [], isLoading, error } = useQuery({
    queryKey: ['hr-purposes'],
    queryFn: listHRPurposes,
  });

  const createMutation = useMutation({
    mutationFn: createHRPurpose,
    onSuccess: () => {
      toast.success('HR purpose created');
      qc.invalidateQueries({ queryKey: ['hr-purposes'] });
      setShowCreate(false);
      setForm(emptyForm);
    },
    onError: () => toast.error('Failed to create HR purpose'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.purposeKey.trim() || !form.description.trim()) {
      toast.error('Purpose key and description are required');
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HR Document Rules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage HR purposes, lawful bases, and retention policies for employee data.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New Purpose
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Create HR Purpose</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Purpose Key</label>
                <input
                  className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. PAYROLL_PROCESSING"
                  value={form.purposeKey}
                  onChange={(e) => setForm({ ...form, purposeKey: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Lawful Basis</label>
                  <select
                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.lawfulBasis}
                    onChange={(e) => setForm({ ...form, lawfulBasis: e.target.value as LawfulBasis })}
                  >
                    {LAWFUL_BASIS_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Retention (days)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.retentionDays}
                    onChange={(e) => setForm({ ...form, retentionDays: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sensitive"
                  checked={form.sensitive}
                  onChange={(e) => setForm({ ...form, sensitive: e.target.checked })}
                />
                <label htmlFor="sensitive" className="text-sm font-medium">
                  Sensitive data (special category)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setForm(emptyForm); }}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purposes table */}
      <div className="rounded-lg border bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading HR purposes…</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">
            Failed to load HR purposes. Is employee-data-service running on port 8091?
          </div>
        ) : purposes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No HR purposes configured yet. Click "+ New Purpose" to add one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Purpose Key</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lawful Basis</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Retention</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sensitive</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {purposes.map((p: HRPurpose) => (
                <tr key={p.purposeId} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono font-medium">{p.purposeKey}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.description}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      {p.lawfulBasis}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.retentionDays}d</td>
                  <td className="px-4 py-3">
                    {p.sensitive ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Sensitive
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
