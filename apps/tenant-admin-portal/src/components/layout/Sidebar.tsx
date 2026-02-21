import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getVisibleNavItems } from '@/config/navigation';
import { useUserRoles } from '@/lib/auth/roles';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const userRoles = useUserRoles();
  const tenantName = useAuthStore((state) => state.tenantName);
  const visibleNavItems = getVisibleNavItems(userRoles);

  return (
    <aside className={cn(
      "border-r border-border bg-white transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between border-b border-border p-3">
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">
              {tenantName || 'Organization'}
            </h2>
            <p className="text-xs text-muted-foreground">Tenant</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex-shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </Button>
      </div>
      
      <nav className="flex-1 space-y-1 p-2">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isCollapsed && 'justify-center'
              )
            }
          >
            {isCollapsed ? (
              <span className="text-base font-semibold">{item.label.charAt(0)}</span>
            ) : (
              item.label
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
