import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../../../lib/api';

interface AuditEvent {
  eventId: string;
  eventType: string;
  actorUserId: string | null;
  actorEmail: string | null;
  entityType: string | null;
  entityId: string | null;
  description: string | null;
  occurredAt: string;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const EVENT_TYPES = [
  'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_LOCKED', 'USER_UNLOCKED',
  'USER_ROLES_ASSIGNED', 'INVITE_SENT', 'API_KEY_CREATED', 'API_KEY_ROTATED',
  'API_KEY_REVOKED', 'PLAN_LIMITS_UPDATED', 'FEATURE_FLAG_UPDATED',
  'TENANT_UPDATED', 'PASSWORD_CHANGED',
];

function fmt(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

function EventTypeBadge({ type }: { type: string }) {
  const color = type.includes('CREAT') || type.includes('SENT') ? '#0369a1'
    : type.includes('LOCK') || type.includes('REVOK') ? '#dc2626'
    : type.includes('LOGIN') || type.includes('LOGOUT') ? '#7c3aed'
    : '#374151';
  const bg = type.includes('CREAT') || type.includes('SENT') ? '#eff6ff'
    : type.includes('LOCK') || type.includes('REVOK') ? '#fef2f2'
    : type.includes('LOGIN') || type.includes('LOGOUT') ? '#f5f3ff'
    : '#f8fafc';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 99,
      fontSize: 11, fontWeight: 600, color, background: bg, letterSpacing: '0.02em',
    }}>
      {type.replace(/_/g, ' ')}
    </span>
  );
}

export default function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterUserId, setFilterUserId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Expanded row for details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(p),
        size: String(pageSize),
      };
      if (filterUserId) params.userId = filterUserId;
      if (filterType) params.eventType = filterType;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;

      const qs = new URLSearchParams(params).toString();
      const data = await apiGet<Page<AuditEvent>>(`/admin/audit-events?${qs}`);
      setEvents(data.content);
      setTotal(data.totalElements);
      setTotalPages(data.totalPages);
      setPage(data.number);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [filterUserId, filterType, filterFrom, filterTo]);

  useEffect(() => {
    load(0);
  }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(0);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Audit Log</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
          Immutable record of all admin actions in this tenant
        </p>
      </div>

      {/* Filters */}
      <div style={{ ...card, marginBottom: 20, padding: '16px 20px' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={labelStyle}>Actor User ID</label>
              <input
                value={filterUserId}
                onChange={e => setFilterUserId(e.target.value)}
                style={inputStyle}
                placeholder="UUID or partial"
              />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={labelStyle}>Event Type</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={inputStyle}>
                <option value="">All types</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={labelStyle}>From</label>
              <input
                type="datetime-local"
                value={filterFrom}
                onChange={e => setFilterFrom(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={labelStyle}>To</label>
              <input
                type="datetime-local"
                value={filterTo}
                onChange={e => setFilterTo(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={btnPrimary}>Search</button>
              <button
                type="button"
                onClick={() => {
                  setFilterUserId('');
                  setFilterType('');
                  setFilterFrom('');
                  setFilterTo('');
                }}
                style={btnSecondary}
              >
                Clear
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results info */}
      {!loading && !error && (
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
          {total > 0 ? `${total} events found · Page ${page + 1} of ${totalPages}` : 'No events found'}
        </div>
      )}

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div style={emptyState}>Loading audit events…</div>
        ) : error ? (
          <div style={{ ...emptyState, color: '#dc2626' }}>{error}</div>
        ) : events.length === 0 ? (
          <div style={emptyState}>No audit events match your filters.</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Time', 'Event', 'Actor', 'Entity', 'Description', ''].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <>
                    <tr
                      key={ev.eventId}
                      style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === ev.eventId ? null : ev.eventId)}
                    >
                      <td style={{ ...td, whiteSpace: 'nowrap', fontSize: 12 }}>
                        {fmt(ev.occurredAt)}
                      </td>
                      <td style={td}>
                        <EventTypeBadge type={ev.eventType} />
                      </td>
                      <td style={td}>
                        {ev.actorEmail ? (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{ev.actorEmail}</div>
                            {ev.actorUserId && (
                              <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                                {ev.actorUserId.slice(0, 8)}…
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>System</span>
                        )}
                      </td>
                      <td style={td}>
                        {ev.entityType ? (
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{ev.entityType}</span>
                            {ev.entityId && (
                              <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                                {ev.entityId.slice(0, 8)}…
                              </div>
                            )}
                          </div>
                        ) : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td style={{ ...td, maxWidth: 260 }}>
                        <div style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.description ?? '—'}
                        </div>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ fontSize: 14, color: '#94a3b8' }}>
                          {expandedId === ev.eventId ? '▲' : '▼'}
                        </span>
                      </td>
                    </tr>
                    {expandedId === ev.eventId && (
                      <tr key={`${ev.eventId}-expanded`} style={{ background: '#f8fafc' }}>
                        <td colSpan={6} style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px 24px', fontSize: 12 }}>
                            <Detail label="Event ID" value={ev.eventId} mono />
                            <Detail label="Actor ID" value={ev.actorUserId ?? '—'} mono />
                            <Detail label="Entity ID" value={ev.entityId ?? '—'} mono />
                            <Detail label="IP Address" value={ev.ipAddress ?? '—'} mono />
                            {ev.metadata && (
                              <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Metadata</div>
                                <pre style={{
                                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
                                  padding: '8px 10px', fontSize: 11, color: '#334155',
                                  overflow: 'auto', maxHeight: 120, margin: 0,
                                }}>
                                  {JSON.stringify(ev.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '14px', borderTop: '1px solid #f1f5f9',
              }}>
                <button
                  onClick={() => load(page - 1)}
                  disabled={page === 0 || loading}
                  style={{ ...btnSecondary, padding: '6px 14px', fontSize: 12 }}
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pageNum = totalPages <= 7 ? i : i === 0 ? 0 : i === 6 ? totalPages - 1 : page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => load(pageNum)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                        fontWeight: pageNum === page ? 700 : 400,
                        background: pageNum === page ? '#3b82f6' : '#fff',
                        color: pageNum === page ? '#fff' : '#374151',
                        border: pageNum === page ? 'none' : '1px solid #d1d5db',
                      }}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= totalPages - 1 || loading}
                  style={{ ...btnSecondary, padding: '6px 14px', fontSize: 12 }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#334155', fontFamily: mono ? 'monospace' : undefined }}>{value}</div>
    </div>
  );
}

// Styles
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
  overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};
const th: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600,
  color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #e2e8f0',
};
const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: '#374151', verticalAlign: 'middle' };
const emptyState: React.CSSProperties = { padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 };
const btnPrimary: React.CSSProperties = {
  padding: '8px 16px', background: '#3b82f6', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', background: '#fff', color: '#374151',
  border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
