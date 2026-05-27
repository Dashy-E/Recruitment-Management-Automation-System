# Recruitment ERP MVP

This workspace contains the starting foundation for a modular recruitment ERP covering manpower requisitions, candidate management, interview workflows, assessments, documentation, offers, training, examinations, reporting, approvals, and probation confirmation.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Prisma
- PostgreSQL
- RBAC-ready multi-portal structure

## Portal Routes

- `/recruiter`
- `/employee`
- `/training`
- `/management`
- `/admin`

## First Build Order

1. Authentication, RBAC, and portal layout guards
2. MRF module with approval workflow and audit logs
3. Candidate module with resume upload, comments, status tracking, and interview scheduling
4. Training and exam workflows
5. Offer/appointment letter and PDF generation
6. Management reporting and probation confirmation

## Current MVP Progress

- Multi-portal dashboard shell is scaffolded for recruiter, employee, training, management, and admin portals.
- Prisma schema covers the core recruitment lifecycle, RBAC, documents, approvals, training, exams, letters, notifications, reports, probation, and audit logs.
- MRF module has initial recruiter routes:
  - `/recruiter/mrf`
  - `/recruiter/mrf/new`
  - `/recruiter/mrf/[id]`
- MRF API contracts are scaffolded:
  - `GET /api/mrf`
  - `POST /api/mrf`
  - `GET /api/mrf/[id]`
  - `PATCH /api/mrf/[id]`
  - `DELETE /api/mrf/[id]`

## Local Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

The Prisma schema is in `prisma/schema.prisma`. Architecture notes are in `docs/architecture.md`.
