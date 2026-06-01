# RecruitPro ERP — Codebase Review

**Date:** 2026-06-01  
**Scope:** Full codebase — 22 backend routes, 40+ frontend pages, schema, middleware, services  
**Reviewer:** Claude Sonnet 4.6 (automated deep review)  
**Status:** Review only — no changes made. Awaiting approval before implementation.

---

## Table of Contents

1. [Critical Bugs (Crashes / Silent Failures)](#1-critical-bugs)
2. [Security Issues](#2-security-issues)
3. [Dead Code](#3-dead-code)
4. [Duplicate Logic](#4-duplicate-logic)
5. [Inconsistencies](#5-inconsistencies)
6. [React Issues](#6-react-issues)
7. [Prisma / Database Issues](#7-prisma--database-issues)
8. [Error Handling Gaps](#8-error-handling-gaps)
9. [Naming Issues](#9-naming-issues)
10. [File Size / Complexity](#10-file-size--complexity)
11. [Top 20 Prioritized Improvements](#11-top-20-prioritized-improvements)

---

## Issue Severity Scale

| Level | Meaning |
|---|---|
| **CRITICAL** | Causes crashes, data loss, or silent broken features |
| **HIGH** | Security vulnerability or major functional regression |
| **MEDIUM** | Inconsistency, bad pattern, or technical debt |
| **LOW** | Minor cleanup, naming, or cosmetic improvement |

---

## 1. Critical Bugs

These are active bugs that cause crashes or completely broken features right now.

---

### CRIT-01 — `AgencyPartner` model missing from Prisma schema

**Severity:** CRITICAL  
**File:** `backend/src/routes/agencies.js` (line ~98), `backend/prisma/schema.prisma`

**Explanation:**  
`agencies.js` calls `prisma.agencyPartner.findFirst(...)` in the `GET /agencies/my` route. The `AgencyPartner` model does not exist anywhere in `schema.prisma`. Prisma will throw a runtime error the moment any `AGENCY_PARTNER` role user logs in and hits this endpoint. The error message leaks to the client as a 500.

**Recommended Fix:**  
Either add the `AgencyPartner` model to the schema (and run `prisma migrate`) or remove the `/my` route and the `AGENCY_PARTNER` role entirely if the feature isn't needed yet.

**Auto-implementable:** No — requires schema decision.

---

### CRIT-02 — Offer rejection in Approvals.jsx does nothing

**Severity:** CRITICAL  
**File:** `frontend/src/pages/management/Approvals.jsx` (line ~81)

**Explanation:**  
`confirmReject()` handles `rejectModal.type === 'mrf'` and calls the MRF reject API. But when `type === 'offer'`, there is no corresponding API call — the function falls through silently. The user sees the modal close, but the offer is never actually rejected in the database.

**Recommended Fix:**  
Add the missing branch:
```js
} else if (rejectModal.type === 'offer') {
  await offerAPI.reject(rejectModal.id, { reason: rejectReason });
  toast.success('Offer rejected');
  fetchOffers();
}
```

**Auto-implementable:** Yes, with care.

---

### CRIT-03 — Wrong API response key breaks Pipeline Kanban and AI Screening MRF dropdowns

**Severity:** CRITICAL  
**Files:**  
- `frontend/src/pages/recruiter/Pipeline/PipelineKanban.jsx` (line ~20)  
- `frontend/src/pages/recruiter/AIScreening/AIScreening.jsx` (line ~26)

**Explanation:**  
Both files read `r.data.mrfs` when fetching approved MRFs. The MRF API returns `{ data: [...], total, page, totalPages }`, so the correct key is `r.data.data`. Because of this bug, the MRF dropdown is always empty, making Pipeline Kanban and AI Screening completely non-functional.

**Recommended Fix:**
```js
// Change:
setMrfs(r.data.mrfs || [])
// To:
setMrfs(r.data.data || [])
```

**Auto-implementable:** Yes.

---

### CRIT-04 — Notifications `mark-all-read` route is unreachable

**Severity:** CRITICAL  
**File:** `backend/src/routes/notifications.js`

**Explanation:**  
Express matches routes in order. `PUT /:id/read` is defined before `PUT /mark-all-read`. Express interprets `mark-all-read` as a value for the `:id` parameter and routes it to the wrong handler. The "mark all read" feature silently fails — it calls the wrong endpoint.

**Recommended Fix:**  
Move `PUT /mark-all-read` above `PUT /:id/read` in the file.

**Auto-implementable:** Yes.

---

### CRIT-05 — `sourcingAPI` not exported from `api.js`

**Severity:** CRITICAL  
**Files:** `frontend/src/services/api.js`, `frontend/src/pages/recruiter/Sourcing/Sourcing.jsx`

**Explanation:**  
`Sourcing.jsx` imports `sourcingAPI` from `services/api.js`, but this export doesn't exist in `api.js`. The sourcing page would throw a runtime import error or all API calls would fail silently.

**Recommended Fix:**  
Add to `api.js`:
```js
export const sourcingAPI = {
  getAll: (params) => api.get('/sourcing', { params }),
  create: (data) => api.post('/sourcing', data),
  update: (id, data) => api.put(`/sourcing/${id}`, data),
  delete: (id) => api.delete(`/sourcing/${id}`),
};
```

**Auto-implementable:** Yes.

---

## 2. Security Issues

---

### SEC-01 — `departments.js` has no role guard on write routes

**Severity:** HIGH  
**File:** `backend/src/routes/departments.js`

**Explanation:**  
`POST /api/departments` (create) and `PUT /api/departments/:id` (update) only require `authenticate`. Any logged-in user — including candidates, employees, or interviewers — can create or rename departments.

**Recommended Fix:**  
Add `authorize('ADMIN')` middleware to both write routes.

**Auto-implementable:** Yes.

---

### SEC-02 — `offers.js` approve route has no role guard

**Severity:** HIGH  
**File:** `backend/src/routes/offers.js`

**Explanation:**  
`POST /api/offers/:id/approve` has no `authorize()` call. Any authenticated user can approve any offer letter, bypassing the management approval workflow.

**Recommended Fix:**  
Add `authorize('ADMIN', 'HR', 'BRANCH_MANAGER', 'MD')` to this route.

**Auto-implementable:** Yes.

---

### SEC-03 — MRF reject has no role guard; MRF submit has no ownership check

**Severity:** HIGH  
**File:** `backend/src/routes/mrf.js`

**Explanation:**  
- `POST /:id/reject` — any authenticated user can reject any MRF.
- `POST /:id/submit` — any authenticated user can submit any MRF for approval, even one they didn't create.
- The approve route checks for `MANAGING_DIRECTOR` (a role string that doesn't exist in the DB — the actual role is `MD`). The `MANAGING_DIRECTOR` branch can never be satisfied.

**Recommended Fix:**  
- Add `authorize('ADMIN', 'HR', 'MD')` to `/:id/reject`.
- Add ownership check on `/:id/submit` (`mrf.createdById === req.user.id || ADMIN`).
- Remove the dead `'MANAGING_DIRECTOR'` check; keep only `'MD'`.

**Auto-implementable:** Partial.

---

### SEC-04 — `candidates.js` CSV import and document upload violate No Upload Policy

**Severity:** HIGH  
**File:** `backend/src/routes/candidates.js`

**Explanation:**  
`POST /api/candidates/import/csv` and `POST /api/candidates/:id/documents` are live, authenticated endpoints. The project explicitly prohibits all file/CSV uploads. Additionally, the CSV import has no role check — any logged-in user can bulk-import candidates.

**Recommended Fix:**  
Remove both routes and all associated `multer` configuration (`storage`, `csvUpload`, `upload`, `parseCSVLine`).

**Auto-implementable:** Yes, but destructive — requires confirmation.

---

### SEC-05 — `candidates.js` PUT allows unrestricted field overwrite

**Severity:** HIGH  
**File:** `backend/src/routes/candidates.js` (line ~122–132)

**Explanation:**  
`PUT /:id` spreads the entire `req.body` into the Prisma update with no allowlist. A malicious or mistaken client can set `addedById`, `deletedAt`, `candidateId`, or any other system-managed field directly.

**Recommended Fix:**  
Destructure only the permitted fields from `req.body` and build a controlled `data` object:
```js
const { firstName, lastName, email, phone, designation, department,
        experience, skills, location, source, status, notes } = req.body;
const data = { firstName, lastName, email, ... }; // only editable fields
```

**Auto-implementable:** Yes.

---

### SEC-06 — `users.js` lists all users with no role guard

**Severity:** MEDIUM  
**File:** `backend/src/routes/users.js`

**Explanation:**  
`GET /api/users` returns all users (emails, roles, departments, last login) to any authenticated user. An employee can enumerate all recruiters, their emails, and their roles.

**Recommended Fix:**  
Add `authorize('ADMIN', 'HR', 'MD')` to `GET /`.

**Auto-implementable:** Yes.

---

### SEC-07 — JWT re-queries DB on every request (performance + correctness tradeoff)

**Severity:** LOW  
**File:** `backend/src/middleware/auth.js`

**Explanation:**  
The `authenticate` middleware re-fetches the user from the database on every API call. This is actually a security feature (it catches deactivated accounts immediately), but it adds a DB round-trip to every request. With SQLite this is fast, but worth documenting for PostgreSQL migration planning.

**Recommended Fix:**  
No change needed now. Document the intent so future developers don't "optimize" it away.

**Auto-implementable:** Documentation only.

---

### SEC-08 — `auth.js` change-password has no input validation

**Severity:** LOW  
**File:** `backend/src/routes/auth.js`

**Explanation:**  
`PUT /change-password` does not validate that `currentPassword` and `newPassword` are present or meet a minimum length. Calling the endpoint with `undefined` causes `bcrypt.compare(undefined, hash)` to throw.

**Recommended Fix:**
```js
if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both fields are required' });
if (newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
```

**Auto-implementable:** Yes.

---

### SEC-09 — `exams.js` exam token route requires auth (candidates cannot access)

**Severity:** MEDIUM  
**File:** `backend/src/routes/exams.js`

**Explanation:**  
`router.use(authenticate)` applies globally to all exam routes including `GET /token/:token`. Candidates accessing their exam link need to be authenticated JWT users. If candidates are external (no login account), this endpoint is inaccessible to them.

**Recommended Fix:**  
Move `GET /token/:token` above the `router.use(authenticate)` call so it is a public route, or create a separate unauthenticated sub-router for it.

**Auto-implementable:** Yes (if candidates are external — confirm with requirements).

---

## 3. Dead Code

---

### DEAD-01 — Unused import: `createNotification` in `mrf.js`

**Severity:** LOW  
**File:** `backend/src/routes/mrf.js` (line ~4)

**Explanation:**  
`createNotification` is imported from `helpers.js` but never called anywhere in `mrf.js`. 

**Recommended Fix:** Remove the import.  
**Auto-implementable:** Yes.

---

### DEAD-02 — Dead `tab` state in `AIScreening.jsx`

**Severity:** LOW  
**File:** `frontend/src/pages/recruiter/AIScreening/AIScreening.jsx` (line ~14)

**Explanation:**  
`const [tab, setTab] = useState('screen')` — `setTab` is never called. `tab` is always `'screen'`. The state is never used to conditionally render anything.

**Recommended Fix:** Remove the state.  
**Auto-implementable:** Yes.

---

### DEAD-03 — Unused import: `userAPI` in `CandidateDetail.jsx`

**Severity:** LOW  
**File:** `frontend/src/pages/recruiter/Candidates/CandidateDetail.jsx`

**Explanation:**  
`userAPI` is imported but never called in the file.

**Recommended Fix:** Remove the import.  
**Auto-implementable:** Yes.

---

### DEAD-04 — Unused import: `Filter` icon in `MRFList.jsx`

**Severity:** LOW  
**File:** `frontend/src/pages/recruiter/MRF/MRFList.jsx`

**Explanation:**  
`Filter` is imported from `lucide-react` but no `<Filter />` element exists in the JSX.

**Recommended Fix:** Remove the import.  
**Auto-implementable:** Yes.

---

### DEAD-05 — `createNotification` in `helpers.js` is never called

**Severity:** LOW  
**File:** `backend/src/utils/helpers.js`

**Explanation:**  
`createNotification` is exported but no route file reviewed actually calls it. Notifications are created directly in each route file using `prisma.notification.create()` where needed.

**Recommended Fix:** Either use the helper consistently everywhere, or remove it if notifications are created inline.  
**Auto-implementable:** No (requires deciding on the pattern).

---

### DEAD-06 — `multer` upload infrastructure in `candidates.js`

**Severity:** MEDIUM (see SEC-04)  
**File:** `backend/src/routes/candidates.js`

**Explanation:**  
`multer`, `storage`, `csvUpload`, `upload`, `parseCSVLine` are all defined and live. Per the no-upload policy, the entire CSV import route (~80 lines) and document upload route are dead relative to product requirements.

**Recommended Fix:** Remove with SEC-04 fix.  
**Auto-implementable:** Yes (with confirmation).

---

## 4. Duplicate Logic

---

### DUP-01 — Paginated fetch pattern repeated 15+ times

**Severity:** MEDIUM  
**Files:** `CandidateList.jsx`, `MRFList.jsx`, `InterviewList.jsx`, `AuditLogs.jsx`, `Probation.jsx`, `Reports.jsx`, `Sourcing.jsx`, `AgencyList.jsx`, and more.

**Explanation:**  
Every list component independently implements:
```js
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);
const [totalPages, setTotalPages] = useState(1);
// ...
useEffect(() => {
  setLoading(true);
  someAPI.getAll({ page, limit, ...filters })
    .then(res => {
      setData(res.data.data || []);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    })
    .finally(() => setLoading(false));
}, [page, ...filterDeps]);
```
This is 15+ lines of identical state + effect code per component.

**Recommended Fix:**  
Create `frontend/src/hooks/usePaginatedFetch.js`:
```js
export function usePaginatedFetch(apiFn, params = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    setLoading(true);
    apiFn({ page, ...params })
      .then(res => {
        setData(res.data.data || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, [page, JSON.stringify(params)]);

  return { data, loading, page, setPage, total, totalPages };
}
```

**Auto-implementable:** Yes (hook creation) — component refactoring requires per-file work.

---

### DUP-02 — AI scoring algorithm duplicated in `aiScreening.js`

**Severity:** MEDIUM  
**File:** `backend/src/routes/aiScreening.js`

**Explanation:**  
The full scoring algorithm (skillScore + expScore + textScore → matchScore → recommendation) is copy-pasted verbatim between `/screen` and `/screen/batch`. A bug fix in one doesn't affect the other.

**Recommended Fix:**  
Extract into a shared function:
```js
function scoreCandidate(candidate, jd) {
  // ... scoring logic
  return { matchScore, skillScore, expScore, textScore, recommendation };
}
```
Call from both routes.

**Auto-implementable:** Yes.

---

### DUP-03 — Agency performance stats computed twice

**Severity:** MEDIUM  
**File:** `backend/src/routes/agencies.js`

**Explanation:**  
`GET /my` (lines ~113–129) and `GET /:id/performance` (lines ~259–286) both compute the identical stats block (`placed`, `successRate`, `statuses` grouping). The `/my` route also does a second `findMany` for submissions despite already having loaded the agency with 20 submissions above.

**Recommended Fix:**  
Extract `computeAgencyStats(submissions)` as a shared function.

**Auto-implementable:** Yes.

---

### DUP-04 — `InterviewForm` defined in two places

**Severity:** MEDIUM  
**Files:**  
- `frontend/src/pages/recruiter/Candidates/CandidateDetail.jsx` (lines ~11–93)  
- `frontend/src/pages/recruiter/Interviews/InterviewList.jsx` (lines ~10–151, as `ScheduleForm`)

**Explanation:**  
Both components render a form to schedule an interview (candidate dropdown, date, type, mode, meeting link, round, duration, notes). They are near-identical with minor field differences.

**Recommended Fix:**  
Create `frontend/src/components/InterviewScheduleForm.jsx` as a shared component. Import in both pages.

**Auto-implementable:** No (requires carefully merging the two implementations).

---

### DUP-05 — Inline modal HTML instead of shared `<Modal>` component

**Severity:** LOW  
**Files:** `AgencyList.jsx`, `AIScreening.jsx`, `Departments.jsx`, `Probation.jsx`, `Approvals.jsx`, `Sourcing.jsx`

**Explanation:**  
Six pages implement their own modal backdrop (`fixed inset-0 bg-black/40 flex items-center justify-center`) instead of using the shared `<Modal>` component that exists in the components folder.

**Recommended Fix:**  
Replace the inline backdrop divs with the shared `<Modal>` component.

**Auto-implementable:** Yes, per file.

---

### DUP-06 — `HR_ROLES` / role constant arrays redefined in multiple route files

**Severity:** LOW  
**Files:** Multiple route files in `backend/src/routes/`

**Explanation:**  
Several files define local `const HR_ROLES = ['HR', 'RECRUITER', 'ADMIN']` or similar role lists inline. These can silently diverge.

**Recommended Fix:**  
Create `backend/src/constants/roles.js` with:
```js
export const ADMIN_ROLES = ['ADMIN'];
export const HR_ROLES = ['HR', 'RECRUITER', 'ADMIN'];
export const MANAGEMENT_ROLES = ['BRANCH_MANAGER', 'COUNTRY_MANAGER', 'MD', 'ADMIN'];
```

**Auto-implementable:** Yes.

---

### DUP-07 — `paginate()` helper used inconsistently

**Severity:** LOW  
**Files:** `users.js`, `probation.js`, `auditLogs.js`, `chemistryTests.js`

**Explanation:**  
`candidates.js`, `interviews.js`, `mrf.js` use the shared `paginate(page, limit)` helper. Four other route files inline the same skip/take math directly. The helper exists — it's just not used everywhere.

**Recommended Fix:**  
Import and use `paginate()` in the four inconsistent files.

**Auto-implementable:** Yes.

---

## 5. Inconsistencies

---

### INC-01 — Error response field: `message` vs `error`

**Severity:** MEDIUM  
**Files:** `sourcing.js`, `communications.js`, `aiScreening.js`, `incomingMail.js` vs all other routes

**Explanation:**  
Most routes return `{ message: '...' }` on errors. Four routes return `{ error: '...' }`. The frontend extracts errors with `err.response?.data?.message` everywhere — this silently swallows all errors from the four inconsistent routes.

**Recommended Fix:**  
Change all `res.status(500).json({ error: ... })` to `res.status(500).json({ message: ... })` in the four affected route files.

**Auto-implementable:** Yes.

---

### INC-02 — `window.confirm()` and `window.prompt()` used for destructive actions

**Severity:** MEDIUM  
**Files:** `CandidateList.jsx`, `AdminUsers.jsx`, `Sourcing.jsx`, `Probation.jsx`, `MRFList.jsx`, `InterviewList.jsx`

**Explanation:**  
Six pages use `window.confirm()` for deletions and `window.prompt()` for rejection reasons. `Approvals.jsx` correctly uses a proper in-app modal. The browser dialogs break the visual consistency of the app and cannot be styled.

**Recommended Fix:**  
Replace all `window.confirm` / `window.prompt` calls with the shared `<Modal>` component pattern used in `Approvals.jsx`.

**Auto-implementable:** No — requires per-component modal state additions.

---

### INC-03 — Loading state patterns vary across dashboards

**Severity:** LOW  
**Files:** All dashboard pages

**Explanation:**
- `RecruiterDashboard`: full-page spinner while loading.
- `AdminDashboard`: no loading state — renders empty KPI cards.
- `TrainingDashboard`, `ManagementDashboard`: spinner.
- `EmployeeDashboard`: no loading state.

**Recommended Fix:**  
Standardize to one pattern (spinner preferred). Add loading state to `AdminDashboard` and `EmployeeDashboard`.

**Auto-implementable:** Yes, per file.

---

### INC-04 — `authorize()` middleware vs inline role checks

**Severity:** MEDIUM  
**Files:** `mrf.js`, `probation.js` vs all other route files

**Explanation:**  
All routes that need role restriction use `authorize(...roles)` middleware — except `mrf.js` approve (inline if-check) and `probation.js` approve (inline if-check). This is inconsistent and the inline checks are easier to bypass.

**Recommended Fix:**  
Replace inline `if (req.user.role !== ...)` guards with `authorize()` middleware calls.

**Auto-implementable:** Yes.

---

### INC-05 — Some routes don't log errors to console

**Severity:** LOW  
**Files:** `candidates.js`, `offers.js` (PUT routes)

**Explanation:**  
Most routes have `console.error(e)` in the catch block. A few catch blocks only return 500 without logging. This makes debugging production issues much harder.

**Recommended Fix:**  
Add `console.error(e)` to all catch blocks that are missing it.

**Auto-implementable:** Yes.

---

## 6. React Issues

---

### REACT-01 — `fetch` function name shadows `window.fetch`

**Severity:** LOW  
**File:** `frontend/src/pages/recruiter/Candidates/CandidateDetail.jsx` (line ~105)

**Explanation:**  
`const fetch = () => { ... }` overwrites the global `fetch` in this component's scope. Any code in this component that tries to use `window.fetch` (native HTTP) would call the wrong function.

**Recommended Fix:**  
Rename to `const loadCandidate = () => { ... }`.

**Auto-implementable:** Yes.

---

### REACT-02 — `useEffect` missing dependencies (`useCallback` not used for effect callbacks)

**Severity:** LOW  
**Files:** `PipelineKanban.jsx` (~line 23), `CandidateDetail.jsx` (~line 109), `Probation.jsx` `ChemistryTestSection` (~line 57)

**Explanation:**  
In each case, a function defined outside a `useEffect` is called inside it, but the function isn't in the dependency array. React's exhaustive-deps rule would flag these. In practice they work because the outer dependency (`id`, `selectedMrf`, `candidateId`) is in the array, but the linter warning can mask real bugs.

**Recommended Fix:**  
Wrap the fetch functions with `useCallback` including their own dependencies, then add them to the effect's dependency array. Or inline the fetch logic directly in the effect.

**Auto-implementable:** Yes (mechanical `useCallback` wrapping).

---

### REACT-03 — `EmployeeDashboard` fetches 5 candidates and filters in JS

**Severity:** LOW  
**File:** `frontend/src/pages/employee/Dashboard.jsx` (~line 73)

**Explanation:**  
`candidateAPI.getAll({ search: user.email, limit: 5 })` fetches up to 5 candidates matching the email, then `.find()` picks the exact match. If the user's email appears in more than 5 candidate records (unlikely but possible), the correct candidate might be missed.

**Recommended Fix:**  
Use `limit: 1` since email should be unique per candidate, or add a dedicated `GET /candidates/by-email/:email` endpoint.

**Auto-implementable:** Yes (change limit).

---

### REACT-04 — `Reports.jsx` `useEffect` closes over stale `filters`

**Severity:** LOW  
**File:** `frontend/src/pages/recruiter/Reports/Reports.jsx` (~line 41)

**Explanation:**  
`useEffect(() => { fetchReport(); }, [activeReport])` — `fetchReport` closes over `filters` state, but `filters` is not in the dependency array. If both `activeReport` and `filters` change at the same time (e.g., reset button), the effect may run with stale filters.

**Recommended Fix:**  
Add `filters` to the dependency array, or restructure so `fetchReport` is called only via explicit user action (click handler), not via effect.

**Auto-implementable:** Yes.

---

### REACT-05 — `AIScreening.jsx` `tab` state is never changed

**Severity:** LOW  
**File:** `frontend/src/pages/recruiter/AIScreening/AIScreening.jsx` (~line 14)

**Explanation:**  
`const [tab, setTab] = useState('screen')` — `setTab` is never called. This is either an incomplete feature or dead state.

**Recommended Fix:**  
Remove the state. If tabbed UI is planned, implement it when needed.

**Auto-implementable:** Yes.

---

## 7. Prisma / Database Issues

---

### DB-01 — Sequential ID generation has a race condition

**Severity:** HIGH  
**File:** `backend/src/utils/helpers.js`

**Explanation:**  
All 5 ID generators (`generateCandidateId`, `generateMRFNumber`, `generateOfferNumber`, `generateAppointmentNumber`, `generateBatchCode`) use `count() + 1`. Under concurrent requests, two records can receive the same generated value. The `@unique` constraint will cause one insert to fail with Prisma error P2002 (unique constraint violation), which surfaces as an unhelpful 500 to the client.

**Recommended Fix:**  
Use `@default(cuid())` (already used for `id` fields) for generated codes, or use a DB sequence (not available in SQLite), or add a retry loop with collision detection. For codes that must be human-readable (MRF-2026-001), use atomic generation with a dedicated counter table.

**Auto-implementable:** No — requires schema change and migration.

---

### DB-02 — N+1 in `agencies.js` performance route

**Severity:** MEDIUM  
**File:** `backend/src/routes/agencies.js` (lines ~259–286)

**Explanation:**  
`GET /:id/performance` fetches all agency submissions with candidate status included, then filters the JS array 6 times with `.filter()` for each status. For an active agency with thousands of submissions, this loads all rows into memory.

**Recommended Fix:**  
Use `prisma.agencySubmission.groupBy({ by: ['status'], _count: true })` to let the database do the counting.

**Auto-implementable:** Yes.

---

### DB-03 — Training enrollment loop makes N×3 queries

**Severity:** MEDIUM  
**File:** `backend/src/routes/training.js` (lines ~76–88)

**Explanation:**  
`POST /batches/:id/enroll` loops through `candidateIds` and does a `findUnique` + `create` + `update` per candidate — 3 queries per candidate. Enrolling 20 candidates = 60 sequential DB queries.

**Recommended Fix:**
```js
// Check existing in one query
const existing = await prisma.trainingEnrollment.findMany({
  where: { batchId, candidateId: { in: candidateIds } },
  select: { candidateId: true },
});
const existingIds = new Set(existing.map(e => e.candidateId));
const newIds = candidateIds.filter(id => !existingIds.has(id));

// Bulk create
await prisma.trainingEnrollment.createMany({
  data: newIds.map(candidateId => ({ batchId, candidateId })),
});

// Bulk update status
await prisma.candidate.updateMany({
  where: { id: { in: newIds } },
  data: { status: 'TRAINING_IN_PROGRESS' },
});
```

**Auto-implementable:** Yes.

---

### DB-04 — `reports.js` uses SQLite-specific raw SQL

**Severity:** LOW (now) / HIGH (on PostgreSQL migration)  
**File:** `backend/src/routes/reports.js` (~line 39)

**Explanation:**  
`prisma.$queryRaw` uses `strftime('%Y-%m', ...)` which is SQLite-only. This query will break on PostgreSQL (`date_trunc` or `to_char` needed instead).

**Recommended Fix:**  
Compute the monthly grouping in application code (group by month after fetching with `createdAt: { gte: startOfYear }`) or add a database-agnostic abstraction. Add a comment marking this as SQLite-specific.

**Auto-implementable:** No — requires DB-specific consideration.

---

### DB-05 — `AIScreeningResult` has `candidateId @unique` — second screening overwrites first

**Severity:** MEDIUM  
**File:** `backend/prisma/schema.prisma`, `backend/src/routes/aiScreening.js`

**Explanation:**  
`AIScreeningResult` is upserted on `candidateId`. If a candidate is screened against JD-A and then JD-B, the second screening silently overwrites the first. A candidate can only ever have one screening result in the system.

**Recommended Fix:**  
Add `mrfId` to the upsert key, making the unique constraint `@@unique([candidateId, mrfId])`. This allows per-MRF screening results.

**Auto-implementable:** No — requires schema migration.

---

### DB-06 — `offers.js` `POST /` body spread risks overwriting system fields

**Severity:** MEDIUM  
**File:** `backend/src/routes/offers.js` (~lines 68–84)

**Explanation:**  
`const { allowances, deductions, joiningDate, ...rest } = req.body` then spreads `rest` directly into `prisma.offerLetter.create`. Fields like `offerNumber`, `approvedById`, `status`, `candidateId` can be set by the client.

**Recommended Fix:**  
Explicitly list only the safe fields in the create data object:
```js
const data = {
  candidateId, designation, department, basicSalary: basic,
  allowances: allowances ? parseFloat(allowances) : null,
  deductions: deductions ? parseFloat(deductions) : null,
  joiningDate: joiningDate ? new Date(joiningDate) : null,
  offerNumber: await generateOfferNumber(prisma),
  createdById: req.user.id,
};
```

**Auto-implementable:** Yes.

---

## 8. Error Handling Gaps

---

### ERR-01 — Dashboard catch blocks swallow all errors silently

**Severity:** MEDIUM  
**Files:** `AdminDashboard.jsx`, `EmployeeDashboard.jsx` (`.catch(() => {})`)  
**Files:** `RecruiterDashboard.jsx`, `TrainingDashboard.jsx`, `ManagementDashboard.jsx` (`.catch(console.error)`)

**Explanation:**  
When API calls fail (server down, network error), the dashboard shows empty data with no user feedback. The user sees blank KPI cards and has no idea why.

**Recommended Fix:**  
Replace all dashboard catch blocks with `toast.error('Failed to load dashboard data')`.

**Auto-implementable:** Yes.

---

### ERR-02 — MRF reject allows empty reason

**Severity:** MEDIUM  
**File:** `backend/src/routes/mrf.js`

**Explanation:**  
`POST /:id/reject` stores `req.body.reason` directly without checking it's non-empty. An MRF can be rejected with a null/empty reason, leaving the requester with no explanation.

**Recommended Fix:**
```js
if (!req.body.reason?.trim()) return res.status(400).json({ message: 'Rejection reason is required' });
```

**Auto-implementable:** Yes.

---

### ERR-03 — MRF submit doesn't check current status

**Severity:** MEDIUM  
**File:** `backend/src/routes/mrf.js`

**Explanation:**  
`POST /:id/submit` will re-submit an already-APPROVED or already-REJECTED MRF, changing its status back to PENDING. No guard exists.

**Recommended Fix:**
```js
if (mrf.status !== 'DRAFT') return res.status(400).json({ message: `Cannot submit an MRF with status ${mrf.status}` });
```

**Auto-implementable:** Yes.

---

### ERR-04 — Candidate comments: empty comment can be saved, any user can edit any comment

**Severity:** MEDIUM  
**File:** `backend/src/routes/candidates.js`

**Explanation:**  
`POST /:id/comments` — no check that `req.body.comment` is non-empty.  
`PUT /:id/comments/:commentId` — no ownership check. Any authenticated user can edit any comment.

**Recommended Fix:**
```js
// POST: add validation
if (!req.body.comment?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });

// PUT: add ownership check
const comment = await prisma.candidateComment.findUnique({ where: { id: commentId } });
if (comment.userId !== req.user.id) return res.status(403).json({ message: 'Not your comment' });
```

**Auto-implementable:** Yes.

---

### ERR-05 — Training enrollment: no check that `candidateIds` is non-empty

**Severity:** LOW  
**File:** `backend/src/routes/training.js`

**Explanation:**  
`POST /batches/:id/enroll` loops over `req.body.candidateIds` without checking it exists or has items. Calling with `candidateIds: []` returns 200 OK and does nothing, which could confuse clients.

**Recommended Fix:**
```js
if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
  return res.status(400).json({ message: 'candidateIds array is required' });
}
```

**Auto-implementable:** Yes.

---

### ERR-06 — Double-submit risk on forms with no loading state

**Severity:** LOW  
**Files:** `AgencyList.jsx` create form, `Departments.jsx` create form, several others

**Explanation:**  
Some create forms don't disable the submit button while the request is in-flight. A user can click "Create" twice and submit two records.

**Recommended Fix:**  
Add a `saving` state, disable the submit button during submission:
```jsx
<button disabled={saving} onClick={handleCreate}>
  {saving ? 'Creating...' : 'Create'}
</button>
```

**Auto-implementable:** Yes, per file.

---

## 9. Naming Issues

| ID | File | Current | Issue | Suggested |
|---|---|---|---|---|
| NAME-01 | `CandidateDetail.jsx` | `fetch` | Shadows `window.fetch` | `loadCandidate` |
| NAME-02 | `candidates.js` line ~41 | `data` | Shadows destructured `{ data }` from Prisma | `rows` |
| NAME-03 | `Reports.jsx` line ~31 | `d` | Single-letter variable for report data | `reportData` |
| NAME-04 | `ExamManagement.jsx` line ~291 | `e` in `.map(e => ...)` | Single-letter in map | `exam` |
| NAME-05 | `agencies.js` | `agencyType` | Field doesn't exist in schema — should be `tier` | `tier` |
| NAME-06 | `InterviewList.jsx` line ~72 | `Err` | Component named too tersely | `FieldError` |
| NAME-07 | `schema.prisma` | `mRF` model | Unusual casing for Prisma model | Rename to `Mrf` (requires migration) |
| NAME-08 | Multiple backend files | catch `e` | Inconsistent: some use `e`, some `err`, some `error` | Standardize to `err` |
| NAME-09 | `helpers.js` | `generateCandidateId(prisma)` | Called in `incomingMail.js` with a `prisma` argument but the function ignores it and creates its own instance | Match signature or remove param |
| NAME-10 | `AIScreening.jsx` | `tab` (dead state) | Misleading — implies tabs exist | Remove entirely |

---

## 10. File Size / Complexity

Files that are large enough to warrant splitting into smaller, focused components:

| File | Line Count | Issue | Recommended Split |
|---|---|---|---|
| `Probation.jsx` | ~460 | 3 inline modal forms + `ChemistryTestSection` (~144 lines) | Extract `ChemistryTestSection` to its own file; extract each modal form |
| `InterviewList.jsx` | ~347 | `ScheduleForm` (151 lines) + `FeedbackForm` (36 lines) inline | Extract both to separate files |
| `ExamManagement.jsx` | ~339 | `GenerateLinkForm` (185 lines) + `ResultForm` (50 lines) inline | Extract both |
| `CandidateDetail.jsx` | ~380 | 7-tab layout + `InterviewForm` (83 lines) | Extract tab content panels to separate components |
| `MRFDetail.jsx` | ~333 | Outreach modal + suggested agencies inline | Extract `OutreachModal` |
| `Sourcing.jsx` | ~297 | Uses raw modal div instead of `<Modal>` | Refactor modal, acceptable size |
| `candidates.js` (backend) | ~305 | CSV import route is 80 lines of unneeded code | Remove CSV import route |

---

## 11. Top 20 Prioritized Improvements

Ranked by impact × effort. Items marked **Auto** can be applied immediately by Claude. Items marked **Manual** require a decision or careful merge.

| # | Severity | Files | Description | Auto? |
|---|---|---|---|---|
| 1 | CRITICAL | `notifications.js` | Fix route order — move `PUT /mark-all-read` before `PUT /:id/read`. "Mark all read" is currently unreachable. | **Auto** |
| 2 | CRITICAL | `PipelineKanban.jsx`, `AIScreening.jsx` | Fix wrong response key `r.data.mrfs` → `r.data.data`. Both features are completely non-functional. | **Auto** |
| 3 | CRITICAL | `Approvals.jsx` | Fix offer rejection — add the missing API call for `type === 'offer'` in `confirmReject`. | **Auto** |
| 4 | CRITICAL | `api.js`, `Sourcing.jsx` | Add `sourcingAPI` export to `api.js` so the Sourcing page doesn't fail. | **Auto** |
| 5 | CRITICAL | `agencies.js`, `schema.prisma` | Fix or remove the `prisma.agencyPartner` call that crashes on missing model. | Manual |
| 6 | HIGH | `departments.js` | Add `authorize('ADMIN')` to `POST /` and `PUT /:id`. | **Auto** |
| 7 | HIGH | `offers.js` | Add `authorize()` to `POST /:id/approve`. | **Auto** |
| 8 | HIGH | `mrf.js` | Remove dead `'MANAGING_DIRECTOR'` check. Add role guard to `/:id/reject`. Add status check to `/:id/submit`. | **Auto** |
| 9 | HIGH | `candidates.js` | Remove CSV import route and file upload route (violation of no-upload policy + security risk). | Manual (confirm) |
| 10 | HIGH | `candidates.js` | Add field allowlist to `PUT /:id` to prevent system field overwrite. | **Auto** |
| 11 | HIGH | `users.js` | Add `authorize('ADMIN', 'HR', 'MD')` to `GET /`. | **Auto** |
| 12 | MEDIUM | `sourcing.js`, `communications.js`, `aiScreening.js`, `incomingMail.js` | Change `{ error: ... }` to `{ message: ... }` in all error responses for consistency. | **Auto** |
| 13 | MEDIUM | `auth.js` | Add input validation to `PUT /change-password` (presence + min length). | **Auto** |
| 14 | MEDIUM | `training.js` | Replace per-candidate enrollment loop with `createMany` + `updateMany` (N→2 queries). | **Auto** |
| 15 | MEDIUM | `aiScreening.js` | Extract duplicate scoring algorithm into shared `scoreCandidate()` function. | **Auto** |
| 16 | MEDIUM | `agencies.js` | Extract duplicate performance stats into `computeAgencyStats()`. Fix double-query in `/my` route. | **Auto** |
| 17 | MEDIUM | All dashboards | Replace `.catch(() => {})` and `.catch(console.error)` with `toast.error(...)` for user-visible error feedback. | **Auto** |
| 18 | MEDIUM | `mrf.js` | Add validation: MRF reject requires non-empty reason. | **Auto** |
| 19 | MEDIUM | `exams.js` | Move `GET /token/:token` above `router.use(authenticate)` so it doesn't require auth. | Manual (confirm intent) |
| 20 | LOW | All dead code | Remove: unused `mrf.js` import, dead `tab` state, `userAPI` import, `Filter` import. Rename `fetch` → `loadCandidate` in `CandidateDetail.jsx`. | **Auto** |

---

## Implementation Plan (After Approval)

**Phase 1 — Critical Fixes (safe to do immediately, no behaviour change for working features)**  
Items 1, 2, 3, 4: Fix broken features. These restore functionality, not add it.

**Phase 2 — Security Hardening**  
Items 6, 7, 8, 10, 11: Add missing route guards and field allowlists.

**Phase 3 — Consistency & Error Handling**  
Items 12, 13, 17, 18: Standardize error formats and dashboard error states.

**Phase 4 — Backend Quality**  
Items 14, 15, 16: Performance and code duplication in routes.

**Phase 5 — Cleanup**  
Item 20: Dead code removal.

**Needs Separate Decisions:**  
- Item 5 (AgencyPartner schema — needs product decision)  
- Item 9 (CSV import removal — confirm no active use)  
- Item 19 (Exam token auth — confirm whether candidates have login accounts)

---

*Total issues found: 49 across all categories.*  
*Auto-implementable: 31 | Needs manual decision: 18*
