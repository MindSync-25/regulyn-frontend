# Smoke Navigation Checklist — Regulyn Tenant Admin Portal

> **Purpose**: Manual smoke test to verify navigation, evidence drawer, and error display work end-to-end.  
> **When to run**: After any service restart, deployment, or significant code change.  
> **Prerequisite**: All backend services running (see PORTAL_README.md §Backend Services).

---

## Pre-flight Checks

- [ ] `tenant-admin-portal` running at http://localhost:3002
- [ ] `identity-tenant-service` running at http://localhost:8081
- [ ] At least one backend service running per module you intend to test
- [ ] Valid tenant admin credentials available (user with `TENANT_ADMIN` role)

---

## 1. Authentication

| # | Action | Expected Result |
|---|--------|----------------|
| 1.1 | Open http://localhost:3002 without logging in | Redirected to `/login` |
| 1.2 | Enter invalid credentials | Error message displayed (not a blank screen) |
| 1.3 | Enter valid `TENANT_ADMIN` credentials | Redirected to `/` (Home/Dashboard) |
| 1.4 | Refresh the page | Stays logged in (token persisted in store) |
| 1.5 | Navigate to `/app/governance/ropa` manually | Loads (not a 403/blank) |

---

## 2. Identity Module

### Users

| # | Action | Expected Result |
|---|--------|----------------|
| 2.1 | Click **Identity → Users** | User list loads or shows "No users yet" empty state |
| 2.2 | If list errors: inspect error panel | Friendly error message with Refresh button |

### API Keys

| # | Action | Expected Result |
|---|--------|----------------|
| 2.3 | Click **Identity → API Keys** | API keys list loads (may be empty) |
| 2.4 | Click **🔍 Evidence / Audit** button | Evidence drawer opens from right side |
| 2.5 | Click **Audit Timeline** tab in drawer | Tab switches; shows events or "No data" state |
| 2.6 | Press **Escape** | Drawer closes |
| 2.7 | Click outside drawer (backdrop) | Drawer closes |

### Tenant Audit Explorer

| # | Action | Expected Result |
|---|--------|----------------|
| 2.8 | Click **Identity → Audit Explorer** | Audit timeline page loads |
| 2.9 | Expand one event | Human-readable detail shown by default |
| 2.10 | Click **Raw JSON** toggle | Dark-background raw JSON visible |
| 2.11 | Click **Human View** toggle | Returns to human-readable view |

---

## 3. DSAR Module

| # | Action | Expected Result |
|---|--------|----------------|
| 3.1 | Click **DSAR → Inbox** | DSAR list loads |
| 3.2 | Click any DSAR row | Detail page opens |
| 3.3 | Click **🔍 Evidence / Audit** on detail page | Drawer opens with objectType `DSAR` + objectId set |
| 3.4 | Switch to **Audit Timeline** tab | Shows timeline or graceful empty/error |
| 3.5 | Try **Assign** or **Transition** action | Toast success/error displayed (not blank screen) |
| 3.6 | Try **Close DSAR** with no close code | Validation error shown |

---

## 4. Incidents Module

| # | Action | Expected Result |
|---|--------|----------------|
| 4.1 | Click **Incidents → List** | Incidents list loads |
| 4.2 | Open one incident detail | Detail page with severity badge |
| 4.3 | Click **🔍 Evidence / Audit** | Drawer opens |
| 4.4 | Verify error handling: stop incident-breach-service and reload page | Friendly "Failed to load incident" with Retry button |

---

## 5. Retention / Deletion Module

| # | Action | Expected Result |
|---|--------|----------------|
| 5.1 | Click **Retention → Rules** | Rules list loads |
| 5.2 | Click **Retention → Deletions** | Deletions list loads |
| 5.3 | Open one deletion detail | Detail page with status/proof section |
| 5.4 | Click **🔍 Evidence / Audit** on detail | Drawer opens with objectId = deletionId |
| 5.5 | Click **Upload Proof** (if OPERATOR/ADMIN role) | Upload dialog opens |

---

## 6. Governance Module

### ROPA

| # | Action | Expected Result |
|---|--------|----------------|
| 6.1 | Click **Governance → ROPA** | Processing activities list |
| 6.2 | Open one activity | Detail page with metadata fields |
| 6.3 | Click **🔍 Evidence / Audit** | Drawer opens |

### Vendors

| # | Action | Expected Result |
|---|--------|----------------|
| 6.4 | Click **Governance → Vendors** | Vendor list loads |
| 6.5 | Click a vendor row | Vendor detail with agreements table |
| 6.6 | Click **🔍 Evidence / Audit** on detail | Drawer opens |

### Scanner

| # | Action | Expected Result |
|---|--------|----------------|
| 6.7 | Click **Governance → Scanner → Runs** | Scan runs list |
| 6.8 | Open one run | Detail with findings and remediation tasks |
| 6.9 | Click **Create Evidence Bundle** | Mutation fires; success or "already exists" toast |
| 6.10 | Click **🔍 Evidence / Audit** | Drawer opens with run's bundleId context |

---

## 7. HR & Workflows Module

### HR Document Rules

| # | Action | Expected Result |
|---|--------|----------------|
| 7.1 | Click **HR → Document Rules** | Purposes list |
| 7.2 | Click **🔍 Evidence / Audit** | Drawer opens |
| 7.3 | Click **+ New Purpose** | Create modal opens |

### Employee Exits / Requests

| # | Action | Expected Result |
|---|--------|----------------|
| 7.4 | Click **HR → Exits** | Request list loads |
| 7.5 | Click **🔍 Evidence / Audit** | Drawer opens |
| 7.6 | Filter by status = `RECEIVED` | List filters correctly |
| 7.7 | Click **View** on a request | Detail modal opens |
| 7.8 | Try **Approve** or **Reject** | Decision recorded; list refreshes |

### Employee Data Records

| # | Action | Expected Result |
|---|--------|----------------|
| 7.9 | Click **HR → Access Logs** | Data records list (filter-first state) |
| 7.10 | Enter an employee ID and click **Apply** | Results shown or "No records" |
| 7.11 | Click **🔍 Evidence / Audit** | Drawer opens |

### Employee Compliance Exports

| # | Action | Expected Result |
|---|--------|----------------|
| 7.12 | Click **HR → Exports** | Export form visible |
| 7.13 | Click **🔍 Evidence / Audit** | Drawer opens |
| 7.14 | Fill form and click **Create Export** | Success toast; last export card appears |
| 7.15 | If evidence-service is down: submit export | Toast about 503; friendly error (not blank) |

### Nominees

| # | Action | Expected Result |
|---|--------|----------------|
| 7.16 | Click **HR → Nominees** | Lookup form visible |
| 7.17 | Click **🔍 Evidence / Audit** | Drawer opens |
| 7.18 | Enter a nominee UUID and look up | Nominee card or "Not found" message |
| 7.19 | Click a claim ID link | Navigates to `NomineeDetailPage` |
| 7.20 | On NomineeDetailPage: click **🔍 Evidence / Audit** | Drawer opens with claimId |

---

## 8. Children & Guardian Module

### Age Rules

| # | Action | Expected Result |
|---|--------|----------------|
| 8.1 | Click **HR → Children → Age Rules** | Age rules table |
| 8.2 | Click **🔍 Evidence / Audit** | Drawer opens |
| 8.3 | Click **+ Add / Update Rule** | Upsert modal opens |
| 8.4 | Enter country code `US`, threshold `13` | Saves; table refreshes |

### Guardian Consent & eSign

| # | Action | Expected Result |
|---|--------|----------------|
| 8.5 | Click **HR → Children → eSign** | Step 1 (Guardian) form visible |
| 8.6 | Click **🔍 Evidence / Audit** | Drawer opens |
| 8.7 | Complete guardian → child → consent → eSign wizard | Each step progresses; done state shows summary |
| 8.8 | After eSign: drawer's objectId = consentId | (visible in drawer context bar) |

### Majority Check

| # | Action | Expected Result |
|---|--------|----------------|
| 8.9 | Click **HR → Children → Majority** | Check form visible |
| 8.10 | Click **🔍 Evidence / Audit** | Drawer opens |
| 8.11 | Enter a known child UUID and run | Result card with `isMajor` + `transitionStatus` |

---

## 9. Evidence Module (Standalone)

| # | Action | Expected Result |
|---|--------|----------------|
| 9.1 | Click **Evidence → Bundles** | Bundles list (paginated) |
| 9.2 | Click one bundle | Bundle detail with artifacts |
| 9.3 | Click **Evidence → Artifacts** | Artifacts list |

---

## 10. Error State Verification

| # | Scenario | Expected Result |
|---|----------|----------------|
| 10.1 | Stop identity-tenant-service; visit `/app/identity/users` | `UserFacingErrorPanel` with "Unable to load data" + Refresh button |
| 10.2 | Log out; navigate to `/app/governance/ropa` | Redirected to `/login` |
| 10.3 | Log in as `REVIEWER`; visit `/app/identity/api-keys` | 403 Forbidden state or graceful degradation |
| 10.4 | Open EvidenceDrawer when evidence service is down | Error card with Retry button visible in drawer |
| 10.5 | Open EvidenceDrawer; switch to Audit tab with 403 | Specific 403 hint shown ("TENANT_ADMIN permission required") |
| 10.6 | Submit empty form (any module) | Validation toast (not a blank screen or console error) |

---

## Sign-off

| Tester | Date | Result | Notes |
|--------|------|--------|-------|
| | | ☐ Pass / ☐ Fail | |

---

*Generated: Part 10 — Regulyn Tenant Admin Portal*
