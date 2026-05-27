# Recruitment ERP MVP Architecture

## Objective

Build a modular, portal-based recruitment ERP that manages the lifecycle from manpower requisition through hiring, training, exams, onboarding, probation, reporting, and final confirmation.

## Application Layers

- Frontend: Next.js App Router, TailwindCSS, role-aware portal layouts.
- Backend/API: Next.js route handlers or server actions for MVP, with module boundaries that can later split into services.
- Database: PostgreSQL through Prisma.
- File storage: local secure storage for MVP, abstracted for later S3 or Azure Blob migration.
- Notification service: queued email jobs for interviews, training, exams, approvals, and document release.
- Reporting engine: HTML templates rendered to PDFs, stored with report history.

## Module Boundaries

- Identity and RBAC: users, roles, permissions, sessions, route guards.
- MRF: requisitions, approvals, status history, PDF print view.
- Candidates: profiles, resume parsing result, comments, documents, status history.
- Interviews: scheduling, panels, feedback, disagreement review.
- Assessments: psychometric tests and score summaries.
- Training: batches, attendance, completion, recruitment handoff.
- Exams: links, attempts, scoring, retakes, pass/fail.
- Offers: salary templates, CTC breakup, approvals, offer/appointment letters.
- Reporting: saved filters, generated PDFs, export jobs.
- Probation: review cycle, extension, confirmation approvals.
- Notifications and audit: reliable cross-module events and recovery.

## Portal Structure

```text
app/
  recruiter/
  employee/
  training/
  management/
  admin/
  api/
    auth/
    mrf/
    candidates/
    interviews/
    training/
    exams/
    reports/
```

## Authentication Flow

1. User signs in with email and password or SSO in a later phase.
2. Server creates a JWT/session containing user id, role, and active portal.
3. Middleware checks portal route access.
4. API authorization checks permissions, not only roles.
5. Sensitive document downloads use short-lived signed URLs.

## Workflow Principles

- Every critical status transition writes to `audit_logs`.
- Soft deletes are used for business records.
- Approval workflows support multiple approvers, partial approvals, rejection, and escalation.
- Candidate status is derived from workflow events where possible, but stored for fast pipeline filtering.
- PDF generation is asynchronous for large reports and cached in report history.

## MVP Build Sequence

1. RBAC, layout, navigation, and seed data.
2. MRF CRUD and approvals.
3. Candidate CRUD, resume upload metadata, comments, and status history.
4. Interview scheduling and feedback.
5. Training batches, attendance, completion notification.
6. Exams with expiring links and attempt limits.
7. Offer/appointment letter generation and approval.
8. Management reports and probation confirmation.
