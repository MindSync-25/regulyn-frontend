import { http } from './http';
import { env } from '@/config/env';

const BASE = env.notificationServiceUrl;

export interface NotificationPreference {
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  enabled: boolean;
  updatedAt: string | null;
}

export interface UpdatePreferenceRequest {
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  enabled: boolean;
}

export const notificationApi = {
  getMyPreferences: (): Promise<NotificationPreference[]> =>
    http.get('/api/notifications/preferences/my', { baseUrl: BASE }),

  updatePreference: (request: UpdatePreferenceRequest): Promise<NotificationPreference> =>
    http.put('/api/notifications/preferences/my', request, { baseUrl: BASE }),
};
