import { create } from 'zustand';

export interface AuthState {
  token: string | null;
  tenantId: string | null;
  tenantName: string | null;
  userId: string | null;
  email: string | null;
  roles: string[];
}

interface AuthStore extends AuthState {
  setAuth: (auth: AuthState) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

const SESSION_KEY = 'regulyn_dp_auth';

function loadFromSession(): AuthState {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && 'token' in parsed && Array.isArray(parsed.roles)) {
        return parsed as AuthState;
      }
    }
  } catch {
    // ignore
  }
  return { token: null, tenantId: null, tenantName: null, userId: null, email: null, roles: [] };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...loadFromSession(),

  setAuth: (auth: AuthState) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(auth));
    } catch { /* ignore */ }
    set(auth);
  },

  clearAuth: () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch { /* ignore */ }
    set({ token: null, tenantId: null, tenantName: null, userId: null, email: null, roles: [] });
  },

  isAuthenticated: () => {
    const { token, tenantId, userId } = get();
    return Boolean(token && tenantId && userId);
  },
}));
