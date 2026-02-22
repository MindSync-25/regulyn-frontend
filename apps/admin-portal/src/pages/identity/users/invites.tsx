import { useState } from 'react';
import { apiPost } from '../../../lib/api';

const ALL_ROLES = ['TENANT_ADMIN', 'DPO', 'REVIEWER', 'OPERATOR', 'AUDITOR', 'DATA_PRINCIPAL', 'CONNECTOR_AGENT'];

interface InviteResponse {
  inviteId: string;
  email: string;
  roles: string[];
  expiresAt: string;
}

export default function InvitesPage() {
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['REVIEWER']);
  const [expiresInMinutes, setExpiresInMinutes] = useState(1440);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<InviteResponse | null>(null);

  function toggleRole(role: string) {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiPost<InviteResponse>('/users/invites', {
        email,
        roles: selectedRoles,
        expiresInMinutes,
      });
      setSuccess(res);
      setEmail('');
      setSelectedRoles(['REVIEWER']);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSending(false);
    }
  }

  const ROLE_DESCRIPTIONS: Record<string, string> = {
    TENANT_ADMIN: 'Full administrative control over the tenant',
    DPO: 'Data Protection Officer — manages compliance workflows',
    REVIEWER: 'Can review and assess compliance items',
    OPERATOR: 'Day-to-day operational access',
    AUDITOR: 'Read-only audit and reporting access',
    DATA_PRINCIPAL: 'End-user / data subject access',
    CONNECTOR_AGENT: 'Service-to-service connector (API key only)',
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Invite User</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
          Send an invite link to a new user. They can set their password on accepting.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
        {/* Invite form */}
        <div style={card}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
            Send Invite
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                Email Address <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="colleague@example.com"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                Invite Expiry
              </label>
              <select
                value={expiresInMinutes}
                onChange={e => setExpiresInMinutes(Number(e.target.value))}
                style={inputStyle}
              >
                <option value={60}>1 hour</option>
                <option value={480}>8 hours</option>
                <option value={1440}>24 hours (default)</option>
                <option value={4320}>3 days</option>
                <option value={10080}>7 days</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>
                Roles to Assign <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ALL_ROLES.map(role => (
                  <label key={role} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    cursor: 'pointer',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1px solid ${selectedRoles.includes(role) ? '#3b82f6' : '#e2e8f0'}`,
                    background: selectedRoles.includes(role) ? '#eff6ff' : '#fff',
                    transition: 'all 0.15s',
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                        {role.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                        {ROLE_DESCRIPTIONS[role]}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {selectedRoles.length === 0 && (
                <p style={{ fontSize: 12, color: '#ef4444', margin: '6px 0 0' }}>
                  Select at least one role.
                </p>
              )}
            </div>

            {error && (
              <div style={errorBox}>{error}</div>
            )}

            <button
              type="submit"
              disabled={sending || selectedRoles.length === 0}
              style={{
                ...btnPrimary,
                width: '100%',
                opacity: selectedRoles.length === 0 ? 0.5 : 1,
                cursor: selectedRoles.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? 'Sending…' : 'Send Invite'}
            </button>
          </form>
        </div>

        {/* Right panel: success or guide */}
        <div>
          {success ? (
            <div style={{ ...card, borderColor: '#bbf7d0', background: '#f0fdf4' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>✅</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#15803d' }}>
                Invite Sent!
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#166534' }}>
                An invite link has been sent to <strong>{success.email}</strong>.
              </p>
              <div style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Invite ID</span>
                  <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{success.inviteId.slice(0, 12)}…</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Roles</span>
                  <span style={{ color: '#0f172a' }}>{success.roles?.join(', ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Expires</span>
                  <span style={{ color: '#0f172a' }}>{success.expiresAt ? new Date(success.expiresAt).toLocaleString() : '—'}</span>
                </div>
              </div>
              <button
                onClick={() => setSuccess(null)}
                style={{ ...btnSecondary, marginTop: 16, width: '100%' }}
              >
                Send Another
              </button>
            </div>
          ) : (
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                How Invites Work
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { step: '1', title: 'Send invite', desc: 'Enter email and roles, then send. A secure token is generated.' },
                  { step: '2', title: 'User receives email', desc: 'The invitee gets an email with a one-time link. (Email sending requires SMTP configuration.)' },
                  { step: '3', title: 'User accepts', desc: 'They click the link and set a password. Their account is activated with the assigned roles.' },
                  { step: '4', title: 'Manage from Users', desc: 'Once accepted, their account appears on the Users page. You can change roles anytime.' },
                ].map(item => (
                  <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#eff6ff', color: '#3b82f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Styles
const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 13.5,
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '9px 18px',
  background: '#fff',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 500,
  cursor: 'pointer',
};

const errorBox: React.CSSProperties = {
  padding: '10px 14px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  fontSize: 13,
  color: '#dc2626',
  marginBottom: 14,
};
