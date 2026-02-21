# Part 6 — Incidents / Breach Module (Tenant Admin Portal)

Scope: Implement Incidents/Breach UI **only using existing backend endpoints and DTOs** (no invented endpoints/fields).

## What shipped

- Incidents list page with server pagination + supported filters
- Incident detail page with:
  - status transition
  - close incident (optionally including evidence IDs)
  - create task (create-only; no task list endpoint exists)
  - incident notification workflow (draft → approve/reject → send)
  - evidence drawer access + tenant audit timeline access

## RBAC / Routing

- Navigation item: **Incidents** → `/incidents`
- Routes are role-gated via `roles.ts` using:
  - `TENANT_ADMIN`, `DPO`, `REVIEWER`

Notes:
- Evidence bundles and audit events are backed by evidence-reporting-service endpoints that may enforce stricter roles (e.g., audit endpoint is documented as `TENANT_ADMIN` in the UI code). UI shows server errors (403) rather than hiding data.

## Exact backend endpoints used (no inventions)

### incident-breach-service (base URL used by UI)

- Local dev base URL used in UI: `http://localhost:8087`

List / view:
- `GET /incidents?status&severity&page&size`
- `GET /incidents/{incidentId}`

Create + workflow:
- `POST /incidents` (create incident)
- `POST /incidents/{incidentId}/transition`
- `POST /incidents/{incidentId}/close`
- `POST /incidents/{incidentId}/tasks`

Notification workflow (incident-scoped):
- `POST /incidents/{incidentId}/notifications/draft`
- `POST /incidents/{incidentId}/notifications/{notificationId}/approve`
- `POST /incidents/{incidentId}/notifications/{notificationId}/reject`
- `POST /incidents/{incidentId}/notifications/{notificationId}/send`

### evidence-reporting-service (used for Evidence Drawer + Audit Timeline)

These endpoints are used to provide Evidence/Audit visibility from the incident pages:

- `GET /admin/tenants/{tenantId}/evidence/bundles?page&size` (tenantId is sourced from authenticated UI context; not user-entered)
- `GET /admin/audit-events?page&size&userId&eventType`

## DTOs used (frontend mirrors backend)

Frontend types mirror the backend DTO shapes found in incident-breach-service:

- `IncidentDetailsResponse`
- `CreateIncidentRequest` / `CreateIncidentResponse`
- `TransitionRequest` / `TransitionResponse`
- `CloseIncidentRequest` / `CloseIncidentResponse`
- `CreateTaskRequest` / `CreateTaskResponse`
- `DraftNotificationRequest` / `DraftNotificationResponse`
- `ApproveNotificationRequest` / `ApproveNotificationResponse`
- `SendNotificationResponse`

## Supported filters / pagination

- List page implements **only** the filters supported by `GET /incidents`:
  - `status`
  - `severity`
  - `page`, `size`
- Search / date ranges / assignee filters are **not implemented** because no corresponding query params exist on the controller.

## Evidence & Audit behavior

- Evidence bundles are shown via the existing reusable Evidence Drawer.
- The drawer is optionally pre-pointed at `evidenceBundleId` if the incident has one.
- Audit timeline shown on the incident detail is tenant-level (`/admin/audit-events`); there is no incident-scoped audit endpoint, so the page provides an optional `eventType` filter input for narrowing.

## Known gaps (backend not exposing endpoints)

- No "list tasks" endpoint was found for an incident; UI supports **create task only**.
- No "list incident notifications" endpoint was found; UI supports:
  - draft (returns a `notificationId`)
  - then approve/reject/send using a pasted or freshly drafted `notificationId`
- notification-service has template/preference endpoints, but there is no confirmed linkage in incident-breach-service controllers/DTOs that would allow a correct UI integration without guessing.

## Files added/changed (frontend)

- Added incident-breach API wrapper: `apps/tenant-admin-portal/src/lib/api/incidentBreach.ts`
- Added pages:
  - `apps/tenant-admin-portal/src/pages/incidents/IncidentsListPage.tsx`
  - `apps/tenant-admin-portal/src/pages/incidents/IncidentDetailPage.tsx`
- Updated routing to replace placeholder:
  - `apps/tenant-admin-portal/src/app/router.tsx`
