import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

interface HttpConfig extends RequestInit {
  skipAuth?: boolean;
  skipTenant?: boolean;
  baseUrl?: string;
  /** Suppress automatic error toasts — caller handles errors themselves */
  skipErrorToast?: boolean;
}

async function createApiError(response: Response): Promise<ApiError> {
  let body: { message?: string; error?: string; code?: string } = {};
  try {
    body = await response.json();
  } catch { /* ignore */ }
  const message = body.message || body.error || `Request failed with status ${response.status}.`;
  return { status: response.status, message, code: body.code };
}

function buildHeaders(config?: HttpConfig): Headers {
  const headers = new Headers(config?.headers);
  headers.set('Content-Type', 'application/json');

  const auth = useAuthStore.getState();

  if (!config?.skipAuth && auth.token) {
    headers.set('Authorization', `Bearer ${auth.token}`);
  }

  if (!config?.skipTenant) {
    if (auth.tenantId) {
      headers.set('X-Tenant-Id', auth.tenantId);
      headers.set('X-Tenant-ID', auth.tenantId);
    }
    if (auth.userId) {
      headers.set('X-User-Id', auth.userId);
      headers.set('X-User-ID', auth.userId);
    }
  }

  return headers;
}

async function request<T>(url: string, config?: HttpConfig): Promise<T> {
  const baseUrl = config?.baseUrl ?? env.apiBaseUrl;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  const headers = buildHeaders(config);

  const response = await fetch(fullUrl, { ...config, headers });

  if (response.status === 401) {
    const auth = useAuthStore.getState();
    if (auth.token) {
      if (!config?.skipErrorToast) toast.error('Your session has expired. Please log in again.');
      auth.clearAuth();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    throw await createApiError(response);
  }

  if (response.status === 403) {
    if (!config?.skipErrorToast) toast.error('You do not have permission to do that.');
    throw await createApiError(response);
  }

  if (response.status === 409 || response.status === 422) {
    const err = await createApiError(response);
    toast.error(err.message);
    throw err;
  }

  if (response.status >= 500) {
    toast.error('Something went wrong on our end. Please try again.');
    throw await createApiError(response);
  }

  if (!response.ok) throw await createApiError(response);
  if (response.status === 204) return undefined as T;

  try {
    return await response.json();
  } catch {
    return undefined as T;
  }
}

export const http = {
  get:    <T>(url: string, config?: HttpConfig) => request<T>(url, { ...config, method: 'GET' }),
  post:   <T>(url: string, data?: unknown, config?: HttpConfig) =>
    request<T>(url, { ...config, method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put:    <T>(url: string, data?: unknown, config?: HttpConfig) =>
    request<T>(url, { ...config, method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  patch:  <T>(url: string, data?: unknown, config?: HttpConfig) =>
    request<T>(url, { ...config, method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(url: string, config?: HttpConfig) => request<T>(url, { ...config, method: 'DELETE' }),
};

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e && 'message' in e;
}

export function getErrorMessage(e: unknown): string {
  if (isApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return 'An unexpected error occurred.';
}
