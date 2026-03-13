import { http } from './http';
import { env } from '@/config/env';

const BASE = env.nomineeServiceUrl;

export interface Nominee {
  nomineeId: string;
  nomineeName: string;
  nomineeEmail: string;
  nomineePhone: string | null;
  relationship: string;
  status: string;
  createdAt: string | null;
  verifiedAt: string | null;
}

export interface AddNomineeRequest {
  nomineeName: string;
  nomineeEmail: string;
  nomineePhone?: string;
  relationship: string;
}

export const nomineeApi = {
  listMyNominees: (): Promise<Nominee[]> =>
    http.get('/nominees', { baseUrl: BASE }),

  addNominee: (request: AddNomineeRequest): Promise<Nominee> =>
    http.post('/nominees', request, { baseUrl: BASE }),

  removeNominee: (nomineeId: string): Promise<void> =>
    http.delete(`/nominees/${encodeURIComponent(nomineeId)}`, { baseUrl: BASE }),
};
