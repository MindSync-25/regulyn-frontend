interface EnvConfig {
  apiBaseUrl: string;
  dsarServiceUrl: string;
  consentServiceUrl: string;
  nomineeServiceUrl: string;
  evidenceServiceUrl: string;
  notificationServiceUrl: string;
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

function getRequiredEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return import.meta.env[key] || defaultValue;
}

export const env: EnvConfig = {
  apiBaseUrl: getRequiredEnv('VITE_API_BASE_URL'),
  dsarServiceUrl: getOptionalEnv('VITE_DSAR_SERVICE_URL', 'http://localhost:8084'),
  consentServiceUrl: getOptionalEnv('VITE_CONSENT_SERVICE_URL', 'http://localhost:8082'),
  nomineeServiceUrl: getOptionalEnv('VITE_NOMINEE_SERVICE_URL', 'http://localhost:8088'),
  evidenceServiceUrl: getOptionalEnv('VITE_EVIDENCE_SERVICE_URL', 'http://localhost:8095'),
  notificationServiceUrl: getOptionalEnv('VITE_NOTIFICATION_SERVICE_URL', 'http://localhost:8092'),
  appName: getOptionalEnv('VITE_APP_NAME', 'Regulyn – My Privacy Rights'),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};
