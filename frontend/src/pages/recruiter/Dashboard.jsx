import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Calendar, GraduationCap, ClipboardList, Mail, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportAPI } from '../../services/api';
import KPICard from '../../components/common/KPICard';
import StatusBadge from '../../components/common/StatusBadge';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const RecruiterDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.dashboard()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { stats = {}, candidatesByStatus = [], recentCandidates = [], monthlyHiring = [] } = data || {};

  const pieData = candidatesByStatus.slice(0, 8).map(g => ({ name: g.status.replace('_', ' '), value: g.count }));
  const barData = (monthlyHiring || []).map(m => ({ month: m.month, candidates: parseInt(m.count) }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Total Candidates" value={stats.totalCandidates} icon={Users} color="indigo" />
        <KPICard title="Active MRFs" value={stats.activeMRFs} icon={FileText} color="blue" />
        <KPICard title="Interviews Today" value={stats.scheduledInterviews} icon={Calendar} color="orange" />
        <KPICard title="In Training" value={stats.trainingInProgress} icon={GraduationCap} color="purple" />
        <KPICard title="Exam Pending" value={stats.examPending} icon={ClipboardList} color="yellow" />
        <KPICard title="Offers Sent" value={stats.offersSent} icon={Mail} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Hiring Trend */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-800">Monthly Candidate Pipeline</h3>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="candidates" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data available</div>
          )}
        </div>

        {/* Candidate Status Breakdown */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-800">Candidate Status Breakdown</h3>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="99%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 truncate">{entry.name} <span className="text-gray-400">({entry.value})</span></span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data available</div>
          )}
        </div>
      </div>

      {/* Recent Candidates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-800">Recent Candidates</h3>
          </div>
          <Link to="/recruiter/candidates" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Candidate</th>
                <th className="px-5 py-3 text-left">Designation</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Source</th>
                <th className="px-5 py-3 text-left">Added On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentCandidates.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link to={`/recruiter/candidates/${c.id}`} className="font-medium text-gray-800 hover:text-indigo-600 text-sm">
                      {c.firstName} {c.lastName}
                    </Link>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{c.designation}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{c.source || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {format(new Date(c.createdAt), 'dd MMM yyyy')}
                  </td>
                </tr>
              ))}
              {recentCandidates.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No candidates yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Create MRF', to: '/recruiter/mrf', icon: FileText, color: 'indigo' },
          { label: 'Add Candidate', to: '/recruiter/candidates', icon: Users, color: 'blue' },
          { label: 'Schedule Interview', to: '/recruiter/interviews', icon: Calendar, color: 'orange' },
          { label: 'View Reports', to: '/recruiter/reports', icon: TrendingUp, color: 'green' },
        ].map(({ label, to, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center group-hover:bg-${color}-200 transition-colors`}>
              <Icon size={18} className={`text-${color}-600`} />
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
