# @regulyn/api-client

Type-safe API client for Regulyn backend services.

## Purpose
- Centralized API client for all backend services
- TypeScript types for API requests/responses
- Request/response interceptors
- Error handling
- Retry logic
- Authentication integration

## Tech Stack
- TypeScript
- Axios
- OpenAPI TypeScript codegen
- Zod (runtime validation)

## Services

### Identity & Tenant Service
- User authentication
- Tenant management
- Role management

### Consent Service
- Consent creation
- Consent updates
- Consent retrieval

### DSAR Service
- DSAR request submission
- Request status tracking
- Response retrieval

### ROPA Service
- Processing activity management
- Data inventory

### Incident Service
- Incident reporting
- Breach notifications

## Usage

```typescript
import { apiClient } from '@regulyn/api-client';

// Authenticate
await apiClient.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Fetch consents
const consents = await apiClient.consent.getConsents({
  userId: 'user-id',
  page: 0,
  size: 20
});

// Submit DSAR
const dsar = await apiClient.dsar.submitRequest({
  type: 'ACCESS',
  description: 'I want my data'
});
```

## Configuration

```typescript
import { createApiClient } from '@regulyn/api-client';

const client = createApiClient({
  baseURL: 'https://api.regulyn.io',
  timeout: 30000,
  retries: 3
});
```

## Error Handling

```typescript
try {
  await apiClient.consent.getConsent('id');
} catch (error) {
  if (error.isNetworkError) {
    // Handle network error
  } else if (error.status === 404) {
    // Handle not found
  }
}
```

## Development

```bash
npm install
npm run dev
npm run generate-types
```

## Type Generation

```bash
npm run generate-types
```

Generates TypeScript types from OpenAPI specs.
