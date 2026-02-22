import { useState, useEffect } from 'react';
import { apiGet, apiPut } from '../../../lib/api';

interface PlanLimits {
  maxUsers: number;
  dsarPerMonth: number;
  exportsPerMonth: number;
  currentUserCount?: number;
  currentDsarCount?: number;
  currentExportsCount?: number;
}

interface FeatureFlag {
  flagKey: string;
  enabled: boolean;
  valueJson: string | null;
}

const FLAG_LABELS: Record<string, { label: string; desc: string }> = {
  CONSENT_MODULE: { label: 'Consent Module', desc: 'Enable consent collection & management workflows' },
  DSAR_MODULE: { label: 'DSAR Module', desc: 'Enable Data Subject Access Request handling' },
  INCIDENT_MODULE: { label: 'Incident & Breach Module', desc: 'Enable data breach tracking and notifications' },
  ROPA_MODULE: { label: 'RoPA Inventory', desc: 'Enable Records of Processing Activities inventory' },
  VENDOR_MODULE: { label: 'Vendor & Sharing', desc: 'Enable third-party data sharing agreements' },
  RETENTION_MODULE: { label: 'Retention & Deletion', desc: 'Enable data retention scheduling and deletion queues' },
  EVIDENCE_REPORTING: { label: 'Evidence & Reporting', desc: 'Enable audit evidence export and compliance reports' },
  MULTI_DPO: { label: 'Multiple DPOs', desc: 'Allow assigning more than one Data Protection Officer' },
  SSO: { label: 'SSO / SAML', desc: 'Enable Single Sign-On via SAML 2.0 or OIDC' },
  API_ACCESS: { label: 'API Access', desc: 'Allow external service-to-service API key access' },
};

export default function SettingsPage() {
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [editLimits, setEditLimits] = useState<PlanLimits | null>(null);
  const [savingLimits, setSavingLimits] = useState(false);
  const [limitsError, setLimitsError] = useState<string | null>(null);

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [savingFlag, setSavingFlag] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    apiGet<PlanLimits>('/tenants/plan-limits').then(d => {
      setLimits(d);
      setEditLimits({ ...d });
    }).catch(() => {/* ignore */});

    apiGet<FeatureFlag[]>('/tenants/feature-flags').then(setFlags).catch(() => {/* ignore */});
  }, []);

  async function saveLimits(e: React.FormEvent) {
    e.preventDefault();
    if (!editLimits) return;
    setSavingLimits(true);
    setLimitsError(null);
    try {
      const saved = await apiPut<PlanLimits>('/tenants/plan-limits', {
        maxUsers: editLimits.maxUsers,
        dsarPerMonth: editLimits.dsarPerMonth,
        exportsPerMonth: editLimits.exportsPerMonth,
      });
      setLimits(saved);
      setEditLimits({ ...saved });
      showToast('Plan limits saved');
    } catch (e) {
      setLimitsError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingLimits(false);
    }
  }

  async function toggleFlag(flag: FeatureFlag) {
    setSavingFlag(flag.flagKey);
    try {
      const updated = await apiPut<FeatureFlag>(`/tenants/feature-flags/${flag.flagKey}`, {
        enabled: !flag.enabled,
        valueJson: flag.valueJson,
      });
      setFlags(prev => prev.map(f => f.flagKey === flag.flagKey ? updated : f));
      showToast(`${FLAG_LABELS[flag.flagKey]?.label ?? flag.flagKey} ${updated.enabled ? 'enabled' : 'disabled'}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Toggle failed', 'error');
    } finally {
      setSavingFlag(null);
    }
  }

  function usagePct(used?: number, max?: number) {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.round(((used ?? 0) / max) * 100));
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

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Tenant Settings</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
          Configure plan limits and feature flags for this tenant
        </p>
      </div>

      {/* Plan Limits Section */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={sectionHeader}>
          <div>
            <div style={sectionTitle}>Plan Limits</div>
            <div style={sectionDesc}>Set usage ceilings for key resources</div>
          </div>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          {limits && editLimits ? (
            <form onSubmit={saveLimits}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
                <LimitField
                  label="Max Users"
                  value={editLimits.maxUsers}
                  used={limits.currentUserCount}
                  max={limits.maxUsers}
                  pct={usagePct(limits.currentUserCount, limits.maxUsers)}
                  onChange={v => setEditLimits(p => p ? { ...p, maxUsers: v } : p)}
                />
                <LimitField
                  label="DSAR / Month"
                  value={editLimits.dsarPerMonth}
                  used={limits.currentDsarCount}
                  max={limits.dsarPerMonth}
                  pct={usagePct(limits.currentDsarCount, limits.dsarPerMonth)}
                  onChange={v => setEditLimits(p => p ? { ...p, dsarPerMonth: v } : p)}
                />
                <LimitField
                  label="Exports / Month"
                  value={editLimits.exportsPerMonth}
                  used={limits.currentExportsCount}
                  max={limits.exportsPerMonth}
                  pct={usagePct(limits.currentExportsCount, limits.exportsPerMonth)}
                  onChange={v => setEditLimits(p => p ? { ...p, exportsPerMonth: v } : p)}
                />
              </div>
              {limitsError && (
                <div style={{ ...errorBox, marginBottom: 14 }}>{limitsError}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditLimits({ ...limits })}
                  disabled={savingLimits}
                  style={btnSecondary}
                >
                  Reset
                </button>
                <button type="submit" disabled={savingLimits} style={btnPrimary}>
                  {savingLimits ? 'Saving…' : 'Save Limits'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading plan limits…</div>
          )}
        </div>
      </div>

      {/* Feature Flags Section */}
      <div style={card}>
        <div style={sectionHeader}>
          <div>
            <div style={sectionTitle}>Feature Flags</div>
            <div style={sectionDesc}>Enable or disable modules for this tenant</div>
          </div>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          {flags.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>No feature flags configured.</div>
          ) : (
            <div style={{ display: 'grid', gap: 0 }}>
              {flags.map((flag, i) => {
                const info = FLAG_LABELS[flag.flagKey] ?? { label: flag.flagKey, desc: '' };
                const isSaving = savingFlag === flag.flagKey;
                return (
                  <div
                    key={flag.flagKey}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 0',
                      borderBottom: i < flags.length - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>
                        {info.label}
                      </div>
                      {info.desc && <div style={{ fontSize: 12, color: '#64748b' }}>{info.desc}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isSaving && <span style={{ fontSize: 12, color: '#94a3b8' }}>Saving…</span>}
                      <ToggleSwitch enabled={flag.enabled} onChange={() => !isSaving && toggleFlag(flag)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LimitField({
  label, value, used, max, pct, onChange,
}: {
  label: string;
  value: number;
  used?: number;
  max: number;
  pct: number;
  onChange: (v: number) => void;
}) {
  const barColor = pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#3b82f6';
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 18px', border: '1px solid #e2e8f0' }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%', padding: '7px 10px', border: '1px solid #d1d5db',
          borderRadius: 7, fontSize: 20, fontWeight: 700, color: '#0f172a',
          boxSizing: 'border-box', outline: 'none',
        }}
      />
      {used !== undefined && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
            <span>{used} used</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 99,
        background: enabled ? '#3b82f6' : '#d1d5db',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: enabled ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

// Styles
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
  overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};
const sectionHeader: React.CSSProperties = {
  padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: '#fafbfc',
};
const sectionTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#0f172a' };
const sectionDesc: React.CSSProperties = { fontSize: 12, color: '#64748b', marginTop: 2 };
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
