import { http } from './http';
import { env } from '@/config/env';

const BASE = env.consentServiceUrl;

export interface ConsentPurpose {
  purposeId: string;
  purposeName: string;
  description: string;
  lawfulBasis: string;
  consentGiven: boolean;
  consentGivenAt: string | null;
  consentWithdrawnAt: string | null;
  expiresAt: string | null;
}

export interface ConsentUpdateRequest {
  consentGiven: boolean;
  reason?: string;
}

export const consentApi = {
  listMyConsents: (): Promise<ConsentPurpose[]> =>
    http.get('/consents/my', { baseUrl: BASE }),

  updateConsent: (purposeId: string, request: ConsentUpdateRequest): Promise<ConsentPurpose> =>
    http.patch(`/consents/my/${encodeURIComponent(purposeId)}`, request, { baseUrl: BASE }),
};
