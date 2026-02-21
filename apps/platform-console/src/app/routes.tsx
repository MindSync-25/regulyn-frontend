import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '@/auth/LoginPage';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { RoleGuard } from '@/auth/RoleGuard';
import { ConsoleLayout } from '@/layout/ConsoleLayout';
import { DashboardPlaceholder } from '@/pages/DashboardPlaceholder';
import { TenantsListPage } from '@/features/tenants/pages/TenantsListPage';
import { TenantDetailPage } from '@/features/tenants/pages/TenantDetailPage';
import { PlatformHealthPage } from '@/features/platform-health/PlatformHealthPage';
import { TenantHealthDetailPage } from '@/features/platform-health/TenantHealthDetailPage';
import { SupportModePage } from '@/features/support-mode/SupportModePage';
import { TenantSupportHomePage } from '@/features/support-mode/TenantSupportHomePage';
import { GlobalAuditPage } from '@/features/global-audit/GlobalAuditPage';
import { NotFound } from '@/pages/NotFound';
import { ForbiddenPage } from '@/components/FullPageError';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <RoleGuard>
                <ConsoleLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPlaceholder />} />
          <Route path="/tenants" element={<TenantsListPage />} />
          <Route path="/tenants/:tenantId" element={<TenantDetailPage />} />
          <Route path="/platform-health" element={<PlatformHealthPage />} />
          <Route path="/platform-health/tenants/:tenantId" element={<TenantHealthDetailPage />} />
          <Route path="/support-mode" element={<SupportModePage />} />
          <Route path="/support-mode/tenant/:tenantId" element={<TenantSupportHomePage />} />
          <Route path="/global-audit" element={<GlobalAuditPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
