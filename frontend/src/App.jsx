import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Auth
import Login from './pages/auth/Login';

// Recruiter
import RecruiterDashboard from './pages/recruiter/Dashboard';
import MRFList from './pages/recruiter/MRF/MRFList';
import MRFDetail from './pages/recruiter/MRF/MRFDetail';
import CandidateList from './pages/recruiter/Candidates/CandidateList';
import CandidateDetail from './pages/recruiter/Candidates/CandidateDetail';
import InterviewList from './pages/recruiter/Interviews/InterviewList';
import TrainingCoordination from './pages/recruiter/Training/TrainingCoordination';
import ExamManagement from './pages/recruiter/Exams/ExamManagement';
import OfferManagement from './pages/recruiter/Offers/OfferManagement';
import Reports from './pages/recruiter/Reports/Reports';
import AgencyList from './pages/recruiter/Agencies/AgencyList';
import AgencyDetail from './pages/recruiter/Agencies/AgencyDetail';
import EmailCenter from './pages/recruiter/EmailCenter/EmailCenter';
import PipelineKanban from './pages/recruiter/Pipeline/PipelineKanban';
import AIScreening from './pages/recruiter/AIScreening/AIScreening';
import CasualWorkers from './pages/recruiter/CasualWorkers/CasualWorkers';
import GeographyIntelligence from './pages/recruiter/Geography/GeographyIntelligence';
import IncomingMail from './pages/recruiter/IncomingMail/IncomingMail';

// Agency Partner
import AgencyDashboard from './pages/agency/AgencyDashboard';

// Employee
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeProfile from './pages/employee/Profile';
import EmployeeDocuments from './pages/employee/Documents';
import EmployeeTraining from './pages/employee/Training';
import EmployeeExams from './pages/employee/Exams';

// Training
import TrainingDashboard from './pages/training/Dashboard';
import TrainingBatches from './pages/training/Batches';
import TrainingAttendance from './pages/training/Attendance';

// Management
import ManagementDashboard from './pages/management/Dashboard';
import ManagementReports from './pages/management/Reports';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';

const roleRedirects = {
  ADMIN: '/admin',
  HR: '/recruiter',
  RECRUITER: '/recruiter',
  INTERVIEWER: '/recruiter',
  TRAINING: '/training',
  BRANCH_MANAGER: '/management',
  COUNTRY_MANAGER: '/management',
  MD: '/management',
  EMPLOYEE: '/employee',
  AGENCY_PARTNER: '/agency',
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={roleRedirects[user.role] || '/login'} replace />;
  return children;
};

const RECRUITER_ROLES = ['HR', 'RECRUITER', 'INTERVIEWER', 'ADMIN'];
const AGENCY_ROLES = ['AGENCY_PARTNER', 'ADMIN'];
const TRAINING_ROLES = ['TRAINING', 'ADMIN'];
const MANAGEMENT_ROLES = ['BRANCH_MANAGER', 'COUNTRY_MANAGER', 'MD', 'ADMIN'];
const ADMIN_ROLES = ['ADMIN'];

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to={user ? (roleRedirects[user.role] || '/recruiter') : '/login'} replace />} />

      {/* Recruiter Portal */}
      <Route path="/recruiter" element={<ProtectedRoute allowedRoles={RECRUITER_ROLES}><Layout /></ProtectedRoute>}>
        <Route index element={<RecruiterDashboard />} />
        <Route path="mrf" element={<MRFList />} />
        <Route path="mrf/:id" element={<MRFDetail />} />
        <Route path="candidates" element={<CandidateList />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        <Route path="interviews" element={<InterviewList />} />
        <Route path="training" element={<TrainingCoordination />} />
        <Route path="exams" element={<ExamManagement />} />
        <Route path="offers" element={<OfferManagement />} />
        <Route path="reports" element={<Reports />} />
        <Route path="agencies" element={<AgencyList />} />
        <Route path="agencies/:id" element={<AgencyDetail />} />
        <Route path="email-center" element={<EmailCenter />} />
        <Route path="pipeline" element={<PipelineKanban />} />
        <Route path="ai-screening" element={<AIScreening />} />
        <Route path="casual-workers" element={<CasualWorkers />} />
        <Route path="geography" element={<GeographyIntelligence />} />
        <Route path="incoming-mail" element={<IncomingMail />} />
      </Route>

      {/* Agency Partner Portal */}
      <Route path="/agency" element={<ProtectedRoute allowedRoles={AGENCY_ROLES}><Layout /></ProtectedRoute>}>
        <Route index element={<AgencyDashboard />} />
      </Route>

      {/* Employee Portal */}
      <Route path="/employee" element={<ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']}><Layout /></ProtectedRoute>}>
        <Route index element={<EmployeeDashboard />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="documents" element={<EmployeeDocuments />} />
        <Route path="training" element={<EmployeeTraining />} />
        <Route path="exams" element={<EmployeeExams />} />
        <Route path="offers" element={<EmployeeDashboard />} />
      </Route>

      {/* Training Portal */}
      <Route path="/training" element={<ProtectedRoute allowedRoles={TRAINING_ROLES}><Layout /></ProtectedRoute>}>
        <Route index element={<TrainingDashboard />} />
        <Route path="batches" element={<TrainingBatches />} />
        <Route path="attendance" element={<TrainingAttendance />} />
        <Route path="reports" element={<TrainingBatches />} />
      </Route>

      {/* Management Portal */}
      <Route path="/management" element={<ProtectedRoute allowedRoles={MANAGEMENT_ROLES}><Layout /></ProtectedRoute>}>
        <Route index element={<ManagementDashboard />} />
        <Route path="reports" element={<ManagementReports />} />
        <Route path="probation" element={<ManagementDashboard />} />
        <Route path="approvals" element={<ManagementDashboard />} />
      </Route>

      {/* Admin Portal */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="departments" element={<AdminDashboard />} />
        <Route path="audit-logs" element={<AdminDashboard />} />
        <Route path="settings" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', fontSize: '14px' } }} />
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
