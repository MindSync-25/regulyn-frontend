import type { AuditEvent } from '../types';
import { CopyCell } from './CopyCell';
import { EventTypePill } from './EventTypePill';

interface AuditTableProps {
  events: AuditEvent[];
  isLoading: boolean;
}

export function AuditTable({ events, isLoading }: AuditTableProps) {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-600">
        No events found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-[#F6F7F9]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Occurred</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tenant</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actor</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Event Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Correlation</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Summary</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {events.map((event, index) => (
            <tr key={event.id || index} className="hover:bg-[#F8FAFC]">
              <td className="px-4 py-3 text-sm text-slate-700">
                {new Date(event.occurredAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm">
                <CopyCell value={event.tenantId} label="Tenant ID" />
              </td>
              <td className="px-4 py-3 text-sm">
                <CopyCell value={event.actorId} label="Actor ID" />
              </td>
              <td className="px-4 py-3 text-sm">
                <EventTypePill eventType={event.eventType} />
              </td>
              <td className="px-4 py-3 text-sm">
                <CopyCell value={event.correlationId} label="Correlation ID" />
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {event.summary ? `${event.summary.slice(0, 120)}${event.summary.length > 120 ? '...' : ''}` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
