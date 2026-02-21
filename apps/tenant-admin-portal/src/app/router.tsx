import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { HomePage } from '@/pages/HomePage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ModulePlaceholderPage } from '@/pages/ModulePlaceholderPage';
import { BundlesListPage } from '@/pages/evidence/BundlesListPage';
import { BundleDetailPage } from '@/pages/evidence/BundleDetailPage';
import { ArtifactsListPage } from '@/pages/evidence/ArtifactsListPage';
import UsersListPage from '@/pages/identity/UsersListPage';
import ApiKeysListPage from '@/pages/identity/ApiKeysListPage';
import FeatureFlagsPage from '@/pages/identity/FeatureFlagsPage';
import PlanLimitsPage from '@/pages/identity/PlanLimitsPage';
import TenantAuditExplorerPage from '@/pages/identity/TenantAuditExplorerPage';
import DsarInboxPage from '@/pages/dsar/DsarInboxPage';
import DsarDetailPage from '@/pages/dsar/DsarDetailPage';
import IncidentsListPage from '@/pages/incidents/IncidentsListPage';
import IncidentDetailPage from '@/pages/incidents/IncidentDetailPage';
import RetentionRulesPage from '@/pages/retention/RetentionRulesPage';
import DeletionsListPage from '@/pages/retention/DeletionsListPage';
import DeletionDetailPage from '@/pages/retention/DeletionDetailPage';
import ConnectorsListPage from '@/pages/retention/ConnectorsListPage';
import ConnectorDetailPage from '@/pages/retention/ConnectorDetailPage';
import { ROLES } from '@/lib/auth/roles';

/**
 * Application router configuration
 */
export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  
  // Protected routes (require authentication)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      // Home/Dashboard
      {
        index: true,
        element: <HomePage />,
      },
      
      // User Management (Admin only)
      {
        path: 'users',
        element: (
          <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN]}>
            <UsersListPage />
          </RoleGuard>
        ),
      },
      
      // ROPA (Records of Processing Activities)
      {
        path: 'ropa',
        element: (
          <RoleGuard
            allowedRoles={[
              ROLES.TENANT_ADMIN,
              ROLES.DPO,
              ROLES.REVIEWER,
            ]}
          >
            <ModulePlaceholderPage
              moduleName="ROPA"
              description="Records of Processing Activities"
            />
          </RoleGuard>
        ),
      },
      
      // Consent Management
      {
        path: 'consent',
        element: (
          <RoleGuard
            allowedRoles={[
              ROLES.TENANT_ADMIN,
              ROLES.DPO,
              ROLES.OPERATOR,
            ]}
          >
            <ModulePlaceholderPage
              moduleName="Consent Management"
              description="Manage consent records and preferences"
            />
          </RoleGuard>
        ),
      },
      
      // DSAR (Data Subject Access Requests)
      {
        path: 'dsar',
        children: [
          {
            index: true,
            element: <Navigate to="/dsar/inbox" replace />,
          },
          {
            path: 'inbox',
            element: (
              <RoleGuard
                allowedRoles={[
                  ROLES.TENANT_ADMIN,
                  ROLES.DPO,
                  ROLES.OPERATOR,
                  ROLES.REVIEWER,
                ]}
              >
                <DsarInboxPage />
              </RoleGuard>
            ),
          },
          {
            path: ':dsarId',
            element: (
              <RoleGuard
                allowedRoles={[
                  ROLES.TENANT_ADMIN,
                  ROLES.DPO,
                  ROLES.OPERATOR,
                  ROLES.REVIEWER,
                ]}
              >
                <DsarDetailPage />
              </RoleGuard>
            ),
          },
        ],
      },
      
      // Incident & Breach Management
      {
        path: 'incidents',
        children: [
          {
            index: true,
            element: (
              <RoleGuard
                allowedRoles={[
                  ROLES.TENANT_ADMIN,
                  ROLES.DPO,
                  ROLES.REVIEWER,
                ]}
              >
                <IncidentsListPage />
              </RoleGuard>
            ),
          },
          {
            path: ':incidentId',
            element: (
              <RoleGuard
                allowedRoles={[
                  ROLES.TENANT_ADMIN,
                  ROLES.DPO,
                  ROLES.REVIEWER,
                ]}
              >
                <IncidentDetailPage />
              </RoleGuard>
            ),
          },
        ],
      },
      
      // Vendor & Third-Party Management
      {
        path: 'vendors',
        element: (
          <RoleGuard
            allowedRoles={[
              ROLES.TENANT_ADMIN,
              ROLES.DPO,
            ]}
          >
            <ModulePlaceholderPage
              moduleName="Vendor Management"
              description="Manage third-party vendors and data sharing agreements"
            />
          </RoleGuard>
        ),
      },
      
      // Data Retention & Deletion
      {
        path: 'retention',
        children: [
          {
            index: true,
            element: <Navigate to="/retention/rules" replace />,
          },
          {
            path: 'rules',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]}>
                <RetentionRulesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'deletions',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]}>
                <DeletionsListPage />
              </RoleGuard>
            ),
          },
          {
            path: 'deletions/:deletionId',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR, ROLES.REVIEWER, ROLES.AUDITOR]}>
                <DeletionDetailPage />
              </RoleGuard>
            ),
          },
          {
            path: 'connectors',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR, ROLES.CONNECTOR_AGENT]}>
                <ConnectorsListPage />
              </RoleGuard>
            ),
          },
          {
            path: 'connectors/:connectorId',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR, ROLES.CONNECTOR_AGENT]}>
                <ConnectorDetailPage />
              </RoleGuard>
            ),
          },
        ],
      },
      
      // Reports & Analytics
      {
        path: 'reports',
        element: (
          <RoleGuard
            allowedRoles={[
              ROLES.TENANT_ADMIN,
              ROLES.DPO,
              ROLES.AUDITOR,
            ]}
          >
            <ModulePlaceholderPage
              moduleName="Reports"
              description="View compliance reports and analytics"
            />
          </RoleGuard>
        ),
      },
      
      // Evidence Center
      {
        path: 'evidence',
        children: [
          {
            index: true,
            element: <Navigate to="/evidence/bundles" replace />,
          },
          {
            path: 'bundles',
            element: (
              <RoleGuard
                allowedRoles={[
                  ROLES.TENANT_ADMIN,
                  ROLES.DPO,
                  ROLES.AUDITOR,
                ]}
              >
                <BundlesListPage />
              </RoleGuard>
            ),
          },
          {
            path: 'bundles/:bundleId',
            element: (
              <RoleGuard
                allowedRoles={[
                  ROLES.TENANT_ADMIN,
                  ROLES.DPO,
                  ROLES.AUDITOR,
                ]}
              >
                <BundleDetailPage />
              </RoleGuard>
            ),
          },
          {
            path: 'artifacts',
            element: (
              <RoleGuard
                allowedRoles={[
                  ROLES.TENANT_ADMIN,
                  ROLES.DPO,
                  ROLES.AUDITOR,
                ]}
              >
                <ArtifactsListPage />
              </RoleGuard>
            ),
          },
        ],
      },
      
      // Identity & Org (PART 3)
      {
        path: 'identity',
        children: [
          {
            index: true,
            element: <Navigate to="/identity/users" replace />,
          },
          {
            path: 'users',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN]}>
                <UsersListPage />
              </RoleGuard>
            ),
          },
          {
            path: 'api-keys',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN]}>
                <ApiKeysListPage />
              </RoleGuard>
            ),
          },
          {
            path: 'feature-flags',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN]}>
                <FeatureFlagsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'plan-limits',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN]}>
                <PlanLimitsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'audit',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.AUDITOR]}>
                <TenantAuditExplorerPage />
              </RoleGuard>
            ),
          },
        ],
      },
      
      // Settings
      {
        path: 'settings',
        element: (
          <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN]}>
            <ModulePlaceholderPage
              moduleName="Settings"
              description="Tenant settings and configuration"
            />
          </RoleGuard>
        ),
      },
      
      // Forbidden page
      {
        path: 'forbidden',
        element: <ForbiddenPage />,
      },
      
      // 404 catch-all
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
