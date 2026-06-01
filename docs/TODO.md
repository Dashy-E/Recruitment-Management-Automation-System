# RecruitPro ERP — Project State

> Living document. Update summary sections when features change. Do not append session logs.

---

## Project Overview

RecruitPro ERP is a full-stack recruitment management system for a mid-size company. It manages the complete hiring lifecycle from manpower requisition through onboarding and probation.

**Users:** HR/Recruiters, Training staff, Management (BM/CM/MD), Employees, Admin  
**Scale:** SQLite for dev/demo; designed to migrate to PostgreSQL for production

---

## Architecture

| Layer | Stack |
|---|---|
| Frontend | React 19 + Vite, Tailwind CSS, React Router, Recharts, date-fns, lucide-react |
| Backend | Express.js (ES Modules), Prisma 5 ORM |
| Database | SQLite (`backend/prisma/dev.db`) |
| Auth | JWT (7-day expiry), stored in localStorage; `authenticate` middleware re-fetches user from DB on every request |
| Email | Nodemailer with lazy SMTP init; falls back to console logging in dev if `SMTP_*` env vars are absent |
| AI Screening | TF-IDF keyword matching (no external ML); scores candidates against job descriptions |

**Ports:** Frontend → 5173 | Backend → 5000  
**API base:** `http://localhost:5000/api`  
**Response shape (paginated):** `{ data: [...], total, page, totalPages }` — frontend reads `res.data.data`  
**Response shape (flat):** plain array — `res.data` directly (e.g. offers, notifications)

---

## Modules

| Module | Route | Key Backend File |
|---|---|---|
| Auth | `/auth` | `routes/auth.js` |
| MRF (Manpower Requisition) | `/mrf` | `routes/mrf.js` |
| Candidates | `/candidates` | `routes/candidates.js` |
| Interviews | `/interviews` | `routes/interviews.js` |
| Training | `/training` | `routes/training.js` |
| Exams | `/exams` | `routes/exams.js` |
| Offers & Appointments | `/offers` | `routes/offers.js` |
| Probation | `/probation` | `routes/probation.js` |
| Agencies | `/agencies` | `routes/agencies.js` |
| Communications (Email Center) | `/communications` | `routes/communications.js` |
| AI Screening | `/ai-screening` | `routes/aiScreening.js` |
| Pipeline (Kanban) | `/pipeline` | `routes/pipeline.js` |
| Incoming Mail | `/incoming-mail` | `routes/incomingMail.js` |
| Geography Intelligence | `/geography` | `routes/geography.js` |
| Departments | `/departments` | `routes/departments.js` |
| Users | `/users` | `routes/users.js` |
| Notifications | `/notifications` | `routes/notifications.js` |
| Audit Logs | `/audit-logs` | `routes/auditLogs.js` |
| Chemistry Tests | `/chemistry-tests` | `routes/chemistryTests.js` |
| Employee Documents | `/employee-documents` | `routes/employeeDocuments.js` |

---

## Recruitment Workflow

```
APPLIED → SHORTLISTED → INTERVIEW_SCHEDULED → SELECTED
       → TRAINING_IN_PROGRESS → EXAM_PENDING → EXAM_COMPLETED
       → OFFER_SENT → OFFER_ACCEPTED → ONBOARDED
```

REJECTED can occur at any stage and is terminal.  
Each arrow represents an action in the system that updates candidate status automatically.

**Status transitions:**
- Shortlist: manual status change in CandidateDetail
- Interview scheduled: auto-set when Interview record created
- Selected: auto-set when Interview marked Complete
- Training In Progress: auto-set when candidate enrolled in batch
- Exam Pending: auto-set when training enrollment marked Complete
- Offer Sent: auto-set when Offer is sent
- Offer Accepted/Rejected: set by Employee via their portal
- Onboarded: manual or via Appointment Letter generation

---

## Roles & Permissions

| Role | Portal | Key Capabilities |
|---|---|---|
| `ADMIN` | `/admin` | Users, departments, audit logs, system settings; full access to all portals |
| `HR` / `RECRUITER` | `/recruiter` | Candidates, MRF, interviews, exams, offers, agencies, pipeline, AI screening, incoming mail |
| `INTERVIEWER` | `/recruiter` | Read-only recruiter portal; submit interview feedback |
| `TRAINING` | `/training` | Create batches, enroll candidates, mark attendance, mark training complete |
| `BRANCH_MANAGER` | `/management` | Approvals, probation (BM tier), reports |
| `COUNTRY_MANAGER` | `/management` | Approvals, probation (CM tier), reports |
| `MD` | `/management` | MRF approve/reject (MD-only), offer approval, probation (MD tier), reports |
| `EMPLOYEE` | `/employee` | Own profile, documents, training status, exam results, offer accept/reject |

**MRF approval is MD-only.** Other management roles see "MD approval required" in the UI.  
**Probation chain:** Branch Manager → Country Manager → MD (each must approve in sequence).

---

## Implemented Features

All core modules are fully operational:

- Auth (login, JWT, role redirect, password change, rate limiting)
- MRF lifecycle (DRAFT → PENDING → APPROVED/REJECTED; MD-only approval)
- Candidate management (CRUD, comments, status tracking, journey bar, per-field validation)
- Interview scheduling (multi-round, ONLINE/IN_PERSON/PHONE modes, feedback scoring, confirmation email)
- Training (batches, enrollment, attendance, mark complete → auto EXAM_PENDING)
- Exam management (multi-candidate link generation, result recording)
- Offer letters (salary breakdown, approval chain, send/accept/reject, appointment letters)
- Probation (BM→CM→MD chain, chemistry tests, extend/fail)
- Agency management (directory, contacts, geo-scoring against MRF, outreach templating)
- Communication engine (templates, bulk send, history)
- AI screening (TF-IDF batch screening per MRF + JD)
- Pipeline Kanban (drag-drop per MRF)
- Incoming mail (auto-parse to candidate, express-track for MANPOWER agencies)
- Geography intelligence (location cards, state grouping)
- Employee portal (journey stepper, documents, exams, offers)
- Reports & analytics (recruiter, management, training)
- Audit logs, notifications, system settings (localStorage)

**No upload policy:** All data entered via structured validated forms. No CSV import, no file upload, no resume upload anywhere in the application.

---

## Known Behaviour

- **Interview Complete = SELECTED** — Completing an interview always moves candidate to SELECTED, regardless of round number. Schedule subsequent rounds after completion.
- **Exam link requires EXAM_PENDING** — Training must be marked Complete before a candidate appears in exam generation.
- **One offer per candidate** — Candidates with existing offers are excluded from the offer creation dropdown. This is intentional.
- **Priya Patel (seed data)** — Has `INTERVIEW_SCHEDULED` status but no Interview record. Schedule via Interviews page → Schedule Interview.
- **Chemistry test ≠ probation pass** — Chemistry PASSED does not auto-advance probation. They are independent fields.
- **System Settings** — Stored in localStorage only; no backend persistence.
- **AI Screening filter** — Displayed results are client-side filtered. All results are stored in DB regardless of which MRF is selected.

---

## Stabilization Roadmap

Full codebase review (49 issues) documented in `docs/CODEBASE_REVIEW.md`.

### Phase 1 — Critical ✅ IMPLEMENTED

| ID | Issue | Status |
|---|---|---|
| P1-01 | Pipeline Kanban MRF dropdown always empty (`r.data.mrfs` → `r.data.data`) | Fixed |
| P1-02 | AI Screening MRF dropdown always empty (same bug) | Fixed |
| P1-03 | `PUT /notifications/mark-all-read` unreachable due to Express route ordering | Fixed |
| P1-04 | Offer rejection in Approvals silently did nothing | Fixed |
| P1-05 | `GET /agencies/my` crashed backend (missing Prisma model) | Fixed — route removed |

### Phase 2 — Security (Awaiting approval)

| ID | Issue | Severity | File |
|---|---|---|---|
| P2-01 | `POST/PUT /departments` — no role guard (any user can create/rename) | HIGH | `departments.js` |
| P2-02 | `POST /offers/:id/approve` — no role guard | HIGH | `offers.js` |
| P2-03 | `POST /mrf/:id/reject` — no role guard | HIGH | `mrf.js` |
| P2-04 | `POST /mrf/:id/submit` — no ownership check | MEDIUM | `mrf.js` |
| P2-05 | Dead `'MANAGING_DIRECTOR'` check in MRF approve (role is `'MD'`) | MEDIUM | `mrf.js` |
| P2-06 | `PUT /candidates/:id` spreads full `req.body` — system fields can be overwritten | HIGH | `candidates.js` |
| P2-07 | `GET /users` returns all users to any logged-in user | MEDIUM | `users.js` |
| P2-08 | `PUT /auth/change-password` — no input validation (can pass undefined) | LOW | `auth.js` |
| P2-09 | `GET /exams/token/:token` requires JWT — may block external candidates | MEDIUM | `exams.js` |
| P2-10 | CSV import + document upload routes still live in backend (policy violation) | HIGH | `candidates.js` |

### Phase 3 — Policy Compliance (Awaiting approval)

| ID | Issue | File |
|---|---|---|
| P3-01 | `Sourcing.jsx` is dead (not in router) but imports removed `sourcingAPI` | `Sourcing.jsx` |
| P3-02 | CSV import and document upload backend routes still exist | `candidates.js` |
| P3-03 | `multer` still imported in `candidates.js` | `candidates.js` |

### Phase 4 — Performance (Awaiting approval)

| ID | Issue | File |
|---|---|---|
| P4-01 | Training enrollment: N×3 DB queries per candidate in loop | `training.js` |
| P4-02 | Agency performance stats: loads all submissions into JS memory | `agencies.js` |
| P4-04 | AI scoring algorithm copy-pasted between `/screen` and `/screen/batch` | `aiScreening.js` |
| P4-05 | `reports.js` uses SQLite-specific raw SQL (`strftime`) — breaks on PostgreSQL | `reports.js` |
| P4-06 | Sequential ID generators (`count() + 1`) — race condition under concurrent load | `helpers.js` |

### Phase 5 — Maintainability (Awaiting approval)

| ID | Issue | File |
|---|---|---|
| P5-01 | 4 route files return `{ error }` instead of `{ message }` — silently swallowed by frontend | `sourcing.js`, `communications.js`, `aiScreening.js`, `incomingMail.js` |
| P5-02 | Dashboard `.catch(() => {})` blocks hide API failures from users | All 5 dashboards |
| P5-03–07 | Dead imports/state (`createNotification`, `tab`, `userAPI`, `Filter`, `fetch` shadow) | Various |
| P5-08–09 | MRF reject allows empty reason; MRF submit doesn't check current status | `mrf.js` |
| P5-10 | Empty comment can be saved; any user can edit any comment | `candidates.js` |
| P5-13 | `window.confirm()` / `window.prompt()` used in 6 pages instead of proper modals | Various |

---

## Deployment Checklist

- [ ] **Database** — Change `provider = "sqlite"` → `"postgresql"` in `schema.prisma`; update `DATABASE_URL`
- [ ] **JWT secret** — Set `JWT_SECRET` env var (current fallback is a hardcoded string)
- [ ] **CORS** — Set `FRONTEND_URL` env var to production domain (default: `http://localhost:5173`)
- [ ] **SMTP** — Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` for real email dispatch
- [ ] **PostgreSQL migration** — `reports.js` uses SQLite-specific `strftime` raw SQL; must be rewritten before DB switch (P4-05)
- [ ] **ID generation** — Sequential ID generators have a race condition under load (P4-06); resolve before multi-user production use

---

## Future Enhancements

- [ ] **Agency outreach history** — When HR sends outreach to an agency, the communication thread should be visible in the agency detail page (not just MRF detail)
- [ ] **Offer reject button in Approvals** — The `confirmReject` logic now handles `type === 'offer'` correctly, but no Reject button is visible in the Offers table in `Approvals.jsx`

---

## Testing Accounts

| Role | Email | Password | Portal |
|---|---|---|---|
| Admin | admin@recruitment.com | Admin@123 | /admin |
| MD | md@recruitment.com | Admin@123 | /management |
| Recruiter | recruiter@recruitment.com | Admin@123 | /recruiter |
| Training | training@recruitment.com | Admin@123 | /training |
| Employee | employee@recruitment.com | Admin@123 | /employee |

**Employee test candidate:** Alex Kumar (CAND-0006) — email matches `employee@recruitment.com` for journey bar and exam testing.

---

## End-to-End Test Flow

1. **Admin** — verify departments and users exist
2. **Recruiter** — Candidates → Add Candidate
3. **Recruiter** — MRF → Create MRF → Submit (status: PENDING)
4. **MD** — Approvals → Approve MRF (status: APPROVED)
5. **Recruiter** — Interviews → Schedule Interview → future date (candidate: INTERVIEW_SCHEDULED)
6. **Recruiter** — Interviews → Mark Complete (candidate: SELECTED)
7. **Training** — Batches → Enroll Candidate (candidate: TRAINING_IN_PROGRESS)
8. **Training** — Batches → Mark Complete on enrollment (candidate: EXAM_PENDING)
9. **Recruiter** — Exams → Generate Links → Record result PASS (candidate: EXAM_COMPLETED)
10. **Recruiter** — Offers → Create Offer (status: DRAFT)
11. **MD** — Approvals → Approve Offer
12. **Recruiter** — Offers → Send Offer (candidate: OFFER_SENT)
13. **Employee** — Offers → Accept (candidate: OFFER_ACCEPTED)
14. **Recruiter** — Appointment Letters → Generate (candidate: ONBOARDED)
15. **Management** — Probation → Create → Approve chain (BM → CM → MD)
