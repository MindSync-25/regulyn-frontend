# @regulyn/auth

Authentication and authorization utilities.

## Purpose
- JWT token management
- User session handling
- Role-based access control (RBAC)
- Permission checking
- Auth state management
- OAuth2/OIDC integration

## Tech Stack
- TypeScript
- JWT decode
- Zustand (state)
- React hooks

## Features

### Authentication
- Login/logout
- Token refresh
- Session persistence
- Auto-logout on expiry

### Authorization
- Role checking
- Permission validation
- Route guards
- Component-level access control

### Security
- Secure token storage
- CSRF protection
- XSS protection

## Usage

### Auth Provider

```typescript
import { AuthProvider } from '@regulyn/auth';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### useAuth Hook

```typescript
import { useAuth } from '@regulyn/auth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onSubmit={login} />;
  }

  return <div>Welcome {user.name}</div>;
}
```

### Permission Checking

```typescript
import { usePermission } from '@regulyn/auth';

function AdminPanel() {
  const canManageUsers = usePermission('users:manage');

  if (!canManageUsers) {
    return <AccessDenied />;
  }

  return <UserManagement />;
}
```

### Route Guards

```typescript
import { ProtectedRoute } from '@regulyn/auth';

<ProtectedRoute
  path="/admin"
  component={AdminDashboard}
  requiredRoles={['admin', 'super-admin']}
  requiredPermissions={['dashboard:view']}
/>
```

## Roles

- `super-admin` - Full system access
- `admin` - Tenant administrator
- `dpo` - Data Protection Officer
- `user` - Regular user
- `data-principal` - End user (data subject)

## Permissions

- `users:manage` - Manage users
- `consents:manage` - Manage consents
- `dsar:process` - Process DSAR requests
- `reports:view` - View reports
- `incidents:manage` - Manage incidents

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
