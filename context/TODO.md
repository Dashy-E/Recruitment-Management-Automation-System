# RecruitPro ERP — TODO

## Status Legend
- [ ] Not started
- [~] In progress / partial
- [x] Complete

---

## Completed (Phase 1–3)

[x] Auth — JWT login, role-based redirect, protected routes  
[x] MRF lifecycle — DRAFT → PENDING → APPROVED/REJECTED → CLOSED  
[x] Candidate management — CRUD, resume upload, comments, status tracking  
[x] Interview scheduling — multi-round, panel, feedback scoring  
[x] Training — batches, enrollment, attendance  
[x] Exam management — token-based links, result recording  
[x] Offer letters — full salary breakdown, approval chain, send/accept/reject  
[x] Appointment letters + Probation tracking  
[x] Reports & analytics dashboard  
[x] User management (Admin)  
[x] Notifications  
[x] Agency management — directory, contacts, submissions, performance metrics  
[x] Automated communication engine — templates, bulk send, history  
[x] Geographic workforce intelligence — location cards, state grouping  
[x] Recruitment pipeline — Kanban drag-drop per MRF  
[x] AI screening — built-in TF-IDF scorer, batch screening  
[x] Casual / contractual worker fast-track — Aadhaar/PAN verify  
[x] Incoming mail processing — auto-parse to candidate  
[x] Agency Partner portal — `/agency` route, AGENCY_PARTNER role  
[x] Sidebar scrolling fix — 15+ nav items now scroll within viewport  
[x] Seed data — demo accounts, agencies, locations, templates, JDs, pipeline stages  

---

## Completed (Session 4 — Gap Fixes)

[x] **Real email dispatch** — nodemailer wired into `communicationRoutes`; lazy SMTP init via `SMTP_USER`/`SMTP_PASS` env vars; falls back to console logging in dev  
[x] **Probation API routes** — full `/api/probation` route file with CRUD, role-aware approve (BM→CM→MD chain), extend, fail  
[x] **Probation management page** — `/management/probation` shows full table, days-left countdown, 3-dot approval chain indicators, role-aware action buttons, Create/Extend/Detail modals  
[x] **Approvals page** — `/management/approvals` shows pending MRFs + draft offer letters; reject modal with required reason  
[x] **Audit Logs page** — `/admin/audit-logs` filterable by entity/action, paginated (50/page), action badge colour-coding  
[x] **System Settings page** — `/admin/settings` localStorage-based settings: General, Security, Notifications, Data & Storage sections  
[x] **Admin Departments page** — `/admin/departments` card grid with user counts, avatar stack, create/edit modal, activate/deactivate toggle  
[x] **Employee Offer page** — `/employee/offers` shows employee's own offer via email match; status banner, salary breakdown, Accept/Decline buttons  
[x] **Training Reports page** — `/training/reports` shows KPI cards, batch summary table with progress bars, enrollment status breakdown  
[x] **Report date filters** — Reports.jsx filters wired end-to-end: labeled date inputs, status dropdown, Clear button  
[x] **Agency partner scoping** — `GET /agencies/my` resolves agency via `AgencyPartner.userId` join; AgencyDashboard uses `agencyAPI.getMy()`  
[x] **Bulk CSV candidate import** — `POST /candidates/import/csv` with multer memoryStorage; CandidateList has Import CSV button; returns `{ created, skipped, errors[] }`  
[x] **Pagination for users** — `GET /users` accepts `page`, `limit`, `search`, `role` with total count  
[x] **Pagination for departments** — `GET /departments` accepts `includeInactive` param  
[x] **Rate limiting on auth** — `express-rate-limit` applied to `POST /auth/login` (20 req / 15 min)  
[x] **Layout page titles** — all Phase 3 routes now have explicit titles in `Layout.jsx`  
[x] **Pie chart resize fix** — `width="99%"` on ResponsiveContainer + HTML flex-wrap legend in recruiter and MD dashboards  
[x] **MD export button** — now builds real CSV from state and triggers browser download with dated filename  

---

## Completed (Session 5 — Agency Outreach & Platform Sourcing)

[x] **Agency type field** — `agencyType` (HIRING | MANPOWER) added to Agency model; `GET /agencies` supports `?agencyType=` filter  
[x] **Worker type on MRF** — `workerType` (PERMANENT | CONTRACTUAL | CASUAL) added to MRF; drives which agency type to contact  
[x] **Geographic agency scoring** — `GET /mrf/:id/suggested-agencies` scores agencies against MRF location (city match = 2 pts, state match = 1 pt), sorts by score → tier → success rate, filters by HIRING vs MANPOWER based on `workerType`  
[x] **MRF outreach endpoints** — `GET /mrf/:id/outreach` (history with replies), `POST /mrf/:id/outreach` (templated bulk email to selected agencies via nodemailer + `{{variable}}` substitution, creates MrfOutreach records)  
[x] **MrfOutreach model** — tracks outreach per MRF+Agency: subject, body, status (SENT | RESPONDED | CLOSED), responseCount, replies (IncomingMail[])  
[x] **Auto-agency detection from incoming mail** — `POST /incoming-mail` extracts sender email domain and auto-links to matching Agency record; no manual selection required  
[x] **IncomingMail relations** — `agencyId`, `mrfId`, `outreachId` FK fields added; GET endpoints include agency, mrf, outreach relations; supports `?agencyId=` and `?mrfId=` filters  
[x] **Express-track pipeline for MANPOWER candidates** — `POST /incoming-mail/:id/create-candidate` detects MANPOWER agency mail; creates candidate at SHORTLISTED (not APPLIED), `isExpressTrack=true`, `isContractual=true`; auto-creates CasualWorker stub; no AI screening or interview rounds required  
[x] **Platform Sourcing** — new `/api/sourcing` route (7 endpoints); `JobPosting` model tracks platform, URL, status (ACTIVE | PAUSED | CLOSED), application count; `formatDescription()` generates platform-specific job description text (LinkedIn gets hashtags, etc.)  
[x] **Sourcing.jsx page** — `/recruiter/sourcing`; platform pill filters, posting CRUD, auto-generate descriptions, copy-to-clipboard, application count tracking, status toggle, create-posting modal with MRF selector  
[x] **MRFDetail.jsx 4-tab rewrite** — Overview, Candidates, Agency Outreach (geo-scored suggestions + send outreach modal + history), Job Postings tab; shows `workerType` badge in header  
[x] **IncomingMail.jsx rewrite** — agency type badges, MRF link badge, outreach reply badge, Express Track warning for MANPOWER mails; orange "Express-Track Candidate" button vs blue "Auto-Create Candidate" button; post-creation result banner with candidate profile link  
[x] **Candidate model extensions** — `sourcedAgencyId` (FK → Agency), `isExpressTrack` Boolean, `sourceDetail` String added  
[x] **CandidateSource model** — added for future platform sourcing provenance tracking  

---

## Completed (Session 6 — Stability & Route Fixes)

[x] **Quick access login redirects** — `quickLogin` no longer calls `navigate()` directly; relies on `if (user)` guard in Login.jsx after AuthContext propagates  
[x] **Agency Partner removed from login** — removed from `roleRedirects` map and quick access buttons  
[x] **Casual Workers removed from sidebar** — removed from HR and RECRUITER nav arrays in Sidebar.jsx  
[x] **Agency Partner portal config removed** — AGENCY_PARTNER block removed from Sidebar.jsx  
[x] **Admin user edit fixed** — backend `PUT /users/:id` now whitelists only safe scalar fields; frontend sends clean payload (no relation objects, no timestamps)  
[x] **Deactivated departments stay visible** — admin Departments page passes `{ includeInactive: true }` to `departmentAPI.getAll()`  
[x] **MRF form input focus loss fixed** — `F` wrapper component moved to module level (was defined inside `MRFForm`, causing React to treat it as a new type on every render → unmount/remount → lost focus)  
[x] **CTC spinners removed** — salary fields changed from `type="number"` to `type="text" inputMode="numeric"`  
[x] **Management MRF Overview removed** — was showing same content as dashboard; nav item removed from BRANCH_MANAGER config  
[x] **Agency routes rewrite** — pagination safety (`parsePagination`), crypto-based agency codes, `findActiveAgency` helper, 404 checks on all detail/mutation routes, 409 on duplicate submissions, required field validation, expanded performance metrics  

---

## Completed (Session 7 — Cleanup, Validation & New Features)

[x] **Agency portal fixed** — added `GET /agencies/my` backend route + `agencyAPI.getMy()` in api.js; `AgencyDashboard` no longer crashes on load  
[x] **Platform sourcing removed** — `sourcingRoutes` unregistered from server.js; `sourcingAPI` removed from api.js; Job Postings tab removed from MRFDetail; MRFDetail now has 3 tabs (Overview, Candidates, Agency Outreach)  
[x] **CSV import removed** — Import CSV button, Download Template button, all import state and handlers removed from CandidateList; no file-based data entry  
[x] **Resume upload removed** — FormData approach in CandidateForm replaced with plain JSON; Resume Upload section removed; `candidateAPI.create` is now a plain JSON POST  
[x] **Document upload removed** — Upload Doc button and modal removed from CandidateDetail; `candidateAPI.uploadDocument` removed from api.js  
[x] **Candidate backend** — `POST /candidates` no longer uses `multer`; accepts JSON body; validates required fields at the API level  
[x] **CandidateForm per-field validation** — F component moved to module level (fixes input focus loss); inline errors for: name (letters only), email (regex), phone (10 digits), DOB (past + age ≥ 16), salary/experience/notice (non-negative); phone inputs strip non-digits automatically  
[x] **Interview scheduling validation** — confirmed already implemented: `scheduledAt` required + must be future, `meetingLink` required when mode=ONLINE, inline error display  
[x] **Department category** — added `category String?` field to Prisma schema + pushed to DB; category dropdown (Engineering, Sales, HR, Finance, etc.) in create/edit modal; category badge shown on department card  
[x] **Chemistry test in probation** — confirmed already fully implemented: `ChemistryTestSection` component with assign form, status update, date/remarks, embedded in probation detail modal  
[x] **AgencyDashboard submit** — changed to send plain JSON instead of FormData when creating candidate via Submit Candidate form  

## Completed (Session 8 — Bug Fixes & Feature Completions)

[x] **Employee Documents page** — replaced fake upload stub with in-app form; `EmployeeDocument` model added to schema; validated fields (type, number, issuing authority, issue/expiry dates)  
[x] **Email center candidates** — fixed data path bug (`r.data.candidates` → `r.data.data`); candidates now load in compose "To" dropdown  
[x] **Incoming mail "failed to load"** — removed `agencyType` from Agency select in incomingMail.js (field not in current schema)  
[x] **Offer letter create fails** — fixed empty `joiningDate` (`''`) causing Prisma DateTime error; only set when provided  
[x] **User edit — password field** — optional password change field added to edit form; blank = keep existing  
[x] **Approvals page — data paths** — fixed `m.data.mrfs` → `m.data.data` and `o.data.offers` → `o.data` (array); approve/reject now works and items disappear  
[x] **MRF experience field** — numeric-only input, strips non-digits, max 2 chars, labelled in years  
[x] **Employee Exams page** — replaced static stub with real API; matches user email → candidate → exam attempts; shows link, score, pass/fail  
[x] **Training attendance reload** — attendance now reloads saved records from backend on batch/date change; Save shows count  
[x] **Test employee created** — `employee@recruitment.com` / `Admin@123` has matching candidate CAND-0006 (Alex Kumar, EXAM_COMPLETED) for end-to-end flow testing  

## Completed (Session 9 — Flow Fixes & Training Enrollment)

[x] **MRF form — full per-field validation** — inline errors on blur for: department (required), designation (2–100 chars), vacancies (1–999 numeric), experience (0–99 numeric), salary min/max (numeric; max > min), reporting manager (letters + punctuation), description (5000 char limit with counter), skills (letters/numbers/+#.-/, max 50 chars, no duplicates); submit blocked until all pass  
[x] **Interview Complete → candidate status** — backend `POST /interviews/:id/complete` now also updates candidate to `SELECTED`; toast confirms "candidate moved to Selected"  
[x] **InterviewList — candidate name search** — search box filters by first+last name client-side; limit raised 20 → 100 so all interviews load; empty state explains interviews are scheduled from candidate detail page  
[x] **Training Batches — Enroll Candidates** — "Enroll Candidates" button in batch detail modal fetches SELECTED candidates not yet in the batch; multi-select → enroll via `POST /training/batches/:id/enroll`; enrolling sets candidate status to TRAINING_IN_PROGRESS  
[x] **Training Batches — Create Batch form** — "New Batch" button added with fully validated modal form (batch name, designation, dates, capacity, trainer, location)  
[x] **Offer form — required field validation** — `designation`, `department`, `basicSalary > 0` validated before submit; clear toast errors instead of silent 500  
[x] **Offer backend — proper 400 errors** — `POST /offers` now validates candidateId, designation, department, and basicSalary server-side; returns 400 with readable message instead of crashing with 500 on NaN salary  
[x] **Offer form — FINAL_APPROVED candidates** — dropdown now fetches both `EXAM_COMPLETED` and `FINAL_APPROVED` candidates; allows offer creation for manually-approved hires  
[x] **CandidateDetail status dropdown** — added all missing statuses: `TRAINING_IN_PROGRESS`, `EXAM_COMPLETED`, `OFFER_SENT`, `OFFER_ACCEPTED`, `OFFER_REJECTED`, `ONBOARDED`; current status always matches a dropdown option (no more blank select)  

## Completed (Session 10 — Interview Scheduling, Exam Batch, Offer Fix, Dynamic Journey)

[x] **Central interview scheduling** — "Schedule Interview" button added directly to InterviewList page header; modal with candidate dropdown (SHORTLISTED / INTERVIEW_SCHEDULED / SELECTED), round, type, date+time (future only, validated), duration, mode, meeting URL (required + URL-validated for ONLINE, disabled for PHONE), notes; confirmation email sent automatically on schedule  
[x] **MRF approval — MD only** — backend `POST /mrf/:id/approve` now returns 403 if caller role isn't `MD` or `MANAGING_DIRECTOR`; Approvals.jsx hides Approve/Reject buttons for non-MD users and shows "MD approval required" label instead; MD login: `md@recruitment.com` / `Admin@123`  
[x] **Exam batch link generation** — GenerateLinkForm replaced single dropdown with multi-select checkbox list of EXAM_PENDING candidates; "Select all" toggle; generates links sequentially and shows a results panel with per-candidate Copy Link buttons and failure reasons; score/expiry validation added to both generate form and result entry  
[x] **Offer form — exclude already-offered candidates** — fetches existing offers on load and removes candidates who already have one from the dropdown; explains "must not already have an offer letter" when list is empty; shows loading state while fetching; includes current status label in dropdown  
[x] **Dynamic recruitment journey — Employee Dashboard** — journey stepper now fetches real candidate record by email match; `JOURNEY_STEPS` mapping exported; steps filled based on actual status (Applied → Shortlisted → Interview → Training → Exam → Offer → Onboarded); current step label shown as badge; REJECTED shown in red  
[x] **Journey stepper on CandidateDetail** — horizontal `JourneyBar` component (imported from employee/Dashboard) inserted between header and tabs on every candidate detail page; shows which stage is done (✓), current (pulsing ring), and upcoming (gray)  
[x] **InterviewList — candidate current status badge** — each interview card now shows "Candidate now: ONBOARDED" (or whatever their current status is) when the candidate has moved beyond INTERVIEW_SCHEDULED; green for progression, red for REJECTED; backend `/interviews` GET updated to include `status` in candidate select  

## Known Behaviour (Not Bugs)

- **Recruitment journey steps** — Applied → Shortlisted → Interview (INTERVIEW_SCHEDULED or SELECTED) → Training (TRAINING_PENDING or TRAINING_IN_PROGRESS) → Exam (EXAM_PENDING, EXAM_COMPLETED, FINAL_APPROVED) → Offer (OFFER_SENT, OFFER_ACCEPTED, OFFER_REJECTED) → Onboarded. REJECTED can appear at any stage.  
- **Interview Complete = SELECTED** — Complete moves candidate to SELECTED regardless of round count. Schedule round 2 from the same Schedule Interview button after round 1 completes.  
- **MRF approval is MD-only** — only `md@recruitment.com` sees Approve/Reject on the Approvals page. Other management roles see a label.  
- **Exam link requires EXAM_PENDING status** — training enrollment must be marked Complete first (sets EXAM_PENDING). Exam link generation then appears in the multi-select list.  
- **Offer form shows no candidates if all are already offered** — this is correct; each candidate can only have one offer. Create a new candidate to test the offer flow again.  
- **Priya Patel seed data** — seed set her status to INTERVIEW_SCHEDULED but created no Interview record. Schedule via Interviews page → "Schedule Interview" → select Priya.  
- **Chemistry test vs probation status** — independent fields; chemistry PASSED does not auto-pass probation.  
- **AI screening MRF dropdown** — client-side filter only; select MRF + JD then click "Run Batch Screen."  
- **System Settings** — localStorage only, no backend effect.  
- **Active/Inactive users** — inactive users are blocked at login.  
- **Approval chain** — MRFs: MD only. Offers: single-level (any management). Probation: BM → CM → MD chain.  

## Full Test Flow (Recruiter → Employee)

1. **Admin** (`admin@recruitment.com`) — verify departments and users exist  
2. **Recruiter** (`recruiter@recruitment.com`) — Candidates → Add Candidate  
3. **Recruiter** — MRF → Create MRF → Submit for Approval (status: PENDING)  
4. **MD** (`md@recruitment.com`) — Approvals → Approve MRF (status: APPROVED)  
5. **Recruiter** — Interviews → Schedule Interview → select candidate → future date → Submit (candidate: INTERVIEW_SCHEDULED)  
6. **Recruiter** — Interviews → Complete interview → candidate auto-moves to **SELECTED**  
7. **Training** (`training@recruitment.com`) — Batches → open or create batch → Enroll Candidates → select candidate (candidate: TRAINING_IN_PROGRESS)  
8. **Training** — Batches → open batch → Mark Complete on enrollment (candidate: EXAM_PENDING)  
9. **Recruiter** — Exams → Generate Links → tick candidate → fill exam name/scores → Generate → copy link → record result PASS (candidate: EXAM_COMPLETED)  
10. **Recruiter** — Offers → Create Offer → select candidate → fill designation, department, salary → Create (status: DRAFT)  
11. **MD** — Approvals → approve offer (status: APPROVED)  
12. **Recruiter** — Offers → Send offer (candidate: OFFER_SENT)  
13. **Employee** (`employee@recruitment.com`) — Offers → Accept (candidate: OFFER_ACCEPTED)  
14. **Recruiter** — Appointment Letters → generate (candidate: ONBOARDED)  
15. **Management** — Probation → create record → assign chemistry test → approve chain (BM → CM → MD)  

## Still Pending

- [ ] **Agencies contacted → save to database** — when HR contacts an agency via outreach, agency communication history should be viewable in the agency detail page  

---

## Infrastructure (Deployment Concerns — Not Code Changes)

- [ ] **SQLite → PostgreSQL** — change `provider = "sqlite"` to `"postgresql"` in schema.prisma and update `DATABASE_URL`
- [ ] **File storage** — resumes at `backend/uploads/`; move to S3/GCS for multi-instance or persistent deployments
- [ ] **JWT secret** — always set `JWT_SECRET` env var in production (current fallback is hardcoded)
- [ ] **CORS** — origin is `http://localhost:5173`; update `FRONTEND_URL` env var for production domain
- [ ] **SMTP credentials** — set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` in `.env` for real email dispatch

---


