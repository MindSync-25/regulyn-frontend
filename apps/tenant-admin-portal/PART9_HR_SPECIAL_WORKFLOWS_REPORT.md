# Part 9 — HR & Special Workflows Module

**Implemented:** HR Document Rules, Exit Workflows, Employee Data Records, Compliance Exports, Nominee Claims, Age Rules, Guardian eSign, Majority Checks

---

## Module Summary

Three backend services wired:

| Service | Port | Frontend Base URL Env Var |
|---------|------|--------------------------|
| `employee-data-service` | 8091 | `VITE_EMPLOYEE_SERVICE_URL` (default: `http://localhost:8091`) |
| `nominee-service` | 8088 | `VITE_NOMINEE_SERVICE_URL` (default: `http://localhost:8088`) |
| `children-guardian-service` | 8089 | `VITE_CHILDREN_SERVICE_URL` (default: `http://localhost:8089`) |

---

## Pages & Routes

| Route | Page | RBAC | Backend Endpoint(s) |
|-------|------|------|---------------------|
| `/hr/exits` | HRExitsPage | TENANT_ADMIN, DPO, REVIEWER | `GET /api/employee-requests`, `POST /…/{id}/approve`, `POST /…/{id}/close` |
| `/hr/rules` | HRRulesPage | TENANT_ADMIN, DPO | `GET /api/hr-purposes`, `POST /api/hr-purposes` |
| `/hr/access-logs` | HRAccessLogsPage | TENANT_ADMIN, DPO, AUDITOR | `GET /api/employee-data-records` |
| `/hr/exports` | HRExportsPage | TENANT_ADMIN, DPO | `POST /api/exports/employee-compliance` |
| `/hr/nominees` | NomineesPage | TENANT_ADMIN, DPO, OPERATOR | `GET /nominees/{id}`, `GET /claims/nominee/{id}`, `POST /nominees/{id}/verify`, `POST /nominees/{id}/verify/reject` |
| `/hr/nominees/:claimId` | NomineeDetailPage | TENANT_ADMIN, DPO, OPERATOR | `GET /claims/{id}`, `POST /claims/{id}/approve`, `POST /claims/{id}/close` |
| `/hr/children/age-rules` | AgeRulesPage | TENANT_ADMIN, DPO | `GET /age-rules`, `PUT /age-rules`, `GET /age-rules/effective` |
| `/hr/children/esign` | ESignPage | TENANT_ADMIN, DPO, OPERATOR | `POST /guardians`, `POST /children`, `POST /consents`, `POST /consents/{id}/approve`, `POST /consents/{id}/esign-requests` |
| `/hr/children/majority` | MajorityPage | TENANT_ADMIN, DPO | `POST /children/{id}/majority-check` |

---

## API Wrappers Created

### `src/lib/api/employee.ts`
- `listEmployees(params?)` — `GET /api/employees`
- `createEmployee(body)` — `POST /api/employees`
- `listHRPurposes()` — `GET /api/hr-purposes`
- `createHRPurpose(body)` — `POST /api/hr-purposes`
- `listEmployeeDataRecords(params?)` — `GET /api/employee-data-records`
- `listEmployeeRequests(params?)` — `GET /api/employee-requests` (paginated)
- `getEmployeeRequest(id)` — `GET /api/employee-requests/{id}`
- `approveEmployeeRequest(id, body)` — `POST /api/employee-requests/{id}/approve`
- `transitionEmployeeRequest(id, body)` — `POST /api/employee-requests/{id}/transition`
- `closeEmployeeRequest(id, body)` — `POST /api/employee-requests/{id}/close`
- `createEmployeeExport(body)` — `POST /api/exports/employee-compliance`

### `src/lib/api/nominee.ts`
- `getNominee(id)` — `GET /nominees/{id}`
- `verifyNominee(id, body)` — `POST /nominees/{id}/verify`
- `rejectNominee(id, body)` — `POST /nominees/{id}/verify/reject`
- `disableNominee(id)` — `DELETE /nominees/{id}`
- `getClaim(id)` — `GET /claims/{id}`
- `getClaimsByNominee(nomineeId)` — `GET /claims/nominee/{nomineeId}`
- `approveClaim(id, body)` — `POST /claims/{id}/approve`
- `closeClaim(id, body)` — `POST /claims/{id}/close`
- `transitionClaim(id, body)` — `POST /claims/{id}/transition`
- `getExportsByNominee(nomineeId)` — `GET /exports/nominee/{nomineeId}`
- `requestNomineeExport(nomineeId)` — `POST /exports/nominee`

### `src/lib/api/children.ts`
- `listAgeRules()` — `GET /age-rules`
- `upsertAgeRule(body)` — `PUT /age-rules`
- `getEffectiveAgeRule(country, state?)` — `GET /age-rules/effective`
- `createChild(body)` — `POST /children`
- `majorityCheck(childId, body?)` — `POST /children/{childId}/majority-check`
- `createGuardian(body)` — `POST /guardians`
- `verifyGuardian(guardianId)` — `POST /guardians/{guardianId}/verify`
- `createConsent(body)` — `POST /consents`
- `approveConsent(consentId)` — `POST /consents/{consentId}/approve`
- `revokeConsent(consentId)` — `POST /consents/{consentId}/revoke`
- `createEsignRequest(consentId, body, idempotencyKey)` — `POST /consents/{consentId}/esign-requests`
- `createGuardianConsentExport(scope?)` — `POST /exports/guardian-consents`

---

## Navigation

Added **"HR & Workflows"** section to sidebar (`src/config/navigation.ts`) with 8 children:

```
HR & Workflows
  ├── Exit Workflows          /hr/exits
  ├── HR Document Rules       /hr/rules
  ├── Data Records            /hr/access-logs
  ├── Compliance Exports      /hr/exports
  ├── Nominees & Claims       /hr/nominees
  ├── Age Rules               /hr/children/age-rules
  ├── Guardian eSign          /hr/children/esign
  └── Majority Check          /hr/children/majority
```

---

## Known Limitations & Design Decisions

### 1. Nominee Service Role Mismatch ⚠️
- The `nominee-service` uses backend role strings `"ADMIN"` and `"NOMINEE"` which do not exist in `src/lib/auth/roles.ts`
- The frontend gates pages by `TENANT_ADMIN`/`DPO`/`OPERATOR` (closest equivalents)
- **Backend will enforce** the actual role; the frontend will show actions but may receive 403
- This is documented with an amber warning banner on the Nominees page

### 2. No List Endpoints for Several Resources
The following resources have **no list/search endpoint** in the backend:
- All nominees across the tenant (no `GET /nominees` for ADMIN without `X-User-ID`)
- All consents (no `GET /consents`)
- All children (no `GET /children`)
- eSign request history (no `GET /consents/{id}/esign-requests`)

**Mitigation:** The Nominees page uses a lookup-by-ID pattern. ESign page uses a step wizard that creates records one at a time.

### 3. Enum Values are Defensive Strings
The backend enums (`RequestType`, `RequestStatus`, `DataCategory`, `PurposeKey`, `LawfulBasis`) were not fully mapped during exploration. All type definitions use `string` fallback unions. Filter dropdowns show common expected values.

### 4. ESign Idempotency Key
`POST /consents/{id}/esign-requests` requires `X-Idempotency-Key`. The frontend uses `crypto.randomUUID()` (Web Crypto API, available in all modern browsers) to generate a unique key per submission. This prevents duplicate eSign requests on retries.

### 5. Employee Export Download
The backend returns a `downloadPath` field in `EmployeeExport`. In production this would be a signed S3 URL; locally it may be a filesystem path. The Exports page displays the path but does not attempt a programmatic download (no streaming endpoint exists at `GET /api/employee/exports/{id}/download` — the path itself is the artifact reference).

### 6. Age Rule Constraint
Backend validates: `ageThreshold` must be `@Min(13) @Max(18)`, `countryCode` must be `@Size(2,2)`. The frontend form enforces these constraints client-side before submission.

### 7. Majority Check Date
The `evaluationDate` field is optional. When omitted, the backend defaults to the current date. The UI provides a date picker but leaves it optional.

---

## Files Created / Modified

### New files
```
src/lib/api/employee.ts
src/lib/api/nominee.ts
src/lib/api/children.ts
src/pages/hr/HRRulesPage.tsx
src/pages/hr/HRExitsPage.tsx
src/pages/hr/HRAccessLogsPage.tsx
src/pages/hr/HRExportsPage.tsx
src/pages/hr/NomineesPage.tsx
src/pages/hr/NomineeDetailPage.tsx
src/pages/hr/children/AgeRulesPage.tsx
src/pages/hr/children/ESignPage.tsx
src/pages/hr/children/MajorityPage.tsx
```

### Modified files
```
src/config/env.ts             — Added employeeServiceUrl, nomineeServiceUrl, childrenServiceUrl
src/app/router.tsx            — Added /hr/* route tree with 9 routes
src/config/navigation.ts      — Added "HR & Workflows" nav section with 8 children
```

---

## Testing Checklist

- [ ] Start `employee-data-service` on port 8091
- [ ] Start `nominee-service` on port 8088
- [ ] Start `children-guardian-service` on port 8089
- [ ] Navigate to `/hr/rules` — verify HR purposes list loads
- [ ] Create an HR purpose — confirm it appears in the table
- [ ] Navigate to `/hr/exits` — verify employee requests load with type filter
- [ ] Navigate to `/hr/nominees` — enter a valid nominee UUID and confirm lookup works
- [ ] Navigate to `/hr/children/age-rules` — add an age rule for "IN" with threshold 18
- [ ] Use effective rule lookup for "IN" — should return the rule just created
- [ ] Navigate to `/hr/children/majority` — enter a valid child UUID and run a check
- [ ] Navigate to `/hr/children/esign` — complete the 4-step wizard flow
- [ ] Verify sidebar shows "HR & Workflows" with all 8 subitems
- [ ] Verify RBAC: a REVIEWER role user can access `/hr/exits` but not `/hr/rules`
