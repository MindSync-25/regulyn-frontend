export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const SUPPORT_AUDIT_ENABLED = import.meta.env.VITE_SUPPORT_AUDIT_ENABLED === 'true';
export const SUPPORT_TENANT_AUDIT_ENABLED = import.meta.env.VITE_SUPPORT_TENANT_AUDIT_ENABLED === 'true';
export const SUPPORT_EVIDENCE_BUNDLES_ENABLED = import.meta.env.VITE_SUPPORT_EVIDENCE_BUNDLES_ENABLED === 'true';

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('VITE_API_BASE_URL not set, using default:', API_BASE_URL);
}
