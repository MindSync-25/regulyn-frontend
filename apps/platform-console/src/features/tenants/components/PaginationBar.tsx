import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationBar({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  const displayPage = currentPage + 1; // Convert to 1-based for display

  return (
    <div className="flex flex-col gap-3 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-gray-600">
        Page <span className="font-semibold text-gray-900">{displayPage}</span> of{' '}
        <span className="font-semibold text-gray-900">{totalPages}</span>
        {totalItems !== undefined && (
          <span className="ml-2 text-gray-500">({totalItems} total)</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
        >
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
