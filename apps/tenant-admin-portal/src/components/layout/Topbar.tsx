import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { getRoleDisplayName } from '@/lib/auth/roles';

export function Topbar() {
  const navigate = useNavigate();
  const { email, roles, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-primary shadow-sm">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary-foreground">Regulyn</h1>
          
          <div className="h-6 w-px bg-primary-foreground/20"></div>
          
          <h2 className="text-sm font-medium text-primary-foreground/90">
            Tenant Admin Portal
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-primary-foreground">{email}</p>
            <p className="text-xs text-primary-foreground/80">
              {roles.map((role) => getRoleDisplayName(role as any)).join(', ')}
            </p>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
