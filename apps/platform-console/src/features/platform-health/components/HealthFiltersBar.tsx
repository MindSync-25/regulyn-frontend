interface HealthFiltersBarProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
}

export function HealthFiltersBar({ pageSize, onPageSizeChange, onRefresh }: HealthFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-slate-700">Tenant health list</div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600" htmlFor="health-page-size">
          Page size
        </label>
        <select
          id="health-page-size"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <button
          onClick={onRefresh}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
