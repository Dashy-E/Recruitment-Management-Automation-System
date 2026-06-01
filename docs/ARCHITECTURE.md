# RecruitPro ERP — Architecture

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TailwindCSS 3, React Router 6 |
| Backend | Node.js, Express 4, ES Modules (`"type": "module"`) |
| ORM | Prisma 5 |
| Database | SQLite (`backend/prisma/dev.db`) |
| Auth | JWT (Bearer token), bcryptjs |
| Rate limiting | express-rate-limit (20 req / 15 min on login) |
| Email | nodemailer — lazy SMTP init; falls back to console log when `SMTP_USER` is unset |
| File uploads | Multer → `backend/uploads/` (disk storage); CSV import uses `memoryStorage` |
| UI components | lucide-react icons, react-hot-toast, Recharts |

## Ports

| Service | Port |
|---|---|
| Backend API | 5000 |
| Frontend (Vite dev) | 5173 |

## Directory Layout

```
recruitment app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # All 30+ models
│   │   ├── seed.js             # Idempotent seed (upsert-based)
│   │   └── dev.db              # SQLite database file
│   ├── src/
│   │   ├── server.js           # Express app, CORS, route mounts
│   │   ├── middleware/
│   │   │   └── auth.js         # authenticate (JWT verify), authorize (role check)
│   │   ├── utils/
│   │   │   ├── helpers.js      # generateCandidateId, createAuditLog, paginate
│   │   │   └── mailer.js       # sendEmail — lazy nodemailer transporter
│   │   └── routes/             # 21 route files (one per domain)
│   └── uploads/                # Multer-stored resumes & documents
├── frontend/
│   └── src/
│       ├── App.jsx             # BrowserRouter, all routes, ProtectedRoute
│       ├── context/
│       │   └── AuthContext.jsx # JWT storage, user state, login/logout
│       ├── components/
│       │   └── layout/
│       │       ├── Layout.jsx  # Sidebar + Header + <Outlet>, page titles
│       │       ├── Sidebar.jsx # Role-aware nav, scrollable
│       │       └── Header.jsx
│       ├── pages/              # Organised by portal (see Portals below)
│       └── services/
│           └── api.js          # Axios instance + 20 typed API objects
└── context/                    # Documentation (this folder)
    ├── ARCHITECTURE.md
    ├── API_CONTRACTS.md
    ├── DATABASE_SCHEMA.md
    └── TODO.md
```

## Portals & Role Mapping

| Role | Prefix | Sidebar gradient |
|---|---|---|
| ADMIN | `/admin` | slate |
| HR | `/recruiter` | indigo |
| RECRUITER | `/recruiter` | indigo |
| INTERVIEWER | `/recruiter` | purple |
| TRAINING | `/training` | emerald |
| BRANCH_MANAGER | `/management` | orange |
| COUNTRY_MANAGER | `/management` | orange |
| MD | `/management` | red |
| EMPLOYEE | `/employee` | teal |
| AGENCY_PARTNER | `/agency` | cyan |

## Auth Flow

1. `POST /api/auth/login` (rate-limited) → returns `{ token, user }`.
2. Frontend stores both in `localStorage`; Axios interceptor injects `Authorization: Bearer <token>` on every request.
3. `401` response → interceptor clears storage and redirects to `/login`.
4. `ProtectedRoute` in `App.jsx` reads `AuthContext`; role mismatch redirects to the role's home route.

## Request Lifecycle

```
Browser → Axios (api.js)
        → Express (server.js)
        → authenticate middleware (JWT verify)
        → authorize middleware (optional role check)
        → Route handler
        → Prisma → SQLite
        ← JSON response
```

## Route Modules (backend/src/routes/)

| File | Mount | Domain |
|---|---|---|
| auth.js | /api/auth | Login, me, password change — rate-limited |
| users.js | /api/users | User CRUD, role filter, pagination |
| departments.js | /api/departments | Department CRUD, includeInactive param |
| mrf.js | /api/mrf | MRF lifecycle, approval workflow, agency outreach endpoints |
| candidates.js | /api/candidates | Candidate CRUD, documents, comments, bulk CSV import |
| interviews.js | /api/interviews | Scheduling, feedback, today's list |
| training.js | /api/training | Batches, enrollment, attendance |
| exams.js | /api/exams | Token-based exam links, results |
| offers.js | /api/offers | Offer + appointment letters, employee self-service (`/mine`) |
| probation.js | /api/probation | Probation CRUD, multi-level approval chain |
| reports.js | /api/reports | Dashboard KPIs, cross-domain stats |
| notifications.js | /api/notifications | Per-user notification inbox |
| auditLogs.js | /api/audit-logs | ADMIN-only; paginated log viewer, entity filter |
| agencies.js | /api/agencies | Agency CRUD, contacts, submissions, performance, partner self-service (`/my`), `agencyType` filter |
| communications.js | /api/communications | Email templates, bulk send via nodemailer, history |
| geography.js | /api/geography | Location CRUD, state grouping, intelligence |
| aiScreening.js | /api/ai-screening | JD upsert, TF-IDF-style scoring, batch screen |
| pipeline.js | /api/pipeline | Kanban stages per MRF, candidate move |
| casualWorkers.js | /api/casual-workers | Fast-track onboard, Aadhaar/PAN verify |
| incomingMail.js | /api/incoming-mail | Mail inbox, auto-agency detection, express-track candidate creation |
| sourcing.js | /api/sourcing | Platform job posting tracker, description generator |

## AI Screening (built-in, no external dependency)

Score formula (0–100):
```
matchScore = skillScore * 0.5 + expScore * 0.3 + textScore * 0.2
```

| Component | Weight | Method |
|---|---|---|
| Skill match | 50% | Intersection of JD skills vs candidate skills (case-insensitive) |
| Experience | 30% | Penalty curve: perfect=30, each missing year −5 pts |
| Text similarity | 20% | Token overlap (word set intersection / union) on JD vs resume text |

Recommendations: STRONGLY_RECOMMENDED (≥75) · RECOMMENDED (≥55) · CONSIDER (≥35) · NOT_RECOMMENDED (<35)

## Key Constraints & Gotchas

- **SQLite**: no concurrent writes; fine for single-server demo. Swap `provider` to `postgresql` for production.
- **Prisma `select` + `include` conflict**: cannot use both on the same query. Nest relations inside `select` instead.
- **Soft deletes**: `deletedAt DateTime?` on User, Candidate, Agency. Most list queries filter `deletedAt: null`.
- **JSON array columns**: skills, education, certifications etc. stored as serialised strings in SQLite; parse with `JSON.parse()` on read.
- **Express route ordering**: named routes (`/mine`, `/my`, `/today`, `/interviewers`) must be registered before `/:id` or Express treats the name as an ID.
- **Recharts pie chart resize**: `width="99%"` on `ResponsiveContainer` forces ResizeObserver to fire on shrink. Use HTML flex-wrap legend instead of SVG `<Legend>` which cannot reflow.
- **File uploads**: resume/document upload uses `multer.diskStorage` → `uploads/`. CSV import uses `multer.memoryStorage` (never written to disk).
- **nodemailer**: `sendEmail()` in `utils/mailer.js` checks `SMTP_USER` at call time. If unset, logs to console and returns `{ success: true, preview: 'logged-to-console' }`. No crash.
- **`@@unique([mrfId, order])`** on PipelineStage enforces one stage per order slot per MRF.
- **`@@unique([batchId, candidateId, date])`** on TrainingAttendance prevents duplicate attendance marks.
- **Employee↔Candidate link**: no direct FK. Bridge is `email` — `GET /offers/mine` resolves via `req.user.email` → `prisma.candidate.findFirst({ where: { email } })`.
- **Agency partner scoping**: AGENCY_PARTNER blocked from `GET /agencies`. Must use `GET /agencies/my` which resolves via `AgencyPartner.userId`.
- **Agency type routing**: `agencyType` on Agency (HIRING | MANPOWER) and `workerType` on MRF (PERMANENT | CONTRACTUAL | CASUAL) drive which agencies appear in `GET /mrf/:id/suggested-agencies`. PERMANENT MRFs → HIRING agencies; CONTRACTUAL/CASUAL MRFs → MANPOWER agencies.
- **Geographic agency scoring**: `suggested-agencies` scores each agency by substring match of its `city`/`state` against the MRF's `location + branch` string (city match = 2 pts, state match = 1 pt). Sorted: score desc → tier desc → successRate desc.
- **Express-track pipeline**: Incoming mail from a MANPOWER agency creates candidate at SHORTLISTED (not APPLIED), sets `isExpressTrack=true` and `isContractual=true`, and auto-creates a CasualWorker stub. Skips AI screening and interview scheduling entirely.
- **Auto-agency detection**: `POST /incoming-mail` extracts the sender email domain and queries `Agency.email CONTAINS domain` to auto-link an agency without manual selection.
- **Outreach template variables**: `POST /mrf/:id/outreach` replaces `{{agencyName}}`, `{{designation}}`, `{{vacancies}}`, `{{location}}`, `{{mrfNumber}}`, `{{experience}}` in the template body before dispatch.
