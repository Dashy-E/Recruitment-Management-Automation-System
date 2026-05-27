import { useEffect, useState } from 'react';
import { trainingAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { Users, CheckCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const TrainingBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetail, setBatchDetail] = useState(null);

  const fetchBatches = async () => {
    setLoading(true);
    try { const res = await trainingAPI.getBatches(); setBatches(res.data); }
    catch { toast.error('Failed to load batches'); }
    finally { setLoading(false); }
  };

  const viewBatch = async (b) => {
    setSelectedBatch(b);
    try { const res = await trainingAPI.getBatchById(b.id); setBatchDetail(res.data); }
    catch { toast.error('Failed to load batch details'); }
  };

  const markComplete = async (enrollmentId) => {
    try {
      await trainingAPI.updateEnrollment(enrollmentId, { status: 'COMPLETED' });
      toast.success('Marked as completed');
      viewBatch(selectedBatch);
    } catch { toast.error('Failed to update'); }
  };

  useEffect(() => { fetchBatches(); }, []);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-800">Training Batches</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : batches.map(b => (
          <div key={b.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewBatch(b)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{b.batchName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{b.batchCode}</p>
              </div>
              <StatusBadge status={b.status} />
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-1.5"><Users size={12} className="text-gray-400" />{b._count?.enrollments || 0} / {b.maxCapacity} enrolled</div>
              <div className="flex items-center gap-1.5"><Calendar size={12} className="text-gray-400" />{format(new Date(b.startDate), 'dd MMM')} – {format(new Date(b.endDate), 'dd MMM yyyy')}</div>
            </div>
          </div>
        ))}
        {!loading && batches.length === 0 && <div className="col-span-3 bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">No batches</div>}
      </div>

      <Modal open={!!selectedBatch} onClose={() => { setSelectedBatch(null); setBatchDetail(null); }} title={selectedBatch?.batchName || 'Batch Details'} size="xl">
        {batchDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Designation</p><p className="font-medium">{batchDetail.designation}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Trainer</p><p className="font-medium">{batchDetail.trainer || '—'}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Location</p><p className="font-medium">{batchDetail.location || '—'}</p></div>
            </div>
            <h4 className="font-medium text-gray-700 text-sm">Enrolled Candidates ({batchDetail.enrollments?.length || 0})</h4>
            <table className="w-full border border-gray-100 rounded-xl overflow-hidden">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-2.5 text-left">Candidate</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Enrolled</th>
                <th className="px-4 py-2.5 text-left">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {batchDetail.enrollments?.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{e.candidate?.firstName} {e.candidate?.lastName}</p>
                      <p className="text-xs text-gray-400">{e.candidate?.designation}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(e.enrolledAt), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3">
                      {e.status !== 'COMPLETED' && (
                        <button onClick={() => markComplete(e.id)} className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100">
                          <CheckCircle size={12} /> Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="flex items-center justify-center h-20"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>}
      </Modal>
    </div>
  );
};

export default TrainingBatches;
