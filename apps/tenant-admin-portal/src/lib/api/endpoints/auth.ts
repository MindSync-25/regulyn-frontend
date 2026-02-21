import { http } from '../http';

/**
 * Login request matching backend LoginRequest.java
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response matching backend LoginResponse.java
 */
export interface LoginResponse {
  token: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  email: string;
  roles: string[];
}

/**
 * /auth/me response matching backend
 */
export interface MeResponse {
  tenantId: string;
  userId: string;
  roles: string[];
}

/**
 * Auth API endpoints
 */
export const authApi = {
  /**
   * POST /auth/login
   * Authenticate user and get JWT token
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return http.post<LoginResponse>('/auth/login', credentials, {
      skipAuth: true, // Login doesn't require existing auth
      skipTenant: true,
    });
  },

  /**
   * GET /auth/me
   * Validate current session and get user info
   */
  getMe: async (): Promise<MeResponse> => {
    return http.get<MeResponse>('/auth/me');
  },

  /**
   * POST /auth/logout
   * Logout (client-side only, clears session)
   */
  logout: (): void => {
    // Logout is client-side only - just clear the store
    // Backend uses stateless JWT so no server-side logout needed
  },
};
