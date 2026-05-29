import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, Users, Calendar, ClipboardList,
  Mail, BarChart3, Settings, LogOut, Building2, UserCheck, BookOpen, Award,
  ShieldCheck, Database, Brain, Layers,
  Inbox, Send
} from 'lucide-react';

const portalConfig = {
  ADMIN: {
    label: 'Admin Portal',
    color: 'from-slate-800 to-slate-900',
    accent: 'bg-slate-700',
    nav: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/departments', label: 'Departments', icon: Building2 },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: Database },
      { to: '/admin/settings', label: 'System Settings', icon: Settings },
    ],
  },
  HR: {
    label: 'HR Portal',
    color: 'from-indigo-800 to-indigo-900',
    accent: 'bg-indigo-700',
    nav: [
      { to: '/recruiter', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/recruiter/mrf', label: 'MRF Management', icon: FileText },
      { to: '/recruiter/candidates', label: 'Candidates', icon: Users },
      { to: '/recruiter/interviews', label: 'Interviews', icon: Calendar },
      { to: '/recruiter/exams', label: 'Examinations', icon: ClipboardList },
      { to: '/recruiter/offers', label: 'Offer Letters', icon: Mail },
      { to: '/recruiter/pipeline', label: 'Pipeline', icon: Layers },
      { to: '/recruiter/ai-screening', label: 'AI Screening', icon: Brain },
      { to: '/recruiter/email-center', label: 'Email Center', icon: Send },
      { to: '/recruiter/incoming-mail', label: 'Incoming Mail', icon: Inbox },
      { to: '/recruiter/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  RECRUITER: {
    label: 'Recruiter Portal',
    color: 'from-indigo-800 to-indigo-900',
    accent: 'bg-indigo-700',
    nav: [
      { to: '/recruiter', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/recruiter/mrf', label: 'MRF Management', icon: FileText },
      { to: '/recruiter/candidates', label: 'Candidates', icon: Users },
      { to: '/recruiter/interviews', label: 'Interviews', icon: Calendar },
      { to: '/recruiter/exams', label: 'Examinations', icon: ClipboardList },
      { to: '/recruiter/offers', label: 'Offer Letters', icon: Mail },
      { to: '/recruiter/pipeline', label: 'Pipeline', icon: Layers },
      { to: '/recruiter/ai-screening', label: 'AI Screening', icon: Brain },
      { to: '/recruiter/email-center', label: 'Email Center', icon: Send },
      { to: '/recruiter/incoming-mail', label: 'Incoming Mail', icon: Inbox },
      { to: '/recruiter/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  INTERVIEWER: {
    label: 'Interviewer Portal',
    color: 'from-purple-800 to-purple-900',
    accent: 'bg-purple-700',
    nav: [
      { to: '/recruiter', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/recruiter/interviews', label: 'My Interviews', icon: Calendar },
      { to: '/recruiter/candidates', label: 'Candidates', icon: Users },
    ],
  },
  TRAINING: {
    label: 'Training Portal',
    color: 'from-emerald-800 to-emerald-900',
    accent: 'bg-emerald-700',
    nav: [
      { to: '/training', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/training/batches', label: 'Training Batches', icon: BookOpen },
      { to: '/training/attendance', label: 'Attendance', icon: UserCheck },
      { to: '/training/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  BRANCH_MANAGER: {
    label: 'Management Portal',
    color: 'from-orange-800 to-orange-900',
    accent: 'bg-orange-700',
    nav: [
      { to: '/management', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/management/reports', label: 'Reports', icon: BarChart3 },
      { to: '/management/probation', label: 'Probation', icon: Award },
    ],
  },
  COUNTRY_MANAGER: {
    label: 'Management Portal',
    color: 'from-orange-800 to-orange-900',
    accent: 'bg-orange-700',
    nav: [
      { to: '/management', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/management/reports', label: 'Reports', icon: BarChart3 },
      { to: '/management/probation', label: 'Probation', icon: Award },
    ],
  },
  MD: {
    label: 'MD Dashboard',
    color: 'from-red-800 to-red-900',
    accent: 'bg-red-700',
    nav: [
      { to: '/management', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/management/reports', label: 'Analytics', icon: BarChart3 },
      { to: '/management/approvals', label: 'Approvals', icon: ShieldCheck },
      { to: '/management/probation', label: 'Probation', icon: Award },
    ],
  },
  EMPLOYEE: {
    label: 'Employee Portal',
    color: 'from-teal-800 to-teal-900',
    accent: 'bg-teal-700',
    nav: [
      { to: '/employee', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/employee/profile', label: 'My Profile', icon: Users },
      { to: '/employee/documents', label: 'Documents', icon: FileText },
      { to: '/employee/exams', label: 'Examinations', icon: ClipboardList },
      { to: '/employee/offers', label: 'Offer Letter', icon: Mail },
    ],
  },
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const config = portalConfig[user?.role] || portalConfig.RECRUITER;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`w-64 h-screen sticky top-0 bg-gradient-to-b ${config.color} text-white flex flex-col`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">RecruitPro</p>
            <p className="text-xs text-white/60">{config.label}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {config.nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={['/recruiter', '/training', '/management', '/admin', '/employee', '/agency'].includes(to)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? `${config.accent} text-white shadow-lg` : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-white/50 truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
