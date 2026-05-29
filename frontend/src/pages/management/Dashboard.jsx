import { useEffect, useState } from 'react';
import { reportAPI } from '../../services/api';
import KPICard from '../../components/common/KPICard';
import { Users, FileText, TrendingUp, Award, BarChart3, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const ManagementDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.dashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>;

  const { stats = {}, candidatesByStatus = [], monthlyHiring = [] } = data || {};
  const pieData = candidatesByStatus.slice(0, 8).map(g => ({ name: g.status.replace(/_/g, ' '), value: g.count }));
  const barData = (monthlyHiring || []).map(m => ({ month: m.month, candidates: parseInt(m.count) }));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">Management Dashboard</h2>
        <p className="text-orange-100">Recruitment analytics and insights</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Total Candidates" value={stats.totalCandidates} icon={Users} color="orange" />
        <KPICard title="Active MRFs" value={stats.activeMRFs} icon={FileText} color="blue" />
        <KPICard title="In Training" value={stats.trainingInProgress} icon={TrendingUp} color="purple" />
        <KPICard title="Exam Pending" value={stats.examPending} icon={Clock} color="yellow" />
        <KPICard title="Offers Sent" value={stats.offersSent} icon={Award} color="green" />
        <KPICard title="Interviews" value={stats.scheduledInterviews} icon={BarChart3} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Hiring Trend</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="candidates" fill="#f97316" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data available</div>}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Candidate Pipeline</h3>
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
          ) : <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data</div>}
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
