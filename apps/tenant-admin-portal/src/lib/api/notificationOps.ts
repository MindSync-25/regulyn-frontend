import { http } from '@/lib/api/http';

import { env } from '@/config/env';

const NOTIFICATION_API_BASE = env.notificationServiceUrl;

// ============================================================================
// Types (mirror backend DTOs)
// ============================================================================

export interface GetPreferencesResponse {
  dataPrincipalId: string;
  preferences: Array<{
    channel: string;
    category: string;
    optedOut: boolean;
  }>;
}

// ============================================================================
// Endpoints (notification-service)
// ============================================================================

export function getNotificationPreferences(dataPrincipalId: string) {
  return http.get<GetPreferencesResponse>(`/api/notifications/preferences/${dataPrincipalId}`, {
    baseUrl: NOTIFICATION_API_BASE,
  });
}
