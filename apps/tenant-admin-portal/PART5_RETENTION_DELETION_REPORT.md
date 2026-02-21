# PART 5 ONLY — Retention Rules + Deletion Requests (Tenant Admin Portal)

Scope: **ONLY** Part 5 UI for Retention + Deletion operations, using **existing backend controllers only**.

## What shipped

### Retention Rules
- Retention rules list
- Create retention rule
- Disable retention rule
- Evidence entry point for each rule

### Deletion Requests
- Deletions list (server-side pagination)
- Create deletion request (idempotent)
- Deletion detail view
- Actions: assign, approve/reject, transition, cascade-execute (idempotent), upload proof (multipart), close
- Evidence + Audit entry points

### Connector service (read-only)
- Connectors list + detail (filters supported by backend)
- Graceful messaging for 403 (connector-service role requirements)

## Routes
- `/retention/rules`
- `/retention/deletions`
- `/retention/deletions/:deletionId`
- `/retention/connectors`
- `/retention/connectors/:connectorId`

## Exact backend endpoints used (no inventions)

### retention-deletion-service (baseUrl: `http://localhost:8086`)
Retention rules:
- `GET /retention/rules`
- `POST /retention/rules`
- `POST /retention/rules/{ruleId}/disable`

Deletion workflows:
- `GET /deletions?status&page&size` (UI uses only `status` filter; pagination is server-side)
- `POST /deletions` (UI always sends `X-Idempotency-Key`)
- `GET /deletions/{id}`
- `POST /deletions/{id}/assign`
- `POST /deletions/{id}/approve`
- `POST /deletions/{id}/transition`
- `POST /deletions/{id}/cascade-execute` (**UI enforces idempotency** via `X-Idempotency-Key`)
- `POST /deletions/{id}/proofs` (multipart upload)
- `POST /deletions/{id}/close` (may surface 503 if evidence service unavailable)

### connector-service (baseUrl: `http://localhost:8093`)
- `GET /connectors?status&type&q`
- `GET /connectors/{connectorId}`

### Evidence / Audit (existing UI primitives)
- Evidence drawer uses the existing Evidence Center integrations.
- Audit uses the existing tenant audit endpoint: `GET /admin/audit-events` (tenant-scoped).

## Tenant scoping + headers
- Tenant scope is derived from authenticated context only.
- To support backend controllers that expect different capitalization, the client sends both header variants:
  - `X-Tenant-Id` **and** `X-Tenant-ID`
  - `X-User-Id` **and** `X-User-ID`
- A strict tenant mismatch guard remains enforced client-side (forced logout on mismatch).

## RBAC (UI gating)
- Module access: `TENANT_ADMIN`, `DPO`, `OPERATOR` (plus `CONNECTOR_AGENT` for connector pages).
- Action-level gating:
  - Operate (assign/transition/cascade/close/upload proof): `TENANT_ADMIN | DPO | OPERATOR`
  - Approve/Reject: `TENANT_ADMIN | DPO | REVIEWER`
  - Audit view: `TENANT_ADMIN | DPO | AUDITOR`

## Pagination + filters
- Deletions list uses server paging (`page`, `size`) and **only** the backend-supported filter: `status`.
- Connector list uses only backend-supported filters: `status`, `type`, `q`.

## Idempotency
- `POST /deletions` always includes `X-Idempotency-Key` (generated client-side).
- `POST /deletions/{id}/cascade-execute` requires `X-Idempotency-Key`; UI exposes it (persist/retry) and can regenerate.

## Limitations / intentionally not implemented
- No attempt to implement filters not exposed by controllers (e.g., date range/system/requester) for deletions.
- Cascade execution status is shown from the latest `cascade-execute` response returned in the current UI session; no GET endpoint was discovered to rehydrate cascade execution history.
- Advanced deletion endpoints discovered but not wired into UI in Part 5 pages:
  - System exceptions grant
  - Manual proof request/submit/decide
  - Tombstones create/remove
  - Retention candidates
- Connector-service may return 403 unless the user has backend-required roles (`CONNECTOR_AGENT` or backend `ADMIN`).

## Files added/updated
- `src/lib/api/retentionDeletion.ts`
- `src/lib/api/connectors.ts`
- `src/pages/retention/RetentionRulesPage.tsx`
- `src/pages/retention/DeletionsListPage.tsx`
- `src/pages/retention/DeletionDetailPage.tsx`
- `src/pages/retention/ConnectorsListPage.tsx`
- `src/pages/retention/ConnectorDetailPage.tsx`
- `src/app/router.tsx`
- `src/config/navigation.ts`
- `src/lib/api/http.ts`
