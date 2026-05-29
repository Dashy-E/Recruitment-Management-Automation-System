# RecruitPro ERP

A full-stack recruitment management system covering the entire hiring lifecycle — from manpower requisition through onboarding, training, examination, and probation — across 10 role-based portals.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Portals & Roles](#portals--roles)
- [Modules](#modules)
- [Demo Accounts](#demo-accounts)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Candidate Status Flow](#candidate-status-flow)
- [Business Rules](#business-rules)
- [Project Structure](#project-structure)
- [Production Checklist](#production-checklist)

---

## Quick Start

### First-time setup

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Subsequent runs

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TailwindCSS 3, React Router 6 |
| Backend | Node.js 20+, Express 4, ES Modules |
| ORM | Prisma 5 |
| Database | SQLite (dev) — swap to PostgreSQL for production |
| Auth | JWT + bcryptjs; login rate-limited (20 req / 15 min) |
| Email | nodemailer — console fallback when SMTP is unconfigured |
| Charts | Recharts |
| File uploads | Multer (disk for resumes; memory for CSV import) |
| Icons | lucide-react |
| Toasts | react-hot-toast |
| Dates | date-fns |
| HTTP client | Axios |

---

## Portals & Roles

| Portal URL | Roles | Purpose |
|---|---|---|
| `/admin` | ADMIN | Users, departments, audit logs, settings |
| `/recruiter` | HR, RECRUITER, INTERVIEWER | End-to-end hiring lifecycle |
| `/training` | TRAINING | Batch and attendance management |
| `/management` | BRANCH_MANAGER, COUNTRY_MANAGER, MD | Approvals, probation, analytics |
| `/employee` | EMPLOYEE | Offer letter self-service |
| `/agency` | AGENCY_PARTNER | Own agency profile and submissions |

---

## Modules

### Admin
- **User management** — create/edit users, assign roles and departments, activate/deactivate, soft-delete
- **Department management** — card grid with user-count avatars, create/edit modal, activate/deactivate
- **Audit logs** — paginated event log filterable by entity (Candidate, MRF, User…) and action (CREATE, STATUS_CHANGE…)
- **System settings** — General, Security, Notifications, Data & Storage (localStorage-persisted)

### MRF (Manpower Requisition)
- Lifecycle: DRAFT → PENDING → APPROVED / REJECTED → CLOSED
- Priority levels: LOW · NORMAL · HIGH · URGENT
- Auto-generated ID: `MRF-YYYY-#####`
- Skills tagging, CTC range, location, branch

### Candidates
- CRUD with resume upload (PDF, DOC, DOCX)
- Bulk CSV import — returns `{ created, skipped, errors[] }` with duplicate detection on email or phone
- Inline status change dropdown in list view
- Full detail view: overview, interviews, documents, comments, training, exams, offer

### Interviews
- Multi-round scheduling (TECHNICAL · HR · CULTURAL · MANAGEMENT)
- Panel assignment, modes (ONLINE · OFFLINE · PHONE), meeting links
- Structured feedback: Technical / Communication / Problem Solving / Culture Fit scores (1–10)
- Mark complete or cancel with reason

### Training
- Batch management with capacity, trainer, dates, status (UPCOMING · ONGOING · COMPLETED)
- Candidate enrollment; update enrollment status (ENROLLED → COMPLETED / DROPPED)
- Daily attendance marking per candidate
- Training Reports: KPI cards, batch progress bars, enrollment breakdown

### Exams
- Token-based exam links with configurable passing score and expiry
- Public link: `/exams/token/:token` (no auth required)
- Record scores and pass/fail results; max 2 attempts enforced

### Offers
- Full salary breakdown: Basic → HRA → Allowances → Deductions → Gross → Net → CTC
- Workflow: DRAFT → APPROVED → SENT → ACCEPTED / REJECTED
- Auto-generated ID: `OFF-YYYY-#####`
- Appointment letters generated post-acceptance

### Probation
- Three-level approval chain: Branch Manager → Country Manager → MD
- When all three approve, status → PASSED and candidate.status → CONFIRMED
- Extend with new end date and reason; fail with reason
- Days-left countdown in list view (red if overdue, orange if ≤14 days)

### Approvals (Management)
- Pending MRFs and draft offer letters awaiting MD/management action
- Reject modal with required reason field

### Recruitment Pipeline
- Kanban board per MRF with 6 default stages (Applied → Screening → Interview → Offer → Hired → Rejected)
- Custom stages with colour; moving a candidate removes prior stage entries

### AI Screening
- No external dependency — built-in TF-IDF scorer
- Score = skill match (50%) + experience fit (30%) + text similarity (20%)
- Recommendations: STRONGLY_RECOMMENDED (≥75) · RECOMMENDED (≥55) · CONSIDER (≥35) · NOT_RECOMMENDED (<35)
- Batch screening per MRF

### Agency Management
- Agency directory with tier (STANDARD · PREFERRED · PREMIUM) and status (ACTIVE · BLACKLISTED)
- Contacts, submissions linked to MRF + Candidate, performance metrics (success rate, placements)
- Agency Partner self-service: own agency resolved via `AgencyPartner.userId` — no HR access required

### Communications
- Email templates with `{{variable}}` substitution and preview
- Bulk send via nodemailer; history logged with status and failure reason
- Console fallback in dev when SMTP is unconfigured

### Geographic Intelligence
- Location cards grouped by state and zone
- Agency-to-location assignment
- Intelligence view: candidate count, active candidates, agency count per location

### Casual Workers
- Fast-track onboard: creates Candidate + CasualWorker atomically
- Worker types: CASUAL · CONTRACT · TEMPORARY
- Aadhaar/PAN verification flags

### Incoming Mail
- Ingest raw emails; auto-parse body to extract candidate fields and create a Candidate record
- Status: UNPROCESSED → PROCESSED / LINKED / DISCARDED
- Deduplicates on `messageId`

### Reports
- Five report types: Candidate, Interview, Training, Exam, MRF
- Date-range filters and status filters
- CSV export with dated filename

---

## Demo Accounts

All accounts use password **`Admin@123`**.

| Email | Role | Portal |
|---|---|---|
| admin@recruitment.com | ADMIN | /admin |
| hr@recruitment.com | HR | /recruiter |
| recruiter@recruitment.com | RECRUITER | /recruiter |
| interviewer@recruitment.com | INTERVIEWER | /recruiter |
| training@recruitment.com | TRAINING | /training |
| manager@recruitment.com | BRANCH_MANAGER | /management |
| country@recruitment.com | COUNTRY_MANAGER | /management |
| md@recruitment.com | MD | /management |
| employee@recruitment.com | EMPLOYEE | /employee |
| agency@recruitment.com | AGENCY_PARTNER | /agency |

---

## API Reference

Base URL: `http://localhost:5000/api`  
All protected routes require `Authorization: Bearer <jwt>`.

For the full contract (query params, request bodies, response shapes) see [context/API_CONTRACTS.md](context/API_CONTRACTS.md).

### Quick reference

| Domain | Base path | Notes |
|---|---|---|
| Auth | `/auth` | `/login` rate-limited |
| Users | `/users` | Pagination: `page, limit, search, role` |
| Departments | `/departments` | `?includeInactive=true` |
| MRF | `/mrf` | Full lifecycle |
| Candidates | `/candidates` | Includes `POST /import/csv` |
| Interviews | `/interviews` | |
| Training | `/training` | Batches, enrollment, attendance |
| Exams | `/exams` | `/token/:token` is public |
| Offers | `/offers` | `/mine` for employee self-service |
| Probation | `/probation` | Role-aware approve endpoint |
| Reports | `/reports` | |
| Notifications | `/notifications` | |
| Audit Logs | `/audit-logs` | ADMIN only |
| Agencies | `/agencies` | `/my` for AGENCY_PARTNER |
| Communications | `/communications` | Templates + bulk send |
| Geography | `/geography` | Locations, states, intelligence |
| AI Screening | `/ai-screening` | JD upsert, score, batch |
| Pipeline | `/pipeline` | Kanban per MRF |
| Casual Workers | `/casual-workers` | |
| Incoming Mail | `/incoming-mail` | |

---

## Environment Variables

File: `backend/.env`

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
PORT=5000
FRONTEND_URL="http://localhost:5173"

# Email — leave SMTP_USER/SMTP_PASS blank to log emails to console in dev
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@recruitment-erp.com"

MAX_FILE_SIZE=10485760
UPLOAD_DIR="uploads"
```

---

## Scripts

### Backend (`cd backend`)

```bash
npm run dev          # nodemon — auto-reload on changes
npm run start        # plain node (no reload)
npm run db:migrate   # run Prisma migrations
npm run db:seed      # seed demo data
npm run db:studio    # Prisma Studio — visual DB browser
npm run db:reset     # drop and recreate database
npm run setup        # full first-time setup (install + migrate + seed)
```

### Frontend (`cd frontend`)

```bash
npm run dev          # Vite dev server
npm run build        # production build
npm run preview      # preview production build locally
npm run lint         # ESLint
```

---

## Candidate Status Flow

```
APPLIED
  └── SHORTLISTED
        └── INTERVIEW_SCHEDULED
              ├── REJECTED
              ├── HOLD
              └── SELECTED
                    └── TRAINING_PENDING
                          └── TRAINING_IN_PROGRESS
                                └── EXAM_PENDING
                                      ├── REJECTED  (fail, 2 attempts used)
                                      └── EXAM_COMPLETED
                                            └── OFFER_SENT
                                                  ├── OFFER_REJECTED
                                                  └── OFFER_ACCEPTED
                                                        └── ONBOARDED
                                                              └── CONFIRMED  (probation passed)
```

---

## Business Rules

- **Duplicate detection** — candidates blocked on matching email OR phone (single create and CSV import)
- **Exam eligibility** — training enrollment must be COMPLETED before a link can be generated
- **Max attempts** — 2 exam attempts per candidate; 3rd attempt rejected at API level
- **Probation chain** — all three approvals (BM + CM + MD) required before status becomes PASSED
- **Soft deletes** — Users, Candidates, and Agencies use `deletedAt`; no hard deletes
- **Audit logging** — CREATE, STATUS_CHANGE, and other mutations write to `AuditLog`
- **Employee↔Candidate link** — resolved by matching `user.email` to `candidate.email` (no direct FK)
- **Agency partner scoping** — AGENCY_PARTNER role is blocked from `GET /agencies`; must use `GET /agencies/my`
- **Route ordering** — named paths (`/mine`, `/my`, `/today`, `/interviewers`) are always registered before `/:id`

---

## Project Structure

```
recruitment app/
├── README.md
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # 30+ models
│   │   ├── seed.js              # Idempotent demo data (upsert-based)
│   │   └── dev.db               # SQLite database file
│   ├── src/
│   │   ├── server.js            # Express app, CORS, route mounts
│   │   ├── middleware/
│   │   │   └── auth.js          # authenticate + authorize(roles...)
│   │   ├── utils/
│   │   │   ├── helpers.js       # generateCandidateId, createAuditLog, paginate
│   │   │   └── mailer.js        # sendEmail with lazy nodemailer init
│   │   └── routes/              # 20 route files, one per domain
│   ├── uploads/                 # Multer disk storage (resumes, documents)
│   └── .env
├── frontend/
│   └── src/
│       ├── App.jsx              # BrowserRouter, all routes, ProtectedRoute
│       ├── context/
│       │   └── AuthContext.jsx  # JWT storage, user state, login/logout
│       ├── components/
│       │   ├── layout/          # Sidebar, Header, Layout (with page titles)
│       │   └── common/          # StatusBadge, Modal, KPICard
│       ├── pages/               # Organised by portal
│       │   ├── admin/           # Users, Departments, AuditLogs, Settings
│       │   ├── recruiter/       # MRF, Candidates, Interviews, Pipeline, AI, Reports…
│       │   ├── training/        # Batches, Attendance, Reports, Dashboard
│       │   ├── management/      # Dashboard, Approvals, Probation, Reports
│       │   ├── employee/        # Dashboard, Offers
│       │   └── agency/          # AgencyDashboard
│       └── services/
│           └── api.js           # Axios instance + 20 typed API objects
└── context/                     # Documentation
    ├── ARCHITECTURE.md
    ├── API_CONTRACTS.md
    ├── DATABASE_SCHEMA.md
    └── TODO.md
```

---

## Production Checklist

- [ ] Change `provider = "sqlite"` to `"postgresql"` in `schema.prisma` and set `DATABASE_URL`
- [ ] Set a strong random `JWT_SECRET` (e.g. `openssl rand -hex 64`)
- [ ] Configure `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` for real email
- [ ] Update `FRONTEND_URL` to the production domain (CORS)
- [ ] Move `uploads/` to S3 or equivalent object storage
- [ ] Place Express behind a reverse proxy (nginx / Caddy) with TLS
