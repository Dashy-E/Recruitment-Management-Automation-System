import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/recruiter': 'Recruiter Dashboard',
  '/recruiter/mrf': 'MRF Management',
  '/recruiter/candidates': 'Candidate Management',
  '/recruiter/interviews': 'Interview Management',
  '/recruiter/training': 'Training Coordination',
  '/recruiter/exams': 'Examination Management',
  '/recruiter/offers': 'Offer Letters',
  '/recruiter/reports': 'Reports & Analytics',
  '/employee': 'Employee Dashboard',
  '/employee/profile': 'My Profile',
  '/employee/documents': 'My Documents',
  '/employee/training': 'My Training',
  '/employee/exams': 'My Examinations',
  '/employee/offers': 'Offer Letter',
  '/training': 'Training Dashboard',
  '/training/batches': 'Training Batches',
  '/training/attendance': 'Attendance',
  '/training/reports': 'Training Reports',
  '/management': 'Management Dashboard',
  '/management/reports': 'Analytics & Reports',
  '/management/probation': 'Probation Management',
  '/management/approvals': 'Approvals',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/departments': 'Departments',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/settings': 'System Settings',
};

const Layout = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'RecruitPro ERP';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
