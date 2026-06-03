# RecruitPro ERP — Codebase Usage Audit

**Date:** 2026-06-03  
**Auditor:** Automated read-only analysis (no files modified)

---

## 1. Executive Summary

| Category | Count |
|---|---|
| Frontend page files audited | 34 |
| Frontend component files audited | 7 |
| Backend route files audited | 22 |
| Prisma models audited | 26 |
| API objects in api.js | 17 |

**Key Findings:**

1. **Two route files are NOT mounted in server.js:** `sourcing.js` and `casualWorkers.js` exist in `backend/src/routes/` but have zero `app.use()` entries in server.js — all their endpoints return 404 in production.

2. **`casualWorkers.js` references non-existent Prisma models:** It calls `prisma.casualWorker` and reads fields `isContractual`, `aadhaarNumber`, `panNumber` on `Candidate` — none of which exist in `schema.prisma`. The route would crash at runtime if it were mounted.

3. **Two frontend pages are NOT imported in App.jsx:** `Sourcing.jsx` and `CasualWorkers.jsx` are page files with full implementations, but they are never imported or routed anywhere — they are completely unreachable.

4. **Two API objects in api.js do not exist:** `sourcingAPI` and `casualWorkerAPI` are imported by the two orphan pages above but are not defined in `api.js`. Both pages would throw a runtime JS error if they were navigated to.

5. **`AgencyDashboard.jsx` has no route in App.jsx:** The file exists and uses `agencyAPI.getMy()`, but there is no `/agency` route registered. The AGENCY portal was explicitly retired (noted in agencies.js comment).

6. **`agencyAPI.getMy()` backend was removed:** A comment in `agencies.js` explicitly documents that `GET /my` was removed because the AGENCY_PARTNER role was retired.

7. **`offerAPI.getAppointments` and `offerAPI.createAppointment` are defined but never called** in any frontend file.

8. **`geographyAPI.createLocation`, `getAgenciesByLocation`, `assignAgencyToLocation`, `getStates`** methods are defined in api.js but never called in any page.

9. **Two backend packages appear unused:** `uuid` and `express-validator` are listed in `backend/package.json` but no `import` statement for either exists in any backend source file.

10. **`HR_ROLES` constant is copy-pasted** into at least 6 separate route files instead of being shared.

11. **`PrismaClient` is instantiated separately** in every route file (22+ instances) instead of sharing a singleton.

---

## 2. Active Architecture Map

The following describes what is actually wired up end-to-end:

**Frontend entry:** `frontend/src/main.jsx` → `App.jsx` → `AuthProvider` + `AppRoutes`

**Portals and their status:**

| Portal | URL prefix | Roles | Status |
|---|---|---|---|
| Recruiter/HR | `/recruiter` | HR, RECRUITER, INTERVIEWER, ADMIN | ACTIVE |
| Employee | `/employee` | EMPLOYEE, ADMIN | ACTIVE |
| Training | `/training` | TRAINING, ADMIN | ACTIVE |
| Management | `/management` | BRANCH_MANAGER, COUNTRY_MANAGER, MD, ADMIN | ACTIVE |
| Admin | `/admin` | ADMIN | ACTIVE |
| Agency | `/agency` | (no route) | ORPHANED — no route in App.jsx |

**Backend:** Express on port 5000 → 20 mounted route files + 2 unmounted orphan files

---

## 3. Frontend Usage Report

### 3a. Page Files

| File | Route in App.jsx | In Sidebar | API Calls | Status |
|---|---|---|---|---|
| `pages/auth/Login.jsx` | `/login` | No (public) | `authAPI.login` | ACTIVE |
| `pages/recruiter/Dashboard.jsx` | `/recruiter` (index) | Yes (all recruiter roles) | `reportAPI.dashboard` | ACTIVE |
| `pages/recruiter/MRF/MRFList.jsx` | `/recruiter/mrf` | Yes | `mrfAPI.getAll` | ACTIVE |
| `pages/recruiter/MRF/MRFDetail.jsx` | `/recruiter/mrf/:id` | No (detail page) | `mrfAPI.getById`, `mrfAPI.getSuggestedAgencies`, `mrfAPI.getOutreach`, `mrfAPI.sendOutreach` | ACTIVE |
| `pages/recruiter/MRF/MRFForm.jsx` | (component, not a route) | No | `mrfAPI.create`, `mrfAPI.update` | ACTIVE — used inside MRFList as a modal |
| `pages/recruiter/Candidates/CandidateList.jsx` | `/recruiter/candidates` | Yes | `candidateAPI.getAll`, `candidateAPI.delete` | ACTIVE |
| `pages/recruiter/Candidates/CandidateDetail.jsx` | `/recruiter/candidates/:id` | No (detail page) | `candidateAPI.getById`, `candidateAPI.update`, `candidateAPI.updateStatus`, `candidateAPI.addComment`, `candidateAPI.editComment` | ACTIVE |
| `pages/recruiter/Candidates/CandidateForm.jsx` | (component, not a route) | No | `candidateAPI.create` | ACTIVE — used inside CandidateList as a modal |
| `pages/recruiter/Interviews/InterviewList.jsx` | `/recruiter/interviews` | Yes | `interviewAPI.getAll`, `interviewAPI.create`, `interviewAPI.update`, `interviewAPI.complete`, `interviewAPI.cancel`, `interviewAPI.submitFeedback` | ACTIVE |
| `pages/recruiter/Training/TrainingCoordination.jsx` | `/recruiter/training` | No (not in sidebar) | `trainingAPI.getBatches`, `trainingAPI.enrollCandidates`, `trainingAPI.updateEnrollment`, `candidateAPI.getAll` | ACTIVE (route exists, not in sidebar for HR/RECRUITER) |
| `pages/recruiter/Exams/ExamManagement.jsx` | `/recruiter/exams` | Yes | `examAPI.getAll`, `examAPI.generateLink`, `examAPI.updateResult`, `candidateAPI.getAll` | ACTIVE |
| `pages/recruiter/Offers/OfferManagement.jsx` | `/recruiter/offers` | Yes | `offerAPI.getAll`, `offerAPI.create`, `offerAPI.approve`, `offerAPI.send`, `candidateAPI.getAll` | ACTIVE |
| `pages/recruiter/Reports/Reports.jsx` | `/recruiter/reports` | Yes | `reportAPI.candidates`, `reportAPI.interviews`, `reportAPI.training`, `reportAPI.exams`, `reportAPI.mrf` | ACTIVE |
| `pages/recruiter/Agencies/AgencyList.jsx` | `/recruiter/agencies` | No (not in sidebar for HR/RECRUITER) | `agencyAPI.getAll`, `agencyAPI.create` | ACTIVE (routed, not in sidebar) |
| `pages/recruiter/Agencies/AgencyDetail.jsx` | `/recruiter/agencies/:id` | No | `agencyAPI.getById`, `agencyAPI.getPerformance`, `agencyAPI.update`, `agencyAPI.delete`, `agencyAPI.addContact` | ACTIVE |
| `pages/recruiter/EmailCenter/EmailCenter.jsx` | `/recruiter/email-center` | Yes | `communicationAPI.getAll`, `communicationAPI.send`, `communicationAPI.getTemplates`, `communicationAPI.createTemplate`, `candidateAPI.getAll` | ACTIVE |
| `pages/recruiter/Pipeline/PipelineKanban.jsx` | `/recruiter/pipeline` | Yes | `pipelineAPI.getByMrf`, `pipelineAPI.initStages`, `pipelineAPI.moveCandidate`, `mrfAPI.getAll` | ACTIVE |
| `pages/recruiter/AIScreening/AIScreening.jsx` | `/recruiter/ai-screening` | Yes | `aiScreeningAPI.getAllJDs`, `aiScreeningAPI.getResults`, `aiScreeningAPI.screenBatch`, `aiScreeningAPI.createJD`, `mrfAPI.getAll` | ACTIVE |
| `pages/recruiter/Geography/GeographyIntelligence.jsx` | `/recruiter/geography` | No (not in sidebar) | `geographyAPI.getIntelligence` | ACTIVE (routed, not in sidebar) |
| `pages/recruiter/IncomingMail/IncomingMail.jsx` | `/recruiter/incoming-mail` | Yes | `incomingMailAPI.getAll`, `incomingMailAPI.getById`, `incomingMailAPI.createCandidate`, `incomingMailAPI.discard`, `incomingMailAPI.process` | ACTIVE |
| `pages/recruiter/Sourcing/Sourcing.jsx` | **NOT in App.jsx** | No | `sourcingAPI.*` (undefined in api.js) | **ORPHANED — unreachable page, broken API imports** |
| `pages/recruiter/CasualWorkers/CasualWorkers.jsx` | **NOT in App.jsx** | No | `casualWorkerAPI.*` (undefined in api.js) | **ORPHANED — unreachable page, broken API imports** |
| `pages/employee/Dashboard.jsx` | `/employee` (index) | Yes | `candidateAPI.getAll`, `examAPI.getAll`, `offerAPI.getMine` | ACTIVE |
| `pages/employee/Profile.jsx` | `/employee/profile` | Yes | (reads from AuthContext, no API calls visible) | ACTIVE |
| `pages/employee/Documents.jsx` | `/employee/documents` | Yes | `employeeDocumentAPI.getAll`, `employeeDocumentAPI.create`, `employeeDocumentAPI.delete` | ACTIVE |
| `pages/employee/Training.jsx` | `/employee/training` | **Not in sidebar** (EMPLOYEE nav omits it) | `trainingAPI.getBatches` (likely) | ROUTED but NOT IN SIDEBAR |
| `pages/employee/Exams.jsx` | `/employee/exams` | Yes | `examAPI.getAll` | ACTIVE |
| `pages/employee/Offers.jsx` | `/employee/offers` | Yes | `offerAPI.getMine`, `offerAPI.accept`, `offerAPI.reject` | ACTIVE |
| `pages/training/Dashboard.jsx` | `/training` (index) | Yes | `trainingAPI.getBatches` | ACTIVE |
| `pages/training/Batches.jsx` | `/training/batches` | Yes | `trainingAPI.getBatches`, `trainingAPI.getBatchById`, `trainingAPI.createBatch`, `trainingAPI.updateBatch`, `trainingAPI.enrollCandidates`, `trainingAPI.updateEnrollment`, `candidateAPI.getAll` | ACTIVE |
| `pages/training/Attendance.jsx` | `/training/attendance` | Yes | `trainingAPI.getBatches`, `trainingAPI.getBatchById`, `trainingAPI.markAttendance`, `trainingAPI.getAttendance` | ACTIVE |
| `pages/training/Reports.jsx` | `/training/reports` | Yes | `reportAPI.training` | ACTIVE |
| `pages/management/Dashboard.jsx` | `/management` (index) | Yes | `reportAPI.dashboard` | ACTIVE |
| `pages/management/Reports.jsx` | `/management/reports` | Yes | `reportAPI.candidates` | ACTIVE |
| `pages/management/Approvals.jsx` | `/management/approvals` | Yes (MD only) | `offerAPI.getAll`, `offerAPI.approve`, `offerAPI.reject`, `mrfAPI.getAll`, `mrfAPI.approve`, `mrfAPI.reject`, `candidateAPI.getAll` | ACTIVE |
| `pages/management/Probation.jsx` | `/management/probation` | Yes | `probationAPI.getAll`, `probationAPI.create`, `probationAPI.approve`, `probationAPI.fail`, `probationAPI.extend`, `chemistryTestAPI.getAll`, `chemistryTestAPI.create`, `chemistryTestAPI.update`, `candidateAPI.getAll` | ACTIVE |
| `pages/admin/Dashboard.jsx` | `/admin` (index) | Yes | `userAPI.getAll`, `departmentAPI.getAll` | ACTIVE |
| `pages/admin/Users.jsx` | `/admin/users` | Yes | `userAPI.getAll`, `userAPI.create`, `userAPI.update`, `userAPI.toggleStatus`, `userAPI.delete`, `departmentAPI.getAll` | ACTIVE |
| `pages/admin/Departments.jsx` | `/admin/departments` | Yes | `departmentAPI.getAll`, `departmentAPI.create`, `departmentAPI.update` | ACTIVE |
| `pages/admin/AuditLogs.jsx` | `/admin/audit-logs` | Yes | `auditLogAPI.getAll`, `auditLogAPI.getEntities` | ACTIVE |
| `pages/admin/SystemSettings.jsx` | `/admin/settings` | Yes | (no API calls — static display only) | ACTIVE (static) |
| `pages/agency/AgencyDashboard.jsx` | **NOT in App.jsx** | No (no portal config either) | `agencyAPI.getMy`, `mrfAPI.getAll`, `agencyAPI.submitCandidate`, `agencyAPI.getById` | **ORPHANED — file exists, no route, no sidebar config** |

### 3b. Component Files

| File | Imported by | Status |
|---|---|---|
| `components/layout/Layout.jsx` | `App.jsx` (all portal wrapper routes) | ACTIVE |
| `components/layout/Sidebar.jsx` | `Layout.jsx` | ACTIVE |
| `components/layout/Header.jsx` | `Layout.jsx` | ACTIVE |
| `components/common/StatusBadge.jsx` | 18+ page files | ACTIVE |
| `components/common/Modal.jsx` | 12+ page files | ACTIVE |
| `components/common/KPICard.jsx` | 4 dashboard pages | ACTIVE |

### 3c. Context, Hooks, Services

| File | Imported by | Status |
|---|---|---|
| `context/AuthContext.jsx` | `App.jsx`, `Sidebar.jsx`, `Header.jsx`, `Login.jsx`, `AgencyDashboard.jsx` | ACTIVE |
| `services/api.js` | All page files | ACTIVE |
| `constants/locations.js` | `MRFForm.jsx` | ACTIVE |

---

## 4. Backend Usage Report

### 4a. Route Files

| File | Mounted in server.js | Mount Path | Status |
|---|---|---|---|
| `routes/auth.js` | Yes | `/api/auth` | ACTIVE |
| `routes/mrf.js` | Yes | `/api/mrf` | ACTIVE |
| `routes/candidates.js` | Yes | `/api/candidates` | ACTIVE |
| `routes/interviews.js` | Yes | `/api/interviews` | ACTIVE |
| `routes/training.js` | Yes | `/api/training` | ACTIVE |
| `routes/exams.js` | Yes | `/api/exams` | ACTIVE |
| `routes/offers.js` | Yes | `/api/offers` | ACTIVE |
| `routes/reports.js` | Yes | `/api/reports` | ACTIVE |
| `routes/users.js` | Yes | `/api/users` | ACTIVE |
| `routes/notifications.js` | Yes | `/api/notifications` | ACTIVE |
| `routes/departments.js` | Yes | `/api/departments` | ACTIVE |
| `routes/agencies.js` | Yes | `/api/agencies` | ACTIVE |
| `routes/communications.js` | Yes | `/api/communications` | ACTIVE |
| `routes/geography.js` | Yes | `/api/geography` | ACTIVE |
| `routes/aiScreening.js` | Yes | `/api/ai-screening` | ACTIVE |
| `routes/pipeline.js` | Yes | `/api/pipeline` | ACTIVE |
| `routes/incomingMail.js` | Yes | `/api/incoming-mail` | ACTIVE |
| `routes/auditLogs.js` | Yes | `/api/audit-logs` | ACTIVE |
| `routes/probation.js` | Yes | `/api/probation` | ACTIVE |
| `routes/chemistryTests.js` | Yes | `/api/chemistry-tests` | ACTIVE |
| `routes/employeeDocuments.js` | Yes | `/api/employee-documents` | ACTIVE |
| `routes/sourcing.js` | **NO** | (none) | **ORPHANED** |
| `routes/casualWorkers.js` | **NO** | (none) | **ORPHANED + BROKEN** |

### 4b. Endpoints per Route File

**auth.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| POST `/api/auth/login` | None (rate-limited) | `authAPI.login` | ACTIVE |
| GET `/api/auth/me` | authenticate | `authAPI.me` | ACTIVE |
| PUT `/api/auth/change-password` | authenticate | `authAPI.changePassword` | No page calls it directly; available | LOW USE |

**mrf.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/mrf` | authenticate | `mrfAPI.getAll` | ACTIVE |
| GET `/api/mrf/:id` | authenticate | `mrfAPI.getById` | ACTIVE |
| POST `/api/mrf` | authenticate | `mrfAPI.create` | ACTIVE |
| PUT `/api/mrf/:id` | authenticate | `mrfAPI.update` | ACTIVE |
| POST `/api/mrf/:id/approve` | authenticate + role check (MD only, inline) | `mrfAPI.approve` | ACTIVE |
| POST `/api/mrf/:id/reject` | authenticate | `mrfAPI.reject` | ACTIVE |
| POST `/api/mrf/:id/submit` | authenticate | `mrfAPI.submit` | ACTIVE |
| DELETE `/api/mrf/:id` | authenticate | `mrfAPI.delete` | ACTIVE |
| GET `/api/mrf/:id/suggested-agencies` | authenticate | `mrfAPI.getSuggestedAgencies` | ACTIVE |
| GET `/api/mrf/:id/outreach` | authenticate | `mrfAPI.getOutreach` | ACTIVE |
| POST `/api/mrf/:id/outreach` | authenticate | `mrfAPI.sendOutreach` | ACTIVE |

**candidates.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/candidates` | authenticate | `candidateAPI.getAll` | ACTIVE |
| GET `/api/candidates/:id` | authenticate | `candidateAPI.getById` | ACTIVE |
| POST `/api/candidates` | authenticate | `candidateAPI.create` | ACTIVE |
| PUT `/api/candidates/:id` | authenticate | `candidateAPI.update` | ACTIVE |
| PATCH `/api/candidates/:id/status` | authenticate | `candidateAPI.updateStatus` | ACTIVE |
| POST `/api/candidates/:id/documents` | authenticate | Not in api.js; multer upload | LOW USE |
| POST `/api/candidates/:id/comments` | authenticate | `candidateAPI.addComment` | ACTIVE |
| PUT `/api/candidates/:id/comments/:commentId` | authenticate | `candidateAPI.editComment` | ACTIVE |
| DELETE `/api/candidates/:id` | authenticate | `candidateAPI.delete` | ACTIVE |
| POST `/api/candidates/import/csv` | authenticate | Not in api.js | **NO FRONTEND CALLER** |

**interviews.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/interviews` | authenticate | `interviewAPI.getAll` | ACTIVE |
| GET `/api/interviews/today` | authenticate | `interviewAPI.getToday` (defined in api.js but no page calls it) | **API METHOD UNCALLED** |
| POST `/api/interviews` | authenticate | `interviewAPI.create` | ACTIVE |
| PUT `/api/interviews/:id` | authenticate | `interviewAPI.update` | ACTIVE |
| POST `/api/interviews/:id/complete` | authenticate | `interviewAPI.complete` | ACTIVE |
| POST `/api/interviews/:id/cancel` | authenticate | `interviewAPI.cancel` | ACTIVE |
| POST `/api/interviews/:id/feedback` | authenticate | `interviewAPI.submitFeedback` | ACTIVE |

**training.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/training/batches` | authenticate | `trainingAPI.getBatches` | ACTIVE |
| GET `/api/training/batches/:id` | authenticate | `trainingAPI.getBatchById` | ACTIVE |
| POST `/api/training/batches` | authenticate | `trainingAPI.createBatch` | ACTIVE |
| PUT `/api/training/batches/:id` | authenticate | `trainingAPI.updateBatch` | ACTIVE |
| POST `/api/training/batches/:id/enroll` | authenticate | `trainingAPI.enrollCandidates` | ACTIVE |
| PUT `/api/training/enrollments/:id` | authenticate | `trainingAPI.updateEnrollment` | ACTIVE |
| POST `/api/training/attendance` | authenticate | `trainingAPI.markAttendance` | ACTIVE |
| GET `/api/training/attendance/:batchId` | authenticate | `trainingAPI.getAttendance` | ACTIVE |

**exams.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/exams` | authenticate | `examAPI.getAll` | ACTIVE |
| POST `/api/exams/generate-link` | authenticate | `examAPI.generateLink` | ACTIVE |
| PUT `/api/exams/:id/result` | authenticate | `examAPI.updateResult` | ACTIVE |
| GET `/api/exams/token/:token` | authenticate | `examAPI.getByToken` (defined but NO page calls it) | **API METHOD UNCALLED** |

**offers.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/offers` | authenticate | `offerAPI.getAll` | ACTIVE |
| GET `/api/offers/mine` | authenticate | `offerAPI.getMine` | ACTIVE |
| GET `/api/offers/:id` | authenticate | `offerAPI.getById` (defined in api.js, not directly called by pages) | LOW USE |
| POST `/api/offers` | authenticate | `offerAPI.create` | ACTIVE |
| PUT `/api/offers/:id` | authenticate | `offerAPI.update` (defined, not directly called) | LOW USE |
| POST `/api/offers/:id/approve` | authenticate | `offerAPI.approve` | ACTIVE |
| POST `/api/offers/:id/send` | authenticate | `offerAPI.send` | ACTIVE |
| POST `/api/offers/:id/accept` | authenticate | `offerAPI.accept` | ACTIVE |
| POST `/api/offers/:id/reject` | authenticate | `offerAPI.reject` | ACTIVE |
| GET `/api/offers/appointments/all` | authenticate | `offerAPI.getAppointments` — **NO page calls this** | **API METHOD UNCALLED** |
| POST `/api/offers/appointments` | authenticate | `offerAPI.createAppointment` — **NO page calls this** | **API METHOD UNCALLED** |

**reports.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/reports/dashboard` | authenticate | `reportAPI.dashboard` | ACTIVE |
| GET `/api/reports/candidates` | authenticate | `reportAPI.candidates` | ACTIVE |
| GET `/api/reports/interviews` | authenticate | `reportAPI.interviews` | ACTIVE |
| GET `/api/reports/training` | authenticate | `reportAPI.training` | ACTIVE |
| GET `/api/reports/exams` | authenticate | `reportAPI.exams` | ACTIVE |
| GET `/api/reports/mrf` | authenticate | `reportAPI.mrf` | ACTIVE |

**users.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/users` | authenticate | `userAPI.getAll` | ACTIVE |
| GET `/api/users/by-role/:role` | authenticate | `userAPI.getByRole` (defined, likely used in forms) | ACTIVE |
| GET `/api/users/interviewers` | authenticate | `userAPI.getInterviewers` | ACTIVE |
| POST `/api/users` | authenticate + authorize(ADMIN, HR) | `userAPI.create` | ACTIVE |
| PUT `/api/users/:id` | authenticate + authorize(ADMIN, HR) | `userAPI.update` | ACTIVE |
| PATCH `/api/users/:id/toggle-status` | authenticate + authorize(ADMIN) | `userAPI.toggleStatus` | ACTIVE |
| DELETE `/api/users/:id` | authenticate + authorize(ADMIN) | `userAPI.delete` | ACTIVE |

**notifications.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/notifications` | authenticate | `notificationAPI.getAll` | ACTIVE |
| PUT `/api/notifications/mark-all-read` | authenticate | `notificationAPI.markAllRead` | ACTIVE |
| PUT `/api/notifications/:id/read` | authenticate | `notificationAPI.markRead` | ACTIVE |

**departments.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/departments` | authenticate | `departmentAPI.getAll` | ACTIVE |
| POST `/api/departments` | authenticate | `departmentAPI.create` | ACTIVE |
| PUT `/api/departments/:id` | authenticate | `departmentAPI.update` | ACTIVE |

**agencies.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/agencies` | authenticate + authorize(ADMIN,HR,RECRUITER) | `agencyAPI.getAll` | ACTIVE |
| POST `/api/agencies` | authenticate + authorize(ADMIN,HR,RECRUITER) | `agencyAPI.create` | ACTIVE |
| GET `/api/agencies/:id` | authenticate + authorize(ADMIN,HR,RECRUITER) | `agencyAPI.getById` | ACTIVE |
| PUT `/api/agencies/:id` | authenticate + authorize(ADMIN,HR,RECRUITER) | `agencyAPI.update` | ACTIVE |
| DELETE `/api/agencies/:id` | authenticate + authorize(ADMIN,HR) | `agencyAPI.delete` | ACTIVE |
| POST `/api/agencies/:id/contacts` | authenticate + authorize(ADMIN,HR,RECRUITER) | `agencyAPI.addContact` | ACTIVE |
| POST `/api/agencies/:id/submissions` | authenticate + authorize(ADMIN,HR,RECRUITER) | `agencyAPI.submitCandidate` | LOW USE (AgencyDashboard only) |
| GET `/api/agencies/:id/performance` | authenticate + authorize(ADMIN,HR,RECRUITER) | `agencyAPI.getPerformance` | ACTIVE |
| ~~GET `/api/agencies/my`~~ | REMOVED | ~~`agencyAPI.getMy`~~ | **ROUTE DELETED** (referenced by orphan AgencyDashboard page) |

**communications.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/communications/templates` | authenticate + authorize(ADMIN,HR,RECRUITER) | `communicationAPI.getTemplates` | ACTIVE |
| POST `/api/communications/templates` | authenticate + authorize(ADMIN,HR) | `communicationAPI.createTemplate` | ACTIVE |
| PUT `/api/communications/templates/:id` | authenticate + authorize(ADMIN,HR) | `communicationAPI.updateTemplate` — **NO page calls this** | **API METHOD UNCALLED** |
| DELETE `/api/communications/templates/:id` | authenticate + authorize(ADMIN,HR) | `communicationAPI.deleteTemplate` — **NO page calls this** | **API METHOD UNCALLED** |
| GET `/api/communications` | authenticate + authorize(ADMIN,HR,RECRUITER) | `communicationAPI.getAll` | ACTIVE |
| POST `/api/communications/send` | authenticate + authorize(ADMIN,HR,RECRUITER) | `communicationAPI.send` | ACTIVE |
| POST `/api/communications/templates/:id/preview` | authenticate + authorize(ADMIN,HR,RECRUITER) | `communicationAPI.previewTemplate` — **NO page calls this** | **API METHOD UNCALLED** |

**geography.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/geography/locations` | authenticate | `geographyAPI.getLocations` (defined, not called from any page) | **API METHOD UNCALLED** |
| POST `/api/geography/locations` | authenticate | `geographyAPI.createLocation` — **NO page calls this** | **API METHOD UNCALLED** |
| GET `/api/geography/intelligence` | authenticate | `geographyAPI.getIntelligence` | ACTIVE |
| GET `/api/geography/locations/:id/agencies` | authenticate | `geographyAPI.getAgenciesByLocation` — **NO page calls this** | **API METHOD UNCALLED** |
| POST `/api/geography/locations/:id/agencies` | authenticate | `geographyAPI.assignAgencyToLocation` — **NO page calls this** | **API METHOD UNCALLED** |
| GET `/api/geography/states` | authenticate | `geographyAPI.getStates` — **NO page calls this** | **API METHOD UNCALLED** |

**aiScreening.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/ai-screening/jd` | authenticate + authorize(ADMIN,HR,RECRUITER) | `aiScreeningAPI.getAllJDs` | ACTIVE |
| POST `/api/ai-screening/jd` | authenticate + authorize(ADMIN,HR,RECRUITER) | `aiScreeningAPI.createJD` | ACTIVE |
| GET `/api/ai-screening/jd/:id` | authenticate + authorize(ADMIN,HR,RECRUITER) | `aiScreeningAPI.getJD` (defined, not called from page) | LOW USE |
| GET `/api/ai-screening/results` | authenticate + authorize(ADMIN,HR,RECRUITER) | `aiScreeningAPI.getResults` | ACTIVE |
| POST `/api/ai-screening/screen` | authenticate + authorize(ADMIN,HR,RECRUITER) | `aiScreeningAPI.screenCandidate` (defined, not called from page directly) | LOW USE |
| POST `/api/ai-screening/screen/batch` | authenticate + authorize(ADMIN,HR,RECRUITER) | `aiScreeningAPI.screenBatch` | ACTIVE |

**pipeline.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/pipeline/mrf/:mrfId` | authenticate + authorize(ADMIN,HR,RECRUITER) | `pipelineAPI.getByMrf` | ACTIVE |
| POST `/api/pipeline/mrf/:mrfId/init` | authenticate + authorize(ADMIN,HR,RECRUITER) | `pipelineAPI.initStages` | ACTIVE |
| POST `/api/pipeline/mrf/:mrfId/stages` | authenticate + authorize(ADMIN,HR,RECRUITER) | `pipelineAPI.createStage` (defined, not called from page) | LOW USE |
| POST `/api/pipeline/move` | authenticate + authorize(ADMIN,HR,RECRUITER) | `pipelineAPI.moveCandidate` | ACTIVE |
| DELETE `/api/pipeline/entry/:candidateId/:stageId` | authenticate + authorize(ADMIN,HR,RECRUITER) | `pipelineAPI.removeEntry` (defined, not called from page) | LOW USE |

**incomingMail.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/incoming-mail` | authenticate + authorize(ADMIN,HR,RECRUITER) | `incomingMailAPI.getAll` | ACTIVE |
| POST `/api/incoming-mail` | authenticate + authorize(ADMIN,HR,RECRUITER) | `incomingMailAPI.ingest` (defined, not called from page) | LOW USE |
| GET `/api/incoming-mail/:id` | authenticate + authorize(ADMIN,HR,RECRUITER) | `incomingMailAPI.getById` | ACTIVE |
| PATCH `/api/incoming-mail/:id/process` | authenticate + authorize(ADMIN,HR,RECRUITER) | `incomingMailAPI.process` | ACTIVE |
| POST `/api/incoming-mail/:id/create-candidate` | authenticate + authorize(ADMIN,HR,RECRUITER) | `incomingMailAPI.createCandidate` | ACTIVE |
| PATCH `/api/incoming-mail/:id/discard` | authenticate + authorize(ADMIN,HR,RECRUITER) | `incomingMailAPI.discard` | ACTIVE |

**auditLogs.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/audit-logs` | authenticate + authorize(ADMIN) | `auditLogAPI.getAll` | ACTIVE |
| GET `/api/audit-logs/entities` | authenticate + authorize(ADMIN) | `auditLogAPI.getEntities` | ACTIVE |

**probation.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/probation` | authenticate + authorize(ADMIN,BRANCH_MANAGER,COUNTRY_MANAGER,MD,HR) | `probationAPI.getAll` | ACTIVE |
| GET `/api/probation/:id` | authenticate + authorize(ADMIN,BRANCH_MANAGER,COUNTRY_MANAGER,MD,HR) | `probationAPI.getById` (defined, not directly called from page) | LOW USE |
| POST `/api/probation` | authenticate + authorize(ADMIN,HR,BRANCH_MANAGER) | `probationAPI.create` | ACTIVE |
| PUT `/api/probation/:id` | authenticate + authorize(ADMIN,BRANCH_MANAGER,COUNTRY_MANAGER,MD,HR) | `probationAPI.update` (defined, not directly called) | LOW USE |
| POST `/api/probation/:id/approve` | authenticate (role check inline) | `probationAPI.approve` | ACTIVE |
| POST `/api/probation/:id/extend` | authenticate + authorize(ADMIN,BRANCH_MANAGER,HR) | `probationAPI.extend` | ACTIVE |
| POST `/api/probation/:id/fail` | authenticate + authorize(ADMIN,BRANCH_MANAGER,MD) | `probationAPI.fail` | ACTIVE |

**chemistryTests.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/chemistry-tests` | authenticate + authorize(ADMIN,HR,RECRUITER,BRANCH_MANAGER,COUNTRY_MANAGER,MD) | `chemistryTestAPI.getAll` | ACTIVE |
| GET `/api/chemistry-tests/:id` | authenticate + authorize(ADMIN,HR,RECRUITER,BRANCH_MANAGER,COUNTRY_MANAGER,MD) | `chemistryTestAPI.getById` (defined, not directly called) | LOW USE |
| POST `/api/chemistry-tests` | authenticate + authorize(ADMIN,HR,BRANCH_MANAGER,RECRUITER) | `chemistryTestAPI.create` | ACTIVE |
| PUT `/api/chemistry-tests/:id` | authenticate + authorize(ADMIN,HR,RECRUITER,BRANCH_MANAGER,COUNTRY_MANAGER,MD) | `chemistryTestAPI.update` | ACTIVE |
| DELETE `/api/chemistry-tests/:id` | authenticate + authorize(ADMIN,HR,BRANCH_MANAGER) | `chemistryTestAPI.delete` (defined, no page calls it) | LOW USE |

**employeeDocuments.js**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/employee-documents` | authenticate | `employeeDocumentAPI.getAll` | ACTIVE |
| POST `/api/employee-documents` | authenticate | `employeeDocumentAPI.create` | ACTIVE |
| DELETE `/api/employee-documents/:id` | authenticate (ownership check) | `employeeDocumentAPI.delete` | ACTIVE |

**sourcing.js (ORPHANED — NOT MOUNTED)**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/sourcing` | authenticate + authorize(ADMIN,HR,RECRUITER) | `sourcingAPI.getAll` (api.js missing) | **NEVER REACHED** |
| GET `/api/sourcing/mrf/:mrfId` | authenticate + authorize(ADMIN,HR,RECRUITER) | none | **NEVER REACHED** |
| POST `/api/sourcing/generate-description` | authenticate + authorize(ADMIN,HR,RECRUITER) | `sourcingAPI.generateDescription` (api.js missing) | **NEVER REACHED** |
| POST `/api/sourcing` | authenticate + authorize(ADMIN,HR,RECRUITER) | `sourcingAPI.create` (api.js missing) | **NEVER REACHED** |
| PUT `/api/sourcing/:id` | authenticate + authorize(ADMIN,HR,RECRUITER) | `sourcingAPI.update` (api.js missing) | **NEVER REACHED** |
| DELETE `/api/sourcing/:id` | authenticate + authorize(ADMIN,HR,RECRUITER) | `sourcingAPI.delete` (api.js missing) | **NEVER REACHED** |

**casualWorkers.js (ORPHANED — NOT MOUNTED + BROKEN)**
| Method + Path | Role Guard | Called from Frontend | Status |
|---|---|---|---|
| GET `/api/casual-workers` | authenticate + authorize(ADMIN,HR,RECRUITER) | `casualWorkerAPI.getAll` (api.js missing) | **NEVER REACHED + RUNTIME CRASH** |
| POST `/api/casual-workers` | authenticate + authorize(ADMIN,HR,RECRUITER) | `casualWorkerAPI.create` (api.js missing) | **NEVER REACHED + RUNTIME CRASH** |
| GET `/api/casual-workers/:id` | authenticate + authorize(ADMIN,HR,RECRUITER) | none | **NEVER REACHED + RUNTIME CRASH** |
| PUT `/api/casual-workers/:id` | authenticate + authorize(ADMIN,HR,RECRUITER) | none | **NEVER REACHED + RUNTIME CRASH** |
| PATCH `/api/casual-workers/:id/verify` | authenticate + authorize(ADMIN,HR,RECRUITER) | `casualWorkerAPI.verify` (api.js missing) | **NEVER REACHED + RUNTIME CRASH** |

---

## 5. Database Usage Report

| Model | Queried in | Created in | Updated in | Deleted in | Classification |
|---|---|---|---|---|---|
| `User` | auth.js, users.js, middleware/auth.js | users.js | auth.js, users.js | users.js (soft) | ACTIVE |
| `Department` | departments.js, users.js, mrf.js | departments.js | departments.js | — | ACTIVE |
| `MRF` | mrf.js, reports.js, aiScreening.js, sourcing.js | mrf.js | mrf.js | mrf.js (soft) | ACTIVE |
| `Candidate` | candidates.js, offers.js, reports.js, training.js, exams.js, aiScreening.js, incomingMail.js, interviews.js, pipeline.js, probation.js, chemistryTests.js, casualWorkers.js | candidates.js, incomingMail.js, casualWorkers.js | candidates.js, training.js, exams.js, offers.js, interviews.js, probation.js, incomingMail.js | candidates.js (soft) | ACTIVE |
| `CandidateDocument` | candidates.js (in GET /:id include) | candidates.js (POST /:id/documents) | — | — | PARTIALLY USED (create only, no frontend call to create endpoint) |
| `CandidateComment` | candidates.js | candidates.js | candidates.js | — | ACTIVE |
| `Interview` | interviews.js, reports.js | interviews.js | interviews.js | — | ACTIVE |
| `InterviewFeedback` | interviews.js | interviews.js | — | — | ACTIVE |
| `Assessment` | candidates.js (in GET /:id include) | — | — | — | **UNUSED** — included in candidate detail but never created or queried directly |
| `TrainingBatch` | training.js, reports.js | training.js | training.js | — | ACTIVE |
| `TrainingEnrollment` | training.js, exams.js, reports.js | training.js | training.js | — | ACTIVE |
| `TrainingAttendance` | training.js | training.js | training.js (upsert) | — | ACTIVE |
| `ExamAttempt` | exams.js, reports.js | exams.js | exams.js | — | ACTIVE |
| `OfferLetter` | offers.js, reports.js | offers.js | offers.js | — | ACTIVE |
| `AppointmentLetter` | offers.js | offers.js | — | — | PARTIALLY USED (created via `/appointments` but no frontend page calls `offerAPI.createAppointment`) |
| `Probation` | probation.js | probation.js | probation.js | — | ACTIVE |
| `Notification` | notifications.js, helpers.js | helpers.js (createNotification) | notifications.js | — | ACTIVE (but `createNotification` in helpers.js is never called from any route) |
| `AuditLog` | auditLogs.js | helpers.js (createAuditLog) | — | — | ACTIVE |
| `Agency` | agencies.js, mrf.js, incomingMail.js, geography.js | agencies.js | agencies.js | agencies.js (soft) | ACTIVE |
| `AgencyContact` | agencies.js | agencies.js | — | — | ACTIVE |
| `AgencySubmission` | agencies.js | agencies.js | agencies.js | — | ACTIVE |
| `MrfOutreach` | mrf.js, incomingMail.js | mrf.js | incomingMail.js | — | ACTIVE |
| `JobPosting` | sourcing.js | sourcing.js | sourcing.js | sourcing.js | **ORPHANED** — only used in unmounted sourcing.js |
| `Location` | geography.js | geography.js | — | — | PARTIALLY USED (only `getIntelligence` called from frontend; create/assign not used) |
| `AgencyLocation` | geography.js, agencies.js | geography.js (upsert) | — | — | PARTIALLY USED |
| `JobDescription` | aiScreening.js | aiScreening.js (upsert) | aiScreening.js | — | ACTIVE |
| `AIScreeningResult` | aiScreening.js, pipeline.js | aiScreening.js (upsert) | aiScreening.js | — | ACTIVE |
| `EmailTemplate` | communications.js | communications.js | communications.js (deactivate via update) | — | ACTIVE |
| `Communication` | communications.js | communications.js | — | — | ACTIVE |
| `PipelineStage` | pipeline.js | pipeline.js | — | — | ACTIVE |
| `PipelineEntry` | pipeline.js | pipeline.js (upsert) | pipeline.js | pipeline.js | ACTIVE |
| `IncomingMail` | incomingMail.js, mrf.js (outreach) | incomingMail.js | incomingMail.js | — | ACTIVE |
| `EmployeeDocument` | employeeDocuments.js | employeeDocuments.js | — | employeeDocuments.js | ACTIVE |
| `ChemistryTest` | chemistryTests.js | chemistryTests.js | chemistryTests.js | chemistryTests.js | ACTIVE |

**Verdict on models never queried by any route:**
- `Assessment`: Included as a relation in `GET /candidates/:id` but no route ever creates, updates, or queries it independently. It appears to be a legacy model from an earlier design (pre-exams flow).

---

## 6. API Flow Report (End-to-End)

### MRF Workflow
```
MRFList.jsx / MRFForm.jsx
  → mrfAPI.create / mrfAPI.update
  → POST/PUT /api/mrf
  → prisma.mRF.create / prisma.mRF.update
  → MRF model

MRFDetail.jsx
  → mrfAPI.approve / mrfAPI.reject / mrfAPI.submit
  → POST /api/mrf/:id/approve|reject|submit
  → prisma.mRF.update (status field)
  → MRF model

Approvals.jsx (MD only)
  → mrfAPI.approve / mrfAPI.reject
  → POST /api/mrf/:id/approve (inline MD role check in route)
  → prisma.mRF.update
```

### Candidate Workflow
```
CandidateList.jsx → CandidateForm.jsx
  → candidateAPI.create
  → POST /api/candidates
  → prisma.candidate.create
  → Candidate model

CandidateDetail.jsx
  → candidateAPI.update / candidateAPI.updateStatus / candidateAPI.addComment
  → PUT /api/candidates/:id / PATCH /:id/status / POST /:id/comments
  → prisma.candidate.update / prisma.candidateComment.create
```

### Interview Workflow
```
InterviewList.jsx
  → interviewAPI.create / interviewAPI.complete / interviewAPI.cancel / interviewAPI.submitFeedback
  → POST /api/interviews / POST /:id/complete|cancel|feedback
  → prisma.interview.create / prisma.interview.update
  → Automatically updates Candidate.status to INTERVIEW_SCHEDULED / SELECTED
  → Sends email via sendEmail() on scheduling
```

### Training Workflow
```
TrainingCoordination.jsx (Recruiter portal) / Batches.jsx (Training portal)
  → trainingAPI.createBatch / trainingAPI.enrollCandidates / trainingAPI.updateEnrollment
  → POST /api/training/batches / POST /:id/enroll / PUT /enrollments/:id
  → prisma.trainingBatch.create / prisma.trainingEnrollment.create
  → Automatically updates Candidate.status to TRAINING_IN_PROGRESS / EXAM_PENDING
```

### Exam Workflow
```
ExamManagement.jsx
  → examAPI.generateLink / examAPI.updateResult
  → POST /api/exams/generate-link / PUT /:id/result
  → prisma.examAttempt.create / prisma.examAttempt.update
  → Validates training enrollment is COMPLETED before generating link
  → Automatically updates Candidate.status to EXAM_PENDING / EXAM_COMPLETED / REJECTED
```

### Offer Workflow
```
OfferManagement.jsx
  → offerAPI.create / offerAPI.approve / offerAPI.send
  → POST /api/offers / POST /:id/approve|send
  → prisma.offerLetter.create / prisma.offerLetter.update
  → Updates Candidate.status to OFFER_SENT

Offers.jsx (Employee portal)
  → offerAPI.getMine / offerAPI.accept / offerAPI.reject
  → GET /api/offers/mine / POST /:id/accept|reject
  → Matches by req.user.email → candidate.email
  → Updates Candidate.status to OFFER_ACCEPTED / OFFER_REJECTED

Approvals.jsx (Management portal)
  → offerAPI.approve / offerAPI.reject (also used here)
```

### Probation Workflow
```
Probation.jsx (Management portal)
  → probationAPI.getAll / probationAPI.create / probationAPI.approve / probationAPI.extend / probationAPI.fail
  → GET/POST /api/probation / POST /:id/approve|extend|fail
  → prisma.probation.create / prisma.probation.update
  → Multi-level approval: BRANCH_MANAGER → COUNTRY_MANAGER → MD
  → On MD approval (after all levels): Candidate.status → CONFIRMED
  → On fail: Candidate.status → REJECTED
  
  Also manages chemistry tests:
  → chemistryTestAPI.getAll / chemistryTestAPI.create / chemistryTestAPI.update
  → GET/POST/PUT /api/chemistry-tests
  → prisma.chemistryTest.create / prisma.chemistryTest.update
```

### Auth Workflow
```
Login.jsx → AuthContext.jsx
  → authAPI.login
  → POST /api/auth/login
  → prisma.user.findUnique / bcrypt.compare / jwt.sign
  → Returns JWT stored in localStorage
  
  On app load:
  → authAPI.me
  → GET /api/auth/me
  → middleware/auth.js → prisma.user.findUnique (via JWT decode)
```

---

## 7. Dead Code Candidates

### HIGH CONFIDENCE

**1. `frontend/src/pages/recruiter/Sourcing/Sourcing.jsx`**
- Imported by: none
- Referenced by: none  
- Evidence: Not imported in App.jsx (grep confirmed); `sourcingAPI` import fails — `sourcingAPI` is not exported from api.js
- Confidence: High
- Risk if removed: None (unreachable today)

**2. `frontend/src/pages/recruiter/CasualWorkers/CasualWorkers.jsx`**
- Imported by: none
- Referenced by: none
- Evidence: Not imported in App.jsx (grep confirmed); `casualWorkerAPI` import fails — not exported from api.js
- Confidence: High
- Risk if removed: None (unreachable today)

**3. `backend/src/routes/sourcing.js`**
- Imported by: Not imported in server.js (grep confirmed)
- Referenced by: none
- Evidence: No `app.use('/api/sourcing', ...)` in server.js; all endpoints return 404
- Confidence: High
- Risk if removed: None (never reachable)

**4. `backend/src/routes/casualWorkers.js`**
- Imported by: Not imported in server.js (grep confirmed)
- Referenced by: none
- Evidence: No `app.use('/api/casual-workers', ...)` in server.js; additionally references `prisma.casualWorker` and `Candidate.isContractual` which don't exist in schema.prisma — would crash at runtime
- Confidence: High
- Risk if removed: None (never reachable; broken if mounted)

**5. `frontend/src/pages/agency/AgencyDashboard.jsx`**
- Imported by: Not imported in App.jsx (grep confirmed)
- Referenced by: none in App.jsx
- Evidence: No `/agency` route in App.jsx; `agencyAPI.getMy` calls `GET /api/agencies/my` which was deliberately deleted from agencies.js (comment: "The AGENCY_PARTNER role and portal were retired in Session 6")
- Confidence: High
- Risk if removed: None

**6. `POST /api/candidates/import/csv` endpoint**
- Imported by: No `import` or frontend call found in any page or api.js
- Evidence: `candidateAPI` in api.js has no `importCsv` method; no page imports a CSV upload feature
- Confidence: High
- Risk if removed: Low (was likely built for future use or testing)
- Note: This is a 100-line endpoint with a full CSV parser — significant maintenance burden

**7. Prisma `Assessment` model**
- Queried in: Only included as a relation in `GET /candidates/:id` (`include: { assessments: true }`)
- Created in: No route ever creates an Assessment record
- Evidence: No `prisma.assessment.create` anywhere in backend/src/
- Confidence: High
- Risk if removed from schema: Medium — requires migration; assessments data loaded in candidate detail but displayed as empty array always

### MEDIUM CONFIDENCE

**8. `offerAPI.getAppointments` and `offerAPI.createAppointment`**
- Backend endpoints: `GET /api/offers/appointments/all` and `POST /api/offers/appointments` exist and work
- Frontend: Neither method is called from any page file
- Evidence: Grep for `getAppointments|createAppointment` in pages/ returns nothing
- Confidence: Medium (could be intended for future use)
- Risk if removed: Low for API methods; Medium for backend routes (appointment letters are created and affect Candidate.status → ONBOARDED)

**9. `interviewAPI.getToday` / `GET /api/interviews/today`**
- Backend: Route exists and works
- Frontend: `interviewAPI.getToday` is defined in api.js but no page calls it
- Evidence: Grep for `getToday` returns only the api.js definition
- Confidence: Medium
- Risk if removed: Low

**10. `examAPI.getByToken` / `GET /api/exams/token/:token`**
- Backend: Route exists
- Frontend: `examAPI.getByToken` is defined in api.js; no page calls it
- Evidence: Grep for `getByToken` returns only api.js definition; no `/exam/` route in App.jsx
- Confidence: Medium (would be used by a candidate-facing exam page)
- Risk if removed: Low (exam link is generated and emailed but there is no exam-taking UI in this codebase)

**11. Geography sub-endpoints (5 of 6 routes unused from frontend)**
- `GET /api/geography/locations`, `POST /locations`, `GET /locations/:id/agencies`, `POST /locations/:id/agencies`, `GET /states`
- Only `GET /intelligence` is called by `GeographyIntelligence.jsx`
- Evidence: Grep for these methods in pages/ returns nothing
- Confidence: Medium
- Risk if removed: Low for routes; note that `Location` and `AgencyLocation` models are used in agency display

**12. `communicationAPI.updateTemplate`, `deleteTemplate`, `previewTemplate`**
- Backend: All three routes exist in communications.js
- Frontend: None of these methods are called from EmailCenter.jsx or any page
- Evidence: Grep for `updateTemplate|deleteTemplate|previewTemplate` in pages/ returns nothing
- Confidence: Medium
- Risk if removed from api.js: None; risk from backend: Low

**13. `helpers.js:createNotification`**
- Defined and exported
- Called in: Zero route files (grep for `createNotification` returns only helpers.js definition)
- Evidence: `createAuditLog` is called (mrf.js, candidates.js); `createNotification` is never called
- Confidence: Medium
- Risk if removed: Low

**14. `Employee Training page` (`pages/employee/Training.jsx`)**
- Route exists in App.jsx: `/employee/training`
- In sidebar: Not present in EMPLOYEE portal nav config in Sidebar.jsx
- The EMPLOYEE sidebar nav lists: Dashboard, Profile, Documents, Exams, Offer Letter — Training is absent
- Confidence: Medium (page exists and is routed but not navigable)
- Risk if removed: Low

---

## 8. Duplicate Implementations

### 1. `PrismaClient` Instantiation

Every route file instantiates its own PrismaClient:
```js
const prisma = new PrismaClient();
```

Files with this pattern:
- `routes/auth.js`
- `routes/mrf.js`
- `routes/candidates.js`
- `routes/interviews.js`
- `routes/training.js`
- `routes/exams.js`
- `routes/offers.js`
- `routes/reports.js`
- `routes/users.js`
- `routes/notifications.js`
- `routes/departments.js`
- `routes/agencies.js`
- `routes/communications.js`
- `routes/geography.js`
- `routes/aiScreening.js`
- `routes/pipeline.js`
- `routes/incomingMail.js`
- `routes/auditLogs.js`
- `routes/probation.js`
- `routes/chemistryTests.js`
- `routes/employeeDocuments.js`
- `routes/sourcing.js`
- `routes/casualWorkers.js`
- `middleware/auth.js`
- `utils/helpers.js`

**Total: 25 separate PrismaClient instances**

Recommended consolidation: Create `backend/src/utils/prisma.js` with a singleton export and import it in each file.

### 2. `HR_ROLES` Array Constant

The array `['ADMIN', 'HR', 'RECRUITER']` is redeclared as `HR_ROLES` in:
- `routes/agencies.js`
- `routes/communications.js`
- `routes/geography.js`
- `routes/aiScreening.js`
- `routes/pipeline.js`
- `routes/incomingMail.js`
- `routes/sourcing.js`
- `routes/casualWorkers.js`

**8 separate declarations of the same constant.**

Recommended consolidation: `backend/src/utils/roles.js` exporting `HR_ROLES`, `MANAGEMENT_ROLES`, `ADMIN_ROLES`.

### 3. `MANAGEMENT_ROLES` Pattern

The management roles list appears in:
- `routes/probation.js` as `const MANAGEMENT_ROLES = ['ADMIN', 'BRANCH_MANAGER', 'COUNTRY_MANAGER', 'MD', 'HR']`
- `frontend/src/App.jsx` as `const MANAGEMENT_ROLES = ['BRANCH_MANAGER', 'COUNTRY_MANAGER', 'MD', 'ADMIN']`

Note: These two are slightly different (probation.js includes 'HR'; App.jsx does not).

### 4. Scoring Algorithm in `aiScreening.js`

The TF-IDF-style scoring logic (skill matching + experience gap + keyword hits) is duplicated verbatim inside:
- `POST /ai-screening/screen` (single candidate)
- `POST /ai-screening/screen/batch` (batch)

These are ~40 lines of identical logic. Should be extracted to a shared `scoreCandidate(candidate, jd)` function.

### 5. `parsePagination` / `paginate` Logic

- `backend/src/utils/helpers.js` exports `paginate(page, limit)`
- `backend/src/routes/agencies.js` defines its own `parsePagination(query)` function locally
- Other files call `paginate()` from helpers; agencies.js has a custom inline version

### 6. `generateAgencyCode` in agencies.js

`agencies.js` has its own `generateAgencyCode()` function while all other ID generators live in `utils/helpers.js`. Inconsistent placement.

---

## 9. Unused Dependencies

### Backend (`backend/package.json`)

| Package | Expected use | Found in code? | Confidence |
|---|---|---|---|
| `uuid` | UUID generation | No `import.*uuid` found in any backend/src/ file | **HIGH — unused** |
| `express-validator` | Request validation middleware | No `import.*express-validator` found in any backend/src/ file | **HIGH — unused** |
| `multer` | File upload handling | Used in `candidates.js` (document upload, CSV import) | USED |
| `nodemailer` | Email sending | Used in `utils/mailer.js` | USED |
| `bcryptjs` | Password hashing | Used in `routes/auth.js`, `routes/users.js` | USED |
| `jsonwebtoken` | JWT auth | Used in `routes/auth.js`, `middleware/auth.js` | USED |
| `cors` | CORS headers | Used in `server.js` | USED |
| `dotenv` | Env vars | Used in `server.js` | USED |
| `express` | HTTP server | Used everywhere | USED |
| `express-rate-limit` | Rate limiting | Used in `routes/auth.js` (login limiter) | USED |
| `@prisma/client` | ORM | Used everywhere | USED |

### Frontend (`frontend/package.json`)

| Package | Expected use | Found in code? | Confidence |
|---|---|---|---|
| `axios` | HTTP client | Used in `services/api.js` | USED |
| `date-fns` | Date formatting | Used in multiple page files | USED |
| `lucide-react` | Icons | Used extensively | USED |
| `react` | UI framework | Used everywhere | USED |
| `react-dom` | DOM rendering | Used in `main.jsx` | USED |
| `react-hot-toast` | Toast notifications | Used in many pages | USED |
| `react-router-dom` | Routing | Used in `App.jsx` and pages | USED |
| `recharts` | Charts/graphs | Used in `Dashboard.jsx`, `Reports.jsx` | USED |

All frontend dependencies are in use.

---

## 10. Safe Cleanup Opportunities

These changes carry low risk of breaking anything currently working:

1. **Delete `frontend/src/pages/recruiter/Sourcing/Sourcing.jsx`**  
   Not imported anywhere, not routed, imports non-existent API objects. Zero impact.

2. **Delete `frontend/src/pages/recruiter/CasualWorkers/CasualWorkers.jsx`**  
   Same as above.

3. **Delete `backend/src/routes/sourcing.js`**  
   Not mounted in server.js. Zero runtime impact.

4. **Delete `backend/src/routes/casualWorkers.js`**  
   Not mounted in server.js and broken (references non-existent Prisma models). Zero runtime impact.

5. **Delete `frontend/src/pages/agency/AgencyDashboard.jsx`**  
   Not in App.jsx, no route, calls a deleted backend endpoint. Zero impact.

6. **Remove `uuid` and `express-validator` from `backend/package.json`**  
   Neither is imported anywhere. Run `npm uninstall uuid express-validator` in the backend directory.

7. **Remove `POST /api/candidates/import/csv` from `candidates.js`**  
   No frontend caller exists. Eliminates ~100 lines of CSV parsing code and multer instance.

8. **Extract `const prisma = new PrismaClient()` into `backend/src/utils/prisma.js`** and import it  
   Safe refactor — no behavior changes, reduces connection pool pressure from 25+ instances.

9. **Extract `HR_ROLES` constant into `backend/src/utils/roles.js`**  
   Safe refactor — no behavior changes.

10. **Extract scoring algorithm from `aiScreening.js`** into a shared helper function  
    Safe refactor within the same file.

11. **Add `GET /recruiter/training` to the HR/RECRUITER sidebar nav**  
    `TrainingCoordination.jsx` is routed but not in the sidebar for those roles. Low risk addition.

12. **Add `GET /recruiter/geography` and `GET /recruiter/agencies` to the HR/RECRUITER sidebar**  
    Both pages are fully functional and routed, just not discoverable from the nav.

---

## 11. Dangerous Cleanup Areas

These require careful coordination before touching:

1. **`Notification` model + `createNotification` helper**  
   `createNotification` is defined but never called from any route. However, `Notification` records are read by the header bell icon in real time. Simply removing `createNotification` is safe, but removing the model would break the Header.jsx notification UI. Do not remove the model or the notification GET/PUT routes.

2. **`AppointmentLetter` model**  
   `POST /offers/appointments` creates appointment letters and transitions `Candidate.status` to `ONBOARDED`. No frontend page currently calls this endpoint, but the endpoint is functional and could be called manually or via Postman. Removing the backend route would orphan the `AppointmentLetter` table and break the `ONBOARDED` status flow. **Do not remove without adding a UI.**

3. **`Assessment` model removal from schema.prisma**  
   The model is never written to, but it is included in the `GET /candidates/:id` response via `include: { assessments: true }`. Removing it from the schema requires a Prisma migration that drops the `Assessment` table. If the table has legacy data, it would be lost. Safe only after confirming the table is empty.

4. **`JobPosting` model removal**  
   Currently only used in the unmounted `sourcing.js`. If the Sourcing feature is ever activated (the route file and frontend page exist), this model is needed. Removing it drops all job posting tracking data. Only remove if the Sourcing feature is formally abandoned.

5. **`agencyAPI.submitCandidate`**  
   Called only from the orphaned `AgencyDashboard.jsx`. The backend endpoint (`POST /agencies/:id/submissions`) is active and creates `AgencySubmission` records. Do not remove the backend endpoint — it may be called from `AgencyDetail.jsx` (the active page). Confirm before removal.

6. **`Geography` features (Location, AgencyLocation)**  
   Only `GET /intelligence` is called from the frontend. However, `Location` is referenced by the `Candidate` model (optional FK `locationId`). Removing `Location` from the schema would require removing the FK on `Candidate`. The geography feature appears half-built — the backend has full CRUD for locations/agency assignments but the frontend only reads the intelligence view.

7. **`MRF.approve` inline role check**  
   In `mrf.js`, the approve route checks `req.user.role !== 'MD'` inline without using `authorize()` middleware. This is inconsistent with the rest of the codebase and easy to miss in a refactor. If roles are ever changed, this inline check may be forgotten.

8. **`candidates.js` document upload endpoint (`POST /candidates/:id/documents`)**  
   This endpoint exists and creates `CandidateDocument` records. The `No Upload Policy` (per project memory) means this should never be called, but the route is mounted and live. It uses `multer` disk storage and writes to an `uploads/` directory. Removing it aligns with policy but requires confirming no integration currently calls it.

9. **`helpers.js` generates IDs using `prisma.*.count()`**  
   `generateMRFNumber`, `generateCandidateId`, etc. use `COUNT(*)` for sequence numbers. This is not race-condition-safe under concurrent requests. Not a cleanup issue but a correctness risk under load.
