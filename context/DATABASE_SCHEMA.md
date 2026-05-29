# RecruitPro ERP — Database Schema

Provider: SQLite via Prisma 5  
File: `backend/prisma/dev.db`  
Schema: `backend/prisma/schema.prisma`

---

## Core Models

### User
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| email | String | unique |
| password | String | bcrypt hash |
| firstName / lastName | String | |
| role | String | See roles below |
| departmentId | String? | FK → Department |
| isActive | Boolean | default true |
| lastLogin | DateTime? | |
| deletedAt | DateTime? | soft delete |

**Roles:** ADMIN · HR · RECRUITER · INTERVIEWER · TRAINING · BRANCH_MANAGER · COUNTRY_MANAGER · MD · EMPLOYEE · AGENCY_PARTNER

---

### Department
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| name | String | unique |
| description | String? | |
| isActive | Boolean | default true |

---

### MRF (Manpower Requisition Form)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| mrfNumber | String | unique, auto-generated `MRF-YYYY-#####` |
| departmentId | String | FK → Department |
| designation | String | |
| vacancies | Int | |
| experience | String | e.g. "3-5 years" |
| skills | String | JSON array |
| salaryMin / salaryMax | Float? | |
| location / branch / country | String? | |
| status | String | DRAFT → PENDING → APPROVED / REJECTED → CLOSED |
| priority | String | LOW · NORMAL · HIGH · URGENT |
| description | String? | |
| rejectionReason | String? | populated on reject |
| createdById / approvedById | String | FK → User |

---

### Candidate
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| candidateId | String | unique, `CAN-#####` auto-generated |
| email | String | unique |
| phone | String | |
| firstName / lastName | String | |
| designation | String | |
| experience | Int | in months |
| currentCompany | String? | |
| city | String? | |
| skills | String | JSON array |
| education | String | JSON array |
| certifications | String | JSON array |
| status | String | APPLIED · SHORTLISTED · INTERVIEW_SCHEDULED · SELECTED · REJECTED · HOLD · TRAINING_PENDING · TRAINING_IN_PROGRESS · EXAM_PENDING · EXAM_COMPLETED · OFFER_SENT · OFFER_ACCEPTED · ONBOARDED · CONFIRMED |
| source | String? | DIRECT · AGENCY · REFERRAL · PORTAL · WALK_IN |
| mrfId | String? | FK → MRF |
| locationId | String? | FK → Location |
| resumePath | String? | relative path under `uploads/` |
| aadhaarNumber / panNumber | String? | contractual workers |
| isContractual | Boolean | default false |
| addedById | String | FK → User |
| deletedAt | DateTime? | soft delete |

---

### CandidateDocument
| Field | Type | Notes |
|---|---|---|
| candidateId | FK → Candidate | |
| docType | String | RESUME · ID_PROOF · EDUCATION · EXPERIENCE · OTHER |
| fileName / filePath | String | |
| fileSize | Int | bytes |
| mimeType | String | |
| verified | Boolean | default false |

---

### CandidateComment
| Field | Type |
|---|---|
| candidateId | FK → Candidate |
| comment | String |
| commentedById | FK → User |
| createdAt | DateTime |

---

### Interview
| Field | Type | Notes |
|---|---|---|
| candidateId | FK → Candidate | |
| round | Int | default 1 |
| interviewType | String | TECHNICAL · HR · CULTURAL · MANAGEMENT |
| scheduledAt | DateTime | |
| duration | Int? | minutes |
| mode | String | ONLINE · OFFLINE · PHONE |
| location / meetingLink | String? | |
| status | String | SCHEDULED → COMPLETED / CANCELLED / NO_SHOW |
| panelIds | String | JSON array of User IDs |
| scheduledById | FK → User | |
| cancelReason | String? | |

### InterviewFeedback
Scores (1–10): technicalScore · communicationScore · problemSolvingScore · cultureFitScore · overallScore  
recommendation: STRONGLY_RECOMMEND · RECOMMEND · HOLD · REJECT  
Linked to one Interview and one interviewer User.

---

### Assessment
| Field | Type |
|---|---|
| candidateId | FK |
| assessmentType / testName | String |
| maxScore / obtainedScore / passingScore | Int |
| status | PENDING · IN_PROGRESS · COMPLETED · FAILED |

---

## Training Models

### TrainingBatch
| Field | Type | Notes |
|---|---|---|
| batchCode | String | unique, auto-generated |
| batchName | String | |
| designation | String | |
| startDate / endDate | DateTime | |
| maxCapacity | Int | |
| trainer / location | String? | |
| status | String | UPCOMING · ONGOING · COMPLETED · CANCELLED |
| managedById | FK → User | |

### TrainingEnrollment
`candidateId @unique` — one enrollment per candidate.  
Status: ENROLLED · COMPLETED · DROPPED  
Optional: `completionDate`, `remarks`

### TrainingAttendance
`@@unique([batchId, candidateId, date])` — prevents duplicate attendance marks.  
`present Boolean`, optional `remarks`

---

## Exam & Offer Models

### ExamAttempt
Token-based exam links (`linkToken @unique`).  
Status: PENDING · SENT · STARTED · COMPLETED · EXPIRED  
Fields: `examName`, `maxScore`, `passingScore`, `score?`, `result?` (PASS/FAIL), `linkExpiresAt`

### OfferLetter
`candidateId @unique` — one offer per candidate.  
Salary breakdown: `basicSalary · hra · allowances (JSON) · deductions (JSON) · grossSalary · netSalary · ctc`  
Status: DRAFT → APPROVED → SENT → ACCEPTED / REJECTED  
Offer number auto-generated: `OFF-YYYY-#####`

### AppointmentLetter
`candidateId @unique` — generated after offer acceptance.  
`probationPeriod` in days (default 180).

### Probation
`candidateId @unique`  

| Field | Type | Notes |
|---|---|---|
| startDate / endDate | DateTime | |
| newEndDate | DateTime? | set on extension |
| status | String | ONGOING · PASSED · EXTENDED · FAILED |
| branchManagerApproval | Boolean? | step 1 |
| countryManagerApproval | Boolean? | step 2 |
| mdApproval | Boolean? | step 3 — all three set → status PASSED, candidate.status CONFIRMED |
| reviewerId | FK → User? | |
| notes / failureReason / extensionReason | String? | |

Approval chain: BRANCH_MANAGER (or ADMIN) → COUNTRY_MANAGER → MD. Only after all three approve does the probation pass.

---

## Agency Management Models

### Agency
| Field | Type | Notes |
|---|---|---|
| agencyCode | String | unique, format `AGY-XXX-#####` |
| tier | String | STANDARD · PREFERRED · PREMIUM |
| status | String | ACTIVE · INACTIVE · BLACKLISTED |
| totalSubmissions / successfulHires | Int | denormalised counters |
| specializations | String | JSON array |
| deletedAt | DateTime? | soft delete |

### AgencyContact
Multiple contacts per agency. `isPrimary` flags the main contact.

### AgencySubmission
Links Agency + MRF + Candidate.  
Status: SUBMITTED · SHORTLISTED · INTERVIEWED · PLACED · REJECTED  
Optional: `fee`, `notes`

### AgencyPartner
`userId @unique` — one-to-one link between a User (AGENCY_PARTNER role) and an Agency.  
Used by `GET /agencies/my` to resolve the partner's own agency.

### AgencyLocation
`@@unique([agencyId, locationId])` — many-to-many Agency ↔ Location with `isPrimary` flag.

---

## Geographic Intelligence Models

### Location
`@@unique([city, state, country])` — canonical city record.  
Fields: city · state · country · region · zone · pincode

### AgencyLocation
Join table: Agency ↔ Location with `isPrimary` flag (shared with Agency Management above).

---

## AI Screening Models

### JobDescription
`mrfId @unique` — one per MRF.  
Stores `skills` (JSON), `description`, `requirements`, optional `vectorData`.

### AIScreeningResult
`candidateId @unique` — one result per candidate.  
Fields: `matchScore` (0–100) · `skillsMatched / skillsMissing` (JSON) · `experienceGap` · `recommendation` · `summary`

---

## Communication Engine Models

### EmailTemplate
`name @unique`.  
`variables` is a JSON array of `{{placeholder}}` names.  
Category: INTERVIEW · OFFER · TRAINING · EXAM · REJECTION · AGENCY

### Communication
Sent email log. Links to optional Candidate, optional EmailTemplate, and required sentBy User.  
`channel`: EMAIL · SMS · WHATSAPP  
`status`: SENT · FAILED · PENDING  
`failureReason`: populated when status=FAILED

---

## Pipeline Models

### PipelineStage
`@@unique([mrfId, order])` — one stage per order slot per MRF.  
Default 6 stages: Applied(1) · Screening(2) · Interview(3) · Offer(4) · Hired(5) · Rejected(6).  
Optional `color` field for Kanban card colour.

### PipelineEntry
Candidate's current position in a stage. Moving a candidate removes all prior PipelineEntry records for that MRF (enforces single-stage position).

---

## Incoming Mail Models

### IncomingMail
Status: UNPROCESSED → PROCESSED / LINKED / DISCARDED  
`messageId @unique` — deduplicates imported emails.  
`candidateId` populated after auto-parse creates a Candidate record.  
Fields: `fromEmail`, `fromName`, `subject`, `body`, `hasAttachment`, `attachments` (JSON), `receivedAt`

---

## Casual Worker Models

### CasualWorker
`candidateId @unique` — every casual worker is also a Candidate with `isContractual=true`.  
`workerType`: CASUAL · CONTRACT · TEMPORARY  
Status: ACTIVE · INACTIVE · TERMINATED  
Verification flags: `aadhaarVerified` · `panVerified`  
Financial: `dailyRate?`, `monthlyRate?`, `bankAccount?`, `ifscCode?`

---

## System Models

### Notification
Per-user notifications. `type`: INFO · WARNING · SUCCESS · ERROR  
`isRead Boolean` (default false), `link?` for deep-link

### AuditLog
Append-only event log. Fields: `userId` · `action` (CREATE · UPDATE · DELETE · STATUS_CHANGE · LOGIN · etc.) · `entity` (Candidate · MRF · User · etc.) · `entityId` · `oldValue` (JSON) · `newValue` (JSON) · `ipAddress?`
