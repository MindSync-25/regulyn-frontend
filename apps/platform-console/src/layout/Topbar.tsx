import { NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Tenants', href: '/tenants' },
  { name: 'Platform Health', href: '/platform-health' },
  { name: 'Support Mode', href: '/support-mode' },
  { name: 'Global Audit', href: '/global-audit' },
];

export function Topbar() {
  const { email, logout } = useAuth();

  return (
    <div className="bg-[#0047AB] border-b border-[#003B8E] h-[70px] flex items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Regulyn Pramana</h1>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-white/90">
          <span className="font-medium">{email || 'Admin'}</span>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
