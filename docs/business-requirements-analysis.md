# RecruitPro ERP — Business Requirements Analysis

*Prepared: 2026-06-03 | Source: Stakeholder requirements + full codebase read*
*Status: Analysis only — no code changes made*

---

## Contents

1. [Requirement Breakdown](#1-requirement-breakdown)
2. [Gap Analysis](#2-gap-analysis)
3. [Role Redesign](#3-role-redesign)
4. [MRF Workflow Redesign](#4-mrf-workflow-redesign)
5. [Candidate Portal Design](#5-candidate-portal-design)
6. [Database Impact Analysis](#6-database-impact-analysis)
7. [API Impact Analysis](#7-api-impact-analysis)
8. [UI Impact Analysis](#8-ui-impact-analysis)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Questions for HR Team](#10-questions-for-hr-team)

---

## 1. Requirement Breakdown

Each stakeholder requirement has been decomposed into an atomic, testable business requirement.

### 1.1 MRF Workflow

| ID | Business Requirement |
|----|----------------------|
| MRF-01 | MRFs shall be initiated by a user with the Hiring Manager role or Branch Manager role only. Recruiters shall not be able to create MRFs. |
| MRF-02 | A Branch Manager shall be able to raise MRFs specifically for their branch locations. |
| MRF-03 | Every submitted MRF shall follow a defined six-stage approval chain: Hiring Manager / Branch Manager → Divisional Head → Functional Head → Supervisor → HR Review → Managing Director. |
| MRF-04 | Each approval stage shall record: who approved, when, any remarks, and the decision (approved / returned / rejected). |
| MRF-05 | The system shall display the current active approver for every in-flight MRF. |
| MRF-06 | The system shall display the full approval history for every MRF at any time. |
| MRF-07 | HR users shall be able to see all MRFs regardless of status, including current stage, current approver, history, and pending actions. |
| MRF-08 | Recruiters shall be able to configure or modify approval hierarchies (which roles occupy which stage). This implies an admin-level workflow configuration UI. |
| MRF-09 | An MRF creator shall be able to nominate specific individuals (not just roles) for each approval step at the time of MRF creation, where the org hierarchy permits this. |

### 1.2 Roles

| ID | Business Requirement |
|----|----------------------|
| ROLE-01 | The system shall support the following distinct roles: Admin, HR, Recruiter, Hiring Manager, Divisional Head, Functional Head, Supervisor, Branch Manager, Managing Director, Candidate. |
| ROLE-02 | There shall be at most one Admin account in the system at any time. |
| ROLE-03 | Existing roles (BRANCH_MANAGER, MD) shall be mapped to new role names where there is a direct match. |
| ROLE-04 | New roles (HIRING_MANAGER, DIVISIONAL_HEAD, FUNCTIONAL_HEAD, SUPERVISOR) shall be added without breaking existing functionality. |

### 1.3 HR Permissions

| ID | Business Requirement |
|----|----------------------|
| HR-01 | HR shall have read access to all MRFs across all departments and statuses. |
| HR-02 | HR shall have read access to the full MRF approval progress and history. |
| HR-03 | HR shall have read access to all candidate records. |
| HR-04 | HR shall have read access to interview schedules and results. |
| HR-05 | HR shall have read access to all onboarding statuses. |
| HR-06 | HR shall have read access to all probation records and statuses. |
| HR-07 | HR shall have read access to all reports. |
| HR-08 | HR edit permissions shall be determined per module. (See Section 3 permissions matrix.) |

### 1.4 MRF Enhancements (Fields)

| ID | Business Requirement |
|----|----------------------|
| MRFF-01 | MRF form shall include a Country field (dropdown). |
| MRFF-02 | MRF form shall include a Location field (city/branch, scoped to the selected country). |
| MRFF-03 | MRF form shall retain the Department field. |
| MRFF-04 | MRF form shall include a Hiring Manager field (select a user with HIRING_MANAGER role). |
| MRFF-05 | MRF form shall include a Functional Head field (select a user with FUNCTIONAL_HEAD role). |
| MRFF-06 | MRF form shall include a Divisional Head field (select a user with DIVISIONAL_HEAD role). |
| MRFF-07 | MRF form shall include a Technical Head field (select an appropriate user). |
| MRFF-08 | MRF form shall include a Supervisor field (select a user with SUPERVISOR role). |
| MRFF-09 | MRF form shall include a Country Supervisor Mapping field (derived from org mapping configuration). |
| MRFF-10 | At the time of creating an MRF, the creator shall be able to select the specific individuals who will approve at each stage, subject to their role eligibility. |

### 1.5 Organizational Mapping

| ID | Business Requirement |
|----|----------------------|
| ORG-01 | The system shall support a Country → Supervisor mapping: for a given country, a designated supervisor user is automatically suggested or assigned. |
| ORG-02 | The system shall support a Department → Functional Head mapping. |
| ORG-03 | The system shall support a Department → HR mapping (which HR user owns a given department). |
| ORG-04 | The system shall support a Department → Divisional Head mapping. |
| ORG-05 | The org mapping engine shall be extensible: HR shall be able to add new mapping types without requiring a developer change. |
| ORG-06 | Org mappings shall be used to auto-suggest approvers when an MRF is created. |

### 1.6 Candidate Portal

| ID | Business Requirement |
|----|----------------------|
| CP-01 | The existing Employee portal shall be extended (not replaced) to become the Candidate onboarding portal. |
| CP-02 | Selected candidates shall receive secure access credentials (or a secure link) to the portal. |
| CP-03 | Candidates shall be able to complete onboarding forms within the portal (personal details, emergency contacts, bank details, etc.). |
| CP-04 | Candidates shall be able to upload required onboarding documents through the portal. |
| CP-05 | Submitted information shall be stored in the database. |
| CP-06 | HR shall be able to view all submitted onboarding information. |
| CP-07 | Submitted information shall be exportable to Excel by HR. |
| CP-08 | Candidates shall be able to track their onboarding progress (checklist of pending actions). |
| CP-09 | Candidates shall be able to view their current status and pending tests/training. |
| CP-10 | All candidate-submitted data shall be auditable (who submitted what and when). |

### 1.7 Document Uploads

| ID | Business Requirement |
|----|----------------------|
| DOCS-01 | Candidates shall be able to upload documents as part of onboarding (not just enter metadata). |
| DOCS-02 | The system shall define which document types are required vs optional for onboarding. |
| DOCS-03 | Documents shall be stored on the server with a reference in the database (file path + metadata). |
| DOCS-04 | HR shall be able to view and download all candidate-uploaded documents. |
| DOCS-05 | HR shall be able to verify/approve individual documents. |
| DOCS-06 | Candidates shall be able to upload their own documents (and replace them). |
| DOCS-07 | Candidates shall NOT be able to view or download other candidates' documents. |
| DOCS-08 | Candidates shall NOT be able to delete verified documents. |
| DOCS-09 | The Admin shall be able to delete any document. |
| DOCS-10 | Document access shall be logged in the audit trail. |

### 1.8 Revised Recruitment Workflow

| ID | Business Requirement |
|----|----------------------|
| WF-01 | The recruitment workflow shall be configurable per designation or role category, not fixed globally. |
| WF-02 | The Psychometric Test step shall be optional and only required for certain designations. |
| WF-03 | Chemistry Training shall be optional and only required for technical/relevant designations. |
| WF-04 | The system shall support at least three predefined workflow templates: Office Staff, Contractual Worker, Technical Candidate. |
| WF-05 | The candidate status model shall reflect every distinct step in all workflow variants. |
| WF-06 | Moving a candidate past a skipped step shall be handled transparently (e.g., a Contractual Worker skips Psychometric Test and goes directly from Interview to Offer). |
| WF-07 | The candidate journey bar in the portal shall adapt to the candidate's workflow path, not show a fixed global bar. |

---

## 2. Gap Analysis

For each requirement area, the current system is evaluated: **Fully Supported**, **Partially Supported**, or **Not Supported**.

### 2.1 MRF Workflow

| Requirement | Current State | Gap Status |
|-------------|---------------|------------|
| MRF-01: HM/BM initiation only | Any user with HR/RECRUITER role can create MRFs | **Not Supported** |
| MRF-02: BM can raise branch MRFs | BRANCH_MANAGER role exists but cannot create MRFs; `POST /mrf` is restricted to HR_ROLES | **Not Supported** |
| MRF-03: 6-stage approval chain | Single-step approval (MD only). `MRF.approvedById` + `MRF.approvedAt` = one approver, one timestamp | **Not Supported** |
| MRF-04: Per-stage approval record | No approval history model exists. Approval is a single string field | **Not Supported** |
| MRF-05: Display current approver | No current approver tracking; only final approver stored | **Not Supported** |
| MRF-06: Full approval history | No history table; only `approvedById` and `rejectionReason` stored | **Not Supported** |
| MRF-07: HR visibility across all MRFs | HR can view all MRFs (`GET /mrf` returns all) but no approval stage tracking to show | **Partially Supported** |
| MRF-08: Recruiter configures hierarchies | No workflow configuration exists anywhere | **Not Supported** |
| MRF-09: Select specific approvers per stage | No concept of per-stage approver nomination | **Not Supported** |

### 2.2 Roles

| Requirement | Current State | Gap Status |
|-------------|---------------|------------|
| ROLE-01: Required role set | Current roles: ADMIN, HR, RECRUITER, INTERVIEWER, TRAINING, BRANCH_MANAGER, COUNTRY_MANAGER, MD, EMPLOYEE. Missing: HIRING_MANAGER, DIVISIONAL_HEAD, FUNCTIONAL_HEAD, SUPERVISOR, CANDIDATE | **Partially Supported** |
| ROLE-02: Single admin | No enforcement of single admin. Multiple ADMIN accounts can exist | **Not Supported** |
| ROLE-03: Map existing roles | BRANCH_MANAGER and MD exist and can be reused | **Fully Supported** |
| ROLE-04: Add new roles | Role is a free-text string field in DB — new roles can be added without schema migration, but portal routing and permissions need updating | **Partially Supported** |

### 2.3 HR Permissions

| Requirement | Current State | Gap Status |
|-------------|---------------|------------|
| HR-01: View all MRFs | HR can view all MRFs | **Fully Supported** |
| HR-02: View approval progress | No approval stages tracked | **Not Supported** |
| HR-03: View all candidates | HR can view all candidates | **Fully Supported** |
| HR-04: View interviews | HR can view all interviews | **Fully Supported** |
| HR-05: View onboarding status | Candidate status `ONBOARDED` exists; HR can see it | **Fully Supported** |
| HR-06: View probation records | Probation page is under `/management` (blocked from HR portal); HR can call API but not via UI | **Partially Supported** |
| HR-07: View reports | HR has access to Reports in recruiter portal | **Fully Supported** |
| HR-08: Edit permissions per module | HR currently has full edit access to all recruiter-portal modules — no read-only restrictions exist | **Partially Supported** (over-permissive) |

### 2.4 MRF Enhancements (Fields)

| Requirement | Current State | Gap Status |
|-------------|---------------|------------|
| MRFF-01: Country field | `MRF.country` field exists, defaults to "India" | **Fully Supported** |
| MRFF-02: Location field (scoped) | `MRF.location` is a free text string, not linked to Location model or scoped to country | **Partially Supported** |
| MRFF-03: Department field | `MRF.departmentId` exists | **Fully Supported** |
| MRFF-04: Hiring Manager field | No `hiringManagerId` field; `MRF.reportingManager` is a free text string | **Not Supported** |
| MRFF-05: Functional Head field | No field | **Not Supported** |
| MRFF-06: Divisional Head field | No field | **Not Supported** |
| MRFF-07: Technical Head field | No field | **Not Supported** |
| MRFF-08: Supervisor field | No field | **Not Supported** |
| MRFF-09: Country Supervisor Mapping | No org mapping engine exists | **Not Supported** |
| MRFF-10: Select approvers at creation | No concept of approver nomination at creation time | **Not Supported** |

### 2.5 Organizational Mapping

| Requirement | Current State | Gap Status |
|-------------|---------------|------------|
| ORG-01 through ORG-06 | No org mapping model, no configuration engine, no auto-suggestion of approvers | **Not Supported** (entire feature area missing) |

### 2.6 Candidate Portal

| Requirement | Current State | Gap Status |
|-------------|---------------|------------|
| CP-01: Extend existing portal | Employee portal exists at `/employee` with 5 pages | **Partially Supported** |
| CP-02: Secure access credentials | Employee account created by Admin; no "secure link" flow exists | **Partially Supported** |
| CP-03: Complete onboarding forms | No onboarding form exists. Profile page is read-only (shows JWT user data only) | **Not Supported** |
| CP-04: Upload documents | `Documents.jsx` exists but stores metadata only (document number, authority, dates) — no actual file upload | **Not Supported** |
| CP-05: Data stored in DB | Document metadata is stored; actual files and onboarding form data are not | **Partially Supported** |
| CP-06: HR views submitted data | No HR view for candidate-submitted onboarding data | **Not Supported** |
| CP-07: Export to Excel | No export functionality in employee portal | **Not Supported** |
| CP-08: Onboarding progress checklist | `Dashboard.jsx` shows a journey bar (7 fixed steps) but no per-item checklist | **Partially Supported** |
| CP-09: View status and pending actions | Journey bar shows current step; no pending action list or test/training visibility | **Partially Supported** |
| CP-10: Auditable submissions | AuditLog model exists but not called from employee portal routes | **Partially Supported** |

### 2.7 Document Uploads

| Requirement | Current State | Gap Status |
|-------------|---------------|------------|
| DOCS-01: File uploads for onboarding | `CandidateDocument` model has `filePath` field. Backend `POST /candidates/:id/documents` route with multer exists but is not exposed in the employee portal UI | **Partially Supported** |
| DOCS-02: Required vs optional document types | No concept of required vs optional documents | **Not Supported** |
| DOCS-03: File stored with DB reference | Schema has `filePath`, `fileName`, `fileSize`, `mimeType` in `CandidateDocument` | **Partially Supported** |
| DOCS-04: HR can view/download | No HR UI to view candidate-uploaded files | **Not Supported** |
| DOCS-05: HR can verify documents | `CandidateDocument.verified` boolean field exists but no UI to toggle it | **Partially Supported** |
| DOCS-06: Candidates can upload/replace | Backend route exists but no employee portal UI | **Partially Supported** |
| DOCS-07: Isolation between candidates | Ownership check on `employeeDocuments` route enforced; `candidateDocuments` backend has no ownership guard | **Partially Supported** |
| DOCS-08: Cannot delete verified docs | No such restriction | **Not Supported** |
| DOCS-09: Admin can delete any | No admin document management UI | **Not Supported** |
| DOCS-10: Access logged | Not logged | **Not Supported** |

### 2.8 Revised Recruitment Workflow

| Requirement | Current State | Gap Status |
|-------------|---------------|------------|
| WF-01: Configurable per designation | Workflow is hardcoded globally | **Not Supported** |
| WF-02: Psychometric Test optional | No `PSYCHOMETRIC_*` statuses exist | **Not Supported** |
| WF-03: Chemistry Training optional | `CHEMISTRY_TRAINING` status exists but is not in the candidate status model or journey bar | **Partially Supported** |
| WF-04: Three workflow templates | Not supported | **Not Supported** |
| WF-05: Status model reflects all steps | Current statuses include `TRAINING_*` and `EXAM_*` but miss `PSYCHOMETRIC_*`, `CHEMISTRY_TRAINING`, and intermediate interview result | **Partially Supported** |
| WF-06: Skip logic for inapplicable steps | No skip logic | **Not Supported** |
| WF-07: Dynamic journey bar | Journey bar is hardcoded with 7 fixed steps in `Dashboard.jsx:8-16` | **Not Supported** |

---

## 3. Role Redesign

### 3.1 Proposed Role Set

| Role | Replaces / New | Portal | Notes |
|------|---------------|--------|-------|
| `ADMIN` | Existing | `/admin` | System configuration, user management. Limit: 1 account enforced. |
| `HR` | Existing | `/recruiter` (full visibility) | Cross-module visibility; limited edit rights per module. |
| `RECRUITER` | Existing | `/recruiter` | Day-to-day candidate and interview management. |
| `HIRING_MANAGER` | **New** | `/management` (limited) | Creates and submits MRFs. First approver in chain. |
| `DIVISIONAL_HEAD` | **New** | `/management` (approval view) | Second approver in MRF chain. |
| `FUNCTIONAL_HEAD` | **New** | `/management` (approval view) | Third approver in MRF chain. |
| `SUPERVISOR` | **New** | `/management` (approval view) | Fourth approver in MRF chain. |
| `BRANCH_MANAGER` | Existing (reuse) | `/management` | Can initiate MRFs for branch. Tier 1 probation approval. |
| `MD` | Existing (reuse) | `/management` | Final MRF approval. Final probation approval. |
| `TRAINING` | Existing | `/training` | Training batch and attendance management. |
| `INTERVIEWER` | Existing | `/recruiter` (limited) | Submits interview feedback only. |
| `CANDIDATE` | **New** (replaces EMPLOYEE) | `/candidate` | Onboarding forms, document uploads, status tracking. |

**Notes on existing EMPLOYEE role:** The current `EMPLOYEE` role should be renamed `CANDIDATE` to reflect the actual user type. All existing employee portal functionality transfers to the candidate portal.

**Notes on COUNTRY_MANAGER:** This role exists in the current system but is not referenced in the new requirements. It should be retained as-is until the HR team confirms whether it maps to DIVISIONAL_HEAD or FUNCTIONAL_HEAD, or should be retired.

### 3.2 Permissions Matrix

The table below shows create/edit (W), read-only (R), and no access (—) for each module.

| Module | ADMIN | HR | RECRUITER | HIRING_MANAGER | DIV_HEAD | FUNC_HEAD | SUPERVISOR | BRANCH_MGR | MD | TRAINING | INTERVIEWER | CANDIDATE |
|--------|-------|----|-----------|----|----|----|----|----|----|----|----|----|
| **MRF — Create** | W | — | — | W | — | — | — | W | — | — | — | — |
| **MRF — View** | W | R | R | R (own) | R (own queue) | R (own queue) | R (own queue) | R (own) | R | — | — | — |
| **MRF — Approve** | — | R(stage 5) | — | R(stage 1) | W(stage 2) | W(stage 3) | W(stage 4) | W(stage 1) | W(stage 6) | — | — | — |
| **Candidates — View** | W | R | W | R | — | — | — | R | R | — | R | R(own) |
| **Candidates — Edit** | W | — | W | — | — | — | — | — | — | — | — | — |
| **Interviews — Schedule** | W | R | W | — | — | — | — | — | — | — | — | — |
| **Interviews — Feedback** | W | R | R | — | — | — | — | — | — | — | W | — |
| **Training** | W | R | R | — | — | — | — | — | — | W | — | R(own) |
| **Exams** | W | R | W | — | — | — | — | — | — | — | — | R(own) |
| **Offers — Create** | W | R | W | — | — | — | — | — | — | — | — | — |
| **Offers — Approve** | — | — | — | — | — | — | — | — | W | — | — | — |
| **Offers — Accept/Reject** | — | — | — | — | — | — | — | — | — | — | — | W(own) |
| **Probation** | W | R | R | — | — | — | — | W(tier 1) | W(tier 3) | — | — | — |
| **Onboarding Forms** | W | R | R | — | — | — | — | — | — | — | — | W(own) |
| **Document Uploads** | W | R+download | — | — | — | — | — | — | — | — | — | W(own) |
| **Reports** | W | R | R | — | — | — | — | R | R | R | — | — |
| **Users / Admin** | W | — | — | — | — | — | — | — | — | — | — | — |
| **Workflow Config** | W | — | W | — | — | — | — | — | — | — | — | — |
| **Org Mappings** | W | R | — | — | — | — | — | — | — | — | — | — |

> W = full write/edit access. R = read-only. — = no access. "(own)" = scoped to own records only.

---

## 4. MRF Workflow Redesign

### 4.1 Current Workflow

```
MRF Created (by HR/RECRUITER)
│
│  status = DRAFT
▼
Submit
│
│  status = PENDING
▼
MD Approves / Rejects   [single approver, no history]
│
│  status = APPROVED or REJECTED
▼
(Done)
```

**Problems with current workflow:**
- Only one approval step (MD)
- No intermediate approvers
- No approval history
- No current-approver tracking
- Wrong initiating role (Recruiter creates, but HR does it)
- Approval stored as two fields: `approvedById` + `approvedAt` — no chain

---

### 4.2 Proposed Workflow

```
MRF Created by HIRING_MANAGER or BRANCH_MANAGER
│  status = DRAFT
│  Creator nominates approvers for each stage at creation
▼
Submit
│  status = PENDING_STAGE_1
▼
Stage 1: Hiring Manager / Branch Manager Review
│  Approver records decision + remarks in ApprovalStep record
│  status = PENDING_STAGE_2  (or RETURNED / REJECTED)
▼
Stage 2: Divisional Head
│  status = PENDING_STAGE_3
▼
Stage 3: Functional Head
│  status = PENDING_STAGE_4
▼
Stage 4: Supervisor
│  status = PENDING_STAGE_5
▼
Stage 5: HR Review
│  HR validates compliance and completeness
│  status = PENDING_STAGE_6
▼
Stage 6: Managing Director (Final Approval)
│  status = APPROVED  (or REJECTED)
▼
Recruitment Begins
```

**Status values required:**

| Status | Meaning |
|--------|---------|
| `DRAFT` | MRF created, not yet submitted |
| `PENDING_STAGE_1` | Awaiting Hiring Manager / BM review |
| `PENDING_STAGE_2` | Awaiting Divisional Head review |
| `PENDING_STAGE_3` | Awaiting Functional Head review |
| `PENDING_STAGE_4` | Awaiting Supervisor review |
| `PENDING_STAGE_5` | Awaiting HR review |
| `PENDING_STAGE_6` | Awaiting MD final approval |
| `APPROVED` | Fully approved |
| `REJECTED` | Rejected at any stage (final rejection) |
| `RETURNED` | Returned for revision to the initiator |
| `CLOSED` | Vacancies filled, MRF closed |

**Key design decisions:**

1. **`ApprovalWorkflow` model** — defines the stages and which role owns each stage.
2. **`ApprovalStep` model** — one record per stage per MRF, created when the MRF is submitted. Records: stage number, assigned approver (user), status (PENDING/APPROVED/REJECTED/RETURNED), decision, remarks, timestamp.
3. **Nominated approvers** — at MRF creation, the initiator selects specific users for each stage. The system validates that the selected user holds the required role. If org mappings exist for the department/country, the system pre-fills suggestions.
4. **RETURNED state** — any approver can return the MRF to the initiator for revision without fully rejecting. Initiator edits and resubmits, resetting to stage 1.
5. **HR at stage 5** — HR review is a compliance check, not a blocking approval. HR can annotate and advance, or return for revision.

---

### 4.3 Approval Visibility Matrix

| Role | Sees All MRFs | Sees Approval History | Can Approve | Receives Notification |
|------|--------------|----------------------|-------------|----------------------|
| ADMIN | Yes | Yes | — | — |
| HR | Yes | Yes (all) | Stage 5 | When an MRF reaches Stage 5 |
| RECRUITER | Yes (read) | Yes | — | — |
| HIRING_MANAGER | Own | Own | Stage 1 | When MRF assigned to them |
| DIVISIONAL_HEAD | Assigned | Own | Stage 2 | When MRF reaches Stage 2 |
| FUNCTIONAL_HEAD | Assigned | Own | Stage 3 | When MRF reaches Stage 3 |
| SUPERVISOR | Assigned | Own | Stage 4 | When MRF reaches Stage 4 |
| BRANCH_MANAGER | Own branch | Own | Stage 1 | When MRF assigned to them |
| MD | All | All | Stage 6 | When MRF reaches Stage 6 |

---

## 5. Candidate Portal Design

### 5.1 Current State

The existing Employee portal (`/employee`) has these pages:
- **Dashboard** — journey bar (7 fixed steps), quick links
- **Profile** — read-only display of JWT user fields (name, email, role, department)
- **Documents** — add/delete document metadata entries (no file upload)
- **Examinations** — view exam links and results
- **Offer Letter** — view and accept/reject offer
- **Training** — (page exists; content unknown from files read)

**Critical gaps vs requirements:**
- Profile is read-only; candidates cannot enter personal details (address, DOB, emergency contact, bank details)
- Documents stores metadata only; no file upload
- No onboarding checklist or pending action tracker
- No progress visibility into upcoming tests/training
- Journey bar is hardcoded (does not adapt to designation-based workflow)
- HR has no view of candidate-submitted data

### 5.2 Proposed Portal Structure

The portal shall be renamed from "Employee Portal" to "Candidate Portal". URL prefix remains `/candidate` (renamed from `/employee`).

#### Pages

**Page 1: Dashboard (redesigned)**
- Welcome banner with candidate name and current status
- Onboarding progress checklist (% complete)
- Pending actions list (what still needs to be filled / uploaded)
- Dynamic journey bar (adapts to candidate's workflow path)
- Quick links to each section

**Page 2: My Profile (new — replaces read-only view)**

Form sections:
- *Personal Information:* Full name (pre-filled, read-only), Date of birth, Gender, Nationality, Blood group
- *Contact Details:* Phone, Alternate phone, Permanent address, Current address
- *Emergency Contact:* Name, relationship, phone
- *Bank Details:* Account number, IFSC, bank name, branch, account type
- *Identification:* PAN number, Aadhaar number (entered, not uploaded here — upload separately)

Validation: All required fields validated client-side before submit. Submitted to backend; HR can view.

**Page 3: Documents (redesigned — file upload)**

Replaces current metadata-only document entry.

Required documents (configurable by Admin):
| Document | Required For | Upload Type |
|----------|-------------|-------------|
| Photo | All | Image (JPG/PNG, max 2MB) |
| Aadhaar Card | All | PDF or Image |
| PAN Card | All | PDF or Image |
| 10th Certificate | All | PDF |
| 12th / Diploma Certificate | Where applicable | PDF |
| Degree Certificate | Where applicable | PDF |
| Previous Employment Letter(s) | If experienced | PDF |
| Offer Letter Acknowledgement | All | PDF |
| Passport (if international) | International candidates | PDF |

Features:
- Upload button per document type
- Status badge: Pending / Uploaded / Verified / Rejected
- HR can mark verified or rejected (with reason)
- Candidates can re-upload if rejected
- Candidates cannot delete verified documents
- File size limit: 5MB per file
- Accepted types: PDF, JPG, PNG

**Page 4: Examinations (minor enhancement)**
- Current functionality retained
- Add: Psychometric test link and status (if applicable to this candidate's workflow path)
- Add: Chemistry test link and result (if applicable)

**Page 5: Offer Letter (no change)**
- Current functionality retained

**Page 6: Onboarding Status (new)**
- Complete checklist view of all pending and completed onboarding steps
- Shows which forms are submitted, which documents are verified, which tests are pending
- "Next action" callout at the top

**Page 7: Training (existing, minor review needed)**
- Shows enrolled training batches
- Training schedule, dates, location

### 5.3 Candidate Data Flow

```
Candidate accesses portal
        │
        ▼
Fills onboarding profile form (POST /api/candidate/profile)
        │
        ├── Stored in CandidateOnboardingProfile model (new)
        │
        ▼
Uploads documents (POST /api/candidate/documents)
        │
        ├── File stored: /uploads/candidates/{candidateId}/{docType}/filename
        ├── CandidateDocument record updated: filePath, fileSize, mimeType, verified=false
        │
        ▼
HR reviews submissions
        │
        ├── GET /api/hr/candidates/:id/onboarding — full onboarding data view
        ├── PUT /api/hr/candidates/:id/documents/:docId/verify — verify/reject
        │
        ▼
All required items complete → HR marks onboarding complete
        │
        ▼
Candidate.status = ONBOARDED
```

### 5.4 Candidate Permissions

| Action | Allowed |
|--------|---------|
| View own profile form | Yes |
| Edit own profile form (before HR finalises) | Yes |
| Edit own profile form (after HR finalises) | No |
| Upload documents | Yes |
| Replace rejected documents | Yes |
| Delete verified documents | No |
| View own offer letter | Yes |
| View other candidates' data | No |
| View HR remarks on document | Yes (read-only) |
| Export own data | No (HR exports on their behalf) |

### 5.5 Security Implications

1. **File upload validation:** MIME type must be validated server-side (not just client-side). Reject non-PDF/image files regardless of extension.
2. **File storage path:** Use candidate-scoped subdirectories. Never expose raw file paths in API responses — return a signed URL or a backend-proxied download endpoint.
3. **Ownership enforcement:** Every document API call must verify `req.user` owns the candidate record (by email match or direct FK, once FK is added).
4. **File size limit:** Enforce in multer config (5MB per file) and on frontend.
5. **Virus scanning:** Out of scope for Phase 1 but noted for production readiness.
6. **Audit trail:** Every upload, replacement, and HR verification action must write to AuditLog.

---

## 6. Database Impact Analysis

### 6.1 New Models Required

#### `ApprovalWorkflow`
Configuration model defining a named workflow with N stages.

```
ApprovalWorkflow
  id            cuid
  name          String          (e.g. "Standard MRF Approval")
  description   String?
  isDefault     Boolean
  stages        ApprovalStage[]
  createdAt     DateTime
  updatedAt     DateTime
```

#### `ApprovalStage`
Defines one stage in a workflow — which role is required, the label, and the order.

```
ApprovalStage
  id            cuid
  workflowId    String          → ApprovalWorkflow
  stageNumber   Int
  stageName     String          (e.g. "Divisional Head Review")
  requiredRole  String          (e.g. "DIVISIONAL_HEAD")
  isOptional    Boolean
  order         Int
  @@unique([workflowId, stageNumber])
```

#### `MrfApprovalStep`
Per-MRF instance of each approval stage. One record per stage per MRF.

```
MrfApprovalStep
  id            cuid
  mrfId         String          → MRF
  stageId       String          → ApprovalStage
  stageNumber   Int
  assignedToId  String          → User (nominated approver)
  status        String          (PENDING / APPROVED / REJECTED / RETURNED)
  decision      String?
  remarks       String?
  actedAt       DateTime?
  createdAt     DateTime
  updatedAt     DateTime
  @@unique([mrfId, stageNumber])
```

#### `OrgMapping`
Generic key-value mapping table for organisational hierarchies.

```
OrgMapping
  id            cuid
  mappingType   String          (COUNTRY_SUPERVISOR, DEPT_FUNCTIONAL_HEAD, DEPT_HR, DEPT_DIV_HEAD, etc.)
  keyType       String          (COUNTRY / DEPARTMENT / LOCATION)
  keyValue      String          (e.g. country name or department id)
  userId        String          → User (the mapped person)
  isActive      Boolean
  createdAt     DateTime
  updatedAt     DateTime
  @@unique([mappingType, keyType, keyValue])
```

#### `DesignationWorkflowRule`
Maps a designation (or designation category) to a workflow path variant.

```
DesignationWorkflowRule
  id              cuid
  designation     String?         (exact match, or null = wildcard)
  category        String?         (OFFICE_STAFF / CONTRACTUAL / TECHNICAL / etc.)
  requiresPsychometric  Boolean   @default(false)
  requiresChemistryTraining Boolean @default(false)
  requiresExam    Boolean         @default(true)
  customStatuses  String?         (JSON: ordered list of statuses for this path)
  createdAt       DateTime
  updatedAt       DateTime
```

#### `CandidateOnboardingProfile`
Stores candidate-submitted personal/bank/emergency contact data.

```
CandidateOnboardingProfile
  id                cuid
  candidateId       String    @unique → Candidate
  dateOfBirth       DateTime?
  gender            String?
  nationality       String?
  bloodGroup        String?
  permanentAddress  String?
  currentAddress    String?
  emergencyName     String?
  emergencyRelation String?
  emergencyPhone    String?
  bankAccountNo     String?
  bankIFSC          String?
  bankName          String?
  bankBranch        String?
  bankAccountType   String?
  panNumber         String?
  aadhaarNumber     String?
  submittedAt       DateTime?
  finalizedAt       DateTime?   (set by HR when onboarding is complete)
  finalizedById     String?     → User
  createdAt         DateTime
  updatedAt         DateTime
```

### 6.2 Models Requiring Modification

| Model | Changes Required |
|-------|-----------------|
| `MRF` | Add: `workflowId` (FK to ApprovalWorkflow), `currentStage` (Int), `hiringManagerId` (FK to User), `functionalHeadId`, `divisionalHeadId`, `technicalHeadId`, `supervisorId`. Change: `status` values to include `PENDING_STAGE_1` through `PENDING_STAGE_6`. Remove: `approvedById`, `approvedAt` (replaced by `MrfApprovalStep`). |
| `Candidate` | Add: new status values (`PSYCHOMETRIC_PENDING`, `PSYCHOMETRIC_PASSED`, `PSYCHOMETRIC_FAILED`, `INTERVIEW_COMPLETED`, `CHEMISTRY_TRAINING`, `CHEMISTRY_TEST_PENDING`, `CHEMISTRY_TEST_PASSED`, `CHEMISTRY_TEST_FAILED`). Add: `workflowRuleId` (FK to DesignationWorkflowRule). |
| `CandidateDocument` | Add: `uploadedById` (FK to User — who uploaded), `verifiedById`, `verifiedAt`, `rejectionReason`, `isRequired` boolean. The existing `verified` boolean is retained. |
| `User` | Role values expanded to include: `HIRING_MANAGER`, `DIVISIONAL_HEAD`, `FUNCTIONAL_HEAD`, `SUPERVISOR`, `CANDIDATE`. Role is a free-text string — no schema migration needed, but portal routing must be updated. |
| `EmployeeDocument` | This model stores document *metadata* for the Employee portal (document numbers, not files). It should be retained as-is for that purpose. `CandidateDocument` handles the actual file uploads for the candidate onboarding flow — these are separate concerns. |

### 6.3 Migration Complexity

| Change | Complexity | Notes |
|--------|-----------|-------|
| Add new models (ApprovalWorkflow, ApprovalStage, MrfApprovalStep) | Medium | New tables; no existing data migration needed |
| Add OrgMapping model | Low | New table, no impact on existing data |
| Add DesignationWorkflowRule | Low | New table, no impact |
| Add CandidateOnboardingProfile | Low | New table, no impact |
| Modify MRF model (add fields) | Medium | Adding nullable FK columns; existing MRFs will have nulls in new fields — acceptable |
| Modify MRF.status values | High | Existing MRFs have `PENDING` status. Code relying on `status === 'PENDING'` breaks. All approval-related routes must be refactored simultaneously. |
| Modify Candidate status values | Medium | Adding new values does not break existing records. Frontend journey bar and status badge components need updating. |
| Modify CandidateDocument (add fields) | Low | Nullable columns; existing records are unaffected |
| Rename EMPLOYEE role to CANDIDATE | High | Must update: route guards, App.jsx portal, AuthContext redirect, all `role === 'EMPLOYEE'` checks, seed data. Must be done in one atomic change. |

---

## 7. API Impact Analysis

### 7.1 New APIs Required

#### MRF Approval Chain

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/workflows` | List approval workflow configurations |
| POST | `/api/workflows` | Create a new workflow configuration |
| PUT | `/api/workflows/:id` | Update a workflow |
| GET | `/api/mrf/:id/approval-steps` | Get all approval steps for an MRF (history + current) |
| POST | `/api/mrf/:id/approve-stage` | Approve the current stage (advancing to next) |
| POST | `/api/mrf/:id/reject-stage` | Reject the MRF at current stage |
| POST | `/api/mrf/:id/return-stage` | Return MRF to initiator for revision |
| GET | `/api/mrf/pending-approval` | Get all MRFs pending action for the current user |

#### Organizational Mappings

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/org-mappings` | List all mappings (Admin only) |
| POST | `/api/org-mappings` | Create a mapping |
| PUT | `/api/org-mappings/:id` | Update a mapping |
| DELETE | `/api/org-mappings/:id` | Delete a mapping |
| GET | `/api/org-mappings/suggest?mrfId=X` | Get suggested approvers for a given MRF (based on department/country) |

#### Candidate Onboarding

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/candidate/profile` | Get own onboarding profile |
| POST | `/api/candidate/profile` | Submit/update own profile form |
| GET | `/api/candidate/documents` | List own uploaded documents |
| POST | `/api/candidate/documents` | Upload a document file |
| DELETE | `/api/candidate/documents/:id` | Delete own unverified document |
| GET | `/api/candidate/onboarding-status` | Get checklist of pending/completed items |

#### HR — Onboarding Overview

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/hr/candidates/:id/onboarding` | Get all onboarding data for a candidate |
| PUT | `/api/hr/candidates/:id/documents/:docId/verify` | Mark a document verified or rejected |
| GET | `/api/hr/onboarding-export?candidateId=X` | Export candidate onboarding data to Excel |

#### Workflow Rules

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/workflow-rules` | List designation workflow rules |
| POST | `/api/workflow-rules` | Create a rule |
| PUT | `/api/workflow-rules/:id` | Update a rule |
| DELETE | `/api/workflow-rules/:id` | Delete a rule |
| GET | `/api/workflow-rules/match?designation=X` | Get the workflow rule for a given designation |

### 7.2 Existing APIs Requiring Changes

| Route | Change Required |
|-------|----------------|
| `POST /api/mrf` | Add: `hiringManagerId`, `functionalHeadId`, `divisionalHeadId`, `technicalHeadId`, `supervisorId`, `workflowId`, nominated approvers per stage. Restrict: only `HIRING_MANAGER` and `BRANCH_MANAGER` roles may create. |
| `POST /api/mrf/:id/submit` | Change: sets `status = PENDING_STAGE_1` (not `PENDING`). Creates initial `MrfApprovalStep` records. Sends notification to Stage 1 approver. |
| `POST /api/mrf/:id/approve` | **Deprecate.** Replaced by `/approve-stage`. |
| `POST /api/mrf/:id/reject` | **Deprecate.** Replaced by `/reject-stage`. Add role guard (currently has none). |
| `GET /api/mrf` | Add: `currentStage`, `currentApproverName` fields in response. |
| `PUT /api/candidates/:id` | Fix: whitelist allowed fields instead of spreading `req.body`. |
| `GET /api/candidates` | Add: `workflowPath` field in response (from DesignationWorkflowRule). |
| `POST /api/interviews/:id/complete` | Change: candidate status → `INTERVIEW_COMPLETED` (not directly `SELECTED`). HR/Recruiter then manually advances to `SELECTED` or `REJECTED`. |
| Auth routes | Add: `CANDIDATE` role support. Session token for candidates can share existing JWT flow. |

---

## 8. UI Impact Analysis

### 8.1 New Pages Required

#### Admin Portal (`/admin`)

| Page | Purpose |
|------|---------|
| Workflow Configuration | CRUD for ApprovalWorkflow and ApprovalStage records. Drag-and-drop stage ordering. |
| Org Mappings | CRUD for OrgMapping records. Table by mapping type. |
| Workflow Rules | CRUD for DesignationWorkflowRule. Configure which designations require psychometric/chemistry steps. |
| Single Admin Enforcement | Warning banner if more than one ADMIN account exists. |

#### Management Portal (`/management`)

| Page | Purpose |
|------|---------|
| My Approval Queue | Shows all MRFs currently awaiting the logged-in user's approval. One-click approve/return/reject with remarks. |
| MRF Approval Tracker | For HR: full view of all in-flight MRFs with stage-by-stage status. |

#### Candidate Portal (`/candidate`)

| Page | Purpose |
|------|---------|
| Onboarding Profile | Multi-section form for personal, contact, emergency, and bank details. |
| Documents (redesigned) | File upload UI with required/optional indicators, upload status per document type, HR remarks. |
| Onboarding Checklist | Consolidated view of all pending and completed onboarding actions. |

#### Recruiter Portal (`/recruiter`)

| Page | Purpose |
|------|---------|
| Candidate Onboarding View | Read-only view of all submitted onboarding data for a candidate. Link from CandidateDetail. |
| Document Verification | HR-only. View uploaded files, mark verified/rejected, download files. |

### 8.2 Pages Requiring Updates

| Page | Change Required |
|------|----------------|
| `MRFForm.jsx` | Add: hiringManagerId, functionalHeadId, divisionalHeadId, technicalHeadId, supervisorId dropdowns (filtered by role). Add: per-stage approver nomination section. Location dropdown scoped to country. |
| `MRFList.jsx` / `MRFDetail.jsx` | Replace single-approver display with multi-stage approval tracker component (timeline/stepper). Remove BRANCH_MANAGER approve button inconsistency. |
| `management/Approvals.jsx` | Split into: MRF approvals (now multi-stage) and Offer approvals. Add stage-specific approval UI. |
| `employee/Dashboard.jsx` (→ `candidate/Dashboard.jsx`) | Dynamic journey bar (reads from DesignationWorkflowRule for candidate's designation). Add onboarding checklist widget. |
| `employee/Profile.jsx` (→ `candidate/Profile.jsx`) | Replace read-only display with editable multi-section form. |
| `employee/Documents.jsx` (→ `candidate/Documents.jsx`) | Replace metadata-entry form with file upload UI. |
| `CandidateDetail.jsx` | Add Onboarding tab showing candidate-submitted profile and documents. Add document verification controls for HR. |
| `App.jsx` | Add new routes for new portals/pages. Rename `/employee` to `/candidate`. Add new management portal pages. |
| `Sidebar.jsx` | Add navigation entries for new pages per role. |

### 8.3 New Dashboard Components Required

| Component | Used In |
|-----------|---------|
| `ApprovalStepper` | MRFDetail, MRFList (inline), management/Approvals |
| `ApprovalActionCard` | management/MyApprovalQueue |
| `OnboardingChecklist` | candidate/Dashboard, candidate/OnboardingChecklist |
| `DocumentUploadCard` | candidate/Documents |
| `DynamicJourneyBar` | candidate/Dashboard, CandidateDetail |
| `OrgMappingTable` | admin/OrgMappings |
| `WorkflowRuleEditor` | admin/WorkflowRules |

---

## 9. Implementation Roadmap

### Phase 1 — Role Expansion & MRF Multi-Step Approval
**Complexity: High**
**Prerequisites: None**

This is the highest-impact, highest-complexity phase. It changes core MRF flow and touches the most files.

| Task | Complexity |
|------|-----------|
| Add new roles (HIRING_MANAGER, DIVISIONAL_HEAD, FUNCTIONAL_HEAD, SUPERVISOR, CANDIDATE) to routing and portal guards | Medium |
| Add ApprovalWorkflow, ApprovalStage, MrfApprovalStep models to schema | Medium |
| Migrate MRF.status values; update all route guards and status checks | High |
| Implement MRF create with approver nomination + workflow selection | High |
| Implement per-stage approve/return/reject API | High |
| Build ApprovalStepper UI component (timeline view) | Medium |
| Build My Approval Queue page (management portal) | Medium |
| Update MRFList and MRFDetail to show multi-stage approval | Medium |
| Rename EMPLOYEE → CANDIDATE in all code, routing, and seed data | Medium |
| Fix missing role guard on `POST /mrf/:id/reject` | Low |
| Enforce single ADMIN account | Low |

---

### Phase 2 — MRF Field Enhancements & Org Mappings
**Complexity: Medium**
**Prerequisites: Phase 1 complete**

| Task | Complexity |
|------|-----------|
| Add hiringManagerId, functionalHeadId, divisionalHeadId, technicalHeadId, supervisorId to MRF model | Low |
| Add MRF form dropdowns filtered by role | Medium |
| Add OrgMapping model + admin CRUD UI | Medium |
| Build org mapping auto-suggestion into MRF create form | Medium |
| Scope location field to country (link to Location model) | Low |
| Build Workflow Configuration admin page | Medium |

---

### Phase 3 — Candidate Portal Onboarding
**Complexity: Medium**
**Prerequisites: Phase 1 complete (CANDIDATE role needed)**

| Task | Complexity |
|------|-----------|
| Add CandidateOnboardingProfile model to schema | Low |
| Build candidate profile form (multi-section, validated) | Medium |
| Add CandidateDocument file upload API (multer, candidate-scoped paths) | Medium |
| Build document upload UI in candidate portal | Medium |
| Build onboarding checklist page | Medium |
| Build HR document verification UI | Medium |
| Build HR onboarding data view in CandidateDetail | Medium |
| Add Excel export for onboarding data | Medium |
| Fix document ownership enforcement (candidateDocuments) | Low |
| Add audit logging for all onboarding events | Low |

---

### Phase 4 — Designation-Based Workflow Engine
**Complexity: High**
**Prerequisites: Phase 3 complete**

| Task | Complexity |
|------|-----------|
| Add DesignationWorkflowRule model | Low |
| Build admin Workflow Rules configuration page | Medium |
| Expand candidate status model with new statuses | Medium |
| Add PsychometricTest model (analogous to ChemistryTest) | Low |
| Implement skip logic at each workflow step | High |
| Update journey bar to render dynamically based on candidate's workflow path | High |
| Update status transition guards in all relevant route handlers | High |
| Update reports to account for new statuses | Medium |

---

### Phase 5 — Security Hardening & Production Readiness
**Complexity: Medium**
**Prerequisites: Phases 1–4 complete**

| Task | Complexity |
|------|-----------|
| Fix `PUT /candidates/:id` req.body spread vulnerability | Low |
| Fix `POST /offers/:id/approve` missing role guard | Low |
| Fix `POST /departments` missing role guard | Low |
| Migrate JWT to httpOnly cookies | High |
| Replace sequential ID generators with UUID-safe alternatives | Medium |
| Configure SMTP | Low |
| Add structured logging (e.g. morgan + winston) | Medium |
| Resolve SQLite strftime → PostgreSQL compatible query | Medium |
| Consolidate PrismaClient to a single shared instance | Low |

---

## 10. Questions for HR Team

These questions must be answered before implementation of the affected phases begins.

### MRF Approval Chain (Phase 1)

1. **Is the six-stage approval chain fixed, or can different MRF types have fewer stages?** For example, do urgent vacancies skip certain stages?
2. **Who exactly approves at Stage 1?** The requirements say "Hiring Manager / Branch Manager" — is this an OR (either one can approve), or is it that BM approves for branch MRFs and HM approves for HQ MRFs?
3. **What happens when an approver is on leave or unavailable?** Is there a delegate/proxy mechanism required?
4. **Can an MRF be returned multiple times**, or is only one return-for-revision allowed before it becomes a rejection?
5. **Should rejected MRFs be archivable, or permanently visible** in the system?
6. **Is the HR Review at Stage 5 a blocking approval**, or an advisory annotation (i.e., can HR reject an MRF, or can they only return it)?
7. **Do all six stages apply to every MRF**, or are some stages conditional based on department, level, or number of vacancies?

### Roles (Phase 1)

8. **Should COUNTRY_MANAGER be retained?** It exists in the current system. Does it map to DIVISIONAL_HEAD, FUNCTIONAL_HEAD, or is it a distinct role?
9. **Can a single user hold multiple roles** (e.g., someone who is both Hiring Manager and Divisional Head for their own MRF)?
10. **Is there a single Admin per company, or per geographic entity?** The requirement says "only 1 system admin" — is this per system instance?

### Organizational Mappings (Phase 2)

11. **What is the full list of mapping types required at launch?** The requirements mention 4 types (Country→Supervisor, Dept→Functional Head, Dept→HR, Dept→Divisional Head). Are there others?
12. **Are these mappings 1:1 or 1:many?** For example, can a department have multiple Functional Heads, or exactly one?
13. **When an org mapping changes, do in-flight MRFs use the old mapping or the new one?** (i.e., are approvers nominated at creation-time locked in, or do they update dynamically?)

### Candidate Portal & Uploads (Phase 3)

14. **What is the complete list of onboarding form fields?** The requirements mention personal details, emergency contacts, bank details — please provide the exact field list, labels, and which are required vs optional.
15. **What is the complete list of required documents** for each candidate type (office staff, contractual, technical)? Are there any designation-specific variations?
16. **Who can verify documents — any HR user, or only the HR user mapped to that candidate's department?**
17. **What happens to a candidate's onboarding data if their offer is rejected or the candidate withdraws?** Should data be retained or purged?
18. **Should candidates be able to update their onboarding profile after HR has finalised it?** If yes, does that trigger a re-review?

### Workflow Redesign (Phase 4)

19. **Please provide the complete list of designations** and which workflow path each follows. The three examples given (Office Staff, Contractual, Technical) are illustrative — a full mapping is needed before implementation.
20. **Is "Psychometric Test" an internal test administered via the system, or an externally-administered test whose result is just recorded?** This determines whether a test-link generation flow is needed.
21. **After a candidate passes the interview, who makes the "SELECTED" decision?** Currently the system auto-advances to SELECTED on interview completion. Should this remain automatic, or should it require a manual HR/recruiter decision?
22. **Is "Chemistry Training" the same training module already in the system**, or a separate short-form training distinct from the main Training Batches?
23. **Can a candidate fail Probation and re-enter the pipeline**, or is FAILED always terminal?

### General / Data Ownership

24. **Which HR user "owns" a candidate?** Is ownership by the HR user who added them, by the department mapping, by the MRF owner, or is there no ownership concept?
25. **Should the system support multi-country operations from day one**, or is the initial deployment single-country (India)?

---

*End of Business Requirements Analysis*
*Next step: Review with HR team → resolve Section 10 questions → begin Phase 1 implementation planning*
