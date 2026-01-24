# @regulyn/config

Shared configuration and environment management.

## Purpose
- Environment configuration
- Feature flags
- Constants
- Build configuration
- API endpoints
- Theme configuration

## Tech Stack
- TypeScript
- Zod (validation)

## Configuration Files

### Environment Config

```typescript
import { config } from '@regulyn/config';

// API configuration
const apiUrl = config.api.baseUrl;
const timeout = config.api.timeout;

// Feature flags
const enableConsent = config.features.consent;
const enableDSAR = config.features.dsar;

// App configuration
const appName = config.app.name;
const version = config.app.version;
```

### Feature Flags

```typescript
import { featureFlags } from '@regulyn/config';

if (featureFlags.isEnabled('new-dashboard')) {
  // Show new dashboard
} else {
  // Show old dashboard
}
```

### Constants

```typescript
import { CONSTANTS } from '@regulyn/config';

// Pagination
const DEFAULT_PAGE_SIZE = CONSTANTS.pagination.defaultPageSize;

// Consent types
const CONSENT_TYPES = CONSTANTS.consent.types;

// DSAR types
const DSAR_TYPES = CONSTANTS.dsar.requestTypes;
```

## Environment Variables

### Admin Portal
```env
VITE_API_BASE_URL=https://api.regulyn.io
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=https://...
```

### Data Principal Portal
```env
VITE_API_BASE_URL=https://api.regulyn.io
VITE_APP_ENV=production
VITE_ENABLE_TRACKING=true
```

### Consent Widget
```env
VITE_API_BASE_URL=https://api.regulyn.io
VITE_CDN_URL=https://cdn.regulyn.io
```

## Theme Configuration

```typescript
import { theme } from '@regulyn/config';

// Colors
const primaryColor = theme.colors.primary;
const secondaryColor = theme.colors.secondary;

// Breakpoints
const mobileBreakpoint = theme.breakpoints.mobile;
const tabletBreakpoint = theme.breakpoints.tablet;
```

## API Endpoints

```typescript
import { endpoints } from '@regulyn/config';

// Identity endpoints
endpoints.identity.login;
endpoints.identity.logout;
endpoints.identity.refresh;

// Consent endpoints
endpoints.consent.list;
endpoints.consent.create;
endpoints.consent.update;

// DSAR endpoints
endpoints.dsar.submit;
endpoints.dsar.status;
endpoints.dsar.response;
```

## Validation

```typescript
import { validators } from '@regulyn/config';

// Environment validation
const env = validators.validateEnv(process.env);

// Config validation
const config = validators.validateConfig(rawConfig);
```

## Usage

```typescript
import { 
  config, 
  featureFlags, 
  CONSTANTS, 
  endpoints 
} from '@regulyn/config';

// Use in your app
const apiClient = createApiClient({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout
});

if (featureFlags.isEnabled('consent-v2')) {
  // Use new consent flow
}
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
