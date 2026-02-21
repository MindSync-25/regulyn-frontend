export interface ApiError {
  status: number;
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
  raw?: unknown;
}

export class ApiException extends Error {
  constructor(public error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiException) {
    return error.error;
  }

  if (error instanceof Response) {
    return {
      status: error.status,
      message: error.statusText || 'Request failed',
      raw: error,
    };
  }

  if (error && typeof error === 'object') {
    const err = error as any;
    
    return {
      status: err.status || err.statusCode || 500,
      message: err.message || err.error || 'An error occurred',
      code: err.code,
      fieldErrors: err.fieldErrors || err.errors,
      raw: error,
    };
  }

  return {
    status: 500,
    message: error instanceof Error ? error.message : 'Unknown error',
    raw: error,
  };
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes('fetch');
}
