import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useHasAnyRole } from '@/lib/auth/roles';
import type { RoleName } from '@/lib/auth/roles';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: RoleName[];
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * RoleGuard component
 * Renders children only if user has one of the allowed roles
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback,
  redirectTo = '/forbidden',
}: RoleGuardProps) {
  const hasRequiredRole = useHasAnyRole(allowedRoles);

  // User doesn't have required role
  if (!hasRequiredRole) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Otherwise redirect
    return <Navigate to={redirectTo} replace />;
  }

  // User has required role, render children
  return <>{children}</>;
}
