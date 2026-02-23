import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createGuardian,
  createChild,
  createConsent,
  approveConsent,
  createEsignRequest,
  type Guardian,
  type Child,
  type Consent,
  type EsignRequest,
} from '@/lib/api/children';

type Step = 'guardian' | 'child' | 'consent' | 'esign' | 'done';

const ESIGN_PROVIDERS = ['DOCUSIGN', 'SIGNDESK', 'LEEGALITY'];

export default function ESignPage() {
  const [step, setStep] = useState<Step>('guardian');
  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [esign, setEsign] = useState<EsignRequest | null>(null);

  // Guardian form
  const [gForm, setGForm] = useState({ fullName: '', email: '', phone: '', relationship: 'PARENT' });

  // Child form
  const [cForm, setCForm] = useState({
    fullName: '',
    dateOfBirth: '',
    regionCountryCode: 'IN',
    regionStateCode: '',
    jurisdiction: '',
  });

  // Consent form
  const [conForm, setConForm] = useState({ consentType: 1, jurisdiction: '' });

  // eSign form
  const [esignForm, setEsignForm] = useState({
    provider: 'DOCUSIGN',
    guardianEmail: '',
    guardianName: '',
  });

  const guardianMutation = useMutation({
    mutationFn: createGuardian,
    onSuccess: (data) => {
      setGuardian(data);
      setEsignForm({ ...esignForm, guardianEmail: data.email, guardianName: data.fullName });
      toast.success('Guardian created');
      setStep('child');
    },
    onError: () => toast.error('Failed to create guardian'),
  });

  const childMutation = useMutation({
    mutationFn: createChild,
    onSuccess: (data) => {
      setChild(data);
      toast.success('Child record created');
      setStep('consent');
    },
    onError: () => toast.error('Failed to create child record'),
  });

  const consentMutation = useMutation({
    mutationFn: createConsent,
    onSuccess: (data) => {
      setConsent(data);
      toast.success('Consent created');
      setStep('esign');
    },
    onError: () => toast.error('Failed to create consent'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveConsent(id),
    onSuccess: () => toast.success('Consent approved'),
    onError: () => toast.error('Approve failed'),
  });

  const esignMutation = useMutation({
    mutationFn: ({ consentId, body, key }: { consentId: string; body: typeof esignForm; key: string }) =>
      createEsignRequest(consentId, body, key),
    onSuccess: (data) => {
      setEsign(data);
      toast.success('eSign request created');
      setStep('done');
    },
    onError: () => toast.error('eSign request failed'),
  });

  function handleGuardian(e: React.FormEvent) {
    e.preventDefault();
    if (!gForm.fullName || !gForm.email) { toast.error('Full name and email required'); return; }
    guardianMutation.mutate(gForm);
  }

  function handleChild(e: React.FormEvent) {
    e.preventDefault();
    if (!cForm.fullName || !cForm.dateOfBirth) { toast.error('Full name and date of birth required'); return; }
    if (!guardian) return;
    childMutation.mutate({ ...cForm, guardianId: guardian.guardianId });
  }

  function handleConsent(e: React.FormEvent) {
    e.preventDefault();
    if (!guardian || !child) return;
    consentMutation.mutate({
      childId: child.childId,
      guardianId: guardian.guardianId,
      consentType: conForm.consentType,
      jurisdiction: conForm.jurisdiction || undefined,
    });
  }

  function handleEsign(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    esignMutation.mutate({
      consentId: consent.consentId,
      body: esignForm,
      key: crypto.randomUUID(),
    });
  }

  const STEP_LABELS: Record<Step, string> = {
    guardian: '1. Guardian',
    child: '2. Child',
    consent: '3. Consent',
    esign: '4. eSign',
    done: '✓ Complete',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Guardian Consent & eSign</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create guardian–child consent flows with e-signature requests for child data processing.
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>Note:</strong> This wizard creates a complete consent chain: Guardian → Child →
        Consent record → eSign request. Each step must be completed in order.
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {(Object.keys(STEP_LABELS) as Step[]).map((s) => (
          <div
            key={s}
            className={`flex-1 rounded px-3 py-2 text-center text-xs font-medium ${
              s === step
                ? 'bg-primary text-primary-foreground'
                : step === 'done' || Object.keys(STEP_LABELS).indexOf(s) < Object.keys(STEP_LABELS).indexOf(step)
                ? 'bg-green-100 text-green-700'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {STEP_LABELS[s]}
          </div>
        ))}
      </div>

      {/* Step 1: Guardian */}
      {step === 'guardian' && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">Step 1 — Create Guardian</h2>
          <form onSubmit={handleGuardian} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Full Name</label>
                <input className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={gForm.fullName} onChange={(e) => setGForm({ ...gForm, fullName: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input type="email" className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={gForm.email} onChange={(e) => setGForm({ ...gForm, email: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone (optional)</label>
                <input className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={gForm.phone} onChange={(e) => setGForm({ ...gForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Relationship</label>
                <select className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={gForm.relationship} onChange={(e) => setGForm({ ...gForm, relationship: e.target.value })}>
                  <option>PARENT</option>
                  <option>GUARDIAN</option>
                  <option>CAREGIVER</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={guardianMutation.isPending}
              className="rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {guardianMutation.isPending ? 'Creating…' : 'Create Guardian →'}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Child */}
      {step === 'child' && guardian && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="mb-3 text-xs text-muted-foreground">
            Guardian: <strong>{guardian.fullName}</strong> ({guardian.guardianId.slice(0, 8)}…)
          </p>
          <h2 className="mb-4 text-base font-semibold">Step 2 — Create Child Record</h2>
          <form onSubmit={handleChild} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Child Full Name</label>
                <input className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={cForm.fullName} onChange={(e) => setCForm({ ...cForm, fullName: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Date of Birth</label>
                <input type="date" className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={cForm.dateOfBirth} onChange={(e) => setCForm({ ...cForm, dateOfBirth: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Country Code</label>
                <input maxLength={2} className="w-full rounded border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                  value={cForm.regionCountryCode} onChange={(e) => setCForm({ ...cForm, regionCountryCode: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">State Code (optional)</label>
                <input className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={cForm.regionStateCode} onChange={(e) => setCForm({ ...cForm, regionStateCode: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={childMutation.isPending}
              className="rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {childMutation.isPending ? 'Creating…' : 'Create Child →'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Consent */}
      {step === 'consent' && child && guardian && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="mb-3 text-xs text-muted-foreground">
            Child: <strong>{child.fullName}</strong> (majority: {child.majorityDate})
          </p>
          <h2 className="mb-4 text-base font-semibold">Step 3 — Create Consent</h2>
          <form onSubmit={handleConsent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Consent Type (integer)</label>
                <input type="number" min={1} className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={conForm.consentType} onChange={(e) => setConForm({ ...conForm, consentType: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Jurisdiction (optional)</label>
                <input className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={conForm.jurisdiction} onChange={(e) => setConForm({ ...conForm, jurisdiction: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={consentMutation.isPending}
              className="rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {consentMutation.isPending ? 'Creating…' : 'Create Consent →'}
            </button>
          </form>
        </div>
      )}

      {/* Step 4: eSign */}
      {step === 'esign' && consent && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="mb-3 text-xs text-muted-foreground">
            Consent ID: <strong>{consent.consentId.slice(0, 8)}…</strong> — Status: {consent.status}
          </p>
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => approveMutation.mutate(consent.consentId)}
              disabled={approveMutation.isPending}
              className="rounded border border-green-400 px-3 py-1.5 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50"
            >
              {approveMutation.isPending ? 'Approving…' : 'Approve Consent'}
            </button>
          </div>
          <h2 className="mb-4 text-base font-semibold">Step 4 — Create eSign Request</h2>
          <form onSubmit={handleEsign} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">eSign Provider</label>
                <select className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={esignForm.provider} onChange={(e) => setEsignForm({ ...esignForm, provider: e.target.value })}>
                  {ESIGN_PROVIDERS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Guardian Name</label>
                <input className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={esignForm.guardianName} onChange={(e) => setEsignForm({ ...esignForm, guardianName: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Guardian Email</label>
                <input type="email" className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={esignForm.guardianEmail} onChange={(e) => setEsignForm({ ...esignForm, guardianEmail: e.target.value })} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              An idempotency key will be auto-generated for this request.
            </p>
            <button type="submit" disabled={esignMutation.isPending}
              className="rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {esignMutation.isPending ? 'Sending…' : 'Send eSign Request'}
            </button>
          </form>
        </div>
      )}

      {/* Done */}
      {step === 'done' && esign && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <h2 className="mb-3 text-base font-semibold text-green-800">eSign Flow Complete ✓</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="font-medium text-muted-foreground">Request ID</dt>
            <dd className="font-mono text-xs">{esign.requestId}</dd>
            <dt className="font-medium text-muted-foreground">eSign Ref</dt>
            <dd className="font-mono text-xs">{esign.esignRef}</dd>
            <dt className="font-medium text-muted-foreground">Status</dt>
            <dd>{esign.status}</dd>
            {esign.providerUrl && (
              <>
                <dt className="font-medium text-muted-foreground">Provider URL</dt>
                <dd><a href={esign.providerUrl} target="_blank" rel="noreferrer" className="text-primary underline text-xs">{esign.providerUrl}</a></dd>
              </>
            )}
          </dl>
          <button
            onClick={() => {
              setStep('guardian'); setGuardian(null); setChild(null); setConsent(null); setEsign(null);
              setGForm({ fullName: '', email: '', phone: '', relationship: 'PARENT' });
            }}
            className="mt-4 rounded border px-4 py-2 text-sm hover:bg-accent"
          >
            Start New Flow
          </button>
        </div>
      )}
    </div>
  );
}
