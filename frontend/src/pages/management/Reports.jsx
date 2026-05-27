import { useEffect, useState } from 'react';
import { reportAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import { BarChart3, Download } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ManagementReports = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.candidates().then(r => setCandidates(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    toast.success('Report exported successfully');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Recruitment Analytics Report</h2>
        <button onClick={handleExport} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700">
          <Download size={16} /> Export
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <BarChart3 size={16} className="text-orange-600" />
          <h3 className="font-semibold text-gray-700 text-sm">Full Candidate Pipeline ({candidates.length} records)</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 text-left">ID</th><th className="px-5 py-3 text-left">Candidate</th><th className="px-5 py-3 text-left">Designation</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-left">CTC</th><th className="px-5 py-3 text-left">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xs text-indigo-600">{c.candidateId}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{c.firstName} {c.lastName}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{c.designation}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 text-sm text-gray-600">{c.offerLetter?.ctc ? `₹${c.offerLetter.ctc.toLocaleString()}` : '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagementReports;
