interface DateRangePickerProps {
  from?: string;
  to?: string;
  onChange: (value: { from?: string; to?: string }) => void;
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        value={from || ''}
        onChange={(event) => onChange({ from: event.target.value, to })}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
      />
      <span className="text-xs text-slate-500">to</span>
      <input
        type="datetime-local"
        value={to || ''}
        onChange={(event) => onChange({ from, to: event.target.value })}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
      />
    </div>
  );
}
