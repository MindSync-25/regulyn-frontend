import { NavLink } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Tenants', href: '/tenants', icon: '🏢' },
  { name: 'Platform Health', href: '/platform-health', icon: '❤️' },
  { name: 'Support Mode', href: '/support-mode', icon: '🔧' },
  { name: 'Global Audit', href: '/global-audit', icon: '📜' },
];

export function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold">Regulyn</h2>
        <p className="text-sm text-gray-400 mt-1">Platform Console</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        <p>Version 0.1.0</p>
        <p className="mt-1">© 2026 Regulyn</p>
      </div>
    </div>
  );
}
