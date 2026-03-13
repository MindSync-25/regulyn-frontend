import { LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const navigate = useNavigate();
  const { email, tenantName, clearAuth } = useAuthStore();

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 shrink-0">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold text-gray-900">My Privacy Rights</span>
        {tenantName && (
          <span className="ml-2 text-sm text-muted-foreground">
            — {tenantName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {email && (
          <span className="hidden sm:block text-sm text-muted-foreground">
            {email}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-1.5"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
