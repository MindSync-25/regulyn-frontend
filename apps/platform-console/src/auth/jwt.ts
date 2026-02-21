/**
 * Decode JWT payload without validation
 * DO NOT use for security - this is for display purposes only
 * Always validate with backend /auth/me
 */
export function decodeJwtPayload(token: string): {
  roles?: string[];
  tid?: string;
  tenantId?: string;
  sub?: string;
  exp?: number;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  
  return Date.now() >= payload.exp * 1000;
}
