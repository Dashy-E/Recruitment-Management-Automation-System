import { useEffect, useState } from 'react';
import { trainingAPI, candidateAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';
import { Plus, Users, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const BatchForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ batchName: '', designation: '', startDate: '', endDate: '', maxCapacity: 20, trainer: '', location: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await trainingAPI.createBatch(form);
      toast.success('Training batch created');
      onSuccess();
    } catch { toast.error('Failed to create batch'); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-xs font-medium text-gray-600 mb-1 block">Batch Name *</label><input type="text" value={form.batchName} onChange={e => setForm(p => ({ ...p, batchName: e.target.value }))} className={inputCls} required /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Designation *</label><input type="text" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} className={inputCls} required /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Max Capacity</label><input type="number" min="1" value={form.maxCapacity} onChange={e => setForm(p => ({ ...p, maxCapacity: parseInt(e.target.value) }))} className={inputCls} /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Start Date *</label><input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inputCls} required /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">End Date *</label><input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls} required /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Trainer</label><input type="text" value={form.trainer} onChange={e => setForm(p => ({ ...p, trainer: e.target.value }))} className={inputCls} /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Location</label><input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className={inputCls} /></div>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">{loading ? 'Creating...' : 'Create Batch'}</button>
    </form>
  );
};

const EnrollModal = ({ batch, onSuccess }) => {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    candidateAPI.getAll({ status: 'SELECTED', limit: 100 }).then(r => setCandidates(r.data.data)).catch(() => {});
  }, []);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleEnroll = async () => {
    if (selected.length === 0) return toast.error('Select at least one candidate');
    try {
      await trainingAPI.enrollCandidates(batch.id, selected);
      toast.success(`${selected.length} candidate(s) enrolled`);
      onSuccess();
    } catch { toast.error('Failed to enroll'); }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Select candidates with "Selected" status to enroll in <strong>{batch.batchName}</strong></p>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {candidates.map(c => (
          <label key={c.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="rounded" />
            <div>
              <p className="text-sm font-medium text-gray-800">{c.firstName} {c.lastName}</p>
              <p className="text-xs text-gray-500">{c.designation} · {c.candidateId}</p>
            </div>
          </label>
        ))}
        {candidates.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No candidates with "Selected" status</p>}
      </div>
      <button onClick={handleEnroll} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Enroll {selected.length} Candidate(s)</button>
    </div>
  );
};

const TrainingCoordination = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [enrollBatch, setEnrollBatch] = useState(null);

  const fetchBatches = async () => {
    setLoading(true);
    try { const res = await trainingAPI.getBatches(); setBatches(res.data); }
    catch { toast.error('Failed to load batches'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBatches(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Training Coordination</h2>
          <p className="text-sm text-gray-500">{batches.length} training batches</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Plus size={16} /> Create Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : batches.length === 0 ? (
          <div className="col-span-3 bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">No training batches yet</div>
        ) : batches.map(b => (
          <div key={b.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{b.batchName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{b.batchCode}</p>
              </div>
              <StatusBadge status={b.status} />
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-1.5"><Users size={12} className="text-gray-400" />{b._count?.enrollments || 0} / {b.maxCapacity} enrolled</div>
              <div className="flex items-center gap-1.5"><Calendar size={12} className="text-gray-400" />{format(new Date(b.startDate), 'dd MMM')} – {format(new Date(b.endDate), 'dd MMM yyyy')}</div>
              {b.trainer && <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-gray-400" />Trainer: {b.trainer}</div>}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setEnrollBatch(b)} className="flex-1 text-xs bg-indigo-50 text-indigo-700 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors font-medium">Enroll Candidates</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Training Batch" size="lg">
        <BatchForm onSuccess={() => { setShowForm(false); fetchBatches(); }} />
      </Modal>
      <Modal open={!!enrollBatch} onClose={() => setEnrollBatch(null)} title="Enroll Candidates" size="md">
        {enrollBatch && <EnrollModal batch={enrollBatch} onSuccess={() => { setEnrollBatch(null); fetchBatches(); }} />}
      </Modal>
    </div>
  );
};

export default TrainingCoordination;
