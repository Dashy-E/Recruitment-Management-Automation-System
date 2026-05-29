import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

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
};

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={roleRedirects[user.role] || '/recruiter'} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please enter email and password');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome, ${data.user.firstName}!`);
      navigate(roleRedirects[data.user.role] || '/recruiter');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email) => {
    setLoading(true);
    try {
      const data = await login(email, 'Admin@123');
      toast.success(`Welcome, ${data.user.firstName}!`);
      // Let the if (user) guard at the top redirect — avoids ProtectedRoute
      // seeing null user before AuthContext re-render propagates
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">RecruitPro</h1>
          <p className="text-indigo-200 mt-1">Enterprise Recruitment Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn size={16} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick login */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-500 mb-3 font-medium">Quick Access (Demo)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Admin', email: 'admin@recruitment.com' },
                { label: 'HR/Recruiter', email: 'recruiter@recruitment.com' },
                { label: 'Training', email: 'training@recruitment.com' },
                { label: 'Management', email: 'manager@recruitment.com' },
                { label: 'MD', email: 'md@recruitment.com' },
                { label: 'Employee', email: 'employee@recruitment.com' },
              ].map(({ label, email }) => (
                <button
                  key={email}
                  onClick={() => quickLogin(email)}
                  className="text-xs bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors text-left"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">All demo accounts use password: Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
