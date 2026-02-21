/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SUPPORT_AUDIT_ENABLED?: string;
  readonly VITE_SUPPORT_TENANT_AUDIT_ENABLED?: string;
  readonly VITE_SUPPORT_EVIDENCE_BUNDLES_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
