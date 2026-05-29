import { useEffect, useState } from 'react';
import { reportAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { BookOpen, Users, CheckCircle, Clock, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  UPCOMING:  'bg-blue-50 text-blue-700',
  ONGOING:   'bg-green-50 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-50 text-red-600',
};

const KPI = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

const TrainingReports = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.training()
      .then(r => setBatches(r.data))
      .catch(() => toast.error('Failed to load training report'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const total      = batches.length;
  const ongoing    = batches.filter(b => b.status === 'ONGOING').length;
  const completed  = batches.filter(b => b.status === 'COMPLETED').length;
  const totalEnrolled = batches.reduce((s, b) => s + b._count.enrollments, 0);

  const completionRate = (batch) => {
    const n = batch.enrollments.length;
    if (!n) return 0;
    const done = batch.enrollments.filter(e => e.status === 'COMPLETED').length;
    return Math.round((done / n) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Training Reports</h2>
        <p className="text-sm text-gray-500">Summary across all training batches</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={BookOpen} label="Total Batches"    value={total}        color="text-emerald-600 bg-emerald-50" />
        <KPI icon={Clock}     label="Ongoing"          value={ongoing}      color="text-blue-600 bg-blue-50" />
        <KPI icon={CheckCircle} label="Completed"      value={completed}    color="text-gray-500 bg-gray-100" />
        <KPI icon={Users}     label="Total Enrolled"  value={totalEnrolled} color="text-indigo-600 bg-indigo-50" />
      </div>

      {/* Per-batch breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <BarChart2 size={18} className="text-emerald-600" />
          <h3 className="font-semibold text-gray-800">Batch Summary</h3>
        </div>
        {batches.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No training batches found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 text-left">Batch</th>
                  <th className="px-5 py-3 text-left">Designation</th>
                  <th className="px-5 py-3 text-left">Duration</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Enrolled</th>
                  <th className="px-5 py-3 text-right">Attendance Marks</th>
                  <th className="px-5 py-3 text-left w-40">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {batches.map(batch => {
                  const rate = completionRate(batch);
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{batch.batchName}</p>
                        <p className="text-xs text-gray-400">{batch.batchCode}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{batch.designation}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                        {format(new Date(batch.startDate), 'dd MMM yy')} – {format(new Date(batch.endDate), 'dd MMM yy')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[batch.status] || 'bg-gray-100 text-gray-600'}`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-700">
                        {batch._count.enrollments} / {batch.maxCapacity}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-500">
                        {batch._count.attendance}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enrollment status breakdown */}
      {batches.some(b => b.enrollments.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Enrollment Status Across All Batches</h3>
          {(() => {
            const all = batches.flatMap(b => b.enrollments);
            const counts = all.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {});
            const statusColors = { ENROLLED: 'bg-blue-500', COMPLETED: 'bg-emerald-500', DROPPED: 'bg-red-400' };
            return (
              <div className="space-y-2.5">
                {Object.entries(counts).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-28">{status}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${statusColors[status] || 'bg-gray-400'}`}
                        style={{ width: `${(count / all.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default TrainingReports;
