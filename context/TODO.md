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

## Infrastructure (Deployment Concerns — Not Code Changes)

- [ ] **SQLite → PostgreSQL** — change `provider = "sqlite"` to `"postgresql"` in schema.prisma and update `DATABASE_URL`
- [ ] **File storage** — resumes at `backend/uploads/`; move to S3/GCS for multi-instance or persistent deployments
- [ ] **JWT secret** — always set `JWT_SECRET` env var in production (current fallback is hardcoded)
- [ ] **CORS** — origin is `http://localhost:5173`; update `FRONTEND_URL` env var for production domain
- [ ] **SMTP credentials** — set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` in `.env` for real email dispatch

---

## Potential Enhancements

- [ ] WebSocket / Server-Sent Events for real-time notifications
- [ ] PDF generation for offer letters and appointment letters (pdfkit or puppeteer)
- [ ] Calendar integration for interview scheduling (Google Calendar API)
- [ ] WhatsApp/SMS channel for Communication engine
- [ ] Geographic heat-map visualization (Leaflet.js or Google Maps)
- [ ] Advanced AI screening with embeddings (OpenAI or local model) instead of TF-IDF
- [ ] Multi-tenancy / company isolation layer
- [ ] Dark mode toggle
- [ ] Export to Excel for reports
- [ ] Input validation library (Zod or Joi) for backend routes
