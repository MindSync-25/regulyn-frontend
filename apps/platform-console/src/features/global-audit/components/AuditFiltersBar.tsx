import { DateRangePicker } from './DateRangePicker';

interface AuditFiltersBarProps {
  tenantId: string;
  actorId: string;
  eventType: string;
  correlationId: string;
  from: string | undefined;
  to: string | undefined;
  size: number;
  onChange: (value: {
    tenantId: string;
    actorId: string;
    eventType: string;
    correlationId: string;
    from: string | undefined;
    to: string | undefined;
    size: number;
  }) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function AuditFiltersBar({
  tenantId,
  actorId,
  eventType,
  correlationId,
  from,
  to,
  size,
  onChange,
  onSearch,
  onClear,
}: AuditFiltersBarProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <input
          value={tenantId}
          onChange={(event) => onChange({ tenantId: event.target.value, actorId, eventType, correlationId, from, to, size })}
          placeholder="Tenant ID"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
        />
        <input
          value={actorId}
          onChange={(event) => onChange({ tenantId, actorId: event.target.value, eventType, correlationId, from, to, size })}
          placeholder="Actor ID"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
        />
        <input
          value={eventType}
          onChange={(event) => onChange({ tenantId, actorId, eventType: event.target.value, correlationId, from, to, size })}
          placeholder="Event type"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
        />
        <input
          value={correlationId}
          onChange={(event) => onChange({ tenantId, actorId, eventType, correlationId: event.target.value, from, to, size })}
          placeholder="Correlation ID"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
        />
        <DateRangePicker
          from={from}
          to={to}
          onChange={(value) => onChange({ tenantId, actorId, eventType, correlationId, from: value.from, to: value.to, size })}
        />
        <select
          value={size}
          onChange={(event) => onChange({ tenantId, actorId, eventType, correlationId, from, to, size: Number(event.target.value) })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onSearch}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
        >
          Search
        </button>
        <button
          onClick={onClear}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-slate-300 hover:bg-slate-100"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
