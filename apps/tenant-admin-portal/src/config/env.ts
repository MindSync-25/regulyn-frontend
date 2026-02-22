/**
 * Environment configuration with runtime validation.
 * Validates required environment variables at startup.
 */

interface EnvConfig {
  apiBaseUrl: string;
  consentServiceUrl: string;
  notificationServiceUrl: string;
  evidenceServiceUrl: string;
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

function getRequiredEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Please check your .env file.`
    );
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return import.meta.env[key] || defaultValue;
}

function validateUrl(value: string, key: string) {
  try {
    new URL(value);
  } catch {
    throw new Error(`Invalid ${key}: "${value}". Must be a valid URL.`);
  }
}

// Validate and export environment configuration
export const env: EnvConfig = {
  apiBaseUrl: getRequiredEnv('VITE_API_BASE_URL'),
  consentServiceUrl: getOptionalEnv('VITE_CONSENT_SERVICE_URL', 'http://localhost:8083'),
  notificationServiceUrl: getOptionalEnv(
    'VITE_NOTIFICATION_SERVICE_URL',
    'http://localhost:8092'
  ),
  evidenceServiceUrl: getOptionalEnv('VITE_EVIDENCE_SERVICE_URL', 'http://localhost:8095'),
  appName: getOptionalEnv('VITE_APP_NAME', 'Regulyn Tenant Admin Portal'),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Validate URL format
validateUrl(env.apiBaseUrl, 'VITE_API_BASE_URL');
validateUrl(env.consentServiceUrl, 'VITE_CONSENT_SERVICE_URL');
validateUrl(env.notificationServiceUrl, 'VITE_NOTIFICATION_SERVICE_URL');
validateUrl(env.evidenceServiceUrl, 'VITE_EVIDENCE_SERVICE_URL');

// Log configuration in development
if (env.isDevelopment) {
  console.log('[env] Configuration loaded:', {
    apiBaseUrl: env.apiBaseUrl,
    consentServiceUrl: env.consentServiceUrl,
    notificationServiceUrl: env.notificationServiceUrl,
    evidenceServiceUrl: env.evidenceServiceUrl,
    appName: env.appName,
    mode: import.meta.env.MODE,
  });
}
