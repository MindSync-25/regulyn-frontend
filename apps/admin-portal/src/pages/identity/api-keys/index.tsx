import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../../../lib/api';

interface ApiKey {
  apiKeyId: string;
  keyName: string;
  prefix: string | null;
  enabled: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string | null;
  keyVersion: number;
}

interface CreatedKey {
  apiKeyId: string;
  keyName: string;
  prefix: string | null;
  apiKey: string;
  expiresAt: string | null;
}

function StatusBadge({ apiKey }: { apiKey: ApiKey }) {
  if (apiKey.revokedAt) return <Badge label="Revoked" color="#dc2626" bg="#fef2f2" />;
  if (!apiKey.enabled) return <Badge label="Disabled" color="#9ca3af" bg="#f9fafb" />;
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date())
    return <Badge label="Expired" color="#d97706" bg="#fffbeb" />;
  return <Badge label="Active" color="#16a34a" bg="#f0fdf4" />;
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 600,
      color,
      background: bg,
    }}>
      {label}
    </span>
  );
}

function fmt(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newKeyResult, setNewKeyResult] = useState<CreatedKey | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<ApiKey[]>('/api-keys');
      setKeys(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const body: Record<string, unknown> = { keyName };
      if (expiryDays) body.expiresInDays = Number(expiryDays);
      const res = await apiPost<CreatedKey>('/api-keys', body, { 'X-Idempotency-Key': idempotencyKey });
      setNewKeyResult(res);
      setShowCreate(false);
      setKeyName('');
      setExpiryDays('');
      loadKeys();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(key: ApiKey) {
    if (!confirm(`Revoke API key "${key.keyName}"? This is immediate and cannot be undone.`)) return;
    try {
      await apiPost(`/api-keys/${key.apiKeyId}/revoke`, {});
      showToast('API key revoked');
      loadKeys();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Revoke failed', 'error');
    }
  }

  async function handleRotate(key: ApiKey) {
    if (!confirm(`Rotate API key "${key.keyName}"? A new key will be generated; the old one is immediately invalidated.`)) return;
    try {
      const rotateIdem = crypto.randomUUID();
      const res = await apiPost<CreatedKey>(`/api-keys/${key.apiKeyId}/rotate`, {}, { 'X-Idempotency-Key': rotateIdem });
      setNewKeyResult(res);
      loadKeys();
      showToast('API key rotated — save the new value!');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Rotate failed', 'error');
    }
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000,
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          color: toast.type === 'error' ? '#dc2626' : '#16a34a',
          padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>API Keys</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Manage service-to-service API keys for connector agents
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>
          + Create API Key
        </button>
      </div>

      {/* New key banner */}
      {newKeyResult && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
          padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#92400e' }}>
              ⚠️ Save your API key — it won&apos;t be shown again
            </div>
            <button onClick={() => setNewKeyResult(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#92400e' }}>✕</button>
          </div>
          <div style={{ fontSize: 12, color: '#78350f', marginBottom: 10 }}>
            Key: <strong>{newKeyResult.keyName}</strong>
            {newKeyResult.expiresAt ? ` · Expires: ${fmt(newKeyResult.expiresAt)}` : ' · No expiry'}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#fff', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px',
          }}>
            <code style={{ flex: 1, fontSize: 13, wordBreak: 'break-all', color: '#0f172a', fontFamily: 'monospace' }}>
              {newKeyResult.apiKey}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(newKeyResult.apiKey); showToast('Copied!'); }}
              style={{ ...btnSecondary, padding: '6px 12px', fontSize: 12, flexShrink: 0 }}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Keys table */}
      <div style={card}>
        {loading ? (
          <div style={emptyState}>Loading API keys…</div>
        ) : error ? (
          <div style={{ ...emptyState, color: '#dc2626' }}>{error}</div>
        ) : keys.length === 0 ? (
          <div style={emptyState}>No API keys yet. Create one for your connector agents.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Name', 'Prefix', 'Status', 'Version', 'Created', 'Expires', 'Last Used', 'Actions'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map(key => (
                <tr key={key.apiKeyId} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={td}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{key.keyName}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
                      {key.apiKeyId.slice(0, 8)}…
                    </div>
                  </td>
                  <td style={td}>
                    <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                      {key.prefix ?? '—'}
                    </code>
                  </td>
                  <td style={td}><StatusBadge apiKey={key} /></td>
                  <td style={{ ...td, textAlign: 'center' }}>v{key.keyVersion}</td>
                  <td style={td}><span style={{ fontSize: 12 }}>{fmt(key.createdAt)}</span></td>
                  <td style={td}><span style={{ fontSize: 12 }}>{fmt(key.expiresAt)}</span></td>
                  <td style={td}><span style={{ fontSize: 12 }}>{fmt(key.lastUsedAt)}</span></td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!key.revokedAt && (
                        <>
                          <button onClick={() => handleRotate(key)} style={btnAction('#0369a1')}>
                            Rotate
                          </button>
                          <button onClick={() => handleRevoke(key)} style={btnAction('#dc2626')}>
                            Revoke
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={modalOverlay} onClick={() => !creating && setShowCreate(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              Create API Key
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
              Generate an API key for a connector or service agent.
            </p>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  Key Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  value={keyName}
                  onChange={e => setKeyName(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="e.g. crm-connector-prod"
                />
                <p style={{ margin: '5px 0 0', fontSize: 11, color: '#94a3b8' }}>
                  A descriptive name — you won't be able to change this later.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Expiry (optional)</label>
                <select
                  value={expiryDays}
                  onChange={e => setExpiryDays(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">No expiry</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                </select>
              </div>

              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
                padding: '10px 14px', fontSize: 12, color: '#78350f', marginBottom: 20,
              }}>
                ⚠️ The full API key is shown <strong>only once</strong> after creation. Store it securely.
              </div>

              {createError && (
                <div style={{ ...errorBox, marginBottom: 16 }}>{createError}</div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreate(false)} disabled={creating} style={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={creating} style={btnPrimary}>
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: '#374151', verticalAlign: 'middle' };
const emptyState: React.CSSProperties = { padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 13.5, color: '#111827', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = {
  padding: '9px 18px', background: '#3b82f6', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '9px 18px', background: '#fff', color: '#374151',
  border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
};
const errorBox: React.CSSProperties = {
  padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
  borderRadius: 8, fontSize: 13, color: '#dc2626',
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
  backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 100, padding: 20,
};
const modalBox: React.CSSProperties = {
  background: '#fff', borderRadius: 16, padding: '28px 32px',
  width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
};
function btnAction(color: string): React.CSSProperties {
  return {
    padding: '4px 12px', background: `${color}10`, color,
    border: `1px solid ${color}30`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  };
}
