/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;

  readonly VITE_CONSENT_SERVICE_URL?: string;
  readonly VITE_NOTIFICATION_SERVICE_URL?: string;
  readonly VITE_EVIDENCE_SERVICE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
