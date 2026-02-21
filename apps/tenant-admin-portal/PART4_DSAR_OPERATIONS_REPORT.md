# Part 4 — DSAR Operations (Tenant Admin Portal)

This implements **Part 4 ONLY** for the Tenant Admin Portal: DSAR inbox + DSAR detail, powered by **dsar-grievance-service**.

Local dev base URL (from backend README): `http://localhost:8084`

## What was added

### Routes

- `/dsar` → redirects to `/dsar/inbox`
- `/dsar/inbox` → DSAR inbox list
- `/dsar/:dsarId` → DSAR detail

Router wiring: `src/app/router.tsx`

### Navigation

- DSAR nav now points to `/dsar/inbox` and is visible to: `TENANT_ADMIN`, `DPO`, `OPERATOR`, `REVIEWER`.

Navigation config: `src/config/navigation.ts`

## Backend endpoints used (no invented endpoints)

### Inbox list (server-side)

- `GET /dsar?page&size&status&requestType&dataPrincipalId`
  - **Server-side pagination**: `page`, `size`
  - **Server-side filters (real backend query params)**: `status`, `requestType`, `dataPrincipalId`
  - Note: when no filters are set, the request will look like:
    - `GET http://localhost:8084/dsar?page=0&size=20`
  - If the inbox is empty for a tenant/environment: Create at least one DSAR using your DSAR intake flow / creation endpoint(s) available in the backend (environment-specific), or seed data for local development.

### Detail (server-side)

- `GET /dsar/{dsarId}`

### Workflow actions (server-side)

- `POST /dsar/{dsarId}/assign`
- `POST /dsar/{dsarId}/transition`
- `POST /dsar/{dsarId}/approve`
- `POST /dsar/{dsarId}/close` (supports `X-Idempotency-Key`)
  - Returns `{ dsarId, status, evidenceBundleId }` (bundle id may be `null` depending on backend behavior)

### Attachments (server-side)

- `GET /dsar/{dsarId}/attachments`
- `POST /dsar/{dsarId}/attachments/reference` (supports `X-Idempotency-Key`)
- `POST /dsar/{dsarId}/attachments/upload` (multipart)

## Server-side vs UI-only behavior

### Server-side (backed by endpoints)

- Inbox pagination (`page`/`size`) and filtering (`status`, `requestType`, `dataPrincipalId`).
- Detail fetch + attachments list/upload/reference.
- Assign / transition / approve / close actions.

### UI-only (no backend support discovered)

- Priority / assignee-name search / SLA bucket/date range filters are **not implemented** because dsar-grievance-service does not expose query params for these.
- “Milestones” panel in DSAR detail is derived from timestamps present on the DSAR record (e.g. `createdAt`, `dueAt`, `approvedAt`, `closedAt`) and does **not** claim to be a full status history.
- DSAR status history timeline is not shown because no `/dsar/{id}/history` endpoint/controller was found.

## Frontend files

### API wrappers

- `src/lib/api/http.ts`
  - Enhanced to support optional per-request `baseUrl` overrides while keeping the same auth + tenant header injection, tenant-mismatch guard, and error handling.
- `src/lib/api/dsar.ts`
  - Typed wrappers for all DSAR + attachment endpoints listed above.
  - Uses the shared `http` client for JSON endpoints.
  - Uses `fetch` for multipart upload, mirroring the shared client’s 401/403/409/422/5xx behavior and enforcing the same tenant-mismatch safety guard.

### Pages

- `src/pages/dsar/DsarInboxPage.tsx`
  - Server-side pagination (`page`, `size`) via backend.
  - Filters implemented only where backend supports them: `status`, `requestType`, `dataPrincipalId`.
  - SLA badge based on `dueAt` + `slaBreached`.
  - Row click navigates to DSAR detail.

- `src/pages/dsar/DsarDetailPage.tsx`
  - Shows DSAR metadata (assignee, due date, SLA breached, approval fields, closure fields).
  - Attachments list + upload + reference.
  - Workflow actions: assign, transition, approve/reject (only shown when `requiresApproval=true` and role is in `TENANT_ADMIN|DPO|REVIEWER`), close (idempotent).
  - Evidence integration:
    - Shows `closeEvidenceBundleId` when present.
    - Provides a link to `/evidence/bundles/{bundleId}`.
    - Provides an Evidence Drawer entry point for quick context.
  - Audit visibility:
    - Shows an audit dialog (tenant audit events) only for roles `TENANT_ADMIN|DPO|AUDITOR`.
    - Note: no DSAR-scoped audit endpoint was found in dsar-grievance-service controllers; the UI uses the existing tenant audit events endpoint with an optional `eventType` filter.

## Tenant scoping & security

- **No tenantId is passed as a query param or path param** for DSAR endpoints.
- Multi-tenancy uses the authenticated context headers. The frontend injects tenant headers from auth state only.
- For DSAR JSON endpoints, tenant scoping is enforced by the shared HTTP client.
- For DSAR multipart uploads, the upload function mirrors the same guard:
  - If `X-Tenant-Id` would ever differ from the authenticated tenant, the client force-logs out and redirects to `/login?error=tenant_mismatch`.

## RBAC

- Route and nav gating uses the role constants from `src/lib/auth/roles.ts` (case-sensitive backend match).
- DSAR module pages are accessible to: `TENANT_ADMIN`, `DPO`, `OPERATOR`, `REVIEWER`.
- This is enforced at the **route level** (not only nav visibility).
- Approve/Reject controls are further gated in the UI:
  - shown only when `requiresApproval=true`
  - and role is one of `TENANT_ADMIN`, `DPO`, `REVIEWER`
- Audit dialog is shown only for `TENANT_ADMIN`, `DPO`, `AUDITOR`.

## Limitations (backend-driven)

- Inbox filters are limited to what the backend currently supports: `status`, `requestType`, `dataPrincipalId`.
- DSAR status history/timeline is not available as a first-class backend endpoint (no `/dsar/{id}/history` controller was found), so the UI cannot show an authoritative transition timeline.
- DSAR-scoped audit events are not available via a DSAR service endpoint; the UI uses tenant audit events with `eventType` filtering.
