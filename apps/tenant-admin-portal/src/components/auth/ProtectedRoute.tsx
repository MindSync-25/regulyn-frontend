import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api/endpoints/auth';
import { isApiError } from '@/lib/api/http';
import { RoleName } from '@/lib/auth/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Required roles (user must have at least one). If omitted, only auth is checked */
  roles?: RoleName[];
}

/**
 * ProtectedRoute component
 * Validates session with backend before rendering protected content
 * Optionally enforces role requirements
 * 
 * Behavior:
 * - Not authenticated → redirect to /login
 * - Authenticated but missing required role → redirect to /forbidden
 * - Authenticated with correct role → render children
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, setAuth, clearAuth, roles: userRoles } = useAuthStore();
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function validateSession() {
      // If not authenticated in store, skip validation
      if (!isAuthenticated()) {
        setValidating(false);
        setIsValid(false);
        return;
      }

      try {
        // Validate session with backend
        const response = await authApi.getMe();
        
        // Update store with latest data from backend
        const currentAuth = useAuthStore.getState();
        setAuth({
          ...currentAuth,
          tenantId: response.tenantId,
          userId: response.userId,
          roles: response.roles,
        });
        
        setIsValid(true);
      } catch (error) {
        console.error('[ProtectedRoute] Session validation failed:', error);
        
        // Clear auth on 401 or any error
        if (isApiError(error) && error.status === 401) {
          clearAuth();
        }
        
        setIsValid(false);
      } finally {
        setValidating(false);
      }
    }

    validateSession();
  }, [isAuthenticated, setAuth, clearAuth]);

  // Show loading state while validating
  if (validating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Validating session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated or validation failed
  if (!isValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements if specified
  if (roles && roles.length > 0) {
    const hasRequiredRole = userRoles.some(userRole => roles.includes(userRole as RoleName));
    if (!hasRequiredRole) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  // Render protected content
  return <>{children}</>;
}
