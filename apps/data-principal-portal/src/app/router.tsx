import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import DsarListPage from '@/pages/dsar/DsarListPage';
import DsarCreatePage from '@/pages/dsar/DsarCreatePage';
import DsarDetailPage from '@/pages/dsar/DsarDetailPage';
import ConsentPage from '@/pages/consent/ConsentPage';
import NomineesPage from '@/pages/nominees/NomineesPage';
import EvidencePage from '@/pages/evidence/EvidencePage';
import PreferencesPage from '@/pages/preferences/PreferencesPage';
import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'dsar',
        children: [
          { index: true, element: <DsarListPage /> },
          { path: 'new', element: <DsarCreatePage /> },
          { path: ':dsarId', element: <DsarDetailPage /> },
        ],
      },
      { path: 'consents', element: <ConsentPage /> },
      { path: 'nominees', element: <NomineesPage /> },
      { path: 'evidence', element: <EvidencePage /> },
      { path: 'preferences', element: <PreferencesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/logout',
    element: <Navigate to="/login" replace />,
  },
]);
