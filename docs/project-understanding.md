# RecruitPro ERP — Project Understanding Report

*Generated: 2026-06-02 | Source: Full codebase read*

---

## Section 1 — Executive Summary

### What RecruitPro ERP Is

RecruitPro ERP is a full-stack, role-based recruitment management system that covers the entire employee hiring lifecycle — from initial manpower requisition through candidate sourcing, interviewing, training, examination, offer management, onboarding, and probation confirmation.

### What Business Problem It Solves

A mid-size company needs to manage structured hiring across multiple departments, locations, and approval hierarchies. Without a system like this, the hiring process is fragmented — MRF approvals happen over email, candidate tracking is done in spreadsheets, training schedules are communicated informally, and probation reviews lack accountability. RecruitPro centralizes all of this into a single audited, role-aware system.

### Intended Users (Portal Types)

| Portal | Roles | Audience |
|---|---|---|
| `/admin` | ADMIN | IT/HR administrators managing system users and configuration |
| `/recruiter` | HR, RECRUITER, INTERVIEWER | Recruiters and HR staff managing day-to-day hiring |
| `/training` | TRAINING | Training coordinators managing batches and attendance |
| `/management` | BRANCH_MANAGER, COUNTRY_MANAGER, MD | Leadership viewing reports and approving key actions |
| `/employee` | EMPLOYEE | Hired candidates accessing their offer letter and documents |

Note: The README and `agency@recruitment.com` seed account reference an `/agency` portal for `AGENCY_PARTNER` role, but this portal and its routes were retired. The `GET /agencies/my` route was removed in Session 6 because the backing `AgencyPartner` Prisma model was never added to the schema. Agencies are now managed entirely by HR/Recruiter staff.

### Current Maturity Level

**Working (production-ready functionally):**
- Authentication, JWT, role-based routing
- MRF lifecycle (full DRAFT → APPROVED flow)
- Candidate management (CRUD, status tracking, comments)
- Interview scheduling (multi-round, feedback scoring, email confirmation)
- Training (batches, enrollment, attendance, completion)
- Exams (token-based links, result recording, max 2 attempts)
- Offer letters (salary breakdown, approval chain, appointment letters)
- Probation (three-level approval chain, extend/fail)
- Agency management (directory, outreach, performance stats)
- Communications (email templates, bulk send)
- AI Screening (TF-IDF, no external dependency)
- Pipeline Kanban (per-MRF stages, drag-move)
- Incoming Mail (auto-parse to candidate)
- Geography Intelligence (location-agency mapping)
- Reports (dashboard, candidate, interview, training, exam, MRF)
- Audit Logs (ADMIN-only, paginated)
- Notifications (per-user, mark read)
- Chemistry Tests (probation phase, score recording)
- Employee Documents (self-service, validated)

**Known Issues / Not Production Ready:**
- System Settings are stored in `localStorage` only — no backend persistence; settings are lost on browser clear
- Sequential ID generators have a race condition under concurrent load
- Several routes lack role guards (see Section 7)
- SQLite-specific raw SQL (`strftime`) in `reports.js` breaks on PostgreSQL
- JWT secret is currently a hardcoded non-random string in `.env`
- SMTP is unconfigured (emails log to console)

### Major Workflows at a High Level

1. **Requisition:** Recruiter creates MRF → submits for approval → MD approves/rejects
2. **Sourcing:** Recruiter creates candidates (manually or via incoming mail) → links to MRF → AI screening against JD → pipeline Kanban view
3. **Hiring:** Interview rounds scheduled and completed → candidate marked SELECTED
4. **Training:** Training batch created → candidates enrolled → attendance marked daily → batch marked complete → candidates advance to EXAM_PENDING
5. **Examination:** Exam links generated and sent → results recorded → pass advances to EXAM_COMPLETED
6. **Offer:** Offer letter created (salary breakdown) → approved by MD → sent to candidate → candidate accepts via Employee portal
7. **Onboarding:** Appointment letter generated → candidate status becomes ONBOARDED
8. **Probation:** Probation record created → three-level approval (BM → CM → MD) → status becomes CONFIRMED (or FAILED/EXTENDED)

---

## Section 2 — Architecture

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19.2.6 |
| Frontend build tool | Vite | 8.0.12 |
| CSS | TailwindCSS | 3.4.19 |
| Routing (frontend) | React Router DOM | 7.15.1 |
| HTTP client | Axios | 1.16.1 |
| Charts | Recharts | 3.8.1 |
| Date utilities | date-fns | 4.3.0 |
| Icon library | lucide-react | 1.16.0 |
| Toast notifications | react-hot-toast | 2.6.0 |
| Backend framework | Express | 4.21.1 |
| Backend runtime | Node.js | 20+ (ES Modules) |
| ORM | Prisma | 5.22.0 |
| Database | SQLite (dev) | file:./dev.db |
| Authentication | JWT (jsonwebtoken) | 9.0.2 |
| Password hashing | bcryptjs | 2.4.3 |
| Email | nodemailer | 6.9.16 |
| Rate limiting | express-rate-limit | 8.5.2 |
| File uploads | multer | 1.4.5-lts.1 |
| Validation | express-validator | 7.2.0 |

### System Architecture

```
User Request (Browser)
        |
        v
React + Vite Frontend (port 5173)
  - BrowserRouter (react-router-dom)
  - ProtectedRoute (role-aware redirects)
  - Axios (with JWT interceptor)
        |
        v (HTTP REST API calls to /api/*)
Express REST API (port 5000)
  - CORS: origin = FRONTEND_URL env var
  - express.json (50mb limit)
  - Global error handler
  - 21 route modules
  - authenticate middleware (JWT verify + DB user lookup)
  - authorize middleware (role array check)
        |
        v
Prisma ORM (Prisma Client 5)
  - Type-safe queries
  - Relation loading via `include`
  - Pagination via skip/take
        |
        v
SQLite Database (backend/prisma/dev.db)
```

### Frontend Architecture

**Routing:**
- `App.jsx` uses `BrowserRouter` from react-router-dom
- Routes organized into 5 portal groups: `/recruiter`, `/employee`, `/training`, `/management`, `/admin`
- Each portal group wraps in `<ProtectedRoute allowedRoles={[...]}>` + shared `<Layout>`
- Unauthorized role → redirected to that user's correct portal via `roleRedirects` map
- Unauthenticated → redirected to `/login`
- Unknown routes → catch-all redirects to `/`

**Auth State Management:**
- `AuthContext.jsx` provides `user`, `loading`, `login()`, `logout()` via React Context
- On mount, reads JWT from `localStorage.getItem('token')` and calls `GET /auth/me` to hydrate user
- Token stored in `localStorage` (not httpOnly cookie — XSS risk noted in Section 7)
- `AuthProvider` wraps the entire app
- Axios interceptor in `api.js` automatically appends `Authorization: Bearer <token>` on every request
- On 401 response, interceptor clears `localStorage` and redirects to `/login`

**API Calls:**
- Single `api.js` file in `services/` exports typed API objects (`mrfAPI`, `candidateAPI`, etc.)
- All calls go through a single `axios.create({ baseURL: 'http://localhost:5000/api' })` instance
- API base URL is hardcoded (not environment-variable driven)

### Backend Architecture

**Route Organization:**
- `server.js` imports and mounts 21 route files under `/api/*` prefixes
- Each route file is self-contained: imports Prisma, defines an Express Router, exports it
- All routes (except `GET /exams/token/:token`) require `authenticate` middleware
- Role enforcement uses `authorize(...roles)` middleware inline per route

**Middleware Chain:**
```
Request → CORS → express.json → express.urlencoded → authenticate (JWT+DB) → authorize (roles) → Route handler → Global error handler
```

**Auth / JWT:**
- Login: `POST /auth/login` — validates email/password (bcrypt), issues JWT signed with `JWT_SECRET`, 7-day expiry
- Rate-limited to 20 requests per 15 minutes (express-rate-limit)
- `authenticate` middleware: extracts Bearer token, verifies signature, fetches full user from DB (ensures `isActive`), attaches to `req.user`
- `authorize` middleware: checks `req.user.role` against an array of allowed roles; returns 403 if not included
- No refresh token mechanism; token expiry forces re-login

**Email:**
- `utils/mailer.js` initializes a nodemailer transporter lazily (only if `SMTP_USER` and `SMTP_PASS` are set)
- If SMTP is not configured, emails are logged to console (dev-friendly fallback)
- `sendEmail()` always resolves — email failures return `{ success: false, error }` without throwing
- Interview scheduling sends automated confirmation email to candidate
- Outreach emails sent via `mrf.js` with `{{variable}}` substitution

**Helper Utilities (`utils/helpers.js`):**
- `generateMRFNumber()` — sequential, format `MRF-NNNN`
- `generateCandidateId()` — sequential, format `CNNNN`
- `generateOfferNumber()` — sequential, format `OFR-NNNN`
- `generateAppointmentNumber()` — sequential, format `APT-NNNN`
- `generateBatchCode()` — sequential, format `BATCH-YYYY-NNN`
- `createAuditLog()` — writes to AuditLog table, swallows errors
- `createNotification()` — writes to Notification table, swallows errors
- `paginate()` — returns `{ skip, take }` for Prisma queries

### Data Flow Example: Scheduling an Interview

1. **Frontend** (`InterviewList.jsx`) — user fills the schedule form and submits
2. **Axios** posts `POST http://localhost:5000/api/interviews` with `{ candidateId, scheduledAt, interviewType, mode, meetingLink, round, duration, notes, panelIds }`
3. **Express** router in `interviews.js`:
   - `authenticate` middleware: verifies JWT, fetches user from DB
   - Route handler validates required fields (candidateId, scheduledAt, interviewType, mode)
   - Validates date is in the future
   - Validates `meetingLink` required for ONLINE mode
   - Creates `Interview` record in DB via Prisma
   - Updates `Candidate.status` to `INTERVIEW_SCHEDULED`
   - Calls `sendEmail()` with confirmation details (async, error swallowed)
4. **Response** 201 JSON with created interview + candidate name
5. **Frontend** receives response, calls `toast.success(...)`, re-fetches the interview list

---

## Section 3 — Module Inventory

### Authentication

- **Purpose:** Secure login/logout with JWT, role-based access, password management
- **Primary users:** All roles
- **Key frontend files:** `pages/auth/Login.jsx`, `context/AuthContext.jsx`, `services/api.js`
- **Key backend route files:** `routes/auth.js`
- **Database models used:** User
- **API route prefix:** `/api/auth`
- **Current status:** Working
- **Notable:** Rate-limited to 20 login attempts / 15 minutes. No refresh token. JWT stored in localStorage (see security note in Section 7).

---

### MRF Management (Manpower Requisition)

- **Purpose:** Create and manage manpower requisition forms through an approval lifecycle
- **Primary users:** HR, RECRUITER (create), MD (approve/reject)
- **Key frontend files:** `pages/recruiter/MRF/MRFList.jsx`, `MRFForm.jsx`, `MRFDetail.jsx`
- **Key backend route files:** `routes/mrf.js`
- **Database models used:** MRF, Department, User, Candidate, JobDescription, PipelineStage, AgencySubmission, MrfOutreach, IncomingMail, JobPosting
- **API route prefix:** `/api/mrf`
- **Current status:** Working
- **Notable:**
  - DRAFT → PENDING (submit) → APPROVED/REJECTED (MD only)
  - `POST /:id/approve` checks for roles `MANAGING_DIRECTOR` or `MD` — `MANAGING_DIRECTOR` is a dead check (no such role in system), but `MD` works correctly
  - `POST /:id/reject` has no role guard — any authenticated user can reject
  - Includes geo-scored agency suggestions, outreach email dispatch, outreach history

---

### Candidate Management

- **Purpose:** Track all candidates through the recruitment lifecycle
- **Primary users:** HR, RECRUITER
- **Key frontend files:** `pages/recruiter/Candidates/CandidateList.jsx`, `CandidateDetail.jsx`, `CandidateForm.jsx`
- **Key backend route files:** `routes/candidates.js`
- **Database models used:** Candidate, CandidateDocument, CandidateComment, Interview, Assessment, TrainingEnrollment, ExamAttempt, OfferLetter, AppointmentLetter, Probation, AIScreeningResult, AgencySubmission, Communication, PipelineEntry, ChemistryTest, MRF, User, Location
- **API route prefix:** `/api/candidates`
- **Current status:** Working
- **Notable:**
  - Duplicate detection on email OR phone at creation
  - CSV import route (`POST /import/csv`) exists in backend code despite the "no upload policy" stated in project memory; the frontend does not expose it
  - Document upload via multer exists at `POST /:id/documents` in backend but is not wired to a frontend button (policy: all data via forms)
  - `PUT /:id` spreads `req.body` directly — any client-provided field can overwrite system fields (security issue logged as P2-06)
  - Experience is stored in months as an integer; the list view displays it as "X yr Y mo"

---

### Interview Management

- **Purpose:** Schedule and track interview rounds; collect structured feedback
- **Primary users:** HR, RECRUITER (schedule), INTERVIEWER (feedback)
- **Key frontend files:** `pages/recruiter/Interviews/InterviewList.jsx`
- **Key backend route files:** `routes/interviews.js`
- **Database models used:** Interview, InterviewFeedback, Candidate, User
- **API route prefix:** `/api/interviews`
- **Current status:** Working
- **Notable:**
  - Completing an interview always sets candidate to `SELECTED` regardless of round number; multi-round hiring requires scheduling a new round after each completion
  - Automated email sent to candidate on scheduling
  - Panel IDs stored as a JSON string (no FK relationship — stored as `panelIds String @default("[]")`)
  - `GET /today` fetches today's scheduled interviews

---

### Training Module

- **Purpose:** Manage training batches, candidate enrollment, and daily attendance
- **Primary users:** TRAINING, HR/RECRUITER (for coordination view)
- **Key frontend files:** `pages/training/Batches.jsx`, `Attendance.jsx`, `Dashboard.jsx`, `Reports.jsx`, `pages/recruiter/Training/TrainingCoordination.jsx`
- **Key backend route files:** `routes/training.js`
- **Database models used:** TrainingBatch, TrainingEnrollment, TrainingAttendance, Candidate
- **API route prefix:** `/api/training`
- **Current status:** Working
- **Notable:**
  - Enrollment sets candidate status to `TRAINING_IN_PROGRESS`
  - Marking enrollment as `COMPLETED` sets candidate to `EXAM_PENDING`
  - Enrollment is unique per candidate (`candidateId` is `@unique` on `TrainingEnrollment`) — a candidate can only be in one batch
  - Attendance uses a composite unique key `(batchId, candidateId, date)` — upsert prevents duplicates

---

### Examination Module

- **Purpose:** Generate token-based exam links, track attempts, record results
- **Primary users:** HR, RECRUITER (generate/record), EMPLOYEE (receive link)
- **Key frontend files:** `pages/recruiter/Exams/ExamManagement.jsx`, `pages/employee/Exams.jsx`
- **Key backend route files:** `routes/exams.js`
- **Database models used:** ExamAttempt, Candidate, TrainingEnrollment
- **API route prefix:** `/api/exams`
- **Current status:** Working
- **Notable:**
  - Training enrollment must be `COMPLETED` before exam link generation is allowed
  - Maximum 2 attempts enforced at API level; 3rd attempt returns 400
  - `GET /token/:token` is the only unauthenticated route in the backend (intended for external candidate access)
  - Exam link format: `${FRONTEND_URL}/exam/${attempt.linkToken}` — but the frontend has no route at `/exam/:token`; this is a gap
  - PASS → candidate status `EXAM_COMPLETED`; FAIL → candidate status `REJECTED`

---

### Offer Letters & Appointment Letters

- **Purpose:** Generate offer letters with full salary breakdown; track acceptance; generate appointment letters
- **Primary users:** HR, RECRUITER (create/send), MD (approve), EMPLOYEE (accept/reject)
- **Key frontend files:** `pages/recruiter/Offers/OfferManagement.jsx`, `pages/management/Approvals.jsx`, `pages/employee/Offers.jsx`
- **Key backend route files:** `routes/offers.js`
- **Database models used:** OfferLetter, AppointmentLetter, Candidate
- **API route prefix:** `/api/offers`
- **Current status:** Working
- **Notable:**
  - `POST /offers/:id/approve` has no role guard — any authenticated user can approve an offer (logged as P2-02)
  - `GET /offers/mine` finds the candidate by matching `user.email` to `candidate.email` (no direct FK link between User and Candidate)
  - One offer per candidate enforced (unique constraint on `candidateId`)
  - Creating appointment letter sets candidate status to `ONBOARDED`
  - Allowances and deductions stored as JSON strings in the DB

---

### Probation Module

- **Purpose:** Three-level approval chain for probation review; chemistry test tracking
- **Primary users:** ADMIN, BRANCH_MANAGER (create/approve tier 1), COUNTRY_MANAGER (approve tier 2), MD (approve tier 3/final)
- **Key frontend files:** `pages/management/Probation.jsx` (includes ChemistryTestSection component)
- **Key backend route files:** `routes/probation.js`, `routes/chemistryTests.js`
- **Database models used:** Probation, Candidate, ChemistryTest, User
- **API route prefix:** `/api/probation`, `/api/chemistry-tests`
- **Current status:** Working
- **Notable:**
  - Three-level chain: `branchManagerApproval` → `countryManagerApproval` → `mdApproval`
  - All three must be present before MD approval sets status to `PASSED` and candidate to `CONFIRMED`
  - Chemistry test result does NOT auto-advance probation — they are independent tracking fields
  - `MANAGEMENT_ROLES` in `probation.js` includes `'HR'` but the frontend probation page is only accessible to `BRANCH_MANAGER, COUNTRY_MANAGER, MD, ADMIN` — inconsistency
  - Extend: sets `extendedEndDate` + status `EXTENDED`; Fail: sets status `FAILED` and candidate to `REJECTED`

---

### Agency Management

- **Purpose:** Manage recruitment agency directory, contacts, submissions, and performance
- **Primary users:** HR, RECRUITER, ADMIN
- **Key frontend files:** `pages/recruiter/Agencies/AgencyList.jsx`, `AgencyDetail.jsx`
- **Key backend route files:** `routes/agencies.js`
- **Database models used:** Agency, AgencyContact, AgencySubmission, AgencyLocation, Location, MRF, Candidate
- **API route prefix:** `/api/agencies`
- **Current status:** Working
- **Notable:**
  - AGENCY_PARTNER role/portal was retired (comment in `agencies.js` line 96-99)
  - Agency code generated with crypto.randomBytes — not sequential, collision-resistant
  - Tier system: STANDARD, PREFERRED, PREMIUM
  - Success rate tracked via `totalSubmissions` / `successfulHires` counters
  - Performance stats endpoint loads all submissions into JS memory (scalability issue at large volume)

---

### Communications / Email Center

- **Purpose:** Send templated or custom emails to candidates (individual or bulk)
- **Primary users:** HR, RECRUITER, ADMIN
- **Key frontend files:** `pages/recruiter/EmailCenter/EmailCenter.jsx`
- **Key backend route files:** `routes/communications.js`
- **Database models used:** Communication, EmailTemplate, Candidate, User
- **API route prefix:** `/api/communications`
- **Current status:** Working
- **Notable:**
  - Template system with `{{variable}}` substitution (client-side and server-side)
  - Bulk send: same subject/body sent to multiple candidates
  - Failed sends are recorded in `Communication.failureReason` (not silently ignored)
  - Template "delete" is a soft-deactivate (`isActive: false`), not a hard delete

---

### AI Screening

- **Purpose:** Score candidates against a job description using keyword matching
- **Primary users:** HR, RECRUITER, ADMIN
- **Key frontend files:** `pages/recruiter/AIScreening/AIScreening.jsx`
- **Key backend route files:** `routes/aiScreening.js`
- **Database models used:** JobDescription, AIScreeningResult, Candidate, MRF
- **API route prefix:** `/api/ai-screening`
- **Current status:** Working
- **Notable:**
  - No external ML dependency — pure Node.js TF-IDF style scoring
  - Score = skill match (50%) + experience fit (30%) + text keyword similarity (20%)
  - Thresholds: STRONGLY_RECOMMENDED (≥75), RECOMMENDED (≥55), CONSIDER (≥35), NOT_RECOMMENDED (<35)
  - Scoring algorithm is copy-pasted between `/screen` and `/screen/batch` routes (maintainability issue)
  - `AIScreeningResult` has a unique constraint on `candidateId` — one result per candidate (across all JDs)

---

### Recruitment Pipeline (Kanban)

- **Purpose:** Visual kanban board to track candidates through custom pipeline stages per MRF
- **Primary users:** HR, RECRUITER, ADMIN
- **Key frontend files:** `pages/recruiter/Pipeline/PipelineKanban.jsx`
- **Key backend route files:** `routes/pipeline.js`
- **Database models used:** PipelineStage, PipelineEntry, Candidate, MRF, AIScreeningResult
- **API route prefix:** `/api/pipeline`
- **Current status:** Working
- **Notable:**
  - Default 6 stages: Applied, Screening, Interview, Offer, Hired, Rejected
  - Moving a candidate removes them from all other stages in that MRF's pipeline
  - `PipelineStage` has unique constraint `(mrfId, order)` — prevents duplicate ordering
  - Each MRF has its own independent pipeline — stages are MRF-scoped

---

### Geographic Intelligence

- **Purpose:** Map candidates and agencies to geographic locations; view coverage intelligence
- **Primary users:** HR, RECRUITER, ADMIN
- **Key frontend files:** `pages/recruiter/Geography/GeographyIntelligence.jsx`
- **Key backend route files:** `routes/geography.js`
- **Database models used:** Location, AgencyLocation, Agency, Candidate
- **API route prefix:** `/api/geography`
- **Current status:** Working
- **Notable:**
  - Locations have unique constraint `(city, state, country)`
  - Intelligence endpoint joins candidates and agencies per location into a summary
  - Agencies can be assigned to multiple locations (many-to-many via `AgencyLocation`)

---

### Incoming Mail

- **Purpose:** Ingest raw agency email responses; parse to create or link candidate records
- **Primary users:** HR, RECRUITER, ADMIN
- **Key frontend files:** `pages/recruiter/IncomingMail/IncomingMail.jsx`
- **Key backend route files:** `routes/incomingMail.js`
- **Database models used:** IncomingMail, Agency, MRF, MrfOutreach, Candidate, User
- **API route prefix:** `/api/incoming-mail`
- **Current status:** Working
- **Notable:**
  - Auto-detects agency from sender email domain (matches `Agency.email` domain)
  - Auto-parse: extracts email, phone, name from mail body using regex
  - Manual ingestion only (no IMAP/SMTP listener — HR manually logs received emails)
  - Status flow: `UNPROCESSED` → `PROCESSED` / `LINKED` / `DISCARDED`
  - The README mentions an "express-track" for MANPOWER agencies, but the current backend code creates all candidates at `APPLIED` status; no `isExpressTrack` or `isContractual` fields exist in the schema

---

### Sourcing (Job Posting Tracker)

- **Purpose:** Track where MRF positions have been posted on external job platforms
- **Primary users:** HR, RECRUITER, ADMIN
- **Key frontend files:** `pages/recruiter/Sourcing/Sourcing.jsx` (exists as file but NOT registered in App.jsx router)
- **Key backend route files:** `routes/sourcing.js` (mounted as `/api/sourcing` — wait, actually in `server.js`, no `sourcing` route is imported; the route is named `sourcing.js` but it exports a router for job postings)
- **Database models used:** JobPosting, MRF, User
- **API route prefix:** Not mounted in server.js (the file exists but is not imported in server.js)
- **Current status:** Stub / Dead — frontend page not in router, backend route not mounted
- **Notable:** `sourcing.js` is a complete implementation with full CRUD for `JobPosting`, but it is not mounted in `server.js`. The frontend `Sourcing.jsx` page exists but has no route. This feature is effectively dead.

---

### Reports & Analytics

- **Purpose:** Aggregated reporting on candidates, interviews, training, exams, MRFs, and dashboard KPIs
- **Primary users:** All roles (different views)
- **Key frontend files:** `pages/recruiter/Reports/Reports.jsx`, `pages/management/Reports.jsx`, `pages/training/Reports.jsx`
- **Key backend route files:** `routes/reports.js`
- **Database models used:** Candidate, MRF, Interview, TrainingBatch, TrainingEnrollment, ExamAttempt
- **API route prefix:** `/api/reports`
- **Current status:** Working (with known issue)
- **Notable:**
  - Dashboard uses SQLite-specific `strftime` raw SQL — will break when migrating to PostgreSQL
  - CSV export handled entirely on the frontend (no backend endpoint for export)

---

### Administration

- **Purpose:** User management, department management, audit logs, system settings
- **Primary users:** ADMIN
- **Key frontend files:** `pages/admin/Users.jsx`, `Departments.jsx`, `AuditLogs.jsx`, `SystemSettings.jsx`
- **Key backend route files:** `routes/users.js`, `routes/departments.js`, `routes/auditLogs.js`
- **Database models used:** User, Department, AuditLog
- **API route prefix:** `/api/users`, `/api/departments`, `/api/audit-logs`
- **Current status:** Working
- **Notable:**
  - `SystemSettings` stores state in `localStorage` only — no backend persistence
  - `POST /departments` has no role guard — any authenticated user can create departments (P2-01)
  - Users are soft-deleted (`deletedAt` + `isActive: false`)
  - Audit logs are ADMIN-only (`authorize('ADMIN')` applied at router level)

---

### Notifications

- **Purpose:** In-app notifications per user
- **Primary users:** All roles
- **Key frontend files:** `components/layout/Header.jsx`
- **Key backend route files:** `routes/notifications.js`
- **Database models used:** Notification, User
- **API route prefix:** `/api/notifications`
- **Current status:** Working
- **Notable:**
  - Capped at last 50 notifications per user
  - `createNotification()` is defined in helpers.js but is not called anywhere in the current route handlers (notifications exist in DB only if seeded or called externally)
  - `PUT /mark-all-read` is registered before `PUT /:id/read` to prevent Express treating it as a param

---

### Employee Documents

- **Purpose:** Employees can self-manage their identity and credential documents
- **Primary users:** EMPLOYEE
- **Key frontend files:** `pages/employee/Documents.jsx`
- **Key backend route files:** `routes/employeeDocuments.js`
- **Database models used:** EmployeeDocument, User
- **API route prefix:** `/api/employee-documents`
- **Current status:** Working
- **Notable:**
  - Users can only manage their own documents (ownership check enforced)
  - Supported types: ID_PROOF, PAN_CARD, AADHAAR, PASSPORT, DRIVING_LICENSE, EDUCATION, CERTIFICATE, OTHER
  - Document number validated with regex `[a-zA-Z0-9\-\/\s]{2,50}`
  - No file upload — stores document metadata (number, authority, dates) only

---

### Chemistry Tests

- **Purpose:** Track chemistry/aptitude tests during the probation phase
- **Primary users:** ADMIN, HR, RECRUITER, BRANCH_MANAGER (assign), all MANAGEMENT roles (view)
- **Key frontend files:** Embedded as `ChemistryTestSection` component inside `pages/management/Probation.jsx`
- **Key backend route files:** `routes/chemistryTests.js`
- **Database models used:** ChemistryTest, Candidate, User
- **API route prefix:** `/api/chemistry-tests`
- **Current status:** Working
- **Notable:**
  - Auto-computes PASSED/FAILED when score is recorded against `passingScore`
  - Status flow: PENDING → SCHEDULED (if date set) → PASSED/FAILED/COMPLETED
  - Not linked to probation approval chain — independent tracking

---

## Section 4 — Database Understanding

### Schema Summary

The schema has 26 models across 5 conceptual domains:

**Core HR Domain:** User, Department  
**Requisition Domain:** MRF, JobDescription, JobPosting  
**Candidate Domain:** Candidate, CandidateDocument, CandidateComment, Assessment  
**Interview Domain:** Interview, InterviewFeedback  
**Training Domain:** TrainingBatch, TrainingEnrollment, TrainingAttendance  
**Examination Domain:** ExamAttempt  
**Offer Domain:** OfferLetter, AppointmentLetter  
**Probation Domain:** Probation, ChemistryTest  
**Agency Domain:** Agency, AgencyContact, AgencySubmission, AgencyLocation, MrfOutreach  
**Communication Domain:** EmailTemplate, Communication, IncomingMail  
**Pipeline Domain:** PipelineStage, PipelineEntry  
**Intelligence Domain:** Location, AIScreeningResult  
**System Domain:** Notification, AuditLog, EmployeeDocument  

### Top 15 Most Important Models

**1. User**
- Purpose: System user accounts with role-based access
- Key fields: `id` (cuid), `email` (unique), `password` (bcrypt hash), `role` (string, default RECRUITER), `departmentId`, `isActive`, `lastLogin`, `deletedAt`
- Relationships: belongs to Department; has MRFs created/approved, Candidates added, Interviews scheduled, TrainingBatches managed, Notifications, AuditLogs, CandidateComments, Communications sent, IncomingMails processed, JobPostings, ChemistryTests assigned, EmployeeDocuments

**2. Candidate**
- Purpose: The central entity — every person in the hiring pipeline
- Key fields: `id` (cuid), `candidateId` (unique, auto-generated `CNNNN`), `firstName`, `lastName`, `email` (unique), `phone`, `designation`, `experience` (months as int), `skills` (JSON string), `status` (string), `source`, `mrfId`, `locationId`, `addedById`, `deletedAt`
- Relationships: belongs to MRF (optional), User (adder), Location; has CandidateDocuments, CandidateComments, Interviews, Assessments, TrainingEnrollment (1:1), ExamAttempts, OfferLetter (1:1), AppointmentLetter (1:1), Probation (1:1), AIScreeningResult (1:1), AgencySubmissions, Communications, PipelineEntries, ChemistryTests

**3. MRF (Manpower Requisition Form)**
- Purpose: Tracks headcount requirements per department
- Key fields: `id`, `mrfNumber` (unique, `MRF-NNNN`), `departmentId`, `designation`, `vacancies`, `experience`, `skills` (JSON string), `status` (DRAFT/PENDING/APPROVED/REJECTED/CLOSED), `priority` (NORMAL/HIGH/LOW/URGENT), `createdById`, `approvedById`, `deletedAt`
- Relationships: belongs to Department, createdBy User, approvedBy User; has Candidates, JobDescription (1:1), PipelineStages, AgencySubmissions, MrfOutreach, IncomingMails, JobPostings

**4. Interview**
- Purpose: Tracks each interview round for a candidate
- Key fields: `id`, `candidateId`, `round` (int), `interviewType` (TECHNICAL/HR/CULTURAL/MANAGEMENT), `scheduledAt`, `mode` (ONLINE/IN_PERSON/PHONE), `meetingLink`, `status` (SCHEDULED/COMPLETED/CANCELLED), `panelIds` (JSON string), `scheduledById`
- Relationships: belongs to Candidate, scheduledBy User; has InterviewFeedback

**5. TrainingBatch**
- Purpose: A cohort of candidates in a training program
- Key fields: `id`, `batchName`, `batchCode` (unique, `BATCH-YYYY-NNN`), `designation`, `startDate`, `endDate`, `maxCapacity`, `trainer`, `status` (UPCOMING/ONGOING/COMPLETED), `managedById`
- Relationships: managedBy User; has TrainingEnrollments, TrainingAttendance

**6. TrainingEnrollment**
- Purpose: Links a single candidate to a single training batch (one-to-one)
- Key fields: `id`, `candidateId` (unique), `batchId`, `status` (ENROLLED/COMPLETED/DROPPED), `completionDate`
- Relationships: belongs to Candidate (1:1 due to unique), belongs to TrainingBatch

**7. ExamAttempt**
- Purpose: Tracks each exam attempt with a unique access token
- Key fields: `id`, `candidateId`, `examName`, `linkToken` (unique cuid), `linkExpiresAt`, `attemptNumber`, `status`, `score`, `passingScore`, `maxScore`, `result` (PASS/FAIL), `sentAt`, `completedAt`
- Relationships: belongs to Candidate

**8. OfferLetter**
- Purpose: Full salary breakdown offer per candidate (one per candidate)
- Key fields: `id`, `candidateId` (unique), `offerNumber` (unique, `OFR-NNNN`), `designation`, `department`, `basicSalary`, `hra`, `allowances` (JSON), `deductions` (JSON), `grossSalary`, `netSalary`, `ctc`, `status` (DRAFT/APPROVED/SENT/ACCEPTED/REJECTED), `expiryDate`, `approvedById`, `sentAt`, `respondedAt`
- Relationships: belongs to Candidate

**9. Probation**
- Purpose: Tracks probation period with three-level approval chain (one per candidate)
- Key fields: `id`, `candidateId` (unique), `startDate`, `endDate`, `extendedEndDate`, `status` (ONGOING/PASSED/FAILED/EXTENDED), `branchManagerApproval` (string), `countryManagerApproval` (string), `mdApproval` (string), `extensionReason`
- Relationships: belongs to Candidate

**10. Agency**
- Purpose: External recruitment agency directory
- Key fields: `id`, `agencyCode` (unique), `name`, `contactPerson`, `email`, `phone`, `tier` (STANDARD/PREFERRED/PREMIUM), `status` (ACTIVE/BLACKLISTED), `totalSubmissions`, `successfulHires`, `contractStart`, `contractEnd`, `deletedAt`
- Relationships: has AgencyContacts, AgencySubmissions, AgencyLocations, MrfOutreach, IncomingMails

**11. Communication**
- Purpose: Log of every outbound email/communication sent
- Key fields: `id`, `candidateId` (optional), `templateId` (optional), `sentById`, `subject`, `body`, `channel` (EMAIL/SMS), `status` (SENT/FAILED), `recipientEmail`, `failureReason`
- Relationships: belongs to Candidate (optional), EmailTemplate (optional), sentBy User

**12. AIScreeningResult**
- Purpose: Stores the result of screening a candidate against a job description (one per candidate)
- Key fields: `id`, `candidateId` (unique), `jdId`, `matchScore` (float), `skillsMatched` (JSON), `skillsMissing` (JSON), `experienceGap`, `recommendation`, `summary`, `modelVersion`
- Relationships: belongs to Candidate, JobDescription

**13. PipelineStage**
- Purpose: A named stage in an MRF's recruitment pipeline
- Key fields: `id`, `mrfId`, `name`, `order`, `color`, `isDefault`
- Relationships: belongs to MRF; has PipelineEntries
- Unique constraint: `(mrfId, order)`

**14. AuditLog**
- Purpose: Immutable record of every significant action in the system
- Key fields: `id`, `userId`, `action`, `entity`, `entityId`, `oldValue` (JSON string), `newValue` (JSON string), `ipAddress`, `createdAt`
- Relationships: belongs to User

**15. IncomingMail**
- Purpose: Stores raw inbound emails from agencies or candidates
- Key fields: `id`, `messageId` (unique), `fromEmail`, `fromName`, `subject`, `body`, `status` (UNPROCESSED/PROCESSED/LINKED/DISCARDED), `hasAttachment`, `agencyId`, `mrfId`, `outreachId`, `processedById`, `processedAt`
- Relationships: belongs to Agency (optional), MRF (optional), MrfOutreach (optional), processedBy User

### Important Enums

There are no formal Prisma `enum` types in the schema. All enum-like values are stored as plain `String` fields. The valid values are enforced in application code or frontend dropdowns:

**Candidate.status values (from frontend code):**
`APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, SELECTED, REJECTED, HOLD, TRAINING_PENDING, TRAINING_IN_PROGRESS, EXAM_PENDING, EXAM_COMPLETED, OFFER_SENT, OFFER_ACCEPTED, ONBOARDED, CONFIRMED`

**MRF.status values:** `DRAFT, PENDING, APPROVED, REJECTED, CLOSED`

**MRF.priority values:** `LOW, NORMAL, HIGH, URGENT`

**Interview.status values:** `SCHEDULED, COMPLETED, CANCELLED`

**Interview.interviewType values:** `TECHNICAL, HR, CULTURAL, MANAGEMENT`

**Interview.mode values:** `ONLINE, IN_PERSON, PHONE`

**TrainingBatch.status values:** `UPCOMING, ONGOING, COMPLETED`

**TrainingEnrollment.status values:** `ENROLLED, COMPLETED, DROPPED`

**ExamAttempt.status values:** `PENDING, LINK_SENT, PASSED, FAILED`

**ExamAttempt.result values:** `PASS, FAIL`

**OfferLetter.status values:** `DRAFT, APPROVED, SENT, ACCEPTED, REJECTED`

**Probation.status values:** `ONGOING, PASSED, FAILED, EXTENDED`

**Agency.tier values:** `STANDARD, PREFERRED, PREMIUM`

**Agency.status values:** `ACTIVE, BLACKLISTED`

**User.role values (from frontend roleRedirects):** `ADMIN, HR, RECRUITER, INTERVIEWER, TRAINING, BRANCH_MANAGER, COUNTRY_MANAGER, MD, EMPLOYEE`

**EmployeeDocument.docType values:** `ID_PROOF, PAN_CARD, AADHAAR, PASSPORT, DRIVING_LICENSE, EDUCATION, CERTIFICATE, OTHER`

### Candidate Lifecycle Data Model

| Stage | Status Value | Data Created |
|---|---|---|
| Applied | `APPLIED` | Candidate record created (candidateId, name, email, phone, designation, skills, source, mrfId) |
| Shortlisted | `SHORTLISTED` | Manual status change; may be placed in PipelineStage |
| Interview | `INTERVIEW_SCHEDULED` | Interview record created; auto-status update |
| Post-Interview | `SELECTED` / `REJECTED` | Interview.status = COMPLETED sets SELECTED; or manual REJECTED |
| Training | `TRAINING_IN_PROGRESS` | TrainingEnrollment record created; auto-status update |
| Post-Training | `EXAM_PENDING` | TrainingEnrollment.status = COMPLETED; auto-status update |
| Exam | `EXAM_COMPLETED` | ExamAttempt record with score; PASS sets EXAM_COMPLETED, FAIL sets REJECTED |
| Offer | `OFFER_SENT` | OfferLetter record created (DRAFT → APPROVED → SENT) |
| Offer Response | `OFFER_ACCEPTED` / `OFFER_REJECTED` | OfferLetter.status updated; Candidate.status updated |
| Onboarded | `ONBOARDED` | AppointmentLetter record created |
| Confirmed | `CONFIRMED` | Probation record PASSED (all 3 approvals received) |

### Approval Chain Implementation

Approval chains are implemented as plain string fields on the relevant model:

**MRF Approval (single-step, MD only):**
- `MRF.approvedById` — ID of approving user
- `MRF.approvedAt` — timestamp
- `MRF.rejectionReason` — text if rejected
- Status field drives the state: DRAFT → PENDING → APPROVED/REJECTED

**Offer Approval (single-step, any authenticated user — bug):**
- `OfferLetter.approvedById` — ID of approving user
- `OfferLetter.approvedAt` — timestamp
- Status field drives the state: DRAFT → APPROVED → SENT → ACCEPTED/REJECTED

**Probation Approval (three-step):**
- `Probation.branchManagerApproval` — string like "APPROVED by John Smith" or null
- `Probation.countryManagerApproval` — string like "APPROVED by Jane Doe" or null
- `Probation.mdApproval` — string like "APPROVED by MD Name" or null
- Logic in `POST /probation/:id/approve`: the requesting user's role determines which field is set
- Only when MD approves AND both other approvals are already set does status become PASSED

Note: Approvals are free-form strings, not structured records. There is no approval history or timestamp per approval level — only the final approver string.

---

## Section 5 — Recruitment Workflow

### Step 1: Candidate Creation

- **Frontend page:** `pages/recruiter/Candidates/CandidateList.jsx` → opens `CandidateForm.jsx` modal
- **API route:** `POST /api/candidates`
- **Database changes:** Creates `Candidate` record with auto-generated `candidateId` (`CNNNN`); writes `AuditLog`
- **Status after:** `APPLIED`
- **Validations:** firstName, lastName, email, phone, designation required; duplicate check on email OR phone returns 409

### Step 2: MRF Submission and Approval

- **Frontend page:** `pages/recruiter/MRF/MRFList.jsx` → `MRFForm.jsx` → submit button → `pages/management/Approvals.jsx`
- **API routes:** `POST /api/mrf` (create), `POST /api/mrf/:id/submit` (DRAFT → PENDING), `POST /api/mrf/:id/approve` (MD only)
- **Database changes:** Creates `MRF` record; submit updates `status = PENDING`; approve updates `status = APPROVED, approvedById, approvedAt`; writes `AuditLog`
- **Status after:** MRF status = APPROVED

### Step 3: Interview Scheduling

- **Frontend page:** `pages/recruiter/Interviews/InterviewList.jsx`
- **API route:** `POST /api/interviews`
- **Database changes:** Creates `Interview` record; updates `Candidate.status = INTERVIEW_SCHEDULED`
- **Status after:** Candidate status = `INTERVIEW_SCHEDULED`
- **Side effects:** Sends confirmation email to candidate (async)

### Step 4: Interview Completion

- **Frontend page:** `pages/recruiter/Interviews/InterviewList.jsx` → Complete button
- **API route:** `POST /api/interviews/:id/complete`
- **Database changes:** Updates `Interview.status = COMPLETED, completedAt`; updates `Candidate.status = SELECTED`
- **Status after:** Candidate status = `SELECTED`

### Step 5: Training Enrollment

- **Frontend page:** `pages/training/Batches.jsx` or `pages/recruiter/Training/TrainingCoordination.jsx`
- **API route:** `POST /api/training/batches/:id/enroll`
- **Database changes:** Creates `TrainingEnrollment` record (unique per candidate); updates `Candidate.status = TRAINING_IN_PROGRESS`
- **Status after:** Candidate status = `TRAINING_IN_PROGRESS`

### Step 6: Training Completion

- **Frontend page:** `pages/training/Batches.jsx` → update enrollment
- **API route:** `PUT /api/training/enrollments/:id` with `{ status: 'COMPLETED' }`
- **Database changes:** Updates `TrainingEnrollment.status = COMPLETED, completionDate`; updates `Candidate.status = EXAM_PENDING`
- **Status after:** Candidate status = `EXAM_PENDING`

### Step 7: Exam

- **Frontend page:** `pages/recruiter/Exams/ExamManagement.jsx`
- **API routes:** `POST /api/exams/generate-link` (creates ExamAttempt); `PUT /api/exams/:id/result` (records score)
- **Database changes:** Creates `ExamAttempt` record with unique `linkToken`; updates `Candidate.status = EXAM_PENDING` (on link gen) then `EXAM_COMPLETED` (PASS) or `REJECTED` (FAIL)
- **Status after:** Candidate status = `EXAM_COMPLETED` (on PASS)

### Step 8: Offer Letter

- **Frontend page (create):** `pages/recruiter/Offers/OfferManagement.jsx`
- **Frontend page (approve):** `pages/management/Approvals.jsx`
- **Frontend page (accept):** `pages/employee/Offers.jsx`
- **API routes:** `POST /api/offers` (create), `POST /api/offers/:id/approve`, `POST /api/offers/:id/send` → `POST /api/offers/:id/accept`
- **Database changes:** Creates `OfferLetter` record; transitions status through DRAFT → APPROVED → SENT → ACCEPTED; updates `Candidate.status = OFFER_SENT` then `OFFER_ACCEPTED`
- **Status after:** Candidate status = `OFFER_ACCEPTED`

### Step 9: Employee Onboarding

- **Frontend page:** `pages/recruiter/Offers/OfferManagement.jsx` (appointment letter section)
- **API route:** `POST /api/offers/appointments`
- **Database changes:** Creates `AppointmentLetter` record with unique `appointmentNumber`; updates `Candidate.status = ONBOARDED`
- **Status after:** Candidate status = `ONBOARDED`

### Step 10: Probation

- **Frontend page:** `pages/management/Probation.jsx`
- **API routes:** `POST /api/probation` (create), `POST /api/probation/:id/approve` (each approval level), `POST /api/probation/:id/extend`, `POST /api/probation/:id/fail`
- **Database changes:** Creates `Probation` record; successive approve calls fill `branchManagerApproval`, `countryManagerApproval`, `mdApproval`; when all three set, `Probation.status = PASSED` and `Candidate.status = CONFIRMED`
- **Status after:** Candidate status = `CONFIRMED`

---

## Section 6 — Roles & Permissions

### ADMIN

- **View:** All portals; full system access
- **Create/Modify:** Users (create, update, toggle-status, soft-delete), Departments (create, update); all candidate/MRF/interview/offer actions available
- **Approval authority:** Can approve offers (no guard), can approve probation as Branch Manager tier
- **Portals/pages:** `/admin` (Dashboard, Users, Departments, Audit Logs, System Settings); full access to `/recruiter` via `RECRUITER_ROLES` group

### HR

- **View:** Full recruiter portal
- **Create/Modify:** Candidates, MRFs, interviews, exams, offers, agencies, communications, pipeline, AI screening, incoming mail, departments (no guard!), users (create/update only, no delete)
- **Approval authority:** Can create users (with ADMIN); can approve probation via `MANAGEMENT_ROLES` in backend (but frontend probation page does not expose this)
- **Portals/pages:** `/recruiter` — all 11 sections

### RECRUITER

- **View:** Full recruiter portal
- **Create/Modify:** Same as HR role for all core recruitment operations
- **Approval authority:** None specifically (MRF approval is MD-only in practice)
- **Portals/pages:** `/recruiter` — all 11 sections (same sidebar as HR)

### INTERVIEWER

- **View:** Dashboard, Interviews, Candidates
- **Create/Modify:** Can submit interview feedback; can view/cancel interviews (no backend restriction, just frontend nav restriction)
- **Approval authority:** None
- **Portals/pages:** `/recruiter` — only Dashboard, My Interviews, Candidates in sidebar

### TRAINING

- **View:** Training portal only
- **Create/Modify:** Training batches (create, update), enroll candidates, mark attendance, update enrollment status (including marking COMPLETED)
- **Approval authority:** None
- **Portals/pages:** `/training` — Dashboard, Training Batches, Attendance, Reports

### BRANCH_MANAGER

- **View:** Management portal
- **Create/Modify:** Can create probation records; can extend probation; can fail probation
- **Approval authority:** Tier 1 of probation approval chain; can approve MRF (frontend shows approve button for `canApprove` roles, but backend `POST /mrf/:id/approve` only allows `MANAGING_DIRECTOR` or `MD`)
- **Portals/pages:** `/management` — Dashboard, Reports, Probation (no Approvals tab in sidebar)
- **Inconsistency:** Frontend `MRFList.jsx` sets `canApprove` to include `BRANCH_MANAGER` (shows Approve button), but backend rejects with 403 unless role is `MD`. The approve button appears but fails on click.

### COUNTRY_MANAGER

- **View:** Management portal
- **Create/Modify:** Can update probation records
- **Approval authority:** Tier 2 of probation approval chain; same MRF approval inconsistency as BRANCH_MANAGER
- **Portals/pages:** `/management` — Dashboard, Reports, Probation (same as BRANCH_MANAGER)

### MD (Managing Director)

- **View:** Management portal with Approvals tab
- **Create/Modify:** Can approve/reject MRFs (sole authority), approve offer letters, final approval of probation chain
- **Approval authority:** MRF approval (sole authority), offer letter approval (though no guard — any user can call the API), tier 3 (final) of probation
- **Portals/pages:** `/management` — Dashboard, Analytics, Approvals, Probation

### EMPLOYEE

- **View:** Employee portal only
- **Create/Modify:** Own profile (read only at API level), own documents (add/delete), own exam results (view), own offer letter (accept/reject)
- **Approval authority:** Can accept/reject their own offer letter
- **Portals/pages:** `/employee` — Dashboard, My Profile, Documents, Examinations, Offer Letter
- **Note:** Employee is linked to Candidate record by email match (`user.email == candidate.email`) — no direct FK

### Notable Permission Inconsistencies Found in Code

1. **MRF Approval UI vs Backend:** Frontend shows Approve/Reject buttons for `BRANCH_MANAGER` and `COUNTRY_MANAGER` in `MRFList.jsx`, but the backend `POST /mrf/:id/approve` only permits `'MANAGING_DIRECTOR'` or `'MD'` — both non-MD management roles get 403 on click.

2. **`POST /departments` — No Role Guard:** Any authenticated user (even EMPLOYEE) can create or update departments. Only `GET /departments` is unguarded, but `POST` and `PUT` are also unguarded.

3. **`POST /offers/:id/approve` — No Role Guard:** Any authenticated user can approve an offer letter via API, though the UI only shows the button to management roles.

4. **`POST /mrf/:id/reject` — No Role Guard:** Any user can reject an MRF.

5. **`GET /users` — Available to All Roles:** Returns all users to any authenticated user. Contains no PII beyond names, emails, and roles, but still exposes organizational structure.

6. **Probation `MANAGEMENT_ROLES` Includes `'HR'`:** The backend `probation.js` includes `HR` in `MANAGEMENT_ROLES` (for list/get/update access), but the frontend probation page is under `/management` which blocks HR. HR can access via API but not via UI.

7. **Dead Role Check:** `POST /mrf/:id/approve` checks for `req.user.role !== 'MANAGING_DIRECTOR' && req.user.role !== 'MD'`. The role `MANAGING_DIRECTOR` does not exist in the system; only `MD` is used. This dead check is harmless but confusing.

---

## Section 7 — Technical Debt

### Architecture Concerns

1. **Sourcing module is dead:** `routes/sourcing.js` is fully implemented but not mounted in `server.js`. `Sourcing.jsx` page exists but has no route in `App.jsx`. The `JobPosting` model exists in the schema. Feature is completely disconnected.

2. **No route for exam public access:** Exam link format is `${FRONTEND_URL}/exam/${token}`, but `App.jsx` has no `/exam/:token` route. External candidates receiving exam links cannot complete them via the frontend.

3. **Employee↔Candidate linked by email string match:** No FK between `User` and `Candidate`. Business logic in `GET /offers/mine` relies on `user.email === candidate.email`. This breaks if email changes on either side.

4. **Agency Partner portal retired mid-project:** The README and seed data still reference AGENCY_PARTNER role and `/agency` portal, but the implementation was removed. Seed data has `agency@recruitment.com` which cannot log into a functional portal.

5. **System Settings are localStorage-only:** All admin settings (company name, timezone, security preferences, notification flags) are stored in the browser's localStorage. They are per-browser, per-user, non-persistent, and not shared across machines.

6. **Single `.env` file with hardcoded secrets:** `JWT_SECRET` in the committed `.env` file is a readable, non-random string (`recruitment_erp_jwt_secret_key_2024_very_secure`).

### Code Duplication

7. **AI scoring algorithm copy-pasted:** The scoring logic (skill match + experience + text similarity) is duplicated verbatim between `POST /ai-screening/screen` and `POST /ai-screening/screen/batch` in `aiScreening.js`. Any bug fix must be applied twice.

8. **Pagination duplicated:** Each route file re-implements its own `skip`/`take` logic. Some use the shared `paginate()` helper from `helpers.js`; others inline their own formula. Inconsistency across `probation.js`, `users.js`, `communications.js`.

9. **Multiple Prisma client instances:** Every route file creates its own `new PrismaClient()`. Prisma recommends a single shared instance to avoid connection pool exhaustion in production.

10. **`HR_ROLES` constant redefined in every file:** `const HR_ROLES = ['ADMIN', 'HR', 'RECRUITER']` is copy-pasted into `agencies.js`, `aiScreening.js`, `communications.js`, `incomingMail.js`, `pipeline.js`, `sourcing.js` with minor variations.

### Security Concerns

11. **JWT in localStorage:** Vulnerable to XSS attacks. Any injected script can read the token. Industry standard is httpOnly cookies for JWT storage.

12. **`PUT /candidates/:id` spreads `req.body` unfiltered:** A client can overwrite `addedById`, `createdAt`, `candidateId`, or any other system field by including it in the request body.

13. **No role guard on `POST /offers/:id/approve`:** Any authenticated user can approve any offer letter via API.

14. **No role guard on `POST /mrf/:id/reject`:** Any authenticated user can reject any MRF.

15. **No role guard on `POST/PUT /departments`:** Any user can create or rename departments.

16. **`GET /exams/token/:token` requires JWT:** The README says this is a public endpoint (for candidates), but `router.use(authenticate)` at the top of `exams.js` applies to all routes including this one, requiring a valid JWT even for external exam access.

17. **CORS origin is a single string:** `cors({ origin: process.env.FRONTEND_URL })` — only allows one origin. Fine for development, but may cause issues in multi-domain production deployments.

18. **CSV import and document upload routes still exist in backend:** Despite the "no upload policy" (project memory), `POST /candidates/import/csv` and `POST /candidates/:id/documents` are live API endpoints with multer handling. They are not exposed in the frontend UI, but exist at the API level.

### Performance Concerns

19. **N+1 queries in training enrollment:** `POST /training/batches/:id/enroll` loops over `candidateIds` and runs `findUnique` + `create` + `update` for each candidate individually.

20. **`GET /agencies/:id/performance` loads all submissions into JS memory:** Fetches all `AgencySubmission` records for an agency, then filters by candidate status in Node.js — not SQL.

21. **Sequential ID generation has race conditions:** `generateCandidateId()` does `count() + 1`. Two simultaneous inserts will compute the same count and produce a duplicate ID (mitigated by the `@unique` constraint throwing an error, but the error is not gracefully handled for the caller).

22. **No database indexes beyond primary keys:** The schema has no `@@index` directives. Queries on `status`, `deletedAt`, `mrfId`, `candidateId` on large tables will do full scans.

23. **SQLite-specific raw SQL in reports:** `prisma.$queryRaw\`SELECT strftime...\`` in `reports.js` breaks on PostgreSQL.

### Maintainability Concerns

24. **Inconsistent error response shape:** Most routes return `{ message: '...' }` on error, but `sourcing.js`, `communications.js`, `aiScreening.js`, and `incomingMail.js` return `{ error: '...' }`. The Axios interceptor in the frontend looks for `err.response?.data?.message` — these routes' errors are silently swallowed.

25. **`window.confirm()` and `window.prompt()` in production UI:** Used in at least 6 pages for delete confirmation and rejection reason input. These are not styleable, block the main thread, and are blocked in some browser contexts.

26. **No input validation on `PUT /auth/change-password`:** `currentPassword` and `newPassword` can be `undefined`, causing a bcrypt error with a generic 500 response.

27. **`createNotification()` is never called:** Defined in `helpers.js` and imported as a dead import in some route files. In-app notifications can only be created if called explicitly — none of the current route handlers use it.

28. **`Sourcing.jsx` imports a non-existent API:** The dead `Sourcing.jsx` page imports `sourcingAPI` which was removed from `api.js`. This file would throw an import error if it were ever routed.

---

## Section 8 — Deployment Readiness

| Area | Status | Notes |
|---|---|---|
| **Production build configuration** | Partially Ready | `npm run build` works for frontend. Backend has no build step (runs raw Node.js). No Docker/PM2/process manager configured. |
| **Database migration strategy** | Not Ready | Using SQLite for dev. Schema must be changed to PostgreSQL; `strftime` raw SQL must be rewritten; migration files must be tested. |
| **Environment variables** | Partially Ready | `.env` file exists with correct structure. JWT_SECRET is a non-random hardcoded string. SMTP credentials are blank. FRONTEND_URL is localhost-hardcoded in `api.js` (separate from `.env`). |
| **Email configuration** | Not Ready | SMTP_USER and SMTP_PASS are blank. All emails fall back to console logging. |
| **File storage** | Partially Ready | `uploads/` directory uses local disk. Must migrate to S3 or equivalent for multi-server or cloud deployment. Multer configured for disk storage. |
| **Authentication security** | Not Ready | JWT in localStorage (XSS risk). JWT secret is non-random. No refresh token. No session timeout implementation (settings page has a toggle but no backend enforcement). |
| **API security** | Not Ready | Multiple routes lack role guards (see Section 7). `req.body` spread vulnerabilities. No input validation beyond ad-hoc checks. |
| **Error handling** | Partially Ready | Global error handler exists in `server.js`. Individual route try/catch is consistent. But 401 handling is client-side only. Inconsistent error response shapes (`message` vs `error`). |
| **Logging** | Not Ready | `console.log`/`console.error` only. No structured logging. No request logging middleware (e.g., morgan). No log aggregation. |

---

## Section 9 — Developer Learning Guide

Recommended reading order for a new developer joining the project:

1. **`README.md`** — High-level overview, quick start, portal list, candidate status flow, business rules. Read this first to understand the domain.

2. **`docs/TODO.md`** — Current project state, known bugs, roadmap, end-to-end test flow. Tells you exactly what works and what is broken.

3. **`backend/prisma/schema.prisma`** — The data model is the source of truth. Understanding models and relationships unlocks everything else. Spend time here.

4. **`backend/src/server.js`** — Tiny file. Shows which routes are mounted and in what order. The full API surface.

5. **`backend/src/middleware/auth.js`** — Understand `authenticate` and `authorize` before reading any route.

6. **`backend/src/utils/helpers.js`** + **`backend/src/utils/mailer.js`** — Shared utilities used across all routes.

7. **`backend/src/routes/candidates.js`** — Most important route file. The Candidate model is the central entity. Reading this shows the standard patterns used everywhere else.

8. **`backend/src/routes/auth.js`** — Short file. Shows login flow, JWT issuance, rate limiting.

9. **`frontend/src/App.jsx`** — All routes in one place. Understand the 5 portals and their allowed roles.

10. **`frontend/src/context/AuthContext.jsx`** + **`frontend/src/services/api.js`** — How auth state is maintained and how API calls are made. Read together.

11. **`frontend/src/components/layout/Sidebar.jsx`** — How each role's navigation is defined. Maps roles to pages.

12. **`backend/src/routes/mrf.js`** — Shows the MRF lifecycle with approval, outreach, and agency suggestion logic. Good example of a complex route file.

13. **`backend/src/routes/probation.js`** — Shows the multi-level approval pattern used for probation.

14. **`frontend/src/pages/management/Probation.jsx`** — Most complex frontend page. Shows the `ChemistryTestSection` embedded component pattern.

15. **`frontend/src/pages/recruiter/Candidates/CandidateList.jsx`** + **`CandidateDetail.jsx`** — Core recruiter workflow pages. Standard patterns for list/detail views.

16. **`docs/CODEBASE_REVIEW.md`** (if available) — Referenced in TODO.md as containing 49 detailed issues. Read after understanding the codebase to understand what needs fixing.

---

## Section 10 — Context Compression Recommendations

After reviewing `docs/TODO.md` (the primary context/state document):

### Recommended to Keep

- **Architecture table** — Stack, ports, API base, response shapes. Directly useful for every coding session.
- **Module table** — Route → file mapping. Critical for navigation.
- **Recruitment Workflow section** — The status transition diagram and description of which actions trigger which transitions is the single most-referenced piece of information.
- **Roles & Permissions table** — Quick reference for who can do what; frequently consulted when adding features.
- **Phase 2 (Security issues P2-01 through P2-10)** — These are unfixed bugs awaiting approval. Must not be lost.
- **Phase 4 (Performance issues)** — The race condition on ID generation and the PostgreSQL incompatibility in reports.js are blockers for production.
- **Deployment Checklist** — The 6 pre-production items are critical reminders.
- **Known Behaviour section** — Documents intentional but surprising behaviors (interview complete = SELECTED, one offer per candidate, etc.) that would otherwise be reported as bugs.
- **Testing Accounts table** — Needed for every manual test session.
- **End-to-End Test Flow** (15 steps) — The primary QA script.

### Recommended to Remove

- **Phase 1 (P1-01 through P1-05)** — These are marked as IMPLEMENTED (fixed). They only add noise. Keeping resolved bugs in the state document creates confusion about what still needs work.
- **Phase 3 (Policy Compliance P3-01 through P3-03)** — These reference the sourcing module and upload routes. The policy decision has been made; the items are awaiting a cleanup PR that is straightforward. Either fix them or note them in Phase 2.
- **Phase 5 (Maintainability)** — Many of these (dead imports, window.confirm usage) are low-priority cleanup items. The sheer count dilutes attention from the important security and performance issues.

### Recommended to Summarize

- **Phase 2 Security issues** — Consolidate into a single table with columns: `ID | Route | Issue | Fix` without the verbose descriptions. The current format is good but verbose.
- **Future Enhancements** — Keep but compress to a flat bullet list. Currently only 2 items; likely to grow.
- **The Agency Partner note** — Currently scattered across README, TODO, and code comments. Consolidate into one clear statement: "AGENCY_PARTNER role and /agency portal were retired in Session 6. The route `/agencies/my` was removed. Agency management is HR-only. The seed account `agency@recruitment.com` has no functional portal."
