import { http } from './http';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  email: string;
  roles: string[];
}

export interface TenantOption {
  tenantId: string;
  tenantName: string;
}

/** Response from POST /auth/dp-login */
export type DpLoginResponse =
  | ({ requiresTenantSelection: false } & LoginResponse)
  | { requiresTenantSelection: true; tenants: TenantOption[] };

export const authApi = {
  /** Standard login — used by tenant-admin-portal only */
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    http.post<LoginResponse>('/auth/login', credentials, { skipAuth: true, skipTenant: true }),

  /**
   * Data Principal Portal login.
   * - Rejects tenant admins / DPOs (403 NOT_A_DATA_PRINCIPAL)
   * - Returns requiresTenantSelection=true when the same email exists in multiple tenants
   * - Pass tenantId on the second call to disambiguate
   */
  dpLogin: (credentials: LoginRequest & { tenantId?: string }): Promise<DpLoginResponse> =>
    http.post<DpLoginResponse>('/auth/dp-login', credentials, { skipAuth: true, skipTenant: true, skipErrorToast: true }),

  getMe: (): Promise<{ tenantId: string; userId: string; roles: string[] }> =>
    http.get('/auth/me'),
};
