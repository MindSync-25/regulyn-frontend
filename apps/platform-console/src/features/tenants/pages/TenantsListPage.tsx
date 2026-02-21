import { Filter } from 'lucide-react';
import { useState } from 'react';
import { useTenantsListQuery } from '../hooks';
import type { TenantStatus } from '../types';
import { PaginationBar } from '../components/PaginationBar';
import { TenantsTable } from '../components/TenantsTable';

const statusOptions: Array<{ value: TenantStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'DELETED', label: 'Deleted' },
];

export function TenantsListPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'ALL'>('ALL');

  const { data, isLoading, error } = useTenantsListQuery({
    page,
    size,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setSize(newSize);
    setPage(0); // Reset to first page when changing size
  };

  const handleStatusChange = (newStatus: TenantStatus | 'ALL') => {
    setStatusFilter(newStatus);
    setPage(0); // Reset to first page when changing filter
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-to-r from-[#003B8E] via-[#0047AB] to-[#1A66D9] text-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Tenants</h1>
            <p className="text-slate-300/80 mt-2">Cross-tenant management and lifecycle controls</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-white/70">
              Platform Console
            </div>
            <div className="rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-white/70">
              Super Admin
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Tenants</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {data?.totalElements ?? '—'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Status Filter</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {statusOptions.find((option) => option.value === statusFilter)?.label}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Page Size</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{size}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter className="h-4 w-4 text-gray-500" />
            Status filter
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-sm text-gray-600">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value as TenantStatus | 'ALL')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-sm text-gray-600">
                Page size
              </label>
              <select
                id="page-size"
                value={size}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">Failed to load tenants. Please try again.</p>
            </div>
          </div>
        )}

        {!error && (
          <>
            <TenantsTable tenants={data?.content || []} isLoading={isLoading} />
            {data && (
              <PaginationBar
                currentPage={data.number}
                totalPages={data.totalPages}
                pageSize={data.size}
                totalItems={data.totalElements}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
