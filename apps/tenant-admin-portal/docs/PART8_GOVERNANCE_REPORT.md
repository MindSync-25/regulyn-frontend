# Part 8 — Governance Module Implementation Report

## Overview

Part 8 implements the **Governance** module for the Regulyn Tenant Admin Portal.
It covers three backend services and seven UI pages, all mounted under `/governance/*`.

---

## 1. Backend Services & Endpoints Used

### 1.1 ROPA Inventory Service — port `8085`

| Method | Path | Used By | Notes |
|--------|------|---------|-------|
| GET | `/activities` | RopaListPage | Spring Page, server-side pagination. Supports `status`, `riskLevel`, `lawfulBasis`, `q`, `page`, `size`. |
| GET | `/activities/:activityId` | RopaDetailPage | Returns `Map<String,Object>` — typed as `Record<string,unknown>`. |
| GET | `/systems` | (ref) | System registry — not currently surfaced in UI. |
| GET | `/data-categories` | (ref) | Category registry — not currently surfaced in UI. |
| POST | `/exports/ropa` | RopaListPage | Trigger ROPA PDF export. Response includes `exportId`. |
| GET | `/cross-border/transfers` | RopaDetailPage | Filtered by `activityId`. |

### 1.2 Vendor Sharing Service — port `8090`

| Method | Path | Used By | Notes |
|--------|------|---------|-------|
| GET | `/vendor/vendors` | VendorListPage, VendorDetailPage, dropdowns | Returns `List` (no pagination). Client-side filtering applied. |
| GET | `/vendor/vendors/:id/agreements` | VendorDetailPage | Returns `List` of DPAs. |
| GET | `/vendor/sharing-records` | SharingLogsPage | Spring Page. Supports `vendorId`, `transferCrossBorder`, `enabled`, `page`, `size`. |
| GET | `/vendor/sharing-records/:id` | (ref) | Not exposed as dedicated route; EvidenceDrawer targets `objectType=sharing_record`. |
| GET | `/vendor/access-events` | SharingLogsPage (Telemetry tab) | Spring Page. **Requires** `vendorId` OR (`subjectRef` + `from` + `to`). Max 90-day range enforced by backend. |
| GET | `/vendor/access-events/vendors/:id/summary` | (ref) | Available in vendors.ts but not yet surfaced. |
| POST | `/vendor/exports` | (ref) | Vendor export trigger — available in vendors.ts. |

### 1.3 Scanner Service — port `8094`

| Method | Path | Used By | Notes |
|--------|------|---------|-------|
| GET | `/scanner/sources` | ScanSourcesPage | Returns `List`. Supports `status` query param. |
| POST | `/scanner/sources/:id/disable` | ScanSourcesPage | TENANT_ADMIN only. One-way — no re-enable endpoint. |
| GET | `/scanner/runs` | ScanRunsPage | Spring Page. Supports `status`, `sourceId`, `page`, `size`. |
| GET | `/scanner/runs/:runId` | ScanRunDetailPage | Single run metadata. |
| GET | `/scanner/runs/:runId/findings` | ScanRunDetailPage | Returns `List`. |
| GET | `/scanner/tasks` | ScanRunDetailPage | Spring Page. Supports `runId`, `page`, `size`. |
| GET | `/scanner/tasks/:taskId` | (ref) | Available in scanner.ts. |
| POST | `/scanner/tasks/:taskId/transition` | ScanRunDetailPage | TENANT_ADMIN only. Idempotency key auto-generated. |
| POST | `/scanner/runs/:runId/evidence/bundle` | ScanRunDetailPage | Idempotent — backend de-dupes. |

---

## 2. Files Created / Modified

### New Files

| File | Purpose |
|------|---------|
| `src/lib/api/ropa.ts` | Typed wrappers for ropa-inventory-service |
| `src/lib/api/vendors.ts` | Typed wrappers for vendor-sharing-service |
| `src/lib/api/scanner.ts` | Typed wrappers for scanner-service |
| `src/pages/governance/RopaListPage.tsx` | ROPA activities list + export trigger |
| `src/pages/governance/RopaDetailPage.tsx` | Activity detail + cross-border transfers + EvidenceDrawer |
| `src/pages/governance/VendorListPage.tsx` | Vendor registry with client-side filters |
| `src/pages/governance/VendorDetailPage.tsx` | Vendor detail + agreements + EvidenceDrawer |
| `src/pages/governance/SharingLogsPage.tsx` | Sharing records + access telemetry tabs |
| `src/pages/governance/ScanSourcesPage.tsx` | Scan sources card grid + disable action |
| `src/pages/governance/ScanRunsPage.tsx` | Paginated scan run history |
| `src/pages/governance/ScanRunDetailPage.tsx` | Run detail + findings + tasks + evidence bundle |

### Modified Files

| File | Change |
|------|--------|
| `src/config/env.ts` | Added `ropaServiceUrl`, `vendorServiceUrl`, `scannerServiceUrl` |
| `.env` | Added `VITE_ROPA_SERVICE_URL`, `VITE_VENDOR_SERVICE_URL`, `VITE_SCANNER_SERVICE_URL` |
| `src/app/router.tsx` | Replaced flat `/ropa` and `/vendors` placeholders with `/governance/*` nested routes; imported all 8 governance pages |
| `src/config/navigation.ts` | Replaced flat ROPA + Vendors nav entries with `Governance` group containing 5 children |

---

## 3. Routes

| Route | Component | RBAC |
|-------|-----------|------|
| `/governance` | → redirect `/governance/ropa` | — |
| `/governance/ropa` | `RopaListPage` | TENANT_ADMIN, DPO, REVIEWER |
| `/governance/ropa/:activityId` | `RopaDetailPage` | TENANT_ADMIN, DPO, REVIEWER |
| `/governance/vendors` | `VendorListPage` | TENANT_ADMIN, DPO |
| `/governance/vendors/:vendorId` | `VendorDetailPage` | TENANT_ADMIN, DPO |
| `/governance/sharing` | `SharingLogsPage` | TENANT_ADMIN, DPO |
| `/governance/scanner` | → redirect `/governance/scanner/sources` | — |
| `/governance/scanner/sources` | `ScanSourcesPage` | TENANT_ADMIN, DPO |
| `/governance/scanner/runs` | `ScanRunsPage` | TENANT_ADMIN, DPO |
| `/governance/scanner/runs/:runId` | `ScanRunDetailPage` | TENANT_ADMIN, DPO |

---

## 4. Navigation

The sidebar `Governance` group (icon: `Shield`) is visible to `TENANT_ADMIN`, `DPO`, `REVIEWER`.

Children (filtered by role at runtime):
1. **ROPA** → `/governance/ropa`
2. **Vendors** → `/governance/vendors`
3. **Sharing Logs** → `/governance/sharing`
4. **Scanner Sources** → `/governance/scanner/sources`
5. **Scanner Runs** → `/governance/scanner/runs`

---

## 5. Feature Matrix

| Feature | Implemented | Notes |
|---------|-------------|-------|
| ROPA list with pagination | ✅ | Server-side via Spring Page |
| ROPA filters (status/risk/basis/q) | ✅ | |
| ROPA export trigger | ✅ | POST /exports/ropa |
| ROPA activity detail | ✅ | Map<String,Object> rendered |
| Cross-border transfers table | ✅ | Filtered by activityId |
| Vendor list | ✅ | Client-side filter (backend returns List) |
| Vendor detail + agreements | ✅ | |
| Sharing records with pagination | ✅ | Server-side |
| Sharing logs filters | ✅ | vendorId / crossBorder / enabled |
| Access telemetry tab | ✅ | Requires vendorId + date range |
| Scan sources card grid | ✅ | |
| Disable scan source | ✅ | TENANT_ADMIN only |
| Scan runs list with pagination | ✅ | Server-side |
| Scan run detail | ✅ | |
| Findings list with risk filter | ✅ | |
| Remediation tasks with transitions | ✅ | TENANT_ADMIN only |
| Evidence bundle creation | ✅ | Idempotent |
| EvidenceDrawer integration | ✅ | On ropa_activity, vendor, sharing_record, scan_run |
| RBAC gating | ✅ | Per route via RoleGuard |

---

## 6. Known Limitations & Design Decisions

1. **No GET /vendors/:vendorId endpoint** — `VendorDetailPage` fetches the full vendor list then finds by ID client-side. Acceptable for typical tenant sizes; revisit if vendor count exceeds ~500.

2. **Access telemetry requires vendorId** — The backend enforces `vendorId OR (subjectRef + from + to)`. The UI requires vendor selection and shows a constraint banner.

3. **Access telemetry max 90 days** — Backend enforces. UI currently does not validate the range client-side; a backend 400 will surface as an error toast.

4. **No SCANNER_AGENT role in frontend** — `roles.ts` does not define `SCANNER_AGENT`. Scanner pages are gated to `TENANT_ADMIN` + `DPO` only.

5. **Disable source is one-way** — No re-enable endpoint exists in the scanner-service. Once disabled, re-activation requires backend CLI/API operation.

6. **Vendor export UI not surfaced** — `createVendorExport` is available in `vendors.ts` but no export button is exposed in the vendor pages (consistent with backend providing PDF generation separately).

7. **ROPA detail returns `Map<String,Object>`** — The backend endpoint returns an untyped map. The UI renders known keys explicitly and falls back to a `<pre>` dump for unknown keys.

8. **Evidence download URL** — `buildRopaExportDownloadUrl(exportId)` and `buildVendorExportDownloadUrl(exportId)` produce signed S3 URLs. They are constructed client-side; actual download requires valid presigned URL from the backend.

---

## 7. Environment Variables

```env
VITE_ROPA_SERVICE_URL=http://localhost:8085
VITE_VENDOR_SERVICE_URL=http://localhost:8090
VITE_SCANNER_SERVICE_URL=http://localhost:8094
```

All three default to `localhost` if not set. In production, point these to the internal ALB/service hostnames.

---

*Part 8 complete — all 11 deliverables shipped.*
