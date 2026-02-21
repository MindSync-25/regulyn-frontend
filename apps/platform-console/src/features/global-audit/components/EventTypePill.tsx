interface EventTypePillProps {
  eventType: string;
}

export function EventTypePill({ eventType }: EventTypePillProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {eventType}
    </span>
  );
}
