import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  listEmployeeDataRecords,
  type EmployeeDataRecord,
  type DataCategory,
} from '@/lib/api/employee';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';

const CATEGORY_OPTIONS: DataCategory[] = [
  'RESUME',
  'HR_DOC',
  'PAYROLL',
  'IDENTITY',
  'HEALTH',
];

const CATEGORY_COLORS: Record<string, string> = {
  RESUME: 'bg-purple-100 text-purple-800',
  HR_DOC: 'bg-blue-100 text-blue-800',
  PAYROLL: 'bg-orange-100 text-orange-800',
  IDENTITY: 'bg-teal-100 text-teal-800',
  HEALTH: 'bg-red-100 text-red-800',
};

export default function HRAccessLogsPage() {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSystem, setFilterSystem] = useState('');
  const [applied, setApplied] = useState({ employeeId: '', dataCategory: '', systemId: '' });

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ['employee-data-records', applied],
    queryFn: () =>
      listEmployeeDataRecords({
        employeeId: applied.employeeId || undefined,
        dataCategory: applied.dataCategory || undefined,
        systemId: applied.systemId || undefined,
      }),
  });

  function applyFilters() {
    setApplied({
      employeeId: filterEmployee.trim(),
      dataCategory: filterCategory,
      systemId: filterSystem.trim(),
    });
  }

  function clearFilters() {
    setFilterEmployee('');
    setFilterCategory('');
    setFilterSystem('');
    setApplied({ employeeId: '', dataCategory: '', systemId: '' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Data Records</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse all employee data records. Filter by employee, data category, or source system.
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
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Employee ID</label>
          <input
            className="rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Employee UUID"
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Data Category</label>
          <select
            className="rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">System ID</label>
          <input
            className="rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="System name / ID"
            value={filterSystem}
            onChange={(e) => setFilterSystem(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="rounded bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Apply
          </button>
          <button
            onClick={clearFilters}
            className="rounded border px-4 py-1.5 text-sm hover:bg-accent"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading records…
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">
            Failed to load records. Is employee-data-service running on port 8091?
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {Object.values(applied).some(Boolean)
              ? 'No records match the current filters.'
              : 'No data records found. Apply filters to search.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Record ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">System</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Retention Override</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(records as EmployeeDataRecord[]).map((rec) => (
                <tr key={rec.recordId} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {rec.recordId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{rec.employeeId.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        CATEGORY_COLORS[rec.dataCategory] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rec.dataCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{rec.systemId || '—'}</td>
                  <td className="px-4 py-3">
                    {rec.retentionDaysOverride != null ? (
                      <span className="font-medium">{rec.retentionDaysOverride}d</span>
                    ) : (
                      <span className="text-muted-foreground">Default</span>
                    )}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                    {rec.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        objectType="EMPLOYEE_DATA_RECORD"
        title="Employee Data Records — Evidence & Audit"
      />
    </div>
  );
}
