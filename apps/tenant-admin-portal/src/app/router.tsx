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
import { NoticeTemplatesListPage } from '@/pages/consent/NoticeTemplatesListPage';
import { NoticeTemplateDetailPage } from '@/pages/consent/NoticeTemplateDetailPage';
import { PurposesHistoryPage } from '@/pages/consent/PurposesHistoryPage';
import { ReconsentDashboardPage } from '@/pages/consent/ReconsentDashboardPage';
import { CommunicationLedgerPage } from '@/pages/consent/CommunicationLedgerPage';
import { ROLES } from '@/lib/auth/roles';
import { RopaListPage } from '@/pages/governance/RopaListPage';
import { RopaDetailPage } from '@/pages/governance/RopaDetailPage';
import { VendorListPage } from '@/pages/governance/VendorListPage';
import { VendorDetailPage } from '@/pages/governance/VendorDetailPage';
import { SharingLogsPage } from '@/pages/governance/SharingLogsPage';
import { ScanSourcesPage } from '@/pages/governance/ScanSourcesPage';
import { ScanRunsPage } from '@/pages/governance/ScanRunsPage';
import { ScanRunDetailPage } from '@/pages/governance/ScanRunDetailPage';
// HR & Special Workflows
import HRRulesPage from '@/pages/hr/HRRulesPage';
import HRExitsPage from '@/pages/hr/HRExitsPage';
import HRAccessLogsPage from '@/pages/hr/HRAccessLogsPage';
import HRExportsPage from '@/pages/hr/HRExportsPage';
import NomineesPage from '@/pages/hr/NomineesPage';
import NomineeDetailPage from '@/pages/hr/NomineeDetailPage';
import AgeRulesPage from '@/pages/hr/children/AgeRulesPage';
import ESignPage from '@/pages/hr/children/ESignPage';
import MajorityPage from '@/pages/hr/children/MajorityPage';

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
      
      // Governance (ROPA + Vendors + Sharing + Scanner)
      {
        path: 'governance',
        children: [
          {
            index: true,
            element: <Navigate to="/governance/ropa" replace />,
          },
          // ROPA
          {
            path: 'ropa',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.REVIEWER]}>
                <RopaListPage />
              </RoleGuard>
            ),
          },
          {
            path: 'ropa/:activityId',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.REVIEWER]}>
                <RopaDetailPage />
              </RoleGuard>
            ),
          },
          // Vendors
          {
            path: 'vendors',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO]}>
                <VendorListPage />
              </RoleGuard>
            ),
          },
          {
            path: 'vendors/:vendorId',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO]}>
                <VendorDetailPage />
              </RoleGuard>
            ),
          },
          // Sharing Logs
          {
            path: 'sharing',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO]}>
                <SharingLogsPage />
              </RoleGuard>
            ),
          },
          // Scanner
          {
            path: 'scanner',
            children: [
              {
                index: true,
                element: <Navigate to="/governance/scanner/sources" replace />,
              },
              {
                path: 'sources',
                element: (
                  <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO]}>
                    <ScanSourcesPage />
                  </RoleGuard>
                ),
              },
              {
                path: 'runs',
                element: (
                  <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO]}>
                    <ScanRunsPage />
                  </RoleGuard>
                ),
              },
              {
                path: 'runs/:runId',
                element: (
                  <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO]}>
                    <ScanRunDetailPage />
                  </RoleGuard>
                ),
              },
            ],
          },
        ],
      },
      
      // Consent Management
      {
        path: 'consent',
        children: [
          {
            index: true,
            element: <Navigate to="/consent/notices" replace />,
          },
          {
            path: 'notices',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]}>
                <NoticeTemplatesListPage />
              </RoleGuard>
            ),
          },
          {
            path: 'notices/:templateId',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]}>
                <NoticeTemplateDetailPage />
              </RoleGuard>
            ),
          },
          {
            path: 'ledger',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]}>
                <CommunicationLedgerPage />
              </RoleGuard>
            ),
          },
          {
            path: 'purposes',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]}>
                <PurposesHistoryPage />
              </RoleGuard>
            ),
          },
          {
            path: 'reconsent',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]}>
                <ReconsentDashboardPage />
              </RoleGuard>
            ),
          },
        ],
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
      
      // Vendor & Third-Party Management (moved under /governance/vendors)
      
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

      // HR & Special Workflows
      {
        path: 'hr',
        children: [
          { index: true, element: <Navigate to="/hr/exits" replace /> },
          {
            path: 'rules',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO]}>
                <HRRulesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'exits',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.REVIEWER]}>
                <HRExitsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'access-logs',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.AUDITOR]}>
                <HRAccessLogsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'exports',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO]}>
                <HRExportsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'nominees',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]}>
                <NomineesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'nominees/:claimId',
            element: (
              <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]}>
                <NomineeDetailPage />
              </RoleGuard>
            ),
          },
          {
            path: 'children',
            children: [
              { index: true, element: <Navigate to="/hr/children/age-rules" replace /> },
              {
                path: 'age-rules',
                element: (
                  <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO]}>
                    <AgeRulesPage />
                  </RoleGuard>
                ),
              },
              {
                path: 'esign',
                element: (
                  <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.OPERATOR]}>
                    <ESignPage />
                  </RoleGuard>
                ),
              },
              {
                path: 'majority',
                element: (
                  <RoleGuard allowedRoles={[ROLES.TENANT_ADMIN, ROLES.DPO]}>
                    <MajorityPage />
                  </RoleGuard>
                ),
              },
            ],
          },
        ],
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
