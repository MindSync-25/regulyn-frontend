import { http } from './http';
import { env } from '@/config/env';

const BASE = env.evidenceServiceUrl;

export interface EvidenceBundle {
  bundleId: string;
  bundleName: string;
  description: string | null;
  status: string;
  createdAt: string | null;
  exportedAt: string | null;
  downloadUrl: string | null;
}

export const evidenceApi = {
  listMyBundles: (): Promise<EvidenceBundle[]> =>
    http.get('/bundles/my', { baseUrl: BASE }),

  requestExport: (bundleId: string): Promise<{ exportId: string; status: string }> =>
    http.post(`/bundles/${encodeURIComponent(bundleId)}/export`, undefined, { baseUrl: BASE }),
};
