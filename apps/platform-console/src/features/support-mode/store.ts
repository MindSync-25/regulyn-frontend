import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/auth/authStore';
import { SUPPORT_AUDIT_ENABLED } from '@/config/env';
import type { SupportAuditPayload } from './types';

interface SupportModeState {
  isActive: boolean;
  tenantId: string | null;
  enteredAt: string | null;
  reason: string | null;
  readOnly: true;
  correlationId: string;
}

interface SupportModeActions {
  enter: (tenantId: string, reason: string) => void;
  exit: () => void;
  setTenant: (tenantId: string) => void;
}

export type SupportModeStore = SupportModeState & SupportModeActions;

const STORAGE_KEY = 'regulyn_console_support_mode';
const AUDIT_THROTTLE_MS = 5000;

const initialState: SupportModeState = {
  isActive: false,
  tenantId: null,
  enteredAt: null,
  reason: null,
  readOnly: true,
  correlationId: '',
};

const lastAuditMap = new Map<string, number>();

const generateCorrelationId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useSupportModeStore = create<SupportModeStore>()(
  persist(
    (set) => ({
      ...initialState,
      enter: (tenantId, reason) => {
        set({
          isActive: true,
          tenantId,
          reason,
          enteredAt: new Date().toISOString(),
          correlationId: generateCorrelationId(),
          readOnly: true,
        });
      },
      exit: () => {
        set({
          ...initialState,
          readOnly: true,
        });
      },
      setTenant: (tenantId) => {
        set({ tenantId });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export async function emitSupportAudit(payload: SupportAuditPayload) {
  if (!SUPPORT_AUDIT_ENABLED) return;

  const token = useAuthStore.getState().token;
  if (!token) return;

  const key = `${payload.tenantId}|${payload.action}|${payload.resourceType}|${payload.resourceId ?? ''}`;
  const now = Date.now();
  const last = lastAuditMap.get(key);

  if (last && now - last < AUDIT_THROTTLE_MS) {
    return;
  }

  lastAuditMap.set(key, now);

  try {
    await apiClient.post('/admin/platform/support/audit', payload, { token });
  } catch (error) {
    console.warn('Support audit emission failed', error);
  }
}
