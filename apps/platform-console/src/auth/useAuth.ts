import { apiClient } from '@/api/client';
import { useAuthStore } from './authStore';
import { toast } from 'sonner';
import { ApiException } from '@/api/errors';
import { decodeJwtPayload, isTokenExpired } from './jwt';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tenantId: string;
  userId: string;
  email: string;
  roles: string[];
}

export interface MeResponse {
  tenantId: string;
  userId: string;
  roles: string[];
}

const REQUIRED_ROLE = 'REGULYN_SUPER_ADMIN';

export function useAuth() {
  const store = useAuthStore();

  const login = async (email: string, password: string) => {
    try {
      store.setStatus('bootstrapping');

      const response = await apiClient.post<LoginResponse>(
        '/auth/login',
        { email, password },
        { skipAuth: true }
      );

      // Check for required role
      if (!response.roles.includes(REQUIRED_ROLE)) {
        store.setStatus('forbidden');
        toast.error('Access denied. Super admin role required.');
        return { success: false, forbidden: true };
      }

      // Set auth state
      store.setAuth({
        token: response.token,
        tenantId: response.tenantId,
        userId: response.userId,
        email: response.email,
        roles: response.roles,
      });

      toast.success('Login successful');
      return { success: true };
    } catch (error) {
      store.setStatus('unauthenticated');
      
      if (error instanceof ApiException) {
        // Handle 422 validation errors with field details
        if (error.error.status === 422 && error.error.fieldErrors) {
          return { 
            success: false, 
            fieldErrors: error.error.fieldErrors 
          };
        }
        
        const message = error.error.status === 401 
          ? 'Invalid credentials' 
          : error.error.message;
        toast.error(message);
      } else {
        toast.error('Login failed. Please try again.');
      }

      return { success: false };
    }
  };

  const logout = () => {
    store.logout();
    toast.info('Logged out successfully');
  };

  const bootstrap = async () => {
    const token = store.token;

    if (!token) {
      store.setStatus('unauthenticated');
      return;
    }

    try {
      store.setStatus('bootstrapping');

      const response = await apiClient.get<MeResponse>(
        '/auth/me',
        { token }
      );

      // Check for required role
      if (!response.roles.includes(REQUIRED_ROLE)) {
        store.logout();
        toast.error('Please login with a super admin account.');
        return;
      }

      // Update auth state with validated data - setAuth already sets status to 'authenticated'
      store.setAuth({
        token,
        tenantId: response.tenantId,
        userId: response.userId,
        email: store.email || '',
        roles: response.roles,
      });
    } catch (error) {
      const payload = decodeJwtPayload(token);
      const fallbackRoles = payload?.roles || [];
      const canFallback = !isTokenExpired(token)
        && fallbackRoles.includes(REQUIRED_ROLE)
        && !!(payload?.tid || payload?.tenantId)
        && !!payload?.sub;

      if (canFallback) {
        store.setAuth({
          token,
          tenantId: (payload?.tid || payload?.tenantId || '') as string,
          userId: payload?.sub || '',
          email: store.email || '',
          roles: fallbackRoles,
        });
        return;
      }

      // Handle auth errors
      if (error instanceof ApiException) {
        if (error.error.status === 401) {
          toast.error('Session expired. Please login again.');
          store.logout();
        } else if (error.error.status === 403) {
          store.setStatus('forbidden');
          toast.error('Access denied. Insufficient permissions.');
        } else {
          store.setStatus('unauthenticated');
        }
      } else {
        store.setStatus('unauthenticated');
      }
    }
  };

  return {
    ...store,
    login,
    logout,
    bootstrap,
    isAuthenticated: store.status === 'authenticated',
    isLoading: store.status === 'bootstrapping',
    isForbidden: store.status === 'forbidden',
  };
}
