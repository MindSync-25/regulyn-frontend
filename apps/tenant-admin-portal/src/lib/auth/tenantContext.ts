import { useAuthStore } from '@/store/authStore';

/**
 * Centralized tenantId access for Tenant Admin Portal.
 *
 * Intent:
 * - Avoid scattering `useAuthStore(state => state.tenantId)` everywhere.
 * - Provide a single place to enforce "tenantId is required" semantics.
 */

export function useTenantId(): string | null {
  return useAuthStore(state => state.tenantId);
}

export function requireTenantId(tenantId: string | null | undefined): string {
  if (!tenantId || tenantId.trim().length === 0) {
    throw new Error('TENANT_CONTEXT_REQUIRED');
  }
  return tenantId;
}
