# RecruitPro — Enterprise Recruitment ERP

A full-stack enterprise recruitment management system that automates the complete hiring lifecycle — from manpower requisition through candidate onboarding, training, examination, and probation confirmation.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Portals & Roles](#portals--roles)
- [Modules](#modules)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Demo Accounts](#demo-accounts)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

---

## Quick Start

### Option 1 — One-click (Windows)

Double-click `start.bat` in the project root. It opens both servers in separate terminal windows.

### Option 2 — Manual

**Backend** (Terminal 1):
```bash
cd backend
node src/server.js
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

### First-time Setup

If running for the first time after cloning:

```bash
# Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js

# Frontend setup
cd ../frontend
npm install
npm run dev
```

---

## Project Structure

```
recruitment app/
├── start.bat                  # One-click launcher (Windows)
│
├── frontend/                  # React + Vite application (port 5173)
│   ├── src/
│   │   ├── App.jsx            # Root router with role-based routing
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js         # All API client functions (axios)
│   │   ├── components/
│   │   │   ├── layout/        # Sidebar, Header, Layout
│   │   │   └── common/        # StatusBadge, Modal, KPICard
│   │   └── pages/
│   │       ├── auth/          # Login page
│   │       ├── recruiter/     # MRF, Candidates, Interviews, Training,
│   │       │                  # Exams, Offers, Reports, Dashboard
│   │       ├── employee/      # Profile, Documents, Training, Exams
│   │       ├── training/      # Batches, Attendance, Dashboard
│   │       ├── management/    # Analytics Dashboard, Reports
│   │       └── admin/         # User Management, Dashboard
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── backend/                   # Express + Prisma API (port 5000)
    ├── src/
    │   ├── server.js          # Express app entry point
    │   ├── routes/
    │   │   ├── auth.js        # Login, /me, change-password
    │   │   ├── mrf.js         # MRF CRUD + approval workflow
    │   │   ├── candidates.js  # Candidate CRUD + docs + comments
    │   │   ├── interviews.js  # Schedule + feedback + complete/cancel
    │   │   ├── training.js    # Batches + enrollment + attendance
    │   │   ├── exams.js       # Exam link generation + results
    │   │   ├── offers.js      # Offer + appointment letters
    │   │   ├── reports.js     # Dashboard + all report endpoints
    │   │   ├── users.js       # User CRUD (admin)
    │   │   ├── notifications.js
    │   │   └── departments.js
    │   ├── middleware/
    │   │   └── auth.js        # JWT authenticate + authorize
    │   └── utils/
    │       └── helpers.js     # ID generators, audit log, notifications
    ├── prisma/
    │   ├── schema.prisma      # Full database schema (SQLite)
    │   ├── seed.js            # Demo data seeder
    │   └── migrations/        # Auto-generated migration files
    ├── uploads/               # Uploaded resumes and documents
    ├── .env                   # Environment configuration
    └── package.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TailwindCSS 3 |
| Routing | React Router DOM 6 |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Date Handling | date-fns |
| Backend | Node.js, Express 4 |
| ORM | Prisma 5 |
| Database | SQLite (dev) — swap `DATABASE_URL` for PostgreSQL/MySQL in production |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| File Uploads | Multer |
| Email | Nodemailer (SMTP) |

---

## Portals & Roles

The application serves five separate portals under one codebase, each with its own sidebar, navigation, and page access.

| Portal URL | Roles Allowed | Primary Purpose |
|---|---|---|
| `/recruiter` | HR, RECRUITER, INTERVIEWER, ADMIN | End-to-end hiring lifecycle |
| `/employee` | EMPLOYEE, ADMIN | Candidate self-service |
| `/training` | TRAINING, ADMIN | Batch and attendance management |
| `/management` | BRANCH_MANAGER, COUNTRY_MANAGER, MD, ADMIN | Analytics and approvals |
| `/admin` | ADMIN | User, role, and system management |

---

## Modules

### Module 1 — MRF Management (`/recruiter/mrf`)
- Create, edit, submit, approve, and reject Manpower Requisition Forms
- Priority levels: Low / Normal / High / Urgent
- Approval workflow: Draft → Pending → Approved / Rejected
- Skills tagging, CTC range, location, reporting manager
- Candidate count per MRF, detailed view with candidate list

### Module 2 — Candidate Management (`/recruiter/candidates`)
- Add candidates manually or with resume upload (PDF, DOC, DOCX)
- Duplicate detection by email and phone
- Status pipeline with inline status change dropdown
- Full detail view with tabbed interface:
  - Overview (personal + professional details, skills)
  - Interviews (all rounds, feedback, scores)
  - Documents (upload and verify documents)
  - Notes (add/edit comments with history)
  - Training (enrollment status and batch info)
  - Exams (attempt history, scores, links)
  - Offer (offer letter summary)

### Module 3 — Interview Management (`/recruiter/interviews`)
- Schedule interviews with round number, type, mode, and meeting link
- Panel assignment, duration, and notes
- Mark complete or cancel with reason
- Submit structured feedback: Technical / Communication / Problem Solving / Culture Fit scores
- Recommendation levels: Strongly Recommend → Not Recommend
- Average score calculation across interviewers

### Module 4 — Training Coordination (`/recruiter/training`)
- Create training batches with dates, trainer, location, and capacity
- Enroll candidates with "Selected" status into batches
- Batch status: Upcoming / Ongoing / Completed

### Module 5 — Examination Management (`/recruiter/exams`)
- Generate exam links with configurable passing score and expiry
- Candidate must have completed training before a link can be generated
- Maximum 2 attempts enforced
- Record scores and pass/fail results
- Copy exam link to clipboard

### Module 6 — Offer Letters (`/recruiter/offers`)
- Auto-calculates HRA, Gross, Net, and annual CTC from Basic Salary input
- Approval workflow: Draft → Approved → Sent → Accepted / Rejected
- Configurable expiry date
- Generate appointment letters separately

### Module 7 — Training Portal (`/training`)
- Dashboard with batch KPIs
- View enrolled candidates per batch
- Mark candidates as training complete (triggers Exam Pending status)
- Attendance marking with date picker and per-candidate present/absent toggle

### Module 8 — Management Portal (`/management`)
- Full pipeline overview with bar chart (monthly hiring trend) and pie chart (status breakdown)
- KPI cards: Total Candidates, Active MRFs, In Training, Exam Pending, Offers Sent, Interviews
- Full candidate pipeline report with CSV export

### Module 9 — Admin Portal (`/admin`)
- User CRUD with password, role, and department assignment
- Toggle active/inactive status
- Role distribution bar chart
- Department user count overview

### Module 10 — Reports (`/recruiter/reports`)
- Five report types: Candidate, Interview, Training, Exam, MRF
- Date range filters
- CSV export for all reports

---

## API Reference

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login with email + password |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/change-password` | Change password |

### MRF
| Method | Endpoint | Description |
|---|---|---|
| GET | `/mrf` | List MRFs (with pagination, filters) |
| POST | `/mrf` | Create MRF |
| GET | `/mrf/:id` | Get MRF detail |
| PUT | `/mrf/:id` | Update MRF |
| POST | `/mrf/:id/submit` | Submit for approval |
| POST | `/mrf/:id/approve` | Approve MRF |
| POST | `/mrf/:id/reject` | Reject with reason |
| DELETE | `/mrf/:id` | Soft delete |

### Candidates
| Method | Endpoint | Description |
|---|---|---|
| GET | `/candidates` | List candidates (paginated, filterable) |
| POST | `/candidates` | Add candidate (multipart/form-data) |
| GET | `/candidates/:id` | Full candidate detail |
| PUT | `/candidates/:id` | Update candidate |
| PATCH | `/candidates/:id/status` | Update status only |
| POST | `/candidates/:id/documents` | Upload document |
| POST | `/candidates/:id/comments` | Add comment |
| PUT | `/candidates/:id/comments/:cid` | Edit comment |
| DELETE | `/candidates/:id` | Soft delete |

### Interviews
| Method | Endpoint | Description |
|---|---|---|
| GET | `/interviews` | List interviews |
| GET | `/interviews/today` | Today's scheduled interviews |
| POST | `/interviews` | Schedule interview |
| PUT | `/interviews/:id` | Update interview |
| POST | `/interviews/:id/complete` | Mark complete |
| POST | `/interviews/:id/cancel` | Cancel with reason |
| POST | `/interviews/:id/feedback` | Submit feedback |

### Training
| Method | Endpoint | Description |
|---|---|---|
| GET | `/training/batches` | List batches |
| POST | `/training/batches` | Create batch |
| GET | `/training/batches/:id` | Batch detail with enrollments |
| PUT | `/training/batches/:id` | Update batch |
| POST | `/training/batches/:id/enroll` | Enroll candidates |
| PUT | `/training/enrollments/:id` | Update enrollment status |
| POST | `/training/attendance` | Mark attendance (bulk) |
| GET | `/training/attendance/:batchId` | Get attendance records |

### Exams
| Method | Endpoint | Description |
|---|---|---|
| GET | `/exams` | List exam attempts |
| POST | `/exams/generate-link` | Generate exam link |
| PUT | `/exams/:id/result` | Record result |
| GET | `/exams/token/:token` | Get exam by token (public) |

### Offers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/offers` | List offer letters |
| POST | `/offers` | Create offer letter |
| GET | `/offers/:id` | Get offer detail |
| PUT | `/offers/:id` | Update offer |
| POST | `/offers/:id/approve` | Approve offer |
| POST | `/offers/:id/send` | Mark as sent |
| POST | `/offers/:id/accept` | Record acceptance |
| POST | `/offers/:id/reject` | Record rejection |
| GET | `/offers/appointments/all` | List appointment letters |
| POST | `/offers/appointments` | Create appointment letter |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/dashboard` | KPI stats + charts data |
| GET | `/reports/candidates` | Candidate report (filterable) |
| GET | `/reports/interviews` | Interview report |
| GET | `/reports/training` | Training batch report |
| GET | `/reports/exams` | Exam report |
| GET | `/reports/mrf` | MRF report |

### Users & Departments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List all users (admin) |
| POST | `/users` | Create user (admin/HR) |
| PUT | `/users/:id` | Update user |
| PATCH | `/users/:id/toggle-status` | Activate / deactivate |
| DELETE | `/users/:id` | Soft delete |
| GET | `/users/interviewers` | Users eligible as interviewers |
| GET | `/departments` | List all departments |

---

## Database Schema

Key tables and their relationships:

```
User ──── Department
  │
  ├── MRF ──── Candidate
  │               │
  │               ├── CandidateDocument
  │               ├── CandidateComment
  │               ├── Interview ──── InterviewFeedback
  │               ├── Assessment
  │               ├── TrainingEnrollment ──── TrainingBatch ──── TrainingAttendance
  │               ├── ExamAttempt
  │               ├── OfferLetter
  │               ├── AppointmentLetter
  │               └── Probation
  │
  ├── Notification
  └── AuditLog
```

All destructive operations use soft deletes (`deletedAt` timestamp). Critical status changes are written to `AuditLog`.

---

## Demo Accounts

All accounts use password: **`Admin@123`**

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

The login page includes quick-access buttons for all demo accounts.

---

## Environment Variables

File: `backend/.env`

```env
# Database
DATABASE_URL="file:./dev.db"           # SQLite (dev). Change to postgres:// for production.

# JWT
JWT_SECRET="your_secret_key_here"      # Change this in production
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
FRONTEND_URL="http://localhost:5173"   # For CORS

# Email (optional — leave blank to disable email sending)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@recruitment-erp.com"

# Uploads
MAX_FILE_SIZE=10485760                 # 10 MB
UPLOAD_DIR="uploads"
```

---

## Scripts

### Backend

```bash
cd backend
npm run dev           # Start with nodemon (auto-reload)
npm run start         # Start without auto-reload
npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio (database GUI)
npm run db:reset      # Drop and recreate database
```

### Frontend

```bash
cd frontend
npm run dev           # Start Vite dev server
npm run build         # Production build
npm run preview       # Preview production build locally
npm run lint          # Run ESLint
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
                                      ├── REJECTED (fail after 2 attempts)
                                      └── EXAM_COMPLETED
                                            └── OFFER_SENT
                                                  ├── OFFER_REJECTED
                                                  └── OFFER_ACCEPTED
                                                        └── ONBOARDED
                                                              └── PROBATION
                                                                    └── CONFIRMED
```

---

## Business Rules

- **Duplicate detection** — Candidates with matching email or phone are flagged on creation
- **Exam eligibility** — Training enrollment must be `COMPLETED` before an exam link can be generated
- **Max exam attempts** — 2 attempts maximum per candidate; 3rd attempt blocked at API level
- **Offer creation** — Candidate must have `EXAM_COMPLETED` status
- **MRF approval** — Roles with approval rights: HR, BRANCH_MANAGER, COUNTRY_MANAGER, MD, ADMIN
- **Soft deletes** — No data is permanently deleted; all records retain `deletedAt` timestamps
- **Audit logging** — All create/update/approve/status-change actions are logged with user + timestamp

---

## Production Notes

1. **Database** — Replace `DATABASE_URL` in `.env` with a PostgreSQL or MySQL connection string and re-run `npx prisma migrate dev`
2. **JWT Secret** — Use a long random string in production (e.g. `openssl rand -hex 64`)
3. **File storage** — Replace the local `uploads/` folder with AWS S3 or Azure Blob Storage via Multer-S3
4. **Email** — Configure real SMTP credentials (Gmail App Password, SendGrid, AWS SES) in `.env`
5. **CORS** — Update `FRONTEND_URL` to your production domain
6. **HTTPS** — Place the Express server behind Nginx or use a managed hosting platform
