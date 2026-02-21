# Regulyn Tenant Admin Portal - PART 1 Implementation Blueprint

## Backend Contract Summary

### Auth Endpoints
```typescript
// POST /auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  tenantId: string;
  userId: string;
  email: string;
  roles: string[]; // Exact role strings from backend
}

// GET /auth/me
interface MeResponse {
  tenantId: string;
  userId: string;
  roles: string[]; // Source of truth for RBAC
}
```

### Tenant Roles (from backend analysis)
- TENANT_ADMIN
- COMPLIANCE_OFFICER
- DATA_PROTECTION_OFFICER
- PRIVACY_MANAGER
- IT_ADMIN
- EMPLOYEE
- AUDITOR

## Implementation Checklist

### ✅ Step 1: Project Setup
- [x] package.json created
- [ ] tsconfig.json
- [ ] vite.config.ts
- [ ] tailwind.config.js
- [ ] postcss.config.js
- [ ] index.html
- [ ] .env

### Step 2: Core Configuration Files

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

**.env**
```
VITE_API_BASE_URL=/api
```

### Step 3: File Structure
```
apps/tenant-admin-portal/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── app/
│   │   ├── AppProviders.tsx        # All providers wrapper
│   │   ├── router.tsx              # Route definitions
│   │   └── queryClient.ts          # TanStack Query config
│   ├── config/
│   │   └── env.ts                  # Env validation
│   ├── store/
│   │   └── authStore.ts            # Zustand auth + tenant state
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── tenant.ts           # Tenant resolver + validator
│   │   │   └── roles.ts            # Role constants + helpers
│   │   └── api/
│   │       ├── http.ts             # HTTP client with auth/tenant injection
│   │       └── endpoints/
│   │           └── auth.ts         # Auth API calls
│   ├── components/
│   │   ├── auth/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RoleGuard.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── navConfig.ts
│   │   └── common/
│   │       ├── StandardDataTable.tsx
│   │       ├── AppErrorBoundary.tsx
│   │       ├── ErrorState.tsx
│   │       └── ForbiddenState.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── HomePage.tsx
│   │   └── ModulePlaceholderPage.tsx
│   └── index.css
```

### Step 4: Critical Implementation Files

I'll create a separate document for each critical file...

## Next Steps

Run this command to install dependencies once all files are created:
```bash
cd apps/tenant-admin-portal
pnpm install
pnpm run dev
```

## Security Checklist
- [ ] Tenant ID never user-editable
- [ ] Tenant ID from JWT only
- [ ] X-Tenant-Id header equals auth tenantId
- [ ] Runtime tenant mismatch => logout
- [ ] Exact role strings from /auth/me
- [ ] 401 => clear session + redirect /login
- [ ] 403 => ForbiddenState component
- [ ] Role guards on routes
- [ ] Role-aware sidebar
