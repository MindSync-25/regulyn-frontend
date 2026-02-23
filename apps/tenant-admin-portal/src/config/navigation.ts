import { ROLES, type RoleName } from '@/lib/auth/roles';

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  allowedRoles?: RoleName[];
  children?: NavItem[];
}

/**
 * Navigation configuration with role-based visibility
 * CRITICAL: Uses ROLES constants from lib/auth/roles which match backend exactly
 */
export const navigationConfig: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: 'Home',
    // All authenticated users can see dashboard
  },
  // Governance group (ROPA + Vendors + Sharing + Scanner)
  {
    label: 'Governance',
    path: '/governance',
    icon: 'Shield',
    allowedRoles: [
      ROLES.TENANT_ADMIN,
      ROLES.DPO,
      ROLES.REVIEWER,
    ],
    children: [
      {
        label: 'ROPA',
        path: '/governance/ropa',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.REVIEWER],
      },
      {
        label: 'Vendors',
        path: '/governance/vendors',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO],
      },
      {
        label: 'Sharing Logs',
        path: '/governance/sharing',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO],
      },
      {
        label: 'Scanner Sources',
        path: '/governance/scanner/sources',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO],
      },
      {
        label: 'Scanner Runs',
        path: '/governance/scanner/runs',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO],
      },
    ],
  },
  {
    label: 'Consent',
    path: '/consent',
    icon: 'CheckSquare',
    allowedRoles: [
      ROLES.TENANT_ADMIN,
      ROLES.DPO,
      ROLES.OPERATOR,
    ],
    children: [
      {
        label: 'Notices',
        path: '/consent/notices',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR],
      },
      {
        label: 'Ledger',
        path: '/consent/ledger',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR],
      },
      {
        label: 'Purposes',
        path: '/consent/purposes',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR],
      },
      {
        label: 'Re-consent',
        path: '/consent/reconsent',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR],
      },
    ],
  },
  {
    label: 'DSAR',
    path: '/dsar/inbox',
    icon: 'Mail',
    allowedRoles: [
      ROLES.TENANT_ADMIN,
      ROLES.DPO,
      ROLES.OPERATOR,
      ROLES.REVIEWER,
    ],
  },
  {
    label: 'Incidents',
    path: '/incidents',
    icon: 'AlertTriangle',
    allowedRoles: [
      ROLES.TENANT_ADMIN,
      ROLES.DPO,
      ROLES.REVIEWER,
    ],
  },

  {
    label: 'Retention',
    path: '/retention/rules',
    icon: 'Clock',
    allowedRoles: [
      ROLES.TENANT_ADMIN,
      ROLES.DPO,
      ROLES.OPERATOR,
    ],
    children: [
      {
        label: 'Rules',
        path: '/retention/rules',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR],
      },
      {
        label: 'Deletions',
        path: '/retention/deletions',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR],
      },
      {
        label: 'Connectors',
        path: '/retention/connectors',
        allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR, ROLES.CONNECTOR_AGENT],
      },
    ],
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: 'BarChart',
    allowedRoles: [
      ROLES.TENANT_ADMIN,
      ROLES.DPO,
      ROLES.AUDITOR,
    ],
  },
  {
    label: 'Evidence',
    path: '/evidence',
    icon: 'Package',
    allowedRoles: [
      ROLES.TENANT_ADMIN,
      ROLES.DPO,
      ROLES.AUDITOR,
    ],
  },
  {
    label: 'Identity & Org',
    path: '/identity',
    icon: 'Shield',
    allowedRoles: [
      ROLES.TENANT_ADMIN,
      ROLES.DPO,
      ROLES.AUDITOR,
    ],
    children: [
      {
        label: 'Users',
        path: '/identity/users',
        allowedRoles: [ROLES.TENANT_ADMIN],
      },
      {
        label: 'API Keys',
        path: '/identity/api-keys',
        allowedRoles: [ROLES.TENANT_ADMIN],
      },
      {
        label: 'Feature Flags',
        path: '/identity/feature-flags',
        allowedRoles: [ROLES.TENANT_ADMIN],
      },
      {
        label: 'Plan Limits',
        path: '/identity/plan-limits',
        allowedRoles: [ROLES.TENANT_ADMIN],
      },
      {
        label: 'Audit Explorer',
        path: '/identity/audit',
        allowedRoles: [
          ROLES.TENANT_ADMIN,
          ROLES.DPO,
          ROLES.AUDITOR,
        ],
      },
    ],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: 'Settings',
    allowedRoles: [ROLES.TENANT_ADMIN],
  },
  {
    label: 'HR & Workflows',
    path: '/hr',
    icon: 'Users',
    allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.REVIEWER, ROLES.OPERATOR, ROLES.AUDITOR],
    children: [
      { label: 'Exit Workflows', path: '/hr/exits', allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.REVIEWER] },
      { label: 'HR Document Rules', path: '/hr/rules', allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO] },
      { label: 'Data Records', path: '/hr/access-logs', allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.AUDITOR] },
      { label: 'Compliance Exports', path: '/hr/exports', allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO] },
      { label: 'Nominees & Claims', path: '/hr/nominees', allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR] },
      { label: 'Age Rules', path: '/hr/children/age-rules', allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO] },
      { label: 'Guardian eSign', path: '/hr/children/esign', allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR] },
      { label: 'Majority Check', path: '/hr/children/majority', allowedRoles: [ROLES.TENANT_ADMIN, ROLES.DPO] },
    ],
  },
];

/**
 * Filter navigation items based on user roles
 */
export function getVisibleNavItems(userRoles: string[]): NavItem[] {
  return navigationConfig.filter((item) => {
    // If no roles specified, item is visible to all authenticated users
    if (!item.allowedRoles || item.allowedRoles.length === 0) {
      return true;
    }
    
    // Check if user has any of the required roles
    return item.allowedRoles.some((role) => userRoles.includes(role));
  });
}
