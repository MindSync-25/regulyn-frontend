import { useAuthStore } from '@/store/authStore';

/**
 * Role constants matching backend Role entity (EXACT MATCH - case-sensitive).
 * Source: services/identity-tenant-service/src/main/resources/db/migration/V3__create_roles_table.sql
 * 
 * CRITICAL: These MUST match /auth/me response exactly.
 * Values: TENANT_ADMIN, DPO, REVIEWER, OPERATOR, AUDITOR, DATA_PRINCIPAL, CONNECTOR_AGENT
 */
export const ROLES = {
  TENANT_ADMIN: 'TENANT_ADMIN',
  DPO: 'DPO',
  REVIEWER: 'REVIEWER',
  OPERATOR: 'OPERATOR',
  AUDITOR: 'AUDITOR',
  DATA_PRINCIPAL: 'DATA_PRINCIPAL',
  CONNECTOR_AGENT: 'CONNECTOR_AGENT',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role descriptions for UI display
 */
export const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  [ROLES.TENANT_ADMIN]: 'Full administrative access to tenant',
  [ROLES.DPO]: 'Data Protection Officer role',
  [ROLES.REVIEWER]: 'Review and approve privacy requests',
  [ROLES.OPERATOR]: 'Operate privacy processes',
  [ROLES.AUDITOR]: 'Audit and compliance review (read-only)',
  [ROLES.DATA_PRINCIPAL]: 'Data subject / end-user',
  [ROLES.CONNECTOR_AGENT]: 'Connector service agent role',
};

/**
 * Role hierarchy for permission checking.
 * Higher index = more permissions
 */
const ROLE_HIERARCHY: RoleName[] = [
  ROLES.DATA_PRINCIPAL,
  ROLES.CONNECTOR_AGENT,
  ROLES.AUDITOR,
  ROLES.OPERATOR,
  ROLES.REVIEWER,
  ROLES.DPO,
  ROLES.TENANT_ADMIN,
];

/**
 * Check if user has a specific role
 */
export function hasRole(role: RoleName): boolean {
  return useAuthStore.getState().hasRole(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(roles: RoleName[]): boolean {
  return useAuthStore.getState().hasAnyRole(roles);
}

/**
 * Check if user has all specified roles
 */
export function hasAllRoles(roles: RoleName[]): boolean {
  const userRoles = useAuthStore.getState().roles;
  return roles.every((role) => userRoles.includes(role));
}

/**
 * Get role hierarchy level (higher = more permissions)
 */
function getRoleLevel(role: RoleName): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * Check if user has a role with at least the specified permission level
 */
export function hasRoleAtLeast(minimumRole: RoleName): boolean {
  const userRoles = useAuthStore.getState().roles;
  const minimumLevel = getRoleLevel(minimumRole);
  
  return userRoles.some((userRole) => {
    const userLevel = getRoleLevel(userRole as RoleName);
    return userLevel >= minimumLevel;
  });
}

/**
 * Check if user is a tenant admin
 */
export function isTenantAdmin(): boolean {
  return hasRole(ROLES.TENANT_ADMIN);
}

/**
 * Check if user is DPO or has equivalent privacy authority
 */
export function isDPO(): boolean {
  return hasRole(ROLES.DPO);
}

/**
 * Check if user can manage compliance activities
 */
export function canManageCompliance(): boolean {
  return hasAnyRole([ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.REVIEWER]);
}

/**
 * Check if user can manage privacy requests
 */
export function canManagePrivacy(): boolean {
  return hasAnyRole([ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]);
}

/**
 * Check if user has admin-level access
 */
export function isAdmin(): boolean {
  return hasRole(ROLES.TENANT_ADMIN);
}

/**
 * Get formatted role display name
 */
export function getRoleDisplayName(role: RoleName): string {
  return role.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: RoleName): boolean {
  return useAuthStore((state) => state.hasRole(role));
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roles: RoleName[]): boolean {
  return useAuthStore((state) => state.hasAnyRole(roles));
}

/**
 * Hook to get all user roles
 */
export function useUserRoles(): string[] {
  return useAuthStore((state) => state.roles);
}
