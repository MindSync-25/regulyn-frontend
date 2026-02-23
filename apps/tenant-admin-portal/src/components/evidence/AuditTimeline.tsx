/**
 * AuditTimeline - Reusable audit events timeline component
 * Displays paginated audit events with expand/collapse for details.
 * Expanded view shows a human-readable summary by default with a Raw JSON toggle.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, User, Activity, Code2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AuditEvent } from '@/lib/api/evidence';

interface AuditTimelineProps {
  events: AuditEvent[];
  isLoading?: boolean;
  error?: Error | null;
  // Pagination
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  // Optional empty state customization
  emptyMessage?: string;
}

export function AuditTimeline({
  events,
  isLoading,
  error,
  currentPage,
  totalPages,
  pageSize,
  totalElements,
  onPageChange,
  emptyMessage = 'No audit events found',
}: AuditTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [rawJsonEvents, setRawJsonEvents] = useState<Set<string>>(new Set());

  const toggleExpand = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const toggleRawJson = (eventId: string) => {
    setRawJsonEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">Failed to load audit timeline</p>
        <p className="mt-1 text-red-700">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <Activity className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-sm text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="relative space-y-6">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

        {events.map(event => {
          const isExpanded = expandedEvents.has(event.id);
          const timestamp = new Date(event.occurredAt);

          return (
            <div key={event.id} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Activity className="h-4 w-4" />
              </div>

              {/* Event card */}
              <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Event type */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {event.eventType}
                      </span>
                      {event.correlationId && (
                        <span className="text-xs text-gray-500">
                          #{event.correlationId.slice(0, 8)}
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    {event.summary && (
                      <p className="mt-1 text-sm text-gray-700">{event.summary}</p>
                    )}

                    {/* Metadata row */}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {event.actorId && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{event.actorId.slice(0, 8)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span title={timestamp.toLocaleString()}>
                          {formatDistanceToNow(timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expand/collapse button */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(event.id)}
                    className="ml-4 rounded p-1 hover:bg-gray-100"
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-4">
                    {/* View toggle */}
                    <div className="mb-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRawJson(event.id)}
                        className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                          rawJsonEvents.has(event.id)
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        aria-label={rawJsonEvents.has(event.id) ? 'Show human view' : 'Show raw JSON'}
                      >
                        {rawJsonEvents.has(event.id) ? (
                          <><Eye className="h-3 w-3" /> Human View</>
                        ) : (
                          <><Code2 className="h-3 w-3" /> Raw JSON</>
                        )}
                      </button>
                    </div>

                    {rawJsonEvents.has(event.id) ? (
                      /* Raw JSON view */
                      <div className="rounded bg-gray-900 p-3">
                        <pre className="overflow-x-auto text-xs text-green-400">
                          {JSON.stringify(event, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      /* Human-readable view */
                      <dl className="rounded bg-gray-50 p-3 text-xs space-y-1.5">
                        {event.id && (
                          <div className="flex gap-2">
                            <dt className="w-28 shrink-0 font-medium text-gray-500">Event ID</dt>
                            <dd className="font-mono text-gray-700 truncate">{event.id}</dd>
                          </div>
                        )}
                        {event.tenantId && (
                          <div className="flex gap-2">
                            <dt className="w-28 shrink-0 font-medium text-gray-500">Tenant</dt>
                            <dd className="font-mono text-gray-700 truncate">{event.tenantId}</dd>
                          </div>
                        )}
                        {event.actorId && (
                          <div className="flex gap-2">
                            <dt className="w-28 shrink-0 font-medium text-gray-500">Actor</dt>
                            <dd className="font-mono text-gray-700 truncate">{event.actorId}</dd>
                          </div>
                        )}
                        {event.eventType && (
                          <div className="flex gap-2">
                            <dt className="w-28 shrink-0 font-medium text-gray-500">Event Type</dt>
                            <dd className="text-gray-700">{event.eventType}</dd>
                          </div>
                        )}
                        {event.correlationId && (
                          <div className="flex gap-2">
                            <dt className="w-28 shrink-0 font-medium text-gray-500">Correlation</dt>
                            <dd className="font-mono text-gray-700 truncate">{event.correlationId}</dd>
                          </div>
                        )}
                        {event.occurredAt && (
                          <div className="flex gap-2">
                            <dt className="w-28 shrink-0 font-medium text-gray-500">Occurred At</dt>
                            <dd className="text-gray-700">{new Date(event.occurredAt).toLocaleString()}</dd>
                          </div>
                        )}
                        {event.summary && (
                          <div className="flex gap-2">
                            <dt className="w-28 shrink-0 font-medium text-gray-500">Summary</dt>
                            <dd className="text-gray-700">{event.summary}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{currentPage * pageSize + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min((currentPage + 1) * pageSize, totalElements)}
            </span>{' '}
            of <span className="font-medium">{totalElements}</span> events
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
