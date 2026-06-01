import { useEffect, useState } from 'react';
import { trainingAPI, candidateAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { Users, CheckCircle, Calendar, UserPlus, Plus, X } from 'lucide-react';
import { format } from 'date-fns';

const CreateBatchForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ batchName: '', designation: '', startDate: '', endDate: '', maxCapacity: 20, trainer: '', location: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.batchName.trim()) e.batchName = 'Batch name is required.';
    if (!form.designation.trim()) e.designation = 'Designation is required.';
    if (!form.startDate) e.startDate = 'Start date is required.';
    if (!form.endDate) e.endDate = 'End date is required.';
    else if (form.startDate && new Date(form.endDate) <= new Date(form.startDate)) e.endDate = 'End date must be after start date.';
    const cap = parseInt(form.maxCapacity, 10);
    if (isNaN(cap) || cap < 1) e.maxCapacity = 'Must be at least 1.';
    if (cap > 500) e.maxCapacity = 'Cannot exceed 500.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error('Fix the errors before saving.'); return; }
    setLoading(true);
    try {
      await trainingAPI.createBatch({ ...form, maxCapacity: parseInt(form.maxCapacity, 10), startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() });
      toast.success('Batch created');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create batch');
    } finally { setLoading(false); }
  };

  const cls = (f) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors[f] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Batch Name *</label>
          <input type="text" value={form.batchName} onChange={e => setForm(p => ({ ...p, batchName: e.target.value }))} className={cls('batchName')} placeholder="e.g. Sales Induction Batch 2" maxLength={100} />
          {errors.batchName && <p className="text-xs text-red-500 mt-1">{errors.batchName}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Designation *</label>
          <input type="text" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} className={cls('designation')} placeholder="e.g. Sales Executive" maxLength={100} />
          {errors.designation && <p className="text-xs text-red-500 mt-1">{errors.designation}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Max Capacity *</label>
          <input type="text" inputMode="numeric" value={form.maxCapacity} onChange={e => setForm(p => ({ ...p, maxCapacity: e.target.value.replace(/[^0-9]/g, '') }))} className={cls('maxCapacity')} maxLength={3} />
          {errors.maxCapacity && <p className="text-xs text-red-500 mt-1">{errors.maxCapacity}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Start Date *</label>
          <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={cls('startDate')} />
          {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">End Date *</label>
          <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={cls('endDate')} />
          {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Trainer</label>
          <input type="text" value={form.trainer} onChange={e => setForm(p => ({ ...p, trainer: e.target.value }))} className={cls('')} placeholder="Trainer name" maxLength={80} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Location</label>
          <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className={cls('')} placeholder="e.g. Mumbai Training Center" maxLength={100} />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={cls('')} rows={3} placeholder="Batch description..." maxLength={1000} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">
        {loading ? 'Creating…' : 'Create Batch'}
      </button>
    </form>
  );
};

const EnrollModal = ({ batch, onSuccess, onClose }) => {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const enrolledIds = new Set(batch.enrollments?.map(e => e.candidateId) || []);

  useEffect(() => {
    // Fetch SELECTED candidates (passed interviews, ready for training)
    candidateAPI.getAll({ status: 'SELECTED', limit: 100 })
      .then(r => {
        const all = r.data.data || [];
        setCandidates(all.filter(c => !enrolledIds.has(c.id)));
      })
      .catch(() => toast.error('Failed to load candidates'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleEnroll = async () => {
    if (!selected.length) { toast.error('Select at least one candidate'); return; }
    setEnrolling(true);
    try {
      await trainingAPI.enrollCandidates(batch.id, selected);
      toast.success(`${selected.length} candidate(s) enrolled`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll candidates');
    } finally { setEnrolling(false); }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Showing candidates with status <strong>Selected</strong> who are not yet in this batch.</p>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No eligible candidates available.<br />
          <span className="text-xs">Candidates must have status "Selected" (completed interviews) to be enrolled.</span>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {candidates.map(c => (
            <label key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
              <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{c.firstName} {c.lastName}</p>
                <p className="text-xs text-gray-400">{c.designation} · {c.email}</p>
              </div>
            </label>
          ))}
        </div>
      )}
      {candidates.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">{selected.length} of {candidates.length} selected</span>
          <button
            onClick={handleEnroll}
            disabled={enrolling || !selected.length}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            <UserPlus size={14} /> {enrolling ? 'Enrolling…' : 'Enroll Selected'}
          </button>
        </div>
      )}
    </div>
  );
};

const TrainingBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetail, setBatchDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);

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

  const refreshDetail = async () => {
    if (!selectedBatch) return;
    try { const res = await trainingAPI.getBatchById(selectedBatch.id); setBatchDetail(res.data); fetchBatches(); }
    catch { /* silent */ }
  };

  const markComplete = async (enrollmentId) => {
    try {
      await trainingAPI.updateEnrollment(enrollmentId, { status: 'COMPLETED' });
      toast.success('Marked complete — candidate moved to Exam Pending');
      refreshDetail();
    } catch { toast.error('Failed to update'); }
  };

  useEffect(() => { fetchBatches(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Training Batches</h2>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
          <Plus size={15} /> New Batch
        </button>
      </div>

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
        {!loading && batches.length === 0 && <div className="col-span-3 bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">No batches — create one to get started</div>}
      </div>

      {/* Batch Detail Modal */}
      <Modal open={!!selectedBatch} onClose={() => { setSelectedBatch(null); setBatchDetail(null); }} title={selectedBatch?.batchName || 'Batch Details'} size="xl">
        {batchDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Designation</p><p className="font-medium">{batchDetail.designation}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Trainer</p><p className="font-medium">{batchDetail.trainer || '—'}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Location</p><p className="font-medium">{batchDetail.location || '—'}</p></div>
            </div>

            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-700 text-sm">Enrolled Candidates ({batchDetail.enrollments?.length || 0})</h4>
              <button
                onClick={() => setShowEnroll(true)}
                className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-medium"
              >
                <UserPlus size={13} /> Enroll Candidates
              </button>
            </div>

            <table className="w-full border border-gray-100 rounded-xl overflow-hidden">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-2.5 text-left">Candidate</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Enrolled</th>
                <th className="px-4 py-2.5 text-left">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {batchDetail.enrollments?.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No candidates enrolled — click "Enroll Candidates" above</td></tr>
                )}
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

      {/* Enroll Candidates Modal */}
      <Modal
        open={showEnroll && !!batchDetail}
        onClose={() => setShowEnroll(false)}
        title={`Enroll Candidates — ${batchDetail?.batchName}`}
        size="lg"
      >
        {batchDetail && (
          <EnrollModal
            batch={batchDetail}
            onSuccess={() => { setShowEnroll(false); refreshDetail(); }}
            onClose={() => setShowEnroll(false)}
          />
        )}
      </Modal>

      {/* Create Batch Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Training Batch" size="lg">
        <CreateBatchForm onSuccess={() => { setShowCreate(false); fetchBatches(); }} />
      </Modal>
    </div>
  );
};

export default TrainingBatches;
