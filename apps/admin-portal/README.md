# Admin Portal

Administrative interface for DPDP compliance management.

## Purpose
- Comprehensive admin dashboard for compliance teams
- Manage organizations, users, and roles
- Configure consent workflows and policies
- Monitor DSAR requests and incidents
- Generate compliance reports
- Vendor and data sharing management

## Tech Stack
- React 18
- TypeScript
- Vite
- React Router
- TanStack Query (React Query)
- Zustand (state management)
- TailwindCSS
- Shadcn UI

## Features
- **Identity & Tenant Management**: Multi-tenant configuration
- **Consent Management**: Consent templates, lifecycle tracking
- **ROPA Management**: Record of processing activities
- **DSAR Processing**: Request management and workflows
- **Incident Management**: Breach reporting and tracking
- **Reporting & Analytics**: Compliance dashboards
- **User Management**: Role-based access control

## Dependencies
- `@regulyn/ui` - Shared component library
- `@regulyn/api-client` - Backend API client
- `@regulyn/auth` - Authentication utilities
- `@regulyn/i18n` - Internationalization
- `@regulyn/config` - Shared configuration

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Port
Development: `http://localhost:3000`
