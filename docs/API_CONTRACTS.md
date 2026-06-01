# RecruitPro ERP — API Contracts

Base URL: `http://localhost:5000/api`  
Auth header: `Authorization: Bearer <jwt>`  
All endpoints (except `/auth/login` and `/exams/token/:token`) require a valid JWT.

---

## Auth — `/api/auth`

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/login` | `{ email, password }` | `{ token, user }` | Rate-limited: 20 req / 15 min |
| GET | `/me` | — | `{ user }` | |
| PUT | `/change-password` | `{ currentPassword, newPassword }` | `{ message }` | |

---

## Users — `/api/users`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `page`, `limit` (default 50), `search`, `role`. Returns users array (no `password`). Requires ADMIN. |
| GET | `/by-role/:role` | Active users with given role string |
| GET | `/interviewers` | Users with INTERVIEWER · RECRUITER · HR · ADMIN role |
| POST | `/` | `{ email, password, firstName, lastName, role, departmentId? }` — ADMIN or HR only |
| PUT | `/:id` | Update user fields; `password` auto-hashed if provided — ADMIN or HR only |
| PATCH | `/:id/toggle-status` | Flip `isActive` — ADMIN only |
| DELETE | `/:id` | Soft delete (`deletedAt`) — ADMIN only |

---

## Departments — `/api/departments`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `includeInactive=true` to include inactive departments (default: active only) |
| POST | `/` | `{ name, description? }` |
| PUT | `/:id` | `{ name?, description?, isActive? }` |

---

## MRF — `/api/mrf`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `status, departmentId, priority, search, page, limit` |
| GET | `/:id` | Full MRF with candidates count |
| POST | `/` | `{ designation, departmentId, vacancies, experience, skills[], salaryMin?, salaryMax?, location?, branch?, workerType?, priority?, description? }` — `workerType`: PERMANENT (default) \| CONTRACTUAL \| CASUAL |
| PUT | `/:id` | Update any MRF field |
| POST | `/:id/submit` | DRAFT → PENDING |
| POST | `/:id/approve` | PENDING → APPROVED |
| POST | `/:id/reject` | `{ reason }` — PENDING → REJECTED |
| DELETE | `/:id` | Soft delete |
| GET | `/:id/suggested-agencies` | Geo-scored agency list filtered by `workerType` → `agencyType`. Returns `{ agencies[], mrfLocation }` sorted by locationScore desc → tier desc → successRate desc |
| GET | `/:id/outreach` | Outreach history with agency, sentBy, replies (IncomingMail[]) |
| POST | `/:id/outreach` | `{ agencyIds[], subject, body }` — sends templated email (replaces `{{agencyName}}`, `{{designation}}`, `{{vacancies}}`, `{{location}}`, `{{mrfNumber}}`, `{{experience}}`); creates MrfOutreach records; returns `{ sent[], failed[] }` |

MRF number auto-generated: `MRF-YYYY-#####`

---

## Candidates — `/api/candidates`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `status, mrfId, search, page, limit` |
| GET | `/:id` | Full candidate with all relations |
| POST | `/` | Multipart form: all candidate fields + optional `resume` file |
| PUT | `/:id` | Update candidate fields (JSON) |
| PATCH | `/:id/status` | `{ status }` — also creates audit log entry |
| POST | `/:id/documents` | Multipart: `docType` + `document` file |
| POST | `/:id/comments` | `{ comment }` |
| PUT | `/:id/comments/:commentId` | `{ comment }` |
| DELETE | `/:id` | Soft delete |
| POST | `/import/csv` | Multipart: `file` (.csv). Required columns: `firstname, lastname, email, phone, designation`. Optional: `experience, currentcompany, city, source`. Returns `{ created, skipped, errors[] }`. |

Candidate ID auto-generated: `CAN-#####`  
Deduplication on email OR phone for both single create and CSV import.

---

## Interviews — `/api/interviews`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `status, candidateId, date, page, limit` |
| GET | `/today` | Interviews scheduled for today |
| POST | `/` | `{ candidateId, round, interviewType, scheduledAt, duration?, mode, location?, meetingLink?, panelIds[]?, notes? }` |
| PUT | `/:id` | Update interview |
| POST | `/:id/complete` | Sets status=COMPLETED, completedAt=now |
| POST | `/:id/cancel` | `{ reason }` |
| POST | `/:id/feedback` | `{ technicalScore, communicationScore, problemSolvingScore, cultureFitScore, overallScore, recommendation, strengths?, weaknesses?, comments? }` |

---

## Training — `/api/training`

| Method | Path | Notes |
|---|---|---|
| GET | `/batches` | Query: `status, search, page, limit` |
| GET | `/batches/:id` | Batch with enrollments and attendance |
| POST | `/batches` | `{ batchName, designation, startDate, endDate, maxCapacity, trainer?, location?, description? }` |
| PUT | `/batches/:id` | Update batch |
| POST | `/batches/:batchId/enroll` | `{ candidateIds[] }` |
| PUT | `/enrollments/:id` | `{ status, completionDate?, remarks? }` |
| POST | `/attendance` | `{ batchId, date, records: [{ candidateId, present, remarks? }] }` |
| GET | `/attendance/:batchId` | Query: `date` |

---

## Exams — `/api/exams`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `status, candidateId, page, limit` |
| POST | `/generate-link` | `{ candidateId, examName, passingScore, maxScore, linkExpiresAt? }` |
| PUT | `/:id/result` | `{ score, result, remarks? }` |
| GET | `/token/:token` | **Public** — returns exam attempt by unique token |

---

## Offers — `/api/offers`

Route ordering note: `/mine` and `/appointments/all` are registered before `/:id`.

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `status, page, limit` |
| GET | `/mine` | EMPLOYEE self-service — resolves via `req.user.email` → candidate email match |
| GET | `/:id` | |
| POST | `/` | `{ candidateId, designation, department, joiningDate?, expiryDate, basicSalary, hra?, allowances[], deductions[], grossSalary, netSalary, ctc }` |
| PUT | `/:id` | |
| POST | `/:id/approve` | DRAFT → APPROVED |
| POST | `/:id/send` | APPROVED → SENT |
| POST | `/:id/accept` | SENT → ACCEPTED |
| POST | `/:id/reject` | `{ reason }` |
| GET | `/appointments/all` | All appointment letters |
| POST | `/appointments` | `{ candidateId, designation, department, joiningDate, probationPeriod? }` |

Offer number auto-generated: `OFF-YYYY-#####`

---

## Probation — `/api/probation`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `status, search, page, limit` |
| GET | `/:id` | Full record with candidate relation |
| POST | `/` | `{ candidateId, startDate, endDate, reviewerId?, notes? }` |
| PUT | `/:id` | Update fields |
| POST | `/:id/approve` | Role-aware approval: BRANCH_MANAGER sets `branchManagerApproval`; COUNTRY_MANAGER sets `countryManagerApproval`; MD sets `mdApproval` and, if all three are set, transitions status → PASSED and candidate.status → CONFIRMED |
| POST | `/:id/extend` | `{ newEndDate, reason }` — sets status=EXTENDED |
| POST | `/:id/fail` | `{ reason }` — sets status=FAILED |

---

## Audit Logs — `/api/audit-logs`

Requires ADMIN role.

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `entity, action, userId, page` (50/page). Returns logs with user firstName/lastName. |
| GET | `/entities` | Returns array of distinct entity strings for filter dropdown |

---

## Reports — `/api/reports`

| Method | Path | Returns |
|---|---|---|
| GET | `/dashboard` | `{ totalMRFs, totalCandidates, scheduledInterviews, activeBatches, pendingOffers, hiredThisMonth }` |
| GET | `/candidates` | Query: `startDate, endDate` — status distribution, source breakdown |
| GET | `/interviews` | Query: `startDate, endDate` — by type, by result |
| GET | `/training` | Batch stats, enrollment counts, completion rates |
| GET | `/exams` | Pass/fail rates |
| GET | `/mrf` | Open vs closed, by department |

---

## Notifications — `/api/notifications`

| Method | Path |
|---|---|
| GET | `/` |
| PUT | `/:id/read` |
| PUT | `/mark-all-read` |

---

## Agencies — `/api/agencies`

Route ordering note: `/my` is registered before `/:id`.

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `status, tier, agencyType, search, page, limit` — HR/ADMIN only. `agencyType`: HIRING \| MANPOWER |
| GET | `/my` | AGENCY_PARTNER self-service — resolves agency via `AgencyPartner.userId`; returns `{ agency, performance }` |
| GET | `/:id` | Agency with contacts, submissions, locations |
| POST | `/` | `{ name, contactPerson, email, phone, address?, city?, state?, specializations[]?, tier?, contractStart?, contractEnd?, notes? }` |
| PUT | `/:id` | |
| DELETE | `/:id` | Soft delete |
| POST | `/:id/contacts` | `{ name, designation?, email?, phone?, isPrimary? }` |
| POST | `/:id/submissions` | `{ mrfId, candidateId, notes?, fee? }` |
| GET | `/:id/performance` | `{ totalSubmissions, placed, successRate, byStatus }` |

Agency code auto-generated: `AGY-XXX-#####`

---

## Communications — `/api/communications`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `candidateId, page, limit` — communication history |
| POST | `/send` | `{ templateId?, subject, body, candidateIds[], channel? }` — dispatches via nodemailer per candidate; logs status/failureReason |
| GET | `/templates` | Query: `category` |
| POST | `/templates` | `{ name, subject, body, category, variables[]? }` |
| PUT | `/templates/:id` | |
| DELETE | `/templates/:id` | |
| POST | `/templates/:id/preview` | `{ variables: { key: value } }` — substitutes `{{key}}` in body |

---

## Geography — `/api/geography`

| Method | Path | Notes |
|---|---|---|
| GET | `/locations` | Query: `state, zone, search` |
| POST | `/locations` | `{ city, state, country?, region?, zone?, pincode? }` |
| GET | `/locations/:id/agencies` | Agencies assigned to this location |
| POST | `/locations/:id/agencies` | `{ agencyId, isPrimary? }` |
| GET | `/states` | Distinct state list with city counts |
| GET | `/intelligence` | Per-location: `{ candidateCount, activeCount, agencyCount, activeAgencies }` |

---

## AI Screening — `/api/ai-screening`

| Method | Path | Notes |
|---|---|---|
| GET | `/jd` | All job descriptions |
| GET | `/jd/:id` | JD by ID |
| POST | `/jd` | `{ mrfId, title, description, requirements, skills[]?, experience? }` — upserts on mrfId |
| GET | `/results` | Query: `mrfId, jdId, minScore` |
| POST | `/screen` | `{ candidateId, jdId }` — score one candidate |
| POST | `/screen/batch` | `{ mrfId, jdId }` — score all candidates for an MRF |

**Score formula:** `matchScore = skillScore*0.5 + expScore*0.3 + textScore*0.2`

---

## Pipeline — `/api/pipeline`

| Method | Path | Notes |
|---|---|---|
| GET | `/mrf/:mrfId` | Stages with candidate entries |
| POST | `/mrf/:mrfId/init` | Create 6 default stages (idempotent) |
| POST | `/mrf/:mrfId/stages` | `{ name, order, color? }` — custom stage |
| POST | `/move` | `{ candidateId, stageId, notes? }` — removes prior entries for same MRF |
| DELETE | `/entry/:candidateId/:stageId` | Remove candidate from a specific stage |

---

## Casual Workers — `/api/casual-workers`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `status, workerType, search, page, limit` |
| GET | `/:id` | |
| POST | `/` | Creates Candidate + CasualWorker atomically. Body: all candidate fields + `{ workerType, contractStart, contractEnd?, dailyRate?, monthlyRate?, bankAccount?, ifscCode?, department?, reportingTo?, siteLocation? }` |
| PUT | `/:id` | Update CasualWorker fields |
| PATCH | `/:id/verify` | `{ aadhaarVerified?, panVerified? }` |

---

## Incoming Mail — `/api/incoming-mail`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `status, agencyId, mrfId, page, limit`. Response includes `agency`, `mrf`, `outreach` relations |
| GET | `/:id` | Full mail with agency (id, name, agencyType, email), mrf (id, mrfNumber, designation, workerType), outreach (id, subject, sentAt) |
| POST | `/` | Ingest: `{ fromEmail, fromName?, subject, body?, receivedAt?, attachments[]?, agencyId?, mrfId?, outreachId? }`. Auto-detects agency from sender domain if `agencyId` not provided. Increments `responseCount` on linked outreach. |
| PATCH | `/:id/process` | `{ status?, candidateId?, agencyId?, mrfId?, notes? }` — mark PROCESSED |
| POST | `/:id/create-candidate` | Auto-parses body; if from MANPOWER agency → candidate created at SHORTLISTED, `isExpressTrack=true`, `isContractual=true`, CasualWorker stub auto-created. Standard agencies → APPLIED. Returns `{ candidate, isExpressTrack, mail }`. 409 if candidate email/phone already exists. |
| PATCH | `/:id/discard` | Status → DISCARDED |

---

## Sourcing (Platform Job Postings) — `/api/sourcing`

Platforms: `LINKEDIN · NAUKRI · INDEED · INTERNSHALA · MONSTER · SHINE · OTHER`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `status, platform, mrfId, page, limit`. Returns postings with mrf and postedBy. |
| GET | `/mrf/:mrfId` | All postings for a specific MRF |
| POST | `/generate-description` | `{ mrfId, platform }` — returns `{ description, platform, platformLabel }` preview text without creating a record |
| POST | `/` | `{ mrfId, platform, title?, description?, postUrl?, expiresAt?, notes? }` — `description` auto-generated if omitted |
| PUT | `/:id` | `{ postUrl?, status?, applications?, notes?, expiresAt? }` — update URL, status (ACTIVE \| PAUSED \| CLOSED), or increment application count |
| DELETE | `/:id` | Hard delete |
