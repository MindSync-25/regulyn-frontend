import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../../../lib/api';

const ALL_ROLES = ['TENANT_ADMIN', 'DPO', 'REVIEWER', 'OPERATOR', 'AUDITOR', 'DATA_PRINCIPAL', 'CONNECTOR_AGENT'];

interface User {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  enabled: boolean;
  roles: string[];
  lockedAt: string | null;
}

interface CreateUserForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

const ROLE_COLORS: Record<string, string> = {
  TENANT_ADMIN: '#1d4ed8',
  DPO: '#7c3aed',
  REVIEWER: '#0369a1',
  OPERATOR: '#0f766e',
  AUDITOR: '#92400e',
  DATA_PRINCIPAL: '#9f1239',
  CONNECTOR_AGENT: '#374151',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      background: (ROLE_COLORS[role] ?? '#374151') + '18',
      color: ROLE_COLORS[role] ?? '#374151',
      marginRight: 4,
      marginBottom: 2,
      border: `1px solid ${(ROLE_COLORS[role] ?? '#374151')}40`,
    }}>
      {role.replace('_', ' ')}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateUserForm>({
    email: '', password: '', firstName: '', lastName: '', roles: [],
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // For role editing
  const [editingRoles, setEditingRoles] = useState<string | null>(null); // userId
  const [pendingRoles, setPendingRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const path = q ? `/users?email=${encodeURIComponent(q)}` : '/users';
      const data = await apiGet<User[]>(path);
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadUsers(search || undefined);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const created = await apiPost<User>('/users', {
        email: form.email,
        password: form.password,
        firstName: form.firstName || null,
        lastName: form.lastName || null,
      });

      // Assign roles if any selected
      if (form.roles.length > 0) {
        await apiPost<User>(`/users/${created.userId}/roles`, { roles: form.roles });
      }

      setShowCreate(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', roles: [] });
      showToast('User created successfully');
      loadUsers();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  async function handleLock(user: User) {
    try {
      await apiPost(`/users/${user.userId}/lock`, {});
      showToast(`${user.email} locked`);
      loadUsers(search || undefined);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to lock user', 'error');
    }
  }

  async function handleUnlock(user: User) {
    try {
      await apiPost(`/users/${user.userId}/unlock`, {});
      showToast(`${user.email} unlocked`);
      loadUsers(search || undefined);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to unlock user', 'error');
    }
  }

  function openRoleEditor(user: User) {
    setEditingRoles(user.userId);
    setPendingRoles(user.roles ?? []);
  }

  async function saveRoles() {
    if (!editingRoles) return;
    setSavingRoles(true);
    try {
      await apiPost(`/users/${editingRoles}/roles`, { roles: pendingRoles });
      showToast('Roles updated');
      setEditingRoles(null);
      loadUsers(search || undefined);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to update roles', 'error');
    } finally {
      setSavingRoles(false);
    }
  }

  function toggleRole(role: string, selected: string[], onChange: (r: string[]) => void) {
    if (selected.includes(role)) {
      onChange(selected.filter(r => r !== role));
    } else {
      onChange([...selected, role]);
    }
  }

  const userStatus = (u: User) => {
    if (u.lockedAt) return { label: 'Locked', color: '#dc2626', bg: '#fef2f2' };
    if (!u.enabled) return { label: 'Disabled', color: '#9ca3af', bg: '#f9fafb' };
    return { label: 'Active', color: '#16a34a', bg: '#f0fdf4' };
  };

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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Users</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Manage tenant users, their roles and access status
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>
          + Create User
        </button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email…"
          style={{ ...inputStyle, flex: 1, maxWidth: 320 }}
        />
        <button type="submit" style={btnSecondary}>Search</button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); loadUsers(); }} style={btnGhost}>
            Clear
          </button>
        )}
      </form>

      {/* Users table */}
      <div style={card}>
        {loading ? (
          <div style={emptyState}>Loading users…</div>
        ) : error ? (
          <div style={{ ...emptyState, color: '#dc2626' }}>{error}</div>
        ) : users.length === 0 ? (
          <div style={emptyState}>No users found. Create one to get started.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['User', 'Email', 'Status', 'Roles', 'Actions'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const status = userStatus(user);
                return (
                  <tr key={user.userId} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 500, color: '#1e293b', fontSize: 14 }}>
                        {user.firstName || user.lastName
                          ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                          : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        ID: {user.userId.slice(0, 8)}…
                      </div>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 13.5, color: '#334155' }}>{user.email}</span>
                    </td>
                    <td style={td}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: 600,
                        background: status.bg,
                        color: status.color,
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ ...td, minWidth: 200 }}>
                      {editingRoles === user.userId ? (
                        <div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {ALL_ROLES.map(r => (
                              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
                                <input
                                  type="checkbox"
                                  checked={pendingRoles.includes(r)}
                                  onChange={() => toggleRole(r, pendingRoles, setPendingRoles)}
                                />
                                {r.replace('_', ' ')}
                              </label>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={saveRoles} disabled={savingRoles} style={{ ...btnPrimary, padding: '4px 12px', fontSize: 12 }}>
                              {savingRoles ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingRoles(null)} style={{ ...btnGhost, padding: '4px 12px', fontSize: 12 }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            {user.roles?.length > 0
                              ? user.roles.map(r => <RoleBadge key={r} role={r} />)
                              : <span style={{ fontSize: 12, color: '#94a3b8' }}>No roles</span>
                            }
                          </div>
                          <button onClick={() => openRoleEditor(user)} style={{ ...btnGhost, padding: '3px 10px', fontSize: 11 }}>
                            Edit Roles
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {user.lockedAt ? (
                          <button onClick={() => handleUnlock(user)} style={btnAction('#16a34a')}>
                            Unlock
                          </button>
                        ) : (
                          <button onClick={() => handleLock(user)} style={btnAction('#dc2626')}>
                            Lock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div style={modalOverlay} onClick={() => !creating && setShowCreate(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              Create User
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
              Add a new user to your tenant. Assign roles immediately or later.
            </p>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    style={inputStyle}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    style={inputStyle}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Email <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  style={inputStyle}
                  placeholder="user@example.com"
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Password <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  style={inputStyle}
                  placeholder="Min 8 characters"
                  minLength={6}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Roles</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 6 }}>
                  {ALL_ROLES.map(role => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={form.roles.includes(role)}
                        onChange={() => toggleRole(role, form.roles, roles => setForm(f => ({ ...f, roles })))}
                      />
                      <span style={{
                        color: ROLE_COLORS[role] ?? '#374151',
                        fontWeight: 500,
                      }}>
                        {role.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#94a3b8' }}>
                  Select the roles this user should have. You can change them later.
                </p>
              </div>

              {createError && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
                  {createError}
                </div>
              )}

              <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreate(false)} disabled={creating} style={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={creating} style={btnPrimary}>
                  {creating ? 'Creating…' : 'Create User'}
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
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 16px',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #e2e8f0',
};

const td: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 13.5,
  color: '#374151',
  verticalAlign: 'top',
};

const emptyState: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: '#94a3b8',
  fontSize: 14,
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 5,
};

const btnPrimary: React.CSSProperties = {
  padding: '9px 18px',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 13.5,
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

const btnGhost: React.CSSProperties = {
  padding: '9px 18px',
  background: 'transparent',
  color: '#64748b',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 13.5,
  cursor: 'pointer',
};

function btnAction(color: string): React.CSSProperties {
  return {
    padding: '4px 12px',
    background: color + '10',
    color: color,
    border: `1px solid ${color}30`,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.5)',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: 20,
};

const modalBox: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '28px 32px',
  width: '100%',
  maxWidth: 520,
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  maxHeight: '90vh',
  overflowY: 'auto',
};
