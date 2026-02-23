import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createEmployeeExport, type EmployeeExport } from '@/lib/api/employee';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function oneYearAgo() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

export default function HRExportsPage() {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    periodFrom: oneYearAgo(),
    periodTo: today(),
  });
  const [lastExport, setLastExport] = useState<EmployeeExport | null>(null);

  const exportMutation = useMutation({
    mutationFn: createEmployeeExport,
    onSuccess: (data) => {
      toast.success('Compliance export created');
      setLastExport(data);
    },
    onError: () => toast.error('Export failed'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (form.periodFrom > form.periodTo) {
      toast.error('Period start must be before period end');
      return;
    }
    exportMutation.mutate({
      title: form.title,
      // Backend expects Instant — append T00:00:00Z to convert YYYY-MM-DD → ISO 8601
      periodFrom: form.periodFrom ? `${form.periodFrom}T00:00:00Z` : form.periodFrom,
      periodTo: form.periodTo ? `${form.periodTo}T23:59:59Z` : form.periodTo,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Compliance Exports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate compliance export bundles for employee data. Exports are packaged with evidence
            and made available for download.
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

      {/* Export form */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Create New Export</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Export Title</label>
            <input
              className="w-full max-w-lg rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Q1 2025 Employee Data Compliance Export"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Period From</label>
              <input
                type="date"
                className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.periodFrom}
                onChange={(e) => setForm({ ...form, periodFrom: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Period To</label>
              <input
                type="date"
                className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.periodTo}
                onChange={(e) => setForm({ ...form, periodTo: e.target.value })}
              />
            </div>
          </div>
          <div className="pt-1">
            <button
              type="submit"
              disabled={exportMutation.isPending}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {exportMutation.isPending ? 'Creating export…' : 'Generate Export'}
            </button>
          </div>
        </form>
      </div>

      {/* Last export result */}
      {lastExport && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-green-800">Export Created</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="font-medium text-muted-foreground">Export ID</dt>
            <dd className="font-mono text-xs">{lastExport.exportId}</dd>
            <dt className="font-medium text-muted-foreground">Bundle ID</dt>
            <dd className="font-mono text-xs">{lastExport.bundleId}</dd>
            <dt className="font-medium text-muted-foreground">Evidence Export ID</dt>
            <dd className="font-mono text-xs">{lastExport.evidenceExportId}</dd>
            <dt className="font-medium text-muted-foreground">Created</dt>
            <dd className="text-xs">{new Date(lastExport.createdAt).toLocaleString()}</dd>
            {lastExport.downloadPath && (
              <>
                <dt className="font-medium text-muted-foreground">Download Path</dt>
                <dd className="font-mono text-xs break-all">{lastExport.downloadPath}</dd>
              </>
            )}
          </dl>
          <div className="mt-4 text-xs text-muted-foreground">
            The export bundle is being processed. Once ready, it will be available via the Evidence
            Center or the download path above.
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="rounded-lg border bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-800">About Compliance Exports</p>
        <ul className="mt-2 space-y-1 text-sm text-blue-700">
          <li>• Exports are generated asynchronously by employee-data-service (port 8091)</li>
          <li>• Each export is linked to an evidence bundle for audit trail purposes</li>
          <li>• Download paths are served through the evidence vault (S3-backed in production)</li>
          <li>• Exports are tenant-scoped and respect the configured retention period</li>
        </ul>
      </div>

      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        objectType="EMPLOYEE_EXPORT"
        title="Employee Exports — Evidence & Audit"
      />
    </div>
  );
}
