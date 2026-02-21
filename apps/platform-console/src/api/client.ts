import { API_BASE_URL } from '@/config/env';
import { ApiException, normalizeApiError } from './errors';

export interface FetchOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
}

export async function fetchJson<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, skipAuth, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }

  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle non-JSON responses for specific status codes
    if (!response.ok) {
      let errorData: any = null;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        }
      } catch {
        // Ignore JSON parse errors
      }

      throw new ApiException(
        normalizeApiError({
          status: response.status,
          message: errorData?.message || errorData?.error || response.statusText,
          code: errorData?.code,
          fieldErrors: errorData?.fieldErrors || errorData?.errors,
          raw: errorData,
        })
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    throw new ApiException(normalizeApiError(error));
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    fetchJson<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    fetchJson<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    fetchJson<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    fetchJson<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    fetchJson<T>(endpoint, { ...options, method: 'DELETE' }),
};
