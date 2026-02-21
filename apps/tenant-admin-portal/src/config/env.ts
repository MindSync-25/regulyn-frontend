/**
 * Environment configuration with runtime validation.
 * Validates required environment variables at startup.
 */

interface EnvConfig {
  apiBaseUrl: string;
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

// Validate and export environment configuration
export const env: EnvConfig = {
  apiBaseUrl: getRequiredEnv('VITE_API_BASE_URL'),
  appName: getOptionalEnv('VITE_APP_NAME', 'Regulyn Tenant Admin Portal'),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Validate URL format
try {
  new URL(env.apiBaseUrl);
} catch (error) {
  throw new Error(
    `Invalid VITE_API_BASE_URL: "${env.apiBaseUrl}". Must be a valid URL.`
  );
}

// Log configuration in development
if (env.isDevelopment) {
  console.log('[env] Configuration loaded:', {
    apiBaseUrl: env.apiBaseUrl,
    appName: env.appName,
    mode: import.meta.env.MODE,
  });
}
