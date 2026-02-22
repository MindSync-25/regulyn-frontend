import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

function isUuid(value: string): boolean {
  // RFC 4122-ish check (accepts any version/variant)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Normalized API error structure
 */
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Standard error response from backend
 */
interface ErrorResponse {
  message?: string;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * HTTP client configuration
 */
interface HttpConfig extends RequestInit {
  skipAuth?: boolean;
  skipTenant?: boolean;
  /**
   * Optional base URL override for calling services that are not behind the default API base.
   * Example: dsar-grievance-service in local dev.
   */
  baseUrl?: string;
}

/**
 * Create ApiError from response
 */
async function createApiError(response: Response): Promise<ApiError> {
  let errorBody: ErrorResponse = {};
  
  try {
    errorBody = await response.json();
  } catch {
    // Response has no JSON body
  }

  const message = 
    errorBody.message || 
    errorBody.error || 
    getDefaultErrorMessage(response.status);

  return {
    status: response.status,
    message,
    code: errorBody.code,
    details: errorBody.details,
  };
}

/**
 * Get default error message for status code
 */
function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication required. Please log in.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'Conflict. The resource already exists or is in use.';
    case 422:
      return 'Validation failed. Please check your input.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return `Request failed with status ${status}.`;
  }
}

/**
 * Build request headers with auth and tenant injection
 * SECURITY: Enforces tenant consistency - X-Tenant-Id must match authenticated tenant
 */
function buildHeaders(config?: HttpConfig): HeadersInit {
  // NOTE: HTTP header names are case-insensitive. Some backend controllers reference headers
  // using different casing (e.g. `X-Tenant-Id` vs `X-Tenant-ID`).
  //
  // We *set both variants* as a hardening measure, but we do it via the Fetch `Headers` API.
  // That ensures we don't accidentally send `x-tenant-id: <uuid>, <uuid>` (merged duplicate
  // header values) which breaks Spring's UUID parsing.
  const headers = new Headers(config?.headers);
  headers.set('Content-Type', 'application/json');

  const authState = useAuthStore.getState();

  // Inject Authorization header
  if (!config?.skipAuth) {
    const token = authState.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Inject X-Tenant-Id header from authenticated context (source of truth)
  if (!config?.skipTenant) {
    const tenantId = authState.tenantId;
    if (tenantId) {
      if (!isUuid(tenantId)) {
        const error: ApiError = {
          status: 401,
          message:
            'Invalid tenantId in session. Please log out and sign in again (tenantId must be a UUID).',
          code: 'TENANT_ID_INVALID',
          details: { tenantId },
        };
        throw error;
      }

      // Enforce tenant header consistency: caller overrides are not allowed.
      const headerTenantId = headers.get('X-Tenant-Id');
      const headerTenantIdCompat = headers.get('X-Tenant-ID');
      if (
        (headerTenantId && headerTenantId !== tenantId) ||
        (headerTenantIdCompat && headerTenantIdCompat !== tenantId)
      ) {
        console.error('[http] SECURITY VIOLATION: X-Tenant header mismatch', {
          authTenant: tenantId,
          headerTenant: headerTenantId,
          headerTenantCompat: headerTenantIdCompat,
        });

        authState.clearAuth();
        window.location.href = '/login?error=tenant_mismatch';
        throw new Error('Tenant header mismatch - forced logout for security');
      }

      // Set BOTH variants (Headers API ensures we don't end up with duplicate merged values).
      headers.set('X-Tenant-Id', tenantId);
      headers.set('X-Tenant-ID', tenantId);
    } else {
      // Not authenticated yet, but some flows may explicitly pass a tenant header (e.g. signup).
      // If neither auth tenant nor explicit header exists, fail fast with a clear message.
      const explicitTenantId = headers.get('X-Tenant-Id') ?? headers.get('X-Tenant-ID');
      if (!explicitTenantId) {
        const error: ApiError = {
          status: 401,
          message:
            'Tenant context is missing (X-Tenant-Id). Please sign in (or sign up) before calling tenant APIs.',
          code: 'TENANT_CONTEXT_MISSING',
        };
        throw error;
      }
    }
  }

  // Inject X-User-Id header from authenticated context
  // Some backend services (e.g. dsar-grievance-service) use it to populate TenantContext.userId
  if (!config?.skipAuth) {
    const userId = authState.userId;
    if (userId) {
      // Best-effort validation (prevents accidentally sending 'null'/'undefined' strings)
      if (!isUuid(userId)) {
        const error: ApiError = {
          status: 401,
          message:
            'Invalid userId in session. Please log out and sign in again (userId must be a UUID).',
          code: 'USER_ID_INVALID',
          details: { userId },
        };
        throw error;
      }

      const headerUserId = headers.get('X-User-Id');
      const headerUserIdCompat = headers.get('X-User-ID');
      if (
        (headerUserId && headerUserId !== userId) ||
        (headerUserIdCompat && headerUserIdCompat !== userId)
      ) {
        console.error('[http] SECURITY VIOLATION: X-User header mismatch', {
          authUser: userId,
          headerUser: headerUserId,
          headerUserCompat: headerUserIdCompat,
        });

        authState.clearAuth();
        window.location.href = '/login?error=user_mismatch';
        throw new Error('User header mismatch - forced logout for security');
      }

      headers.set('X-User-Id', userId);
      headers.set('X-User-ID', userId);
    }
  }

  return headers;
}

/**
 * Execute HTTP request with error handling
 */
async function request<T>(
  url: string,
  config?: HttpConfig
): Promise<T> {
  const baseUrl = config?.baseUrl ?? env.apiBaseUrl;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  const headers = buildHeaders(config);

  // Dev-only request diagnostics (do NOT log tokens)
  if (env.isDevelopment) {
    const h = new Headers(headers);
    const authHeader = h.get('Authorization');
    const tenantHeader = h.get('X-Tenant-Id') ?? h.get('X-Tenant-ID');
    const userHeader = h.get('X-User-Id') ?? h.get('X-User-ID');
    // eslint-disable-next-line no-console
    console.info('[http] request', {
      method: (config?.method ?? 'GET').toUpperCase(),
      url: fullUrl,
      hasAuth: Boolean(authHeader),
      hasTenant: Boolean(tenantHeader),
      hasUser: Boolean(userHeader),
      tenantPrefix: tenantHeader ? tenantHeader.slice(0, 8) : null,
    });
  }
  
  const response = await fetch(fullUrl, {
    ...config,
    headers,
  });

  // Handle 401 - clear auth and redirect to login
  if (response.status === 401) {
    console.warn('[http] 401 Unauthorized - clearing auth');
    const currentToken = useAuthStore.getState().token;
    
    // Only show toast and redirect if user was authenticated (avoid loop on login page)
    if (currentToken) {
      toast.error('Session expired. Please log in again.');
      useAuthStore.getState().clearAuth();
      
      // Redirect to login unless already there
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    
    const error = await createApiError(response);
    throw error;
  }

  // Handle 403 Forbidden
  if (response.status === 403) {
    toast.error('Access denied. You do not have permission to perform this action.');
    const error = await createApiError(response);
    throw error;
  }

  // Handle 409 Conflict
  if (response.status === 409) {
    const error = await createApiError(response);
    toast.error(error.message || 'Operation conflict. Please refresh and try again.');
    throw error;
  }

  // Handle 422 Validation Error
  if (response.status === 422) {
    const error = await createApiError(response);
    // Show validation error details if available
    if (error.details) {
      const firstError = Object.values(error.details)[0];
      toast.error(firstError as string || error.message);
    } else {
      toast.error(error.message || 'Validation failed. Please check your input.');
    }
    throw error;
  }

  // Handle 5xx Server Errors
  if (response.status >= 500) {
    toast.error('Server error. Please try again later.');
    console.error('[http] Server error:', response.status);
    const error = await createApiError(response);
    throw error;
  }

  // Handle other error statuses
  if (!response.ok) {
    const error = await createApiError(response);
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // Parse JSON response
  try {
    return await response.json();
  } catch {
    return undefined as T;
  }
}

/**
 * HTTP client with auth and tenant injection
 */
export const http = {
  get: <T>(url: string, config?: HttpConfig) =>
    request<T>(url, { ...config, method: 'GET' }),

  post: <T>(url: string, data?: unknown, config?: HttpConfig) =>
    request<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(url: string, data?: unknown, config?: HttpConfig) =>
    request<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(url: string, data?: unknown, config?: HttpConfig) =>
    request<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(url: string, config?: HttpConfig) =>
    request<T>(url, { ...config, method: 'DELETE' }),
};

/**
 * Type guard to check if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

/**
 * Get user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
}
