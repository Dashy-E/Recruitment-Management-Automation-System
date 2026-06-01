# RecruitPro ERP — Complete Project Study Guide

> **Purpose:** Teach the project owner how this system works internally so they can explain it, present it, debug it, modify it, and answer architecture questions confidently. Every reference in this document points to an actual file, route, model, or component in this codebase.

---

## 1. Executive Summary

### What is RecruitPro ERP?

RecruitPro is a full-stack, role-based **Recruitment Enterprise Resource Planning** system. It digitises and manages the entire lifecycle of hiring — from raising a vacancy request to onboarding a permanent employee — for a mid-to-large Indian company with multiple management layers.

### What business problem does it solve?

Before a system like this, companies manage recruitment through emails, spreadsheets, and WhatsApp groups. This creates:
- No audit trail of who approved what
- No visibility into where a candidate is in the process
- Manual coordination between HR, interviewers, training staff, and management
- No standardised offer/appointment letter generation

RecruitPro solves all of these by centralising every step in one application with role-appropriate access.

### Who are the users?

| Role | Description | Portal |
|---|---|---|
| ADMIN | System administrator, manages users and departments | `/admin` |
| HR / RECRUITER | Raises MRFs, manages candidates, schedules interviews, creates offers | `/recruiter` |
| INTERVIEWER | Can view candidates and submit interview feedback | `/recruiter` |
| TRAINING | Manages training batches, attendance, marks completion | `/training` |
| BRANCH_MANAGER | Reviews probation; views reports | `/management` |
| COUNTRY_MANAGER | Reviews probation; views reports | `/management` |
| MD | Approves MRFs, approves offers, full management access | `/management` |
| EMPLOYEE | Views their own journey, offer, exam, documents | `/employee` |

### Major Modules

1. MRF Management (vacancy creation and approval)
2. Candidate Management (pipeline tracking)
3. Interview Scheduling and Feedback
4. Training Batch Management and Attendance
5. Examination Link Generation and Results
6. Offer Letter and Appointment Letter
7. Employee Self-Service Portal
8. Probation and Chemistry Test Tracking
9. Agency Management and Outreach
10. Communication Engine (email templates, bulk send)
11. Recruitment Pipeline (Kanban)
12. AI Screening (TF-IDF based resume matching)
13. Geographic Workforce Intelligence
14. Incoming Mail Processing
15. Admin: Users, Departments, Audit Logs, System Settings

### Why this architecture?

```
Browser (React 19 + Vite)         port 5173
         │
         │ HTTP + JSON (axios)
         ▼
Express.js REST API               port 5000
         │
         │ Prisma ORM (type-safe queries)
         ▼
SQLite Database (dev.db)
```

- **React + Vite**: Fast development server, component-based UI, easy state management
- **Express.js**: Lightweight, unopinionated, perfect for JSON APIs
- **Prisma**: Type-safe ORM with schema-first design; one `schema.prisma` file defines the entire DB structure
- **SQLite**: Zero-config, file-based, perfect for development and demos; can swap to PostgreSQL for production
- **JWT**: Stateless authentication — no server-side sessions needed
- **TailwindCSS**: Utility-first CSS; no separate CSS files needed

---

## 2. Complete System Map

### 2.1 Authentication Module
- **Purpose**: Login, JWT issue, route protection, role redirect
- **Primary Users**: All roles
- **DB Models**: `User`
- **Backend**: `backend/src/routes/auth.js`, `backend/src/middleware/auth.js`
- **Frontend**: `frontend/src/pages/auth/Login.jsx`, `frontend/src/context/AuthContext.jsx`

### 2.2 MRF Management
- **Purpose**: Create and track Manpower Requisition Forms (vacancy requests)
- **Primary Users**: RECRUITER (create), MD (approve)
- **DB Models**: `MRF`, `Department`
- **Backend**: `backend/src/routes/mrf.js`
- **Frontend**: `frontend/src/pages/recruiter/MRF/MRFList.jsx`, `MRFDetail.jsx`, `MRFForm.jsx`

### 2.3 Candidate Management
- **Purpose**: Add, track, and manage candidates through the hiring pipeline
- **Primary Users**: RECRUITER, HR
- **DB Models**: `Candidate`, `CandidateComment`, `CandidateDocument`
- **Backend**: `backend/src/routes/candidates.js`
- **Frontend**: `CandidateList.jsx`, `CandidateDetail.jsx`, `CandidateForm.jsx`

### 2.4 Interview Management
- **Purpose**: Schedule multi-round interviews, collect structured feedback
- **Primary Users**: RECRUITER, INTERVIEWER
- **DB Models**: `Interview`, `InterviewFeedback`
- **Backend**: `backend/src/routes/interviews.js`
- **Frontend**: `frontend/src/pages/recruiter/Interviews/InterviewList.jsx`

### 2.5 Training Management
- **Purpose**: Create training batches, enroll candidates, mark attendance, complete training
- **Primary Users**: TRAINING role
- **DB Models**: `TrainingBatch`, `TrainingEnrollment`, `TrainingAttendance`
- **Backend**: `backend/src/routes/training.js`
- **Frontend**: `frontend/src/pages/training/Batches.jsx`, `Attendance.jsx`

### 2.6 Examination Management
- **Purpose**: Generate tokenised exam links, record results
- **Primary Users**: RECRUITER
- **DB Models**: `ExamAttempt`
- **Backend**: `backend/src/routes/exams.js`
- **Frontend**: `frontend/src/pages/recruiter/Exams/ExamManagement.jsx`

### 2.7 Offer Letters
- **Purpose**: Create, approve, send, and track offer letters
- **Primary Users**: RECRUITER (create/send), MD (approve), EMPLOYEE (accept/reject)
- **DB Models**: `OfferLetter`
- **Backend**: `backend/src/routes/offers.js`
- **Frontend**: `OfferManagement.jsx` (recruiter), `frontend/src/pages/employee/Offers.jsx`

### 2.8 Appointment Letters
- **Purpose**: Generate appointment letter after offer acceptance, triggers ONBOARDED status
- **Primary Users**: RECRUITER
- **DB Models**: `AppointmentLetter`
- **Backend**: `backend/src/routes/offers.js` (`/appointments` sub-routes)
- **Frontend**: Part of `OfferManagement.jsx`

### 2.9 Probation Tracking
- **Purpose**: Manage new employee probation period with 3-level approval chain (BM → CM → MD)
- **Primary Users**: BRANCH_MANAGER, COUNTRY_MANAGER, MD
- **DB Models**: `Probation`, `ChemistryTest`
- **Backend**: `backend/src/routes/probation.js`, `backend/src/routes/chemistryTests.js`
- **Frontend**: `frontend/src/pages/management/Probation.jsx`

### 2.10 Agency Management
- **Purpose**: Maintain a directory of staffing agencies, track outreach and submissions
- **Primary Users**: RECRUITER
- **DB Models**: `Agency`, `AgencyContact`, `AgencySubmission`, `AgencyLocation`, `MrfOutreach`
- **Backend**: `backend/src/routes/agencies.js`
- **Frontend**: `AgencyList.jsx`, `AgencyDetail.jsx`

### 2.11 Incoming Mail Processing
- **Purpose**: Log and process inbound emails from agencies; auto-create candidates
- **Primary Users**: RECRUITER
- **DB Models**: `IncomingMail`
- **Backend**: `backend/src/routes/incomingMail.js`
- **Frontend**: `frontend/src/pages/recruiter/IncomingMail/IncomingMail.jsx`

### 2.12 Communication Engine
- **Purpose**: Send templated bulk emails to candidates, manage email templates
- **Primary Users**: RECRUITER
- **DB Models**: `Communication`, `EmailTemplate`
- **Backend**: `backend/src/routes/communications.js`
- **Frontend**: `frontend/src/pages/recruiter/EmailCenter/EmailCenter.jsx`

### 2.13 Recruitment Pipeline
- **Purpose**: Kanban-style drag-and-drop view of candidate stages per MRF
- **Primary Users**: RECRUITER
- **DB Models**: `PipelineStage`, `PipelineEntry`
- **Backend**: `backend/src/routes/pipeline.js`
- **Frontend**: `frontend/src/pages/recruiter/Pipeline/PipelineKanban.jsx`

### 2.14 AI Screening
- **Purpose**: TF-IDF based keyword matching between candidate profiles and job descriptions
- **Primary Users**: RECRUITER
- **DB Models**: `JobDescription`, `AIScreeningResult`
- **Backend**: `backend/src/routes/aiScreening.js`
- **Frontend**: `frontend/src/pages/recruiter/AIScreening/AIScreening.jsx`

### 2.15 Employee Self-Service
- **Purpose**: Employee views their own journey, documents, exams, and offer letter
- **Primary Users**: EMPLOYEE
- **DB Models**: `EmployeeDocument`, `ExamAttempt`, `OfferLetter`
- **Backend**: `/api/employee-documents`, `/api/offers/mine`, `/api/exams`
- **Frontend**: `frontend/src/pages/employee/` (Dashboard, Documents, Exams, Offers, Training)

### 2.16 Administration
- **Purpose**: Manage users, departments, audit logs, system settings
- **Primary Users**: ADMIN
- **DB Models**: `User`, `Department`, `AuditLog`
- **Backend**: `users.js`, `departments.js`, `auditLogs.js`
- **Frontend**: `frontend/src/pages/admin/` (Users, Departments, AuditLogs, SystemSettings)

### 2.17 Geographic Intelligence
- **Purpose**: Map candidate and agency locations; view workforce distribution by state
- **Primary Users**: RECRUITER
- **DB Models**: `Location`, `AgencyLocation`
- **Backend**: `backend/src/routes/geography.js`
- **Frontend**: `frontend/src/pages/recruiter/Geography/GeographyIntelligence.jsx`

### 2.18 Reports & Analytics
- **Purpose**: Dashboards showing pipeline KPIs, hiring funnel, batch performance
- **Primary Users**: RECRUITER (own), MD (company-wide)
- **Backend**: `backend/src/routes/reports.js`
- **Frontend**: `Reports.jsx` in recruiter and management portals

---

## 3. Database Learning Guide

> File: `backend/prisma/schema.prisma`

### 3.1 Top 10 Models to Understand First

```
1.  User              — who logs in; drives all authorization
2.  Candidate         — the central entity; every module revolves around it
3.  MRF               — vacancy request that starts the hiring process
4.  Interview         — scheduled conversation between interviewer and candidate
5.  TrainingEnrollment — links candidate to a training batch
6.  ExamAttempt       — tokenised exam link and result record
7.  OfferLetter       — salary offer; triggers status chain to OFFER_ACCEPTED
8.  Probation         — post-hire tracking; 3-level approval chain
9.  Agency            — external staffing agency record
10. AuditLog          — every important action is recorded here
```

### 3.2 Model-by-Model Explanation

#### User
```
What: Represents every person who logs in to the system.
Why:  Authentication and authorization hinge on this model. 
      Every other model that needs an "actor" FK points here 
      (mrfCreatedBy, scheduledBy, approvedById, etc.).
Fields of note:
  - role: String  — determines which portal the user sees
  - isActive: Boolean — inactive users are rejected at login
  - departmentId: FK → Department
Modules: ALL modules use User in some way.
```

#### Candidate
```
What: A job applicant moving through the recruitment pipeline.
Why:  This is the most central entity. Almost every module 
      creates a child record linked to Candidate.
Fields of note:
  - candidateId: String  — human-readable ID like "C0001"
  - status: String       — the current pipeline stage (APPLIED, 
                           SHORTLISTED, INTERVIEW_SCHEDULED, 
                           SELECTED, TRAINING_IN_PROGRESS,
                           EXAM_PENDING, EXAM_COMPLETED,
                           OFFER_SENT, OFFER_ACCEPTED, ONBOARDED,
                           REJECTED, HOLD, FINAL_APPROVED)
  - mrfId: FK → MRF      — which vacancy this candidate applied for
Relations (children of Candidate):
  Candidate
  ├── Interview[]
  ├── InterviewFeedback (via Interview)
  ├── TrainingEnrollment (1:1, unique)
  ├── ExamAttempt[]
  ├── OfferLetter (1:1, unique)
  ├── AppointmentLetter (1:1, unique)
  ├── Probation (1:1, unique)
  ├── CandidateComment[]
  ├── CandidateDocument[]
  ├── AIScreeningResult (1:1, unique)
  ├── AgencySubmission[]
  ├── PipelineEntry[]
  └── Communication[]
```

#### MRF (Manpower Requisition Form)
```
What: A vacancy request raised by a recruiter and approved by the MD.
Why:  Every hire must be justified through an MRF. 
      Candidates are linked to the MRF they applied for.
Status flow:
  DRAFT → PENDING (submitted) → APPROVED or REJECTED → CLOSED
Fields of note:
  - mrfNumber: unique, auto-generated (MRF-0001)
  - workerType: PERMANENT | CONTRACTUAL | CASUAL
  - priority: LOW | NORMAL | HIGH | URGENT
  - departmentId, createdById, approvedById
```

#### Interview
```
What: A scheduled interview session for a candidate.
Why:  Tracks when, how (ONLINE/IN_PERSON/PHONE), and 
      who interviewed each candidate.
Fields of note:
  - status: SCHEDULED | COMPLETED | CANCELLED | RESCHEDULED
  - round: Int  — supports multiple interview rounds
  - panelIds: JSON string of User IDs (panel members)
  - linkToken not here; meetingLink is a URL string
When COMPLETED: candidate status → SELECTED (via backend route)
```

#### InterviewFeedback
```
What: Structured scores and recommendation from an interviewer.
Why:  Standardises feedback; prevents subjective "good/bad" calls.
Fields: technicalScore, communicationScore, problemSolvingScore, 
        cultureFitScore (all 1-10), recommendation enum, 
        strengths, weaknesses, comments.
Relation: belongs to Interview (many feedbacks per interview)
```

#### TrainingBatch
```
What: A scheduled training program for a group of candidates.
Why:  Organises batch-wise training instead of individual tracking.
Fields: batchCode (auto: BATCH-2025-001), startDate, endDate, 
        maxCapacity, trainer, location, status (UPCOMING|ONGOING|COMPLETED)
```

#### TrainingEnrollment
```
What: The link between a Candidate and a TrainingBatch.
Why:  1:1 with Candidate (unique on candidateId) — 
      a candidate can only be in one batch at a time.
When created: candidate status → TRAINING_IN_PROGRESS
When status → COMPLETED: candidate status → EXAM_PENDING
```

#### TrainingAttendance
```
What: Daily attendance record per candidate per batch.
Why:  Compliance requirement; attendance is marked per date.
Unique constraint: [batchId, candidateId, date]
      (prevents duplicate attendance for same day)
```

#### ExamAttempt
```
What: A tokenised exam link sent to a candidate.
Why:  Generates a unique URL the candidate can open to take 
      the exam. The system tracks expiry and result.
Fields of note:
  - linkToken: unique cuid (used in exam URL)
  - examLink: full URL like /exam/{linkToken}
  - status: PENDING | LINK_SENT | PASSED | FAILED | EXPIRED
  - max 2 attempts per candidate (enforced in backend)
When PASS: candidate status → EXAM_COMPLETED
When FAIL: candidate status → REJECTED
```

#### OfferLetter
```
What: The formal salary offer from the company to the candidate.
Why:  1:1 with Candidate (unique on candidateId). Captures 
      full salary breakdown. Has an approval workflow.
Status flow:
  DRAFT → APPROVED (MD) → SENT → ACCEPTED or REJECTED
Fields: basicSalary, hra, grossSalary, netSalary, ctc, 
        designation, department, joiningDate, expiryDate
When SENT: candidate status → OFFER_SENT
When ACCEPTED: candidate status → OFFER_ACCEPTED
When REJECTED: candidate status → OFFER_REJECTED
```

#### AppointmentLetter
```
What: Official joining document generated after offer acceptance.
Why:  1:1 with Candidate. Confirms employment and sets 
      probation period.
When created: candidate status → ONBOARDED
Fields: appointmentNumber, joiningDate, probationPeriod (days)
```

#### Probation
```
What: Tracks a new employee's probation status post-joining.
Why:  3-level approval chain (BM → CM → MD) ensures proper 
      oversight. Supports extension and failure.
Fields: status (ONGOING|PASSED|FAILED|EXTENDED), 
        branchManagerApproval, countryManagerApproval, mdApproval
```

#### ChemistryTest
```
What: A drug/fitness test assigned during probation.
Why:  Regulatory requirement for certain industries. 
      Independent of probation approval status.
Fields: status (PENDING|PASSED|FAILED|CANCELLED), testDate, remarks
```

#### Agency
```
What: External staffing/manpower agency in the company's network.
Why:  Companies use agencies to source candidates, 
      especially for contractual/casual roles.
Fields: agencyCode (unique, crypto-generated), tier, rating, 
        totalSubmissions, successfulHires
```

#### MrfOutreach
```
What: A record of an email sent to an agency about a specific MRF.
Why:  Tracks which agency was contacted for which vacancy, 
      and whether they responded.
Fields: subject, body, status (SENT|RESPONDED|CLOSED), responseCount
```

#### IncomingMail
```
What: An inbound email from an agency or candidate.
Why:  Allows recruiters to log and process incoming emails 
      without switching to their email client.
Auto-detection: sender domain is matched to Agency records.
```

#### Communication
```
What: A record of every email sent FROM the system.
Why:  Audit trail for all outbound communications.
Fields: templateId, candidateId, subject, body, status, recipientEmail
```

#### EmailTemplate
```
What: Reusable email template with {{variable}} placeholders.
Why:  Standardises candidate communication.
Variables list stored as JSON string.
```

#### PipelineStage / PipelineEntry
```
PipelineStage: A named column in the Kanban board for an MRF.
PipelineEntry: Places a Candidate in a specific PipelineStage.
Why: Visual drag-and-drop pipeline view per vacancy.
```

#### JobDescription / AIScreeningResult
```
JobDescription: Free-text JD linked to an MRF, vectorised for AI matching.
AIScreeningResult: TF-IDF match score between a Candidate and a JD.
Fields: matchScore, skillsMatched[], skillsMissing[], experienceGap
```

#### Location / AgencyLocation
```
Location: A city/state/region record (e.g., Mumbai, Maharashtra, West).
AgencyLocation: Junction table — which agency covers which location.
Why: Geographic intelligence — map agencies and candidates by location.
```

#### Notification
```
What: In-app bell notifications for users.
Fields: title, message, type (INFO|SUCCESS|WARNING|ERROR), read, link
```

#### AuditLog
```
What: Tamper-evident record of important actions.
Fields: userId, action (APPROVE/REJECT/CREATE/etc.), 
        entity (MRF/CANDIDATE/etc.), entityId, oldValue, newValue
Why: Compliance and debugging. Admin can filter by entity/action.
```

#### Department
```
What: Organisational department (Engineering, Sales, HR, Finance…).
Why: MRFs and Users belong to departments. Category field 
     allows further classification.
```

#### EmployeeDocument
```
What: Identity/education documents submitted by an employee 
      via in-app form (no file upload — all structured fields).
Fields: docType (AADHAAR/PAN/PASSPORT/etc.), docNumber, 
        issuingAuthority, issueDate, expiryDate
Why: No-upload policy — structured data only to prevent 
     ambiguous formats.
```

### 3.3 Full Relationship Diagram

```
User ──────────────────────────┐
  ├── MRF (createdBy)          │
  ├── MRF (approvedBy)         │
  ├── Interview (scheduledBy)  │
  ├── InterviewFeedback        │
  ├── TrainingBatch (managed)  │
  ├── Communication (sentBy)   │
  ├── MrfOutreach (sentBy)     │
  ├── ChemistryTest (assigned) │
  ├── AuditLog                 │
  ├── Notification             │
  └── EmployeeDocument         │
                               │
Department ──── User ──────────┘
         └──── MRF

MRF ──────────────────────────────────
  ├── Candidate[]
  ├── JobDescription (1:1)
  ├── PipelineStage[]
  ├── AgencySubmission[]
  ├── MrfOutreach[]
  └── IncomingMail[]

Candidate ────────────────────────────
  ├── Interview[]
  │     └── InterviewFeedback[]
  ├── TrainingEnrollment (1:1)
  │     └── TrainingBatch
  ├── ExamAttempt[]
  ├── OfferLetter (1:1)
  ├── AppointmentLetter (1:1)
  ├── Probation (1:1)
  │     └── ChemistryTest[]
  ├── CandidateComment[]
  ├── CandidateDocument[]
  ├── AIScreeningResult (1:1)
  ├── AgencySubmission[]
  ├── PipelineEntry[]
  └── Communication[]

Agency ────────────────────────────────
  ├── AgencyContact[]
  ├── AgencySubmission[]
  ├── AgencyLocation[]
  ├── MrfOutreach[]
  └── IncomingMail[]
```

---

## 4. Authentication & Authorization Guide

### 4.1 Login Flow

```
User submits email + password
         │
         ▼
POST /api/auth/login (backend/src/routes/auth.js)
         │
         ▼
Prisma: find user by email, check isActive
         │
         ▼
bcrypt.compare(password, user.password)
         │
         ▼
jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
         │
         ▼
Returns: { token, user: { id, email, role, firstName, lastName } }
         │
         ▼
Frontend stores token in localStorage
AuthContext sets user state
roleRedirects[user.role] → navigate to correct portal
```

### 4.2 JWT Request Flow

Every API call after login:
```
frontend/src/services/api.js — axios interceptor
  ↓ Reads token from localStorage
  ↓ Attaches: Authorization: Bearer <token>
  ↓ Sends to backend

backend/src/middleware/auth.js — authenticate()
  ↓ Extracts token from header
  ↓ jwt.verify(token, JWT_SECRET) → decoded.id
  ↓ prisma.user.findUnique({ where: { id: decoded.id } })
  ↓ Checks user.isActive
  ↓ Attaches user to req.user
  ↓ Calls next() → route handler runs
```

If the token is expired or invalid: middleware returns `401 Unauthorized`.

The axios response interceptor in `api.js` catches 401 responses globally, clears localStorage, and redirects to `/login`.

### 4.3 Protected Routes (Frontend)

In `frontend/src/App.jsx`:

```jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to={roleRedirects[user.role]} />;
  return children;
};
```

Each portal route group wraps its `<Layout />` in `<ProtectedRoute allowedRoles={...}>`. Attempting to visit `/admin` while logged in as RECRUITER redirects you to `/recruiter` automatically.

### 4.4 Role Groups

Defined in `App.jsx`:
```js
const RECRUITER_ROLES  = ['HR', 'RECRUITER', 'INTERVIEWER', 'ADMIN'];
const TRAINING_ROLES   = ['TRAINING', 'ADMIN'];
const MANAGEMENT_ROLES = ['BRANCH_MANAGER', 'COUNTRY_MANAGER', 'MD', 'ADMIN'];
const ADMIN_ROLES      = ['ADMIN'];
// Employee portal: ['EMPLOYEE', 'ADMIN']
```

ADMIN is included in all groups so one admin account can access everything.

### 4.5 What Each Role Can Do

| Role | Key Permissions |
|---|---|
| ADMIN | All portals; create/edit/delete users; view audit logs; manage departments; system settings |
| HR / RECRUITER | Create MRFs; add candidates; schedule interviews; generate exam links; create offer letters; send emails; view agencies |
| INTERVIEWER | View candidates; submit feedback; view interview schedule |
| TRAINING | Create/manage batches; enroll candidates; mark attendance; mark training complete |
| BRANCH_MANAGER | View management dashboard; probation first-level approval; reports |
| COUNTRY_MANAGER | Probation second-level approval; reports |
| MD | MRF approval (exclusive); offer letter approval; probation final approval; full management dashboard |
| EMPLOYEE | View own profile, documents, exam links, offer letter; accept/decline offer |

### 4.6 Key Files

```
backend/src/middleware/auth.js     — authenticate() and authorize() middleware
backend/src/routes/auth.js        — POST /login, GET /me, PUT /change-password
frontend/src/context/AuthContext.jsx — login(), logout(), user state
frontend/src/services/api.js      — axios interceptors (add token, handle 401)
frontend/src/App.jsx               — ProtectedRoute, role groups, route map
```

---

## 5. Recruitment Lifecycle Deep Dive

### Complete Status Transition Map

```
APPLIED
  │ (recruiter shortlists)
  ▼
SHORTLISTED
  │ (interview scheduled via POST /api/interviews)
  ▼
INTERVIEW_SCHEDULED
  │ (interview marked complete via POST /api/interviews/:id/complete)
  ▼
SELECTED
  │ (training portal enrolls candidate via POST /api/training/batches/:id/enroll)
  ▼
TRAINING_IN_PROGRESS
  │ (training enrollment marked COMPLETED via PUT /api/training/enrollments/:id)
  ▼
EXAM_PENDING
  │ (exam link generated via POST /api/exams/generate-link)
  ▼
[candidate takes exam externally]
  │ (recruiter records result via PUT /api/exams/:id/result)
  ▼
EXAM_COMPLETED ──── [FAIL] ──→ REJECTED
  │ (offer letter created via POST /api/offers)
  ▼
[offer in DRAFT → MD approves → APPROVED → recruiter sends]
  │ (POST /api/offers/:id/send)
  ▼
OFFER_SENT
  │ (employee accepts via POST /api/offers/:id/accept)
  ▼
OFFER_ACCEPTED
  │ (recruiter generates appointment letter via POST /api/offers/appointments)
  ▼
ONBOARDED
  │ (management creates probation record)
  ▼
[probation: ONGOING → BM approves → CM approves → MD approves → PASSED]
```

### Stage Details

#### Stage 1: Candidate Creation
- **Frontend**: `CandidateForm.jsx` — validated in-app form
- **Backend**: `POST /api/candidates` — validates fields, generates candidateId (`C0001`)
- **DB change**: New `Candidate` row with `status: 'APPLIED'`
- **No file uploads**: All data entered as structured form fields with per-field validation

#### Stage 2: Interview Scheduling
- **Frontend**: `InterviewList.jsx` — "Schedule Interview" button opens `ScheduleForm` modal
- **Backend**: `POST /api/interviews` — validates future date, requires meeting link for ONLINE
- **DB change**: New `Interview` row; candidate `status → INTERVIEW_SCHEDULED`
- **Side effect**: Confirmation email sent to candidate via nodemailer

#### Stage 3: Interview Completion
- **Frontend**: `InterviewList.jsx` — "Complete" button on SCHEDULED interview card
- **Backend**: `POST /api/interviews/:id/complete`
- **DB change**: Interview `status → COMPLETED`; candidate `status → SELECTED`
- **Note**: Marking complete does not auto-submit feedback; feedback is separate

#### Stage 4: Training Enrollment
- **Frontend**: `Batches.jsx` (Training portal) — "Enroll Candidates" button in batch modal
- **Backend**: `POST /api/training/batches/:id/enroll` — enrolls batch of candidateIds
- **DB change**: New `TrainingEnrollment` row; candidate `status → TRAINING_IN_PROGRESS`
- **Requirement**: Candidate must have status SELECTED to appear in the enrollment list

#### Stage 5: Training Completion
- **Frontend**: `Batches.jsx` — "Mark Complete" button per enrollment row
- **Backend**: `PUT /api/training/enrollments/:id` with `{ status: 'COMPLETED' }`
- **DB change**: Enrollment `status → COMPLETED`; candidate `status → EXAM_PENDING`

#### Stage 6: Exam Link Generation
- **Frontend**: `ExamManagement.jsx` — multi-select candidates, fill exam name/scores, generate
- **Backend**: `POST /api/exams/generate-link`
  - Checks training enrollment is COMPLETED (hard requirement)
  - Max 2 attempts enforced
  - Generates `linkToken` (unique cuid), builds `examLink = /exam/{token}`
- **DB change**: New `ExamAttempt` row; candidate `status → EXAM_PENDING`

#### Stage 7: Exam Result Recording
- **Frontend**: `ExamManagement.jsx` — "Result" button on LINK_SENT/PENDING row
- **Backend**: `PUT /api/exams/:id/result`
- **DB change**: ExamAttempt updated with score/result; if PASS → `status → EXAM_COMPLETED`; if FAIL → `status → REJECTED`

#### Stage 8: Offer Letter Creation
- **Frontend**: `OfferManagement.jsx` — "Create Offer" button; dropdown shows EXAM_COMPLETED + FINAL_APPROVED candidates who don't already have an offer
- **Backend**: `POST /api/offers` — validates required fields; generates `OFR-0001`; checks for existing offer (409 if exists)
- **DB change**: New `OfferLetter` row with `status: 'DRAFT'`

#### Stage 9: Offer Approval
- **Frontend**: `Approvals.jsx` (management portal, MD only) — approve/reject
- **Backend**: `POST /api/offers/:id/approve` — sets `status → APPROVED, approvedById, approvedAt`
- **Role check**: No explicit role check in this route (MD is expected to be the only one on that page)

#### Stage 10: Offer Sent → Accepted
- **Frontend**: Recruiter clicks Send (changes to SENT); employee sees offer in `/employee/offers`
- **Backend**: `POST /api/offers/:id/send` → candidate `OFFER_SENT`; `POST /api/offers/:id/accept` → candidate `OFFER_ACCEPTED`

#### Stage 11: Appointment Letter → Onboarded
- **Frontend**: Part of `OfferManagement.jsx`
- **Backend**: `POST /api/offers/appointments` — creates `AppointmentLetter`, sets candidate `ONBOARDED`

#### Stage 12: Probation
- **Frontend**: `management/Probation.jsx`
- **Backend**: `POST /api/probation`, `POST /api/probation/:id/approve`
- **DB change**: Probation record; each approve call checks `req.user.role` to determine which approval field to set

---

## 6. Feature Walkthroughs

### 6.1 Create Candidate (end-to-end)

```
User fills CandidateForm.jsx (name, email, phone, designation, etc.)
  ↓ Per-field validation (inline errors, blur handlers)
  ↓ handleSubmit() validates all fields
  ↓ candidateAPI.create(form) — POST /api/candidates

Backend: candidates.js POST /
  ↓ authenticate middleware verifies JWT
  ↓ Validates required fields (name, email, phone, designation)
  ↓ generateCandidateId() — counts rows, returns "C0005"
  ↓ prisma.candidate.create({ data: { ...form, candidateId, addedById: req.user.id } })
  ↓ createAuditLog(userId, 'CREATE', 'CANDIDATE', newId, null, form)
  ↓ Returns 201 + candidate JSON

Frontend:
  ↓ toast.success('Candidate added')
  ↓ Modal closes, CandidateList re-fetches
```

### 6.2 Schedule Interview (end-to-end)

```
Recruiter clicks "Schedule Interview" in InterviewList.jsx
  ↓ ScheduleForm modal opens
  ↓ Loads SHORTLISTED/INTERVIEW_SCHEDULED/SELECTED candidates
  ↓ User selects candidate, fills date/time, mode, meeting link
  ↓ validate() checks: future date, URL format, duration range
  ↓ interviewAPI.create(form) — POST /api/interviews

Backend: interviews.js POST /
  ↓ authenticate
  ↓ Validates: candidateId, scheduledAt (future), interviewType, mode
  ↓ Validates: meetingLink required if mode === 'ONLINE'
  ↓ prisma.interview.create({ ...data, scheduledById: req.user.id })
  ↓ prisma.candidate.update({ status: 'INTERVIEW_SCHEDULED' })
  ↓ sendEmail({ to: candidate.email, subject: "Interview Scheduled..." })
  ↓ Returns 201 + interview JSON

Frontend:
  ↓ toast.success('Interview scheduled — confirmation email sent')
  ↓ Modal closes, InterviewList re-fetches
```

### 6.3 Complete Interview (end-to-end)

```
Recruiter clicks "Complete" on a SCHEDULED interview card
  ↓ handleComplete(id) called
  ↓ interviewAPI.complete(id) — POST /api/interviews/:id/complete

Backend:
  ↓ prisma.interview.update({ status: 'COMPLETED', completedAt: now })
  ↓ prisma.candidate.update({ status: 'SELECTED' })
  ↓ Returns updated interview

Frontend:
  ↓ toast.success('Interview marked complete — candidate moved to Selected')
  ↓ fetchInterviews() re-fetches, card now shows COMPLETED status
```

### 6.4 Enroll Candidates in Training

```
Training user opens Batches.jsx, clicks a batch card
  ↓ Batch detail modal opens
  ↓ Clicks "Enroll Candidates"
  ↓ EnrollModal loads: fetches SELECTED candidates not already in this batch
  ↓ User ticks checkboxes, clicks "Enroll Selected"
  ↓ trainingAPI.enrollCandidates(batch.id, selectedIds)
    → POST /api/training/batches/:id/enroll

Backend:
  ↓ For each candidateId:
      if no existing enrollment: create TrainingEnrollment
      prisma.candidate.update({ status: 'TRAINING_IN_PROGRESS' })
  ↓ Returns created enrollments

Frontend:
  ↓ toast.success('3 candidate(s) enrolled')
  ↓ refreshDetail() re-fetches batch to show new enrollments
```

### 6.5 Generate Exam Link

```
Recruiter opens ExamManagement.jsx, clicks "Generate Links"
  ↓ GenerateLinkForm modal opens
  ↓ Fetches EXAM_PENDING candidates (checkbox list)
  ↓ User ticks candidates, fills exam name, max score, passing score, expiry hours
  ↓ validate() checks: at least 1 candidate, name length, score ranges
  ↓ For each selected candidateId:
      examAPI.generateLink({ candidateId, examName, passingScore, maxScore, expiryHours })
      → POST /api/exams/generate-link

Backend (per candidate):
  ↓ Checks training enrollment status === 'COMPLETED' (hard gate)
  ↓ Counts prev attempts; rejects if >= 2
  ↓ Creates ExamAttempt with linkToken (cuid), linkExpiresAt
  ↓ Builds examLink = process.env.FRONTEND_URL + /exam/ + linkToken
  ↓ candidate.update({ status: 'EXAM_PENDING' })
  ↓ Returns attempt with examLink

Frontend:
  ↓ Collects successes/failures
  ↓ Shows results panel with Copy Link buttons per candidate
```

### 6.6 Create Offer Letter

```
Recruiter opens OfferManagement.jsx, clicks "Create Offer"
  ↓ OfferForm modal opens
  ↓ Fetches EXAM_COMPLETED + FINAL_APPROVED candidates
      AND existing offers → excludes already-offered candidates
  ↓ User selects candidate, fills designation, department, 
      basicSalary (HRA is optional; gross/net/CTC auto-compute)
  ↓ handleSubmit validates: candidateId, designation, department, basicSalary > 0
  ↓ offerAPI.create({ ...form, expiryDate: now + 30 days })
    → POST /api/offers

Backend:
  ↓ Validates candidateId, designation, department, basicSalary
  ↓ Checks for existing offer (409 if found)
  ↓ generateOfferNumber() → OFR-0003
  ↓ parseFloat on all salary fields
  ↓ prisma.offerLetter.create(...)
  ↓ Returns 201 + offer

Frontend:
  ↓ toast.success('Offer letter created')
  ↓ Modal closes, offer list re-fetches (shows DRAFT status)
```

### 6.7 Approve Offer

```
MD logs in, goes to Management → Approvals
  ↓ Approvals.jsx loads: fetches pending MRFs and DRAFT offers
  ↓ MD sees offer in "Offer Letter Approvals" section
  ↓ Clicks Approve button (visible only if user.role === 'MD')
  ↓ approveOffer(id) → offerAPI.approve(id)
    → POST /api/offers/:id/approve

Backend:
  ↓ prisma.offerLetter.update({ status: 'APPROVED', approvedById, approvedAt })
  ↓ Returns updated offer

Frontend:
  ↓ toast.success('Offer letter approved')
  ↓ fetchAll() re-fetches; approved offer disappears from pending list
```

### 6.8 Accept Offer (Employee Side)

```
Employee logs in, goes to /employee/offers
  ↓ EmployeeOffers.jsx calls offerAPI.getMine() → GET /api/offers/mine
  ↓ Backend finds candidate by req.user.email, then finds OfferLetter
  ↓ Employee sees salary breakdown, status: SENT
  ↓ Employee clicks "Accept"
  ↓ offerAPI.accept(id) → POST /api/offers/:id/accept

Backend:
  ↓ offerLetter.update({ status: 'ACCEPTED', respondedAt })
  ↓ candidate.update({ status: 'OFFER_ACCEPTED' })
  ↓ Returns updated offer

Frontend:
  ↓ Page re-fetches, shows ACCEPTED banner
```

### 6.9 Create Appointment Letter

```
Recruiter in OfferManagement.jsx (appointment section)
  ↓ Fills: candidateId, designation, department, joiningDate
  ↓ offerAPI.createAppointment(data) → POST /api/offers/appointments

Backend:
  ↓ Checks for existing appointment (409 if found)
  ↓ generateAppointmentNumber() → APT-0001
  ↓ prisma.appointmentLetter.create({ joiningDate: new Date(...) })
  ↓ candidate.update({ status: 'ONBOARDED' })
  ↓ Returns appointment letter

Frontend:
  ↓ toast.success, list re-fetches
```

### 6.10 Create Probation Record

```
Management user opens Probation.jsx
  ↓ Clicks "Create Probation"
  ↓ Fills: candidateId (ONBOARDED candidates), startDate, endDate
  ↓ probationAPI.create(data) → POST /api/probation

Backend:
  ↓ prisma.probation.create({ status: 'ONGOING', ... })
  ↓ Returns probation record

Approval chain (each triggered by role-specific approve button):
  ↓ BM clicks Approve → POST /api/probation/:id/approve
      Backend: checks role === BM, sets branchManagerApproval = 'APPROVED'
  ↓ CM clicks Approve → sets countryManagerApproval = 'APPROVED'
  ↓ MD clicks Approve → sets mdApproval = 'APPROVED', status = 'PASSED'
```

---

## 7. API Learning Guide

### Most Important Routes (understand these first)

| Method | Route | Purpose | Role |
|---|---|---|---|
| POST | `/api/auth/login` | Issue JWT token | Public |
| GET | `/api/auth/me` | Verify token, get user | All |
| GET | `/api/candidates` | List candidates with filters | RECRUITER |
| POST | `/api/candidates` | Create candidate | RECRUITER |
| PATCH | `/api/candidates/:id/status` | Update candidate status | RECRUITER |
| GET | `/api/mrf` | List MRFs | RECRUITER |
| POST | `/api/mrf` | Create MRF | RECRUITER |
| POST | `/api/mrf/:id/submit` | Submit MRF for approval | RECRUITER |
| POST | `/api/mrf/:id/approve` | Approve MRF | MD only |
| POST | `/api/interviews` | Schedule interview | RECRUITER |
| POST | `/api/interviews/:id/complete` | Complete interview → SELECTED | RECRUITER |
| POST | `/api/interviews/:id/feedback` | Submit feedback scores | RECRUITER |
| POST | `/api/training/batches/:id/enroll` | Enroll candidates | TRAINING |
| PUT | `/api/training/enrollments/:id` | Complete training → EXAM_PENDING | TRAINING |
| POST | `/api/exams/generate-link` | Generate tokenised exam link | RECRUITER |
| PUT | `/api/exams/:id/result` | Record exam result | RECRUITER |
| POST | `/api/offers` | Create offer letter | RECRUITER |
| POST | `/api/offers/:id/approve` | Approve offer | MD |
| POST | `/api/offers/:id/send` | Send offer → OFFER_SENT | RECRUITER |
| POST | `/api/offers/:id/accept` | Employee accepts | EMPLOYEE |
| POST | `/api/offers/appointments` | Generate appointment → ONBOARDED | RECRUITER |
| POST | `/api/probation` | Create probation record | MANAGEMENT |
| POST | `/api/probation/:id/approve` | Approve probation (role-aware) | BM/CM/MD |
| GET | `/api/reports/dashboard` | KPI metrics | RECRUITER/MD |
| GET | `/api/audit-logs` | View audit trail | ADMIN |

### Complete Route File Map

```
/api/auth           → backend/src/routes/auth.js
/api/mrf            → backend/src/routes/mrf.js
/api/candidates     → backend/src/routes/candidates.js
/api/interviews     → backend/src/routes/interviews.js
/api/training       → backend/src/routes/training.js
/api/exams          → backend/src/routes/exams.js
/api/offers         → backend/src/routes/offers.js
/api/reports        → backend/src/routes/reports.js
/api/users          → backend/src/routes/users.js
/api/notifications  → backend/src/routes/notifications.js
/api/departments    → backend/src/routes/departments.js
/api/agencies       → backend/src/routes/agencies.js
/api/communications → backend/src/routes/communications.js
/api/geography      → backend/src/routes/geography.js
/api/ai-screening   → backend/src/routes/aiScreening.js
/api/pipeline       → backend/src/routes/pipeline.js
/api/incoming-mail  → backend/src/routes/incomingMail.js
/api/audit-logs     → backend/src/routes/auditLogs.js
/api/probation      → backend/src/routes/probation.js
/api/chemistry-tests → backend/src/routes/chemistryTests.js
/api/employee-documents → backend/src/routes/employeeDocuments.js
```

### Response Shapes (critical to understand)

Most paginated list endpoints return:
```json
{ "data": [...], "total": 42, "page": 1, "totalPages": 5 }
```
Access the array as `res.data.data` in frontend — NOT `res.data.candidates` or `res.data.mrfs`.

Non-paginated endpoints (offers, exams, batches) return:
```json
[...] — plain array
```
Access as `res.data` directly.

---

## 8. Frontend Learning Guide

### 8.1 Project Structure

```
frontend/src/
├── App.jsx                     — routes, ProtectedRoute, role groups
├── context/
│   └── AuthContext.jsx          — user state, login(), logout()
├── services/
│   └── api.js                  — ALL API calls (axios, interceptors)
├── components/
│   ├── layout/
│   │   ├── Layout.jsx           — sidebar + content wrapper
│   │   └── Sidebar.jsx          — nav items per role
│   └── common/
│       ├── Modal.jsx            — reusable modal (open, onClose, title, size)
│       └── StatusBadge.jsx     — coloured badge for status strings
├── pages/
│   ├── auth/Login.jsx
│   ├── recruiter/              — 11 sub-pages
│   ├── employee/               — 6 sub-pages
│   ├── training/               — 4 sub-pages
│   ├── management/             — 4 sub-pages
│   └── admin/                  — 5 sub-pages
└── constants/
    └── locations.js            — INDIAN_LOCATIONS array
```

### 8.2 Most Important Files to Read First

1. `App.jsx` — understand the entire routing tree in one file
2. `context/AuthContext.jsx` — understand how user state flows everywhere
3. `services/api.js` — understand how every API call is made; all in one place
4. `components/layout/Sidebar.jsx` — see what nav items each role gets
5. `components/common/Modal.jsx` — understand the reusable modal pattern
6. `pages/recruiter/Candidates/CandidateDetail.jsx` — the most complex page; tabs, sub-forms, status change
7. `pages/recruiter/Offers/OfferManagement.jsx` — salary calculation, filtered dropdown
8. `pages/employee/Dashboard.jsx` — `JourneyBar` component, dynamic status → step mapping

### 8.3 Most Reused Patterns

**F wrapper component (avoids focus loss)**
```jsx
// Defined at module level (OUTSIDE the parent component)
const F = ({ label, required, error, children }) => (
  <div>
    <label>...</label>
    {children}
    {error && <p className="text-red-500">{error}</p>}
  </div>
);
```
If defined INSIDE a parent component, React sees it as a new component type on every render → unmount/remount → focused input loses focus. This pattern appears in `MRFForm.jsx`, `CandidateForm.jsx`.

**touched + blur validation**
```jsx
const [touched, setTouched] = useState({});
const [errors, setErrors] = useState({});
// Only show error after user has interacted with field:
{touched.email && errors.email && <p>{errors.email}</p>}
```

**Data path pattern**
```jsx
// Paginated endpoints:
const res = await candidateAPI.getAll({ status: 'EXAM_COMPLETED' });
const candidates = res.data.data || [];  // res.data = { data: [], total, page }

// Non-paginated:
const res = await offerAPI.getAll();
const offers = Array.isArray(res.data) ? res.data : [];
```

**JourneyBar component** (`employee/Dashboard.jsx`)
```jsx
// Shared between Employee Dashboard and CandidateDetail
export const JOURNEY_STEPS = [
  { label: 'Applied',     statuses: ['APPLIED'] },
  { label: 'Shortlisted', statuses: ['SHORTLISTED'] },
  { label: 'Interview',   statuses: ['INTERVIEW_SCHEDULED', 'SELECTED'] },
  // ...
];
export function getJourneyProgress(status) { ... }
export { JourneyBar };
```

### 8.4 State Management

This project uses **no Redux or Zustand**. State is managed with:
- `useState` for local component state
- `AuthContext` (React Context) for user identity across all components
- Props drilling for parent → child communication
- `fetchXxx()` functions called after mutations to refresh data

### 8.5 API Layer Pattern

All API calls are in `services/api.js`. Every page imports the named API object:
```js
import { candidateAPI, interviewAPI } from '../../../services/api';
// Then:
const res = await candidateAPI.getAll({ status: 'SHORTLISTED', limit: 100 });
```

The axios instance auto-attaches the JWT token via request interceptor. The response interceptor handles 401 globally.

---

## 9. Backend Learning Guide

### 9.1 Request Flow

```
Browser sends: GET /api/candidates?status=EXAM_COMPLETED&limit=100
                    │
                    ▼
server.js — app.use('/api/candidates', candidateRoutes)
                    │
                    ▼
candidates.js — router.get('/', ...)
                    │
                    ▼
authenticate middleware:
  - Extract Bearer token from Authorization header
  - jwt.verify(token) → decoded.id
  - prisma.user.findUnique(decoded.id) → req.user
  - if user inactive → 401
                    │
                    ▼
Route handler:
  - Parse query params (page, limit, status, search, mrfId)
  - Build Prisma where clause
  - prisma.candidate.findMany({ where, include, orderBy, skip, take })
  - prisma.candidate.count({ where })
                    │
                    ▼
res.json({ data: [...], total, page, totalPages })
```

### 9.2 server.js Explained

`backend/src/server.js` does exactly six things:
1. Import dotenv and load `.env`
2. Import all 21 route files
3. Configure Express middleware: CORS, JSON body parser (50mb limit)
4. Serve `/uploads` folder as static files
5. Mount all routes under `/api/*`
6. Register global error handler; start listening on port 5000

### 9.3 Utility Functions (`backend/src/utils/helpers.js`)

| Function | What it does |
|---|---|
| `generateMRFNumber()` | Counts MRF rows → `MRF-0042` |
| `generateCandidateId()` | Counts candidate rows → `C0043` |
| `generateOfferNumber()` | Counts offer rows → `OFR-0012` |
| `generateAppointmentNumber()` | Counts appointment rows → `APT-0005` |
| `generateBatchCode()` | Counts batches + year → `BATCH-2025-003` |
| `createAuditLog(userId, action, entity, entityId, old, new)` | Writes AuditLog row |
| `createNotification(userId, title, msg, type, link)` | Writes Notification row |
| `paginate(page, limit)` | Returns `{ skip, take }` for Prisma |

### 9.4 Prisma Usage Pattern

Every route file creates its own `PrismaClient` instance:
```js
const prisma = new PrismaClient();
```

Queries use Prisma's fluent API:
```js
// Find with relations:
const candidate = await prisma.candidate.findUnique({
  where: { id: req.params.id },
  include: {
    interviews: { orderBy: { scheduledAt: 'desc' } },
    offerLetter: true,
    trainingEnrollment: { include: { batch: true } },
  },
});

// Create with nested connect:
const interview = await prisma.interview.create({
  data: { candidateId, scheduledById: req.user.id, ... },
  include: { candidate: { select: { firstName: true, email: true } } },
});

// Update:
await prisma.candidate.update({
  where: { id: candidateId },
  data: { status: 'SELECTED' },
});
```

### 9.5 Error Handling Pattern

Every route wraps its logic in try/catch:
```js
router.post('/', async (req, res) => {
  try {
    // ... business logic
    res.status(201).json(result);
  } catch (e) {
    console.error(e);  // ← logs full Prisma error to console
    res.status(500).json({ message: 'Failed to create ...' });
  }
});
```

To diagnose a 500 error: **check the backend console** — the full Prisma error (including which field rejected what value) is logged there.

### 9.6 20 Most Important Backend Files

```
1.  server.js                  — entry point, all routes registered here
2.  middleware/auth.js         — authenticate(), authorize()
3.  utils/helpers.js           — number generators, paginate, audit/notification creators
4.  routes/auth.js             — login, me, change-password
5.  routes/candidates.js       — CRUD + status update; most complex route file
6.  routes/interviews.js       — schedule, complete (→SELECTED), feedback
7.  routes/training.js         — batches, enroll (→TRAINING_IN_PROGRESS), attendance, complete (→EXAM_PENDING)
8.  routes/exams.js            — generate link (→EXAM_PENDING), result (→EXAM_COMPLETED/REJECTED)
9.  routes/offers.js           — create, approve, send (→OFFER_SENT), accept (→OFFER_ACCEPTED), appointment (→ONBOARDED)
10. routes/probation.js        — create, role-aware 3-level approve
11. routes/mrf.js              — create, submit, MD-only approve
12. routes/users.js            — create, update, toggle-status (active/inactive)
13. routes/agencies.js         — directory, contacts, submissions, geo-scoring
14. routes/communications.js   — send email, template CRUD, bulk send
15. routes/incomingMail.js     — log mail, auto-link agency, create-candidate
16. routes/aiScreening.js      — JD management, TF-IDF screen, batch screen
17. routes/reports.js          — dashboard KPIs, funnel metrics
18. routes/pipeline.js         — Kanban stage management, candidate move
19. routes/auditLogs.js        — list logs, filter by entity/action
20. prisma/schema.prisma       — single source of truth for all DB models
```

---

## 10. Debugging Guide

### 10.1 Frontend Bug

**Symptoms**: UI doesn't update, shows blank, throws error in browser console

**Where to look first**:
1. Browser DevTools → Console tab (red errors)
2. Browser DevTools → Network tab → find the failed request → check response body
3. Check for `undefined` access: `res.data.data` vs `res.data.candidates` (common data path bug)

**How to trace**:
```
Error: "Cannot read properties of undefined (reading 'map')"
  ↓ The state variable being mapped is undefined/null
  ↓ Check: what does the API call return? (Network tab)
  ↓ Check: is the correct key being accessed? (data.data vs data)
  ↓ Fix: add fallback: `res.data.data || []`
```

**Real example from this codebase**:
- `EmailCenter.jsx` was using `r.data.candidates` but API returns `r.data.data` → fixed in Session 8
- `Approvals.jsx` was using `m.data.mrfs` but API returns `m.data.data` → fixed in Session 8

### 10.2 API Bug (4xx/5xx response)

**Where to look first**:
1. Network tab → Status code + response body
2. Backend console (terminal running the server) for full error

**400 Bad Request**: Missing or invalid required field. Read the `message` in the response body.

**401 Unauthorized**: JWT is missing, expired, or invalid. Try logging out and back in.

**403 Forbidden**: The logged-in user's role is not allowed to do this action. Example: non-MD trying to approve an MRF.

**409 Conflict**: Unique constraint violation. Example: trying to create a second offer for the same candidate. The backend returns a specific message.

**500 Internal Server Error**: Something crashed in the backend. **Check the backend console terminal** — Prisma logs the full error including which field rejected which value.

**Real example**:
```
Prisma: "Argument `basicSalary`: Invalid value provided. 
Expected Float, provided NaN."
  ↓ Frontend sent basicSalary: '' (empty string)
  ↓ parseFloat('') = NaN
  ↓ Fix: validate before submit; backend now returns 400 instead of 500
```

### 10.3 Database Bug

**Symptoms**: Records disappear, wrong data, Prisma errors in console

**Where to look**:
1. Backend console for full Prisma error message
2. Check `schema.prisma` for field types and constraints
3. Check if a `@unique` constraint is being violated (causes 500 → look for `Unique constraint failed on the fields`)

**Prisma DLL lock issue (Windows-specific)**:
When running `npx prisma db push` while the backend server is running, you may see:
```
EPERM: operation not permitted, rename ...query_engine-windows.dll.node.tmp...
```
The DB sync succeeds, but the generate step fails. Fix: stop the backend server, run db push, restart.

### 10.4 Validation Bug

**Symptoms**: Form submits but nothing happens, or toast shows a vague error

**How to trace**:
1. Add `console.log(form)` before the API call — verify the values
2. Check backend validation (400 response) vs frontend validation
3. In Prisma errors — check if a DateTime field received an empty string `''`

**Real example**:
```
joiningDate: '' → new Date('') = Invalid Date → Prisma DateTime error
Fix: only pass joiningDate if it's truthy:
  ...(joiningDate ? { joiningDate: new Date(joiningDate) } : {})
```

### 10.5 Authentication Bug

**Symptoms**: Redirect loop to login, actions fail with 401

**How to trace**:
1. Check `localStorage.getItem('token')` in browser DevTools → Application → Local Storage
2. If token exists but 401 occurs: token may be expired (JWT_SECRET mismatch in dev)
3. If user shows as inactive: check `isActive` field in DB

**Common cause**: Changing `JWT_SECRET` in `.env` while existing tokens were issued with the old secret. All existing sessions become invalid. Fix: log out and log back in.

---

## 11. Deployment Learning Guide

### 11.1 Current Dev Architecture

```
Frontend: npm run dev (Vite) → http://localhost:5173
Backend:  node src/server.js → http://localhost:5000
Database: backend/prisma/dev.db (SQLite file, committed to repo)
```

### 11.2 What Must Change for Production

| Concern | Current State | Production Fix |
|---|---|---|
| Database | SQLite file (`dev.db`) | Switch to PostgreSQL — change `provider = "sqlite"` to `"postgresql"` in schema.prisma; update `DATABASE_URL` |
| JWT Secret | Fallback in code / env var | Set `JWT_SECRET=<64-char-random-string>` in prod env; NEVER commit to git |
| CORS | `http://localhost:5173` hardcoded | Set `FRONTEND_URL=https://yourdomain.com` env var |
| SMTP | Falls back to console.log in dev | Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` env vars |
| File uploads | `backend/uploads/` folder | Move to S3, GCS, or similar; `uploads/` is not persistent across restarts |
| Vite dev server | Not for production | Run `npm run build` → serve `dist/` folder via Nginx or serve static from Express |
| API base URL | Hardcoded `http://localhost:5000/api` in api.js | Use `VITE_API_URL` env var: `const API_BASE = import.meta.env.VITE_API_URL` |

### 11.3 SQLite → PostgreSQL Migration

1. Change `schema.prisma` datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL=postgresql://user:pass@host:5432/dbname`
3. Run `npx prisma migrate dev --name init` (or `db push` for quick setup)
4. Re-run seed: `node prisma/seed.js`

### 11.4 Environment Variables Required

Create a `.env` file in `backend/`:
```
DATABASE_URL=file:./prisma/dev.db   (SQLite) or postgresql://... (Postgres)
JWT_SECRET=your-super-secret-key-min-32-chars
PORT=5000
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=RecruitPro <your@email.com>
```

---

## 12. Learning Roadmap — 7-Day Study Plan

### Day 1: Database Foundation

**Files to read**:
- `backend/prisma/schema.prisma` (read every model)
- `backend/prisma/seed.js` (understand what demo data exists)

**Concepts to understand**:
- What is Prisma? What is an ORM?
- What does `@relation` mean in Prisma?
- What does `@unique` enforce?
- What is the difference between `findUnique`, `findMany`, `findFirst`?
- Why does `Candidate` have `status: String @default("APPLIED")`?

**Exercise**: Draw the full entity relationship diagram on paper. Then open `dev.db` with DB Browser for SQLite and verify you can see the tables.

---

### Day 2: Authentication Deep Dive

**Files to read**:
- `backend/src/middleware/auth.js`
- `backend/src/routes/auth.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/services/api.js` (interceptors section)
- `frontend/src/App.jsx` (ProtectedRoute and roleRedirects)

**Concepts to understand**:
- What is a JWT? What is inside the token?
- What is the difference between authentication and authorisation?
- What happens when `jwt.verify()` fails?
- Why is the token stored in `localStorage` and not a cookie?
- What does the axios response interceptor do on 401?

**Exercise**: Log in as different roles and observe the redirect. Then manually delete the token from localStorage and try to access `/recruiter` — observe the redirect to `/login`.

---

### Day 3: Candidate Flow

**Files to read**:
- `backend/src/routes/candidates.js` (entire file)
- `frontend/src/pages/recruiter/Candidates/CandidateForm.jsx`
- `frontend/src/pages/recruiter/Candidates/CandidateList.jsx`
- `frontend/src/pages/recruiter/Candidates/CandidateDetail.jsx`

**Concepts to understand**:
- How does pagination work? (`paginate()` helper → `skip` and `take`)
- How does the status dropdown update the candidate?
- What is the `touched` + `blur` validation pattern?
- How does the journey stepper map status to step number?
- What does `include` do in a Prisma query?

**Exercise**: Add a new candidate via the UI. Watch the Network tab to see the POST request. Then open the DB and find the new row. Change the status via the dropdown and watch the PATCH request.

---

### Day 4: Interview + Training

**Files to read**:
- `backend/src/routes/interviews.js`
- `backend/src/routes/training.js`
- `frontend/src/pages/recruiter/Interviews/InterviewList.jsx`
- `frontend/src/pages/training/Batches.jsx`
- `frontend/src/pages/training/Attendance.jsx`

**Concepts to understand**:
- Why does scheduling an interview set `status: 'INTERVIEW_SCHEDULED'`?
- Why does completing an interview set `status: 'SELECTED'`?
- What gate does exam link generation enforce? (`trainingEnrollment.status === 'COMPLETED'`)
- How does `TrainingAttendance` use a composite unique constraint?
- How does the `EnrollModal` exclude already-enrolled candidates?

**Exercise**: Schedule an interview for a SHORTLISTED candidate. Mark it complete. Confirm the status changes to SELECTED. Create a training batch, enroll that candidate, mark training complete — confirm status becomes EXAM_PENDING.

---

### Day 5: Offers + Employee Portal

**Files to read**:
- `backend/src/routes/offers.js`
- `frontend/src/pages/recruiter/Offers/OfferManagement.jsx`
- `frontend/src/pages/employee/Dashboard.jsx` (JourneyBar + getJourneyProgress)
- `frontend/src/pages/employee/Offers.jsx`
- `frontend/src/pages/employee/Exams.jsx`

**Concepts to understand**:
- Why does `OfferLetter` have `candidateId @unique`? (one offer per candidate)
- How does `calcSalary()` auto-compute gross/net/CTC from basic + HRA?
- How does `/api/offers/mine` find the right offer without passing a candidateId?
- How does `getJourneyProgress(status)` return the current step index?
- Why is `JOURNEY_STEPS` exported from `employee/Dashboard.jsx` and imported in `CandidateDetail`?

**Exercise**: Generate an exam link for an EXAM_PENDING candidate. Record a PASS result. Create an offer letter for the EXAM_COMPLETED candidate. Approve it (as MD). Send it. Log in as Employee, accept it. Generate appointment letter. Confirm status is ONBOARDED.

---

### Day 6: Probation + Agencies

**Files to read**:
- `backend/src/routes/probation.js`
- `frontend/src/pages/management/Probation.jsx`
- `backend/src/routes/agencies.js`
- `frontend/src/pages/recruiter/Agencies/AgencyDetail.jsx`
- `frontend/src/pages/recruiter/IncomingMail/IncomingMail.jsx`

**Concepts to understand**:
- How does the probation approval check `req.user.role` to decide which field to set?
- What is the chemistry test and why is it independent of probation approval?
- How does agency geo-scoring work? (city match = 2pts, state match = 1pt)
- What does auto-agency detection do with incoming mail sender domains?
- What is the express-track pipeline for MANPOWER agency candidates?

**Exercise**: Create a probation record for an ONBOARDED candidate. Log in as Branch Manager, approve. Log in as Country Manager, approve. Log in as MD, approve. Confirm status becomes PASSED.

---

### Day 7: Architecture Review

**Files to read**:
- `frontend/src/App.jsx` (one final comprehensive read)
- `backend/src/server.js`
- This entire document again

**Concepts to understand**:
- What is the request lifecycle from browser to DB and back?
- Why was SQLite chosen for development?
- How would you swap SQLite for PostgreSQL?
- What would you need to change to add a new role?
- What would you need to change to add a new module?

**Exercise**: Sketch the entire system architecture from memory. Then try explaining the candidate lifecycle verbally, end-to-end, in under 3 minutes.

---

## 13. Project Review Preparation

### "If Tridib Sir Asks…"

**Q1. What is this project and what problem does it solve?**
> RecruitPro is a full-stack Recruitment ERP that digitises the end-to-end hiring process — from vacancy creation to employee onboarding. It solves the problem of uncoordinated recruitment where HR, management, training, and candidates are all working in silos through emails and spreadsheets. Every stage of the hiring lifecycle is captured in a centralised system with role-based access, audit trails, and automated status transitions.

**Q2. What tech stack did you use and why?**
> React 19 with Vite for the frontend — Vite gives instant hot reload. Express.js on the backend — lightweight and unopinionated, perfect for JSON REST APIs. Prisma ORM — type-safe queries with a schema-first approach that makes DB changes predictable. SQLite for development — zero config, portable, can be swapped to PostgreSQL for production with a one-line change in `schema.prisma`. TailwindCSS — utility classes, no context switching between CSS files and JSX.

**Q3. How does authentication work?**
> When a user logs in, the backend verifies their email/password with bcrypt, then issues a JWT signed with `JWT_SECRET` and set to expire in 7 days. The frontend stores this token in localStorage. Every subsequent API request attaches it as `Authorization: Bearer <token>`. The `authenticate` middleware on every protected route extracts the token, verifies it, looks up the live user record in the DB, checks `isActive`, and attaches the user to `req.user`. If the token is invalid or the user is inactive, the request gets a 401.

**Q4. How does role-based access control work?**
> It works at two levels. Frontend: `ProtectedRoute` in `App.jsx` checks `user.role` against `allowedRoles` — if the role isn't in the list, it redirects to the role's own portal. Backend: the `authenticate` middleware always runs first; some routes additionally check `req.user.role` inline (e.g., MRF approval is MD-only). There's also an `authorize(...roles)` helper middleware in `auth.js` but most role checks are done inline.

**Q5. Explain the full candidate journey from application to onboarding.**
> A candidate is added by a recruiter as APPLIED. The recruiter shortlists them (SHORTLISTED), then schedules an interview which sets INTERVIEW_SCHEDULED. When the interview is marked Complete, the candidate moves to SELECTED. The training team enrolls them in a batch (TRAINING_IN_PROGRESS). When training ends and the enrollment is marked Complete, the status becomes EXAM_PENDING. The recruiter generates a tokenised exam link, the candidate takes the exam externally, and the recruiter records the result — PASS becomes EXAM_COMPLETED, FAIL becomes REJECTED. The recruiter creates an offer letter (DRAFT), the MD approves it, the recruiter sends it (OFFER_SENT), the employee accepts it (OFFER_ACCEPTED), and the recruiter generates an appointment letter (ONBOARDED). Finally, management creates a probation record and the 3-level approval chain runs.

**Q6. What is Prisma and why did you use it instead of raw SQL?**
> Prisma is an ORM (Object Relational Mapper). Instead of writing SQL like `SELECT * FROM candidates WHERE status = 'APPLIED'`, you write `prisma.candidate.findMany({ where: { status: 'APPLIED' } })`. It prevents SQL injection by default, gives you TypeScript types for all models, and `schema.prisma` acts as the single source of truth for the DB structure. When the schema changes, you run `db push` and Prisma regenerates the client — no manual SQL migration scripts needed in development.

**Q7. How does pagination work in this system?**
> The `paginate(page, limit)` helper in `helpers.js` returns `{ skip: (page-1)*limit, take: limit }` which maps directly to Prisma's `skip` and `take` options. The backend returns `{ data: [...], total, page, totalPages }`. The frontend accesses `res.data.data` (the array) and uses `res.data.total` for the page counter.

**Q8. Why did you separate the frontend and backend into different ports?**
> This is the standard SPA (Single Page Application) architecture. The frontend is served by Vite's dev server on 5173 and makes HTTP requests to the Express API on 5000. CORS is configured on the backend to allow this cross-origin communication. In production, both could be on the same domain — the frontend `dist/` folder could be served by Nginx on port 80 while Express runs behind a reverse proxy.

**Q9. How does the MRF approval workflow work?**
> A recruiter creates an MRF as DRAFT, then submits it (status → PENDING). The Approvals page in the management portal shows all PENDING MRFs. Only the MD role can see the Approve/Reject buttons (enforced both in the backend route with a 403 check and in the frontend by checking `user.role === 'MD'`). When the MD approves, the status becomes APPROVED and the MRF is linked to `approvedById`. Rejection requires a written reason which is stored in `rejectionReason`.

**Q10. What happens when an interview is completed?**
> The recruiter clicks "Complete" on a SCHEDULED interview card in `InterviewList.jsx`. This calls `POST /api/interviews/:id/complete`. The backend updates the interview record's `status` to `COMPLETED` and also calls `candidate.update({ status: 'SELECTED' })`. This automatic status transition signals that the interview phase is done and the candidate is ready for the training phase. Feedback can still be submitted independently.

**Q11. How does the exam link system work?**
> When a recruiter generates an exam link, the backend creates an `ExamAttempt` record with a unique `linkToken` (a cuid — collision-resistant unique ID). It builds the exam URL as `FRONTEND_URL/exam/{linkToken}`. The candidate receives this link and clicks it. The frontend at `/exam/:token` calls `GET /api/exams/token/:token` to fetch the attempt details. This design means the exam is external (just a URL) — the system tracks that the link was sent and when the result comes back, the recruiter records it manually.

**Q12. How do you prevent the same offer letter being created twice for one candidate?**
> The `OfferLetter` model in `schema.prisma` has `candidateId String @unique` — a database-level unique constraint. Additionally, the `POST /api/offers` backend route explicitly checks `prisma.offerLetter.findUnique({ where: { candidateId } })` before attempting to create and returns a `409 Conflict` with a descriptive message if one already exists. The frontend's `OfferForm` also pre-filters out already-offered candidates from the dropdown.

**Q13. How does the 3-level probation approval chain work?**
> The `Probation` model has three separate approval fields: `branchManagerApproval`, `countryManagerApproval`, `mdApproval`. When `POST /api/probation/:id/approve` is called, the backend reads `req.user.role`. If BRANCH_MANAGER, it sets `branchManagerApproval = 'APPROVED'`. If COUNTRY_MANAGER, it sets `countryManagerApproval = 'APPROVED'`. If MD, it sets `mdApproval = 'APPROVED'` and also changes the probation `status` to `'PASSED'`. Each approval is independent — no automated chain; the approvers must each separately take action.

**Q14. How does the communication/email system work?**
> The communication engine uses nodemailer. In `backend/src/utils/mailer.js`, a transporter is created lazily using `SMTP_USER` and `SMTP_PASS` env vars. In development (no SMTP credentials), emails are logged to the console instead. Recruiters can send bulk emails to candidates using `EmailTemplate` records with `{{variable}}` placeholders. The system substitutes the variables and sends via nodemailer, logging each sent email as a `Communication` record.

**Q15. What is the AI screening feature and how does it work?**
> AI screening uses TF-IDF (Term Frequency-Inverse Document Frequency) — a classic NLP technique. The recruiter creates a `JobDescription` for an MRF with required skills and description text. For each candidate, the system computes a match score by comparing the candidate's skills and designation against the JD keywords. It returns a `matchScore`, `skillsMatched`, `skillsMissing`, and `experienceGap`. It's called "AI" but is actually deterministic keyword matching — no ML model involved.

**Q16. How is audit logging implemented?**
> The `createAuditLog(userId, action, entity, entityId, oldValue, newValue)` helper in `helpers.js` writes a row to the `AuditLog` table. It's called manually inside important route handlers (e.g., MRF approval, candidate creation). The Admin portal's `AuditLogs.jsx` page fetches these with filters by entity and action. The `oldValue` and `newValue` fields are stored as JSON strings.

**Q17. What is the no-upload policy and why was it implemented?**
> The project owner decided that file uploads (CSV, PDF, DOCX) introduce data quality problems — different date formats, inconsistent salary representations, encoding issues. Instead, all data is entered via validated in-app forms with per-field rules. This applies to: candidate information (no resume upload), employee documents (no file upload — structured fields only like Aadhaar number, issue date, expiry date), and candidates (no CSV import). This ensures all data in the DB is in a consistent, validated format.

**Q18. How does the Kanban pipeline work?**
> Each MRF has `PipelineStage` records representing columns (e.g., Applied, Shortlisted, Interview, Selected). `PipelineEntry` records place a specific candidate in a specific stage. The `PipelineKanban.jsx` frontend renders candidates in their respective stage columns and supports drag-and-drop to move them. `POST /api/pipeline/move` updates the candidate's `PipelineEntry` to point to the new stage.

**Q19. What would you need to change to add a new role, say "FINANCE"?**
> 1. Add `FINANCE` as a valid role string wherever roles are checked (no enum in DB — it's just a string)
> 2. Add FINANCE to `roleRedirects` in `App.jsx`
> 3. Create a new route group in `App.jsx` with `allowedRoles={['FINANCE', 'ADMIN']}`
> 4. Add sidebar nav items for FINANCE in `Sidebar.jsx`
> 5. Create the frontend pages
> 6. Add any backend role checks needed

**Q20. What is the difference between `findUnique` and `findFirst` in Prisma?**
> `findUnique` requires the query field to have a `@unique` constraint in the schema — it throws at the Prisma type level if you try to query by a non-unique field. `findFirst` works like `findMany` with `take: 1` — it finds the first matching record by any field. In this codebase, `findFirst` is used when looking up by email (which is unique but for semantic clarity) or when finding a candidate by an email match in the offers route.

**Q21. How does the system handle concurrent requests?**
> This system does not implement explicit locking or transaction management for concurrent requests. For most operations this is fine. The `@unique` constraints in Prisma provide DB-level protection against duplicate records (e.g., two offers for the same candidate). For production, certain operations (like generating sequential MRF numbers) could theoretically race — `generateMRFNumber()` uses count + 1 which could collide under heavy load. A UUID-based numbering system or DB sequences would be more robust.

**Q22. How does the employee portal connect to the candidate record?**
> The employee user account (`User` model, role: EMPLOYEE) and the candidate record (`Candidate` model) are separate records linked by **email address**. When the employee portal loads data, it calls `prisma.candidate.findFirst({ where: { email: req.user.email } })` to find their matching candidate record. This design means no explicit FK exists between User and Candidate — the bridge is the shared email.

**Q23. What is the purpose of `isExpressTrack` on the Candidate model?**
> When an agency email comes in via the Incoming Mail system and the sending agency is of type MANPOWER (contractual/casual), the system can auto-create the candidate as an `isExpressTrack: true` record. This means they skip the AI screening and regular interview rounds and go directly to SHORTLISTED status. It represents a fast-track hiring path for contractual workers sourced through manpower agencies.

**Q24. How would you debug a situation where a candidate's status is stuck?**
> 1. Open the candidate detail in the recruiter portal and check the current status badge
> 2. Check the Audit Logs in the Admin portal for any recent status change for this candidate
> 3. Check if the expected pre-condition is met (e.g., for EXAM_PENDING, is the training enrollment actually COMPLETED?)
> 4. Try manually changing the status via the dropdown in CandidateDetail (which calls PATCH /api/candidates/:id/status directly, bypassing all gates)
> 5. Check the backend console for any errors in the relevant route

**Q25. What are the key differences between the development and production setups?**
> Development: SQLite file as DB (no server needed), SMTP falls back to console.log, JWT_SECRET defaults to a hardcoded value if not set, CORS is open to localhost:5173, Vite dev server with HMR. Production: PostgreSQL required (SQLite doesn't handle concurrent writes well under load), real SMTP credentials required, JWT_SECRET must be a cryptographically random string stored as an env var, CORS must match the production domain, frontend must be built with `npm run build` and served as static files through Nginx or a CDN.

---

## 14. Knowledge Checklist

Work through this list to verify your understanding. If you can't answer a checkbox confidently, go back to the relevant section of this guide.

### Architecture
- [ ] I can draw the system architecture diagram (Browser → React → Express → Prisma → SQLite) from memory
- [ ] I can explain why React and Express are on different ports and how CORS enables communication
- [ ] I can explain what Prisma does and why it's better than raw SQL queries
- [ ] I can explain what `schema.prisma` is and how `npx prisma db push` works
- [ ] I can explain how to swap SQLite to PostgreSQL for production

### Authentication
- [ ] I can trace the login flow from form submit to JWT issue and localStorage storage
- [ ] I can explain what is inside a JWT token and how it is verified
- [ ] I can explain what `authenticate` middleware does and where it is called
- [ ] I can explain what happens when a token expires (401 → axios interceptor → redirect to login)
- [ ] I can explain how `ProtectedRoute` prevents unauthorised access to portals

### Database
- [ ] I can name the 10 most important models in the schema
- [ ] I can explain the relationship between `Candidate` and `OfferLetter` (1:1, unique FK)
- [ ] I can explain the difference between `@unique` and a regular field
- [ ] I can explain why `TrainingEnrollment` has `candidateId @unique` (one batch at a time)
- [ ] I can explain how `AuditLog` is written and where it's called from

### Candidate Lifecycle
- [ ] I can list all valid candidate status values in order
- [ ] I can explain what triggers each status transition (which backend route changes what)
- [ ] I can explain why exam link generation requires training completion to be verified
- [ ] I can explain the offer approval chain: DRAFT → APPROVED → SENT → ACCEPTED/REJECTED
- [ ] I can explain how the employee portal connects to the candidate record (shared email)

### Features
- [ ] I can explain how the MRF approval is restricted to MD only (backend 403 + frontend UI gate)
- [ ] I can explain how the probation 3-level approval chain works
- [ ] I can explain how `generateMRFNumber()` works and its limitation under concurrent load
- [ ] I can explain how the communication engine sends templated emails
- [ ] I can explain what the AI screening feature actually does (TF-IDF keyword matching)

### Frontend
- [ ] I can explain the F wrapper component pattern and why it must be at module level
- [ ] I can explain the `touched` + `blur` validation pattern
- [ ] I can explain why `res.data.data` is used for paginated endpoints
- [ ] I can explain what `AuthContext` stores and how `useAuth()` accesses it from any component
- [ ] I can explain how `JourneyBar` maps a status string to a highlighted step

### Debugging
- [ ] I can explain where to look first for a 500 error (backend console terminal)
- [ ] I can explain the common data path bug pattern (`res.data.candidates` vs `res.data.data`)
- [ ] I can explain why `parseFloat('') = NaN` causes a Prisma Float field rejection
- [ ] I can explain what the Prisma DLL lock error is and how to fix it on Windows
- [ ] I can explain how to manually unstick a candidate's status using the status dropdown

### Deployment
- [ ] I can list all environment variables required for production deployment
- [ ] I can explain the 3 things that must change when switching from SQLite to PostgreSQL
- [ ] I can explain how SMTP is configured and what happens if it's not set
- [ ] I can explain why `JWT_SECRET` must never be committed to git
- [ ] I can explain the difference between `npm run dev` and `npm run build`

---

*Document last updated: Session 10. Based on complete codebase analysis including all 21 backend route files, all 30+ frontend pages, full Prisma schema (26 models), and 10 sessions of iterative development.*
