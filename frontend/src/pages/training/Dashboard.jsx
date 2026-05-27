import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trainingAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import { BookOpen, Users, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import KPICard from '../../components/common/KPICard';

const TrainingDashboard = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trainingAPI.getBatches().then(r => setBatches(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: batches.length,
    ongoing: batches.filter(b => b.status === 'ONGOING').length,
    upcoming: batches.filter(b => b.status === 'UPCOMING').length,
    completed: batches.filter(b => b.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Batches" value={stats.total} icon={BookOpen} color="emerald" />
        <KPICard title="Ongoing" value={stats.ongoing} icon={Calendar} color="green" />
        <KPICard title="Upcoming" value={stats.upcoming} icon={Users} color="blue" />
        <KPICard title="Completed" value={stats.completed} icon={CheckCircle} color="indigo" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Training Batches</h3>
          <Link to="/training/batches" className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">View All →</Link>
        </div>
        {loading ? <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div> : (
          <div className="divide-y divide-gray-100">
            {batches.slice(0, 5).map(b => (
              <div key={b.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.batchName}</p>
                  <p className="text-xs text-gray-500">{b.batchCode} · {b._count?.enrollments || 0} enrolled · {b.designation}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{format(new Date(b.startDate), 'dd MMM')} – {format(new Date(b.endDate), 'dd MMM')}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
            {batches.length === 0 && <div className="px-5 py-10 text-center text-gray-400 text-sm">No batches yet</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingDashboard;
