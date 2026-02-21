export type UserFacingErrorAction = {
  label: string;
  kind: 'refresh' | 'login';
};

export type UserFacingError = {
  title: string;
  message: string;
  primaryAction?: UserFacingErrorAction;
  secondaryAction?: UserFacingErrorAction;
};

function getMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function getStatusCode(err: unknown, message: string): number | undefined {
  if (typeof err === 'object' && err) {
    const anyErr = err as any;
    const directStatus = anyErr.status;
    if (typeof directStatus === 'number') return directStatus;

    const responseStatus = anyErr.response?.status;
    if (typeof responseStatus === 'number') return responseStatus;

    const causeStatus = anyErr.cause?.status;
    if (typeof causeStatus === 'number') return causeStatus;
  }

  const match = message.match(/\b(401|403|404|409|422|429|500|502|503|504)\b/);
  if (match) return Number(match[1]);

  return undefined;
}

function isTenantContextRequired(message: string): boolean {
  return (
    message === 'TENANT_CONTEXT_REQUIRED' ||
    message.includes('TENANT_CONTEXT_REQUIRED') ||
    message === 'No tenant context' ||
    message.includes('No tenant context')
  );
}

/**
 * Maps unknown errors to a consistent user-facing message.
 * Never returns internal error codes in the UI.
 */
export function getUserFacingError(err: unknown): UserFacingError {
  const message = getMessage(err);

  if (isTenantContextRequired(message)) {
    return {
      title: 'Tenant context not available',
      message:
        "Your session is loaded, but tenant context hasn’t initialized yet. Refresh the page to retry.",
      primaryAction: {
        label: 'Refresh',
        kind: 'refresh',
      },
      secondaryAction: {
        label: 'Go to Login',
        kind: 'login',
      },
    };
  }

  const status = getStatusCode(err, message);

  if (status === 401) {
    return {
      title: 'Sign-in required',
      message: 'Please sign in again. If the problem continues, refresh the page.',
      primaryAction: {
        label: 'Go to Login',
        kind: 'login',
      },
      secondaryAction: {
        label: 'Refresh',
        kind: 'refresh',
      },
    };
  }

  if (status === 403) {
    return {
      title: 'Access denied',
      message: "You may not have permission to view this. If you believe this is an error, refresh the page or contact your administrator.",
      primaryAction: {
        label: 'Refresh',
        kind: 'refresh',
      },
    };
  }

  if (typeof status === 'number' && status >= 500) {
    return {
      title: 'Something went wrong',
      message: 'Please try again. If the problem continues, refresh the page.',
      primaryAction: {
        label: 'Refresh',
        kind: 'refresh',
      },
    };
  }

  return {
    title: 'Unable to load data',
    message: 'Please try again. If the problem continues, refresh the page.',
    primaryAction: {
      label: 'Refresh',
      kind: 'refresh',
    },
  };
}
