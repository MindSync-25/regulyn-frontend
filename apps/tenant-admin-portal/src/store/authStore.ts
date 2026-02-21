import { create } from 'zustand';

/**
 * Auth state matching backend LoginResponse contract
 */
export interface AuthState {
  token: string | null;
  tenantId: string | null;
  tenantName: string | null;
  userId: string | null;
  email: string | null;
  roles: string[];
}

interface AuthStore extends AuthState {
  // Actions
  setAuth: (auth: AuthState) => void;
  clearAuth: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAuthenticated: () => boolean;
}

const SESSION_STORAGE_KEY = 'regulyn_tenant_auth';

// Load initial state from sessionStorage
function loadAuthFromSession(): AuthState {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate structure
      if (
        parsed &&
        typeof parsed === 'object' &&
        'token' in parsed &&
        'tenantId' in parsed &&
        'userId' in parsed &&
        Array.isArray(parsed.roles)
      ) {
        return parsed as AuthState;
      }
    }
  } catch (error) {
    console.error('[authStore] Failed to load auth from sessionStorage:', error);
  }
  return {
    token: null,
    tenantId: null,
    tenantName: null,
    userId: null,
    email: null,
    roles: [],
  };
}

// Save auth state to sessionStorage
function saveAuthToSession(auth: AuthState): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(auth));
  } catch (error) {
    console.error('[authStore] Failed to save auth to sessionStorage:', error);
  }
}

// Clear auth from sessionStorage
function clearAuthFromSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('[authStore] Failed to clear auth from sessionStorage:', error);
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...loadAuthFromSession(),

  setAuth: (auth: AuthState) => {
    saveAuthToSession(auth);
    set(auth);
  },

  clearAuth: () => {
    clearAuthFromSession();
    set({
      token: null,
      tenantId: null,
      userId: null,
      email: null,
      roles: [],
    });
  },

  hasRole: (role: string) => {
    return get().roles.includes(role);
  },

  hasAnyRole: (roles: string[]) => {
    const userRoles = get().roles;
    return roles.some((role) => userRoles.includes(role));
  },

  isAuthenticated: () => {
    const { token, tenantId, userId } = get();
    return Boolean(token && tenantId && userId);
  },
}));

// Export selectors for convenience
export const selectAuthToken = (state: AuthStore) => state.token;
export const selectTenantId = (state: AuthStore) => state.tenantId;
export const selectUserId = (state: AuthStore) => state.userId;
export const selectUserEmail = (state: AuthStore) => state.email;
export const selectUserRoles = (state: AuthStore) => state.roles;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated();
