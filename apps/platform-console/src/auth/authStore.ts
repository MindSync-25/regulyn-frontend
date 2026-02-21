import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthStatus = 
  | 'idle' 
  | 'bootstrapping' 
  | 'authenticated' 
  | 'unauthenticated' 
  | 'forbidden';

interface AuthState {
  token: string | null;
  tenantId: string | null;
  userId: string | null;
  email: string | null;
  roles: string[];
  status: AuthStatus;
}

interface AuthActions {
  setAuth: (data: {
    token: string;
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  }) => void;
  setStatus: (status: AuthStatus) => void;
  logout: () => void;
  clearAuth: () => void;
}

export type AuthStore = AuthState & AuthActions;

const STORAGE_KEY = 'regulyn_console_token';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // State
      token: null,
      tenantId: null,
      userId: null,
      email: null,
      roles: [],
      status: 'idle' as AuthStatus,

      // Actions
      setAuth: (data: Parameters<AuthActions['setAuth']>[0]) => {
        set({
          token: data.token,
          tenantId: data.tenantId,
          userId: data.userId,
          email: data.email,
          roles: data.roles,
          status: 'authenticated',
        });
      },

      setStatus: (status: AuthStatus) => {
        set({ status });
      },

      logout: () => {
        set({
          token: null,
          tenantId: null,
          userId: null,
          email: null,
          roles: [],
          status: 'unauthenticated',
        });
      },

      clearAuth: () => {
        set({
          token: null,
          tenantId: null,
          userId: null,
          email: null,
          roles: [],
          status: 'idle',
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state: AuthStore) => ({
        token: state.token,
        tenantId: state.tenantId,
        userId: state.userId,
        email: state.email,
        roles: state.roles,
      }),
      onRehydrateStorage: () => (state) => {
        // Reset status to 'idle' on page load so bootstrap can run
        if (state && state.token) {
          state.status = 'idle';
        }
      },
    }
  )
);
