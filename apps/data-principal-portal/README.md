# Data Principal Portal

Self-service portal for data subjects (end users).

## Purpose
- User-facing portal for data subjects
- View and manage personal data
- Grant/revoke consent
- Submit DSAR requests
- Track request status
- Manage nominees and guardians
- Privacy preferences

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
- **My Data**: View personal data collected
- **Consent Management**: Manage consent preferences
- **DSAR Requests**: Submit access, correction, deletion requests
- **Privacy Dashboard**: Data usage transparency
- **Nominee Management**: Designate nominees for data access
- **Guardian Consent**: Parental consent for minors
- **Notification Preferences**: Communication settings

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
Development: `http://localhost:3001`
