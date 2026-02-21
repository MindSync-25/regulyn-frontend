# Regulyn Platform Console

Super Admin UI for Regulyn platform operations and tenant management.

## Features (Parts 1–4)

- ✅ Authentication with JWT (POST /auth/login, GET /auth/me)
- ✅ Role-based access control (requires `REGULYN_SUPER_ADMIN`)
- ✅ Protected routing with auth guards
- ✅ Global error handling (401/403/409/422/5xx)
- ✅ Toast notifications
- ✅ Zustand state management with localStorage persistence
- ✅ Support Mode UX with session-scoped state and read-only guardrails
- ✅ Support Mode auditing (opt-in via env flag)

## Prerequisites

### Backend Services Required

The Platform Console requires the following backend service to be running:

1. **identity-tenant-service** (Port 8081)
   - Handles authentication (POST /auth/login)
   - Session validation (GET /auth/me)
   - Role verification

**Starting Backend:**
```bash
# Navigate to backend directory
cd ../../regulyn-backend/services/identity-tenant-service

# Run with Maven
mvn spring-boot:run

# Or with Docker Compose (from backend root)
cd ../../
docker-compose -f docker-compose.dev.yml up postgres redis kafka
cd services/identity-tenant-service
mvn spring-boot:run
```

### Environment Variables

Create a `.env` file in the root of platform-console:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_SUPPORT_AUDIT_ENABLED=false
VITE_SUPPORT_TENANT_AUDIT_ENABLED=false
VITE_SUPPORT_EVIDENCE_BUNDLES_ENABLED=false
```

**API Gateway Configuration:**
- The backend services are accessed through a unified base URL
- identity-tenant-service runs on port 8081
- API gateway (if configured) should proxy to individual services

## Installation

```bash
# From workspace root
cd apps/platform-console

# Install dependencies (using pnpm workspace)
pnpm install

# Copy environment file
cp .env.example .env

# Verify environment configuration
cat .env
```

## Development

```bash
# Start development server
pnpm dev

# The app will be available at:
# http://localhost:3001
```

## Testing Authentication

### Login Credentials

You need a user with `REGULYN_SUPER_ADMIN` role in the backend database.

**Create test super admin user in backend:**
```sql
-- Connect to regulyn database
-- Insert into users table (example - adjust based on your schema)
INSERT INTO users (email, password_hash, roles, tenant_id) 
VALUES (
  'admin@regulyn.io', 
  -- bcrypt hash for 'password123'
  '$2a$10$...',  
  '["REGULYN_SUPER_ADMIN"]',
  'some-tenant-uuid'
);
```

### Login Flow

1. Navigate to http://localhost:3001
2. You'll be redirected to `/login`
3. Enter credentials:
   - Email: `admin@regulyn.io`
   - Password: (your password)
4. On successful login with `REGULYN_SUPER_ADMIN` role:
   - JWT token stored in localStorage
   - Redirected to dashboard
   - Session persists on refresh
5. On login without required role:
   - Forbidden screen shown
   - Auto-logout triggered

### Error Scenarios

- **401 Unauthorized**: Invalid credentials or expired session → redirects to login
- **403 Forbidden**: Missing REGULYN_SUPER_ADMIN role → shows forbidden page
- **Network errors**: Toast notification shown
- **Session expiry**: Auto-logout with notification

## Architecture

### Authentication Flow

```
1. User visits / → ProtectedRoute checks auth status
2. No token → redirect to /login
3. User submits login form → POST /auth/login
4. Backend returns: { token, tenantId, userId, email, roles }
5. Check roles.includes('REGULYN_SUPER_ADMIN')
6. If missing → /forbidden page
7. If present → save to Zustand store + localStorage
8. On app bootstrap → GET /auth/me to validate token
9. Update auth state with fresh data
```

### Folder Structure

```
src/
├── app/
│   ├── App.tsx              # Root component
│   ├── routes.tsx           # Route configuration
│   └── providers/
│       └── QueryProvider.tsx
├── auth/
│   ├── authStore.ts         # Zustand store
│   ├── useAuth.ts           # Auth hook
│   ├── jwt.ts               # JWT decoder
│   ├── LoginPage.tsx
│   ├── ProtectedRoute.tsx   # Auth guard
│   └── RoleGuard.tsx        # Role guard
├── api/
│   ├── client.ts            # API client
│   └── errors.ts            # Error handling
├── layout/
│   ├── ConsoleLayout.tsx
│   ├── Sidebar.tsx
│   └── Topbar.tsx
├── pages/
│   ├── DashboardPlaceholder.tsx
│   └── NotFound.tsx
├── features/
│   ├── support-mode/
│   │   ├── SupportModePage.tsx
│   │   ├── TenantSupportHomePage.tsx
│   │   ├── store.ts
│   │   ├── types.ts
│   │   └── components/
│   └── ...
├── components/
│   ├── GlobalToaster.tsx
│   ├── FullPageError.tsx
│   └── Spinner.tsx
└── config/
    └── env.ts
```

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Login page |
| `/` | Protected | Dashboard (placeholder) |
| `/tenants` | Protected | Tenant management (placeholder) |
| `/platform-health` | Protected | System health monitoring (placeholder) |
| `/support-mode` | Protected | Support Mode entry (read-only) |
| `/support-mode/tenant/:tenantId` | Protected | Support Mode tenant workspace |
| `/global-audit` | Protected | Platform audit logs (placeholder) |
| `/forbidden` | Public | Access denied page |
| `*` | Public | 404 Not Found |

All protected routes require `REGULYN_SUPER_ADMIN` role.

## API Endpoints Used

### POST /auth/login
```json
Request:
{
  "email": "admin@regulyn.io",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "tenantId": "uuid",
  "userId": "uuid",
  "email": "admin@regulyn.io",
  "roles": ["REGULYN_SUPER_ADMIN"]
}
```

### GET /auth/me
```json
Headers:
Authorization: Bearer <token>

Response:
{
  "tenantId": "uuid",
  "userId": "uuid",
  "roles": ["REGULYN_SUPER_ADMIN"]
}
```

## Tech Stack

- **React 18** + TypeScript
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **Tailwind CSS** - Styling
- **Sonner** - Toast notifications

## Troubleshooting

### "Cannot connect to backend"
- Ensure identity-tenant-service is running on port 8081
- Check VITE_API_BASE_URL in .env
- Verify backend database is accessible

### "403 Forbidden" after login
- User doesn't have REGULYN_SUPER_ADMIN role
- Check user roles in database
- Verify JWT includes correct roles claim

### "Session expired" on refresh
- JWT token expired (check backend JWT_EXPIRATION_MS)
- Token not persisted correctly
- Clear localStorage and login again

### Red underlines in VS Code
- Run `pnpm install` from workspace root
- Reload VS Code window (Ctrl+Shift+P → "Reload Window")

## Support Mode

Support Mode is a privacy-sensitive, read-only workflow for cross-tenant troubleshooting. It is:

- Explicit to enter (requires tenant selection + reason)
- Read-only by default
- Audited on enter/exit/view actions (when enabled)
- Easy to exit with a global banner

### Auditing Enablement

Auditing is opt-in via environment flags. The UI **will not** probe endpoints.

```env
VITE_SUPPORT_AUDIT_ENABLED=true
```

When disabled, the UI shows: “Auditing endpoint not implemented.”

### Backend Endpoints Required

Support Mode reuses existing tenant detail and optionally exposes read-only tabs:

- Tenant Config (required):
  - GET /admin/platform/tenants/{tenantId}
- Tenant Audit Timeline (optional):
  - GET /admin/platform/tenants/{tenantId}/audit/events
  - Enable with: VITE_SUPPORT_TENANT_AUDIT_ENABLED=true
- Evidence Bundles (optional):
  - GET /admin/platform/tenants/{tenantId}/evidence/bundles
  - Enable with: VITE_SUPPORT_EVIDENCE_BUNDLES_ENABLED=true

If optional endpoints are not exposed, the UI shows placeholders and makes no calls.

## License

Proprietary - All rights reserved.
