# PART 7 — Consent & Notification Preferences (Tenant Admin Portal)

This deliverable implements **PART 7 ONLY**, adding Consent & Preferences UI to the Tenant Admin Portal, **strictly using existing backend endpoints** from:
- **consent-service** (`http://localhost:8083`)
- **notification-service** (`http://localhost:8092`)

No backend endpoints were invented.

---

## 1) Routes & Navigation

### Routes (React Router)
Implemented under `/consent/*`:
- `/consent/notices` — Notice templates (capability-aware)
- `/consent/notices/:templateId` — Notice operations for a specific `noticeId`
- `/consent/ledger` — Communication consent “ledger” viewer (read-only)
- `/consent/purposes` — Purpose history (disabled: backend missing list/history endpoints)
- `/consent/reconsent` — Re-consent dashboard (disabled: backend endpoints not found)

Default redirect:
- `/consent` → `/consent/notices`

### Sidebar Navigation
Updated Consent navigation to:
- Consent → `/consent/notices`
- Child links: Notices, Ledger, Purposes, Re-consent

Files:
- Router: apps/tenant-admin-portal/src/app/router.tsx
- Navigation: apps/tenant-admin-portal/src/config/navigation.ts

---

## 2) RBAC (RoleGuard + action gating)

Route-level access for the Consent module:
- Allowed roles: `TENANT_ADMIN`, `DPO`, `OPERATOR`

Write operations on consent notices are additionally gated in-page:
- Allowed roles: `TENANT_ADMIN`, `DPO`

Role strings are sourced from `apps/tenant-admin-portal/src/lib/auth/roles.ts` (no new role names introduced).

---

## 3) API Wrappers (existing endpoints only)

### consent-service wrapper
File: apps/tenant-admin-portal/src/lib/api/consent.ts
Base URL: `http://localhost:8083`

Endpoints used by the UI:
- **Active Notice Lookup**
  - `GET /api/v2/consent/notices/active?purpose={purpose}&language={language}`
  - `GET /api/v2/consent/notices/active-dual?purpose={purpose}&region={region}`

- **Notice Write Operations**
  - `POST /api/v2/consent/notices`
  - `POST /api/v2/consent/notices/{noticeId}/versions`
  - `POST /api/v2/consent/notices/{noticeId}/versions/{versionId}/languages`
  - `POST /api/v2/consent/notices/{noticeId}/versions/{versionId}/publish`

- **Purpose active version lookup**
  - `GET /api/v2/consent/notices/{noticeId}/purposes/{purposeKey}/active-version`

- **Consent receipts (read-only viewer)**
  - `GET /api/v2/consent/consents?dataPrincipalId={id}&purpose={purpose?}`

- **Communication consent status (read-only viewer)**
  - `GET /api/v2/consent/communication/channels/{channel}/status?dataPrincipalId={id}`
  - `POST /api/v2/consent/communication/batch/status`

### notification-service wrapper
File: apps/tenant-admin-portal/src/lib/api/notificationOps.ts
Base URL: `http://localhost:8092`

Endpoint used by the UI:
- **Notification preferences (read-only viewer)**
  - `GET /api/notifications/preferences/{dataPrincipalId}`

---

## 4) Pages Delivered

### Notices
- apps/tenant-admin-portal/src/pages/consent/NoticeTemplatesListPage.tsx
  - Capability-aware UI: consent-service does **not** expose notice template list/detail read endpoints.
  - Implements:
    - Active notice lookup (purpose + language)
    - Active dual notice lookup (purpose + region)
    - Create notice / create version / add language / publish (write ops), gated to `TENANT_ADMIN` + `DPO`

- apps/tenant-admin-portal/src/pages/consent/NoticeTemplateDetailPage.tsx
  - Capability-aware UI for a noticeId from the URL (`:templateId` treated as `noticeId`).
  - Implements:
    - Create version / add language / publish (write ops), gated to `TENANT_ADMIN` + `DPO`
    - Active purpose version lookup

### Ledger (read-only)
- apps/tenant-admin-portal/src/pages/consent/CommunicationLedgerPage.tsx
  - Implements:
    - Communication consent status (single)
    - Communication consent status (batch)
    - Consent receipts viewer
    - Notification preferences viewer

### Purposes + Re-consent (capability-gated)
- apps/tenant-admin-portal/src/pages/consent/PurposesHistoryPage.tsx
- apps/tenant-admin-portal/src/pages/consent/ReconsentDashboardPage.tsx

These remain “Not available” because list/history/re-consent endpoints were not found in the current backend controller inventory.

---

## 5) Evidence & Audit Visibility

Each Consent page includes an **Evidence & Audit** action that opens the existing Evidence drawer UI.

Important note:
- Some backend responses include explicit evidence identifiers (e.g., communication consent status includes `ledgerId`, and some consent/communication DTOs include evidence fields).
- Where the backend does not return an evidence artifact ID for an operation, the UI uses a stable object-type/object-id placeholder to keep evidence/audit access present without inventing backend calls.

---

## 6) Error Handling

- All new Consent pages render errors via `UserFacingErrorPanel`.
- The centralized error mapper (`getUserFacingError`) avoids showing internal error codes to users and provides actionable remediation (Refresh / Go to Login for tenant-context issues).

---

## 7) Capability Gaps (backend-driven)

The UI explicitly gates/labels features as unavailable when endpoints do not exist, including:
- Listing notice templates / template details / listing versions / listing languages
- Purpose catalog + purpose version history browsing
- Re-consent dashboard aggregation endpoints

If/when the backend exposes these endpoints, the UI can be extended without changing the existing contract.
