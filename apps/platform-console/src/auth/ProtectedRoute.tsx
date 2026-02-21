import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, status, bootstrap } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (status === 'idle') {
      bootstrap();
    }
  }, [status, bootstrap]);

  // Show loading during bootstrap
  if (status === 'idle' || status === 'bootstrapping') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
