# RecruitPro Frontend

React + Vite frontend for the RecruitPro Enterprise Recruitment ERP.

## Stack

- **React 19** with functional components and hooks
- **Vite 8** for dev server and production builds
- **TailwindCSS 3** for styling
- **React Router DOM 6** for client-side routing
- **Axios** for API requests (with JWT interceptors)
- **Recharts** for dashboard charts
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **date-fns** for date formatting

## Development

```bash
npm install
npm run dev       # http://localhost:5173
```

Requires the backend running at `http://localhost:5000`. See the root `README.md` for full setup instructions.

## Build

```bash
npm run build     # Output in dist/
npm run preview   # Preview the production build
npm run lint      # ESLint check
```

## Key Files

| File | Purpose |
|---|---|
| `src/App.jsx` | Root router — all routes and role-based `ProtectedRoute` |
| `src/context/AuthContext.jsx` | Auth state (user, login, logout) |
| `src/services/api.js` | All API calls grouped by module |
| `src/components/layout/Sidebar.jsx` | Role-aware navigation sidebar |
| `src/components/common/StatusBadge.jsx` | Colour-coded status labels |
| `src/components/common/Modal.jsx` | Reusable modal dialog |
| `src/components/common/KPICard.jsx` | Dashboard stat card |

## Pages

```
src/pages/
├── auth/Login.jsx
├── recruiter/
│   ├── Dashboard.jsx
│   ├── MRF/MRFList.jsx, MRFForm.jsx, MRFDetail.jsx
│   ├── Candidates/CandidateList.jsx, CandidateForm.jsx, CandidateDetail.jsx
│   ├── Interviews/InterviewList.jsx
│   ├── Training/TrainingCoordination.jsx
│   ├── Exams/ExamManagement.jsx
│   ├── Offers/OfferManagement.jsx
│   └── Reports/Reports.jsx
├── employee/Dashboard.jsx, Profile.jsx, Documents.jsx, Training.jsx, Exams.jsx
├── training/Dashboard.jsx, Batches.jsx, Attendance.jsx
├── management/Dashboard.jsx, Reports.jsx
└── admin/Dashboard.jsx, Users.jsx
```
