# Regulyn Tenant Admin Portal — Developer README

> **App**: `tenant-admin-portal` (Vite + React 18 + TypeScript + TailwindCSS)  
> **Port**: 3002 (dev server)  
> **Last updated**: Part 10 — Final Polish & Evidence/Audit Coverage

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Backend Services (local ports)](#backend-services-local-ports)
4. [Role Matrix](#role-matrix)
5. [Evidence & Audit Coverage Map](#evidence--audit-coverage-map)
6. [Known Backend Limitations](#known-backend-limitations)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Accessibility Notes](#accessibility-notes)

---

## Quick Start

```bash
# From monorepo root
cd regulyn-frontend
pnpm install

# Run admin portal only
pnpm --filter tenant-admin-portal dev
```

The app starts at **http://localhost:3002**.

---

## Environment Variables

Create `apps/tenant-admin-portal/.env.local` (never commit):

```env
# Required — Backend service base URLs
VITE_IDENTITY_SERVICE_URL=http://localhost:8081
VITE_DSAR_SERVICE_URL=http://localhost:8082
VITE_EVIDENCE_SERVICE_URL=http://localhost:8083
VITE_CONSENT_SERVICE_URL=http://localhost:8084
VITE_ROPA_SERVICE_URL=http://localhost:8085
VITE_RETENTION_SERVICE_URL=http://localhost:8086
VITE_INCIDENT_SERVICE_URL=http://localhost:8087
VITE_NOMINEE_SERVICE_URL=http://localhost:8088
VITE_CHILDREN_SERVICE_URL=http://localhost:8089
VITE_VENDOR_SERVICE_URL=http://localhost:8090
VITE_EMPLOYEE_SERVICE_URL=http://localhost:8091
VITE_NOTIFICATION_SERVICE_URL=http://localhost:8092
VITE_SCANNER_SERVICE_URL=http://localhost:8094

# Optional
VITE_APP_ENV=local
```

> **Note**: All variables must be prefixed `VITE_` to be exposed to the browser bundle.  
> See `src/config/env.ts` for the full mapping.

---

## Backend Services (local ports)

| Service | Port | Spring Profile |
|---------|------|----------------|
| identity-tenant-service | **8081** | `local` |
| dsar-grievance-service | **8082** | `local` |
| evidence-reporting-service | **8083** | `local` |
| consent-service | **8084** | `local` |
| ropa-inventory-service | **8085** | `local` |
| retention-deletion-service | **8086** | `local` |
| incident-breach-service | **8087** | `local` |
| nominee-service | **8088** | `local` |
| children-guardian-service | **8089** | `local` |
| vendor-sharing-service | **8090** | `local` |
| employee-data-service | **8091** | `local` |
| notification-service | **8092** | `local` |
| scanner-service | **8094** | `local` |

### Starting a Service (PowerShell)

```powershell
cd services/<service-name>
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

> **Important**: Quote the `-D` flag in PowerShell to prevent argument splitting.

### Docker Compose (Infra)

```bash
cd regulyn-backend
docker-compose -f docker-compose.dev.yml up -d
```

This starts Postgres (5433), Redis, and Kafka for local development.

---

## Role Matrix

| Module | TENANT_ADMIN | DPO | REVIEWER | OPERATOR | AUDITOR |
|--------|:---:|:---:|:---:|:---:|:---:|
| Identity — Users | ✅ | ✅ | — | — | 👁 |
| Identity — API Keys | ✅ | — | — | — | — |
| Identity — Audit Explorer | ✅ | ✅ | — | — | ✅ |
| DSAR — Inbox | ✅ | ✅ | ✅ | ✅ | 👁 |
| DSAR — Actions (assign/approve/close) | ✅ | ✅ | ✅ | ✅ | — |
| Incidents — List | ✅ | ✅ | ✅ | ✅ | 👁 |
| Incidents — Actions (transition/close) | ✅ | ✅ | — | ✅ | — |
| Retention — Rules | ✅ | ✅ | — | ✅ | 👁 |
| Retention — Deletion Actions | ✅ | ✅ | ✅ | ✅ | 👁 |
| Governance — ROPA | ✅ | ✅ | ✅ | — | 👁 |
| Governance — Vendors | ✅ | ✅ | — | — | 👁 |
| Governance — Scanner | ✅ | ✅ | — | — | 👁 |
| HR — Rules / Data Records | ✅ | ✅ | — | ✅ | 👁 |
| HR — Exits (requests) | ✅ | ✅ | ✅ | ✅ | — |
| HR — Exports | ✅ | ✅ | — | ✅ | — |
| HR — Nominees | ✅ | ✅ | — | — | — |
| HR — Children / Age Rules | ✅ | ✅ | — | ✅ | — |
| HR — eSign / Majority | ✅ | ✅ | — | ✅ | — |
| Evidence — Bundles | ✅ | ✅ | ✅ | — | ✅ |
| Consent — Notices & Purposes | ✅ | ✅ | ✅ | — | 👁 |

**Legend**: ✅ Full access · 👁 Read-only · — No access

> RBAC constants are in `src/lib/auth/roles.ts`. All role checks use `useHasAnyRole([ROLES.X, ...])`.

---

## Evidence & Audit Coverage Map

The `EvidenceDrawer` (right-side panel) and `AuditTimeline` (inside it) are available on the following pages via the **🔍 Evidence / Audit** button:

### Fully Wired (EvidenceDrawer opens, queries evidence-reporting-service)

| Page | Object Type | Notes |
|------|-------------|-------|
| `DsarDetailPage` | `DSAR` | Includes objectId + bundleId |
| `DeletionDetailPage` | `DELETION` | Full wiring with proof upload |
| `IncidentDetailPage` | `INCIDENT` | Wired; notifications sub-actions included |
| `RopaDetailPage` | `ROPA_ACTIVITY` | Read-only viewer |
| `VendorDetailPage` | `VENDOR` | Read-only viewer |
| `ScanRunDetailPage` | `SCAN_RUN` | Includes create-bundle action |
| **HRExitsPage** | `EMPLOYEE_REQUEST` | Part 10 |
| **HRExportsPage** | `EMPLOYEE_EXPORT` | Part 10 |
| **HRRulesPage** | `HR_PURPOSE` | Part 10 |
| **HRAccessLogsPage** | `EMPLOYEE_DATA_RECORD` | Part 10 |
| **NomineesPage** | `NOMINEE` | Part 10 |
| **NomineeDetailPage** | `NOMINEE_CLAIM` | Part 10; objectId = claimId |
| **AgeRulesPage** | `AGE_RULE` | Part 10 |
| **ESignPage** | `CHILD_CONSENT` | Part 10; objectId = consentId when available |
| **MajorityPage** | `CHILD_MAJORITY_CHECK` | Part 10 |
| **ApiKeysListPage** | `API_KEY` | Part 10 |

### Placeholder (button exists, evidence service returns empty/503)

> These pages show the drawer but evidence-reporting-service (port 8083) may not have indexed their objects yet. This is an **integration gap**, not a UI bug.

- All HR & Children pages — evidence bundles are created by employee-data-service and children-guardian-service via outbox events; indexing into evidence-reporting-service is a backend concern.

---

## Known Backend Limitations

| Limitation | Affected Page(s) | Notes |
|------------|-----------------|-------|
| No `GET /api-keys` list endpoint | `ApiKeysListPage` | Only create/rotate/revoke available; list requires new backend endpoint |
| No `GET /vendors/:id` endpoint | `VendorDetailPage` | Fetches full list and filters client-side |
| No `GET /nominees` list endpoint | `NomineesPage` | Lookup by UUID only |
| evidence-reporting-service (8083) not always running | All EvidenceDrawer pages | Bundles show empty when service is down; shows friendly error |
| Nominee service uses internal role strings ("ADMIN") | `NomineesPage`, `NomineeDetailPage` | Backend 403 unless backend role matches |
| `@RequestParam` no `-parameters` compiler flag | employee-data-service | All `@RequestParam` must have explicit `name=` attribute |
| Export 503 when evidence service unavailable | `HRExportsPage` | Export runs but evidence bundle creation may fail |
| Audit timeline scoped to tenant only | `EvidenceDrawer` (Audit tab) | Cannot filter by objectId; returns all tenant events |

---

## Error Handling Patterns

### `getUserFacingError(err)` — Centralized error mapper

Location: `src/lib/api/errorMessages.ts`

Maps HTTP status codes and internal error codes to friendly UI messages:

| Code / Error | Friendly Title | Actions |
|---|---|---|
| `TENANT_CONTEXT_REQUIRED` | "Tenant context not available" | Refresh / Go to Login |
| 401 | "Sign-in required" | Go to Login / Refresh |
| 403 | "Access denied" | Refresh |
| 5xx | "Something went wrong" | Refresh |
| Other | "Unable to load data" | Refresh |

### `UserFacingErrorPanel` component

Location: `src/components/shared/UserFacingErrorPanel.tsx`

```tsx
<UserFacingErrorPanel error={queryError} />
```

Use this instead of raw error message rendering on all list/detail page error states.

### `ErrorState` component

Location: `src/components/error/ErrorState.tsx`

Use for full-page error states (e.g., when a detail page cannot load its primary resource):

```tsx
<ErrorState
  title="Failed to load DSAR"
  message="The DSAR could not be loaded. Please try again."
  onRetry={() => query.refetch()}
/>
```

---

## Accessibility Notes

Improvements applied in Part 10:

- **EvidenceDrawer** (`components/evidence/EvidenceDrawer.tsx`):
  - `role="dialog"` + `aria-modal="true"` on drawer panel
  - Escape key closes the drawer
  - Focus auto-moves to close button on open
  - Tab buttons have `role="tab"` + `aria-selected` + `aria-controls`
  - Icons are `aria-hidden="true"`

- **AuditTimeline** (`components/evidence/AuditTimeline.tsx`):
  - Expand/collapse buttons have `aria-label`
  - Human view / Raw JSON toggle has `aria-label`
  - Human view default — no raw JSON initially shown to reduce noise

- **All Evidence/Audit buttons** across HR + Identity pages:
  - `type="button"` (prevent accidental form submit)
  - `aria-label="Open evidence and audit drawer"`
  - Hover state added (`hover:bg-accent`)

- **Form inputs** in existing pages: `id`/`htmlFor` labels already present in most pages (standard from earlier parts).

- **Color contrast**: Status badges use Tailwind color pairs verified for WCAG AA contrast (e.g., `bg-green-100 text-green-900`, `bg-red-100 text-red-900`).
