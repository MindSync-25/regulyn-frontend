import { useAuth } from './useAuth';
import { Navigate } from 'react-router-dom';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function RoleGuard({ children, requiredRole = 'REGULYN_SUPER_ADMIN' }: RoleGuardProps) {
  const { roles, isForbidden, status } = useAuth();

  // Wait for bootstrap to complete
  if (status === 'bootstrapping' || status === 'idle') {
    return null;
  }

  const hasRole = roles.includes(requiredRole);

  if (isForbidden || !hasRole) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
