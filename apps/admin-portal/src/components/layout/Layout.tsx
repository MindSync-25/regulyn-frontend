import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { clearAuth, getUser, isAuthenticated, AuthUser } from '../../lib/auth';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    title: 'Identity & Org',
    items: [
      { label: 'Users', href: '/identity/users', icon: '👥' },
      { label: 'Invite User', href: '/identity/users/invites', icon: '✉️' },
      { label: 'API Keys', href: '/identity/api-keys', icon: '🔑' },
      { label: 'Tenant Settings', href: '/identity/settings', icon: '⚙️' },
      { label: 'Audit Log', href: '/identity/audit', icon: '📋' },
    ],
  },
];

const PUBLIC_PATHS = ['/login'];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const authed = isAuthenticated();
    if (!authed && !PUBLIC_PATHS.includes(router.pathname)) {
      router.replace('/login');
      return;
    }
    setUser(getUser());
  }, [router.pathname]);

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  if (!mounted) return null;

  const isPublic = PUBLIC_PATHS.includes(router.pathname);
  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: '#0f172a',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #1e293b',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            🛡️ Regulyn
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Admin Portal</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map((section) => (
            <div key={section.title} style={{ marginBottom: 8 }}>
              <div style={{
                padding: '6px 20px',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#475569',
              }}>
                {section.title}
              </div>
              {section.items.map((item) => {
                const active = router.pathname === item.href ||
                  (router.pathname.startsWith(item.href) && item.href !== '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 20px',
                      fontSize: 13.5,
                      fontWeight: active ? 600 : 400,
                      color: active ? '#f1f5f9' : '#94a3b8',
                      background: active ? '#1e293b' : 'transparent',
                      borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #1e293b',
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              <div style={{ fontWeight: 500, color: '#cbd5e1' }}>{user.email}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: '#475569' }}>
                {user.roles?.join(', ') || 'No roles'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '6px 12px',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{
        marginLeft: 240,
        flex: 1,
        background: '#f8fafc',
        minHeight: '100vh',
      }}>
        {/* Top bar */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ fontSize: 14, color: '#64748b' }}>
            {NAV.flatMap(s => s.items).find(i =>
              router.pathname === i.href ||
              (router.pathname.startsWith(i.href) && i.href !== '/')
            )?.label ?? 'Dashboard'}
          </div>
          {user && (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Tenant: <span style={{ color: '#475569', fontWeight: 500 }}>{user.tenantName}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '28px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
