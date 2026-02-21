import { useAuthStore } from '@/store/authStore';

/**
 * Tenant security utilities.
 * CRITICAL: Tenant ID must ONLY come from JWT token, never from user input.
 */

export class TenantMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantMismatchError';
  }
}

/**
 * Get the current user's tenant ID from auth store.
 * @throws {Error} if user is not authenticated or tenant ID is missing
 */
export function getCurrentTenantId(): string {
  const tenantId = useAuthStore.getState().tenantId;
  
  if (!tenantId) {
    throw new Error('No tenant ID found. User must be authenticated.');
  }
  
  return tenantId;
}

/**
 * Validate that a tenant ID matches the current user's tenant.
 * Use this to protect against tenant ID manipulation in URL params or request bodies.
 * 
 * @param tenantId - The tenant ID to validate (e.g., from URL param)
 * @throws {TenantMismatchError} if tenant IDs don't match
 */
export function validateTenantId(tenantId: string): void {
  const currentTenantId = getCurrentTenantId();
  
  if (tenantId !== currentTenantId) {
    console.error(
      `[tenant] Tenant mismatch detected! Current: ${currentTenantId}, Attempted: ${tenantId}`
    );
    throw new TenantMismatchError(
      'Tenant ID mismatch. You do not have access to this tenant.'
    );
  }
}

/**
 * Check if user belongs to a specific tenant.
 * Returns false instead of throwing, useful for conditional UI.
 */
export function belongsToTenant(tenantId: string): boolean {
  const currentTenantId = useAuthStore.getState().tenantId;
  return currentTenantId === tenantId;
}

/**
 * Hook to get current tenant ID safely.
 * Returns null if not authenticated.
 */
export function useTenantId(): string | null {
  return useAuthStore((state) => state.tenantId);
}

/**
 * Hook to get current tenant ID with validation.
 * @throws {Error} if user is not authenticated
 */
export function useRequiredTenantId(): string {
  const tenantId = useAuthStore((state) => state.tenantId);
  
  if (!tenantId) {
    throw new Error('Tenant ID is required but user is not authenticated.');
  }
  
  return tenantId;
}
