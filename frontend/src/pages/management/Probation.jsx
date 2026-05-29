import { useEffect, useState } from 'react';
import { probationAPI, candidateAPI, chemistryTestAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Award, CheckCircle, XCircle, Clock, Search, Plus, ChevronRight, FlaskConical, ChevronDown } from 'lucide-react';
import { format, differenceInDays, isValid } from 'date-fns';

const STATUS_COLORS = {
  ONGOING:  'bg-blue-50 text-blue-700',
  PASSED:   'bg-green-50 text-green-700',
  EXTENDED: 'bg-yellow-50 text-yellow-700',
  FAILED:   'bg-red-50 text-red-600',
};

const CHEM_STATUS_COLORS = {
  PENDING:   'bg-gray-100 text-gray-600',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-indigo-100 text-indigo-700',
  PASSED:    'bg-green-100 text-green-700',
  FAILED:    'bg-red-100 text-red-600',
};

const safeFormat = (val, fmt) => {
  if (!val) return '—';
  const d = new Date(val);
  return isValid(d) ? format(d, fmt) : '—';
};

const daysLeft = (record) => {
  const end = record.extendedEndDate || record.endDate;
  return differenceInDays(new Date(end), new Date());
};

const ApprovalDot = ({ value, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-200'}`} />
    <span className="text-xs text-gray-500">{label}</span>
  </div>
);

const ChemistryTestSection = ({ candidateId, candidateName }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ testDate: '', remarks: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await chemistryTestAPI.getAll({ candidateId });
      setTests(res.data.tests || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTests(); }, [candidateId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await chemistryTestAPI.create({ candidateId, ...form });
      toast.success('Chemistry test assigned');
      setShowForm(false);
      setForm({ testDate: '', remarks: '', notes: '' });
      fetchTests();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (testId, status) => {
    try {
      await chemistryTestAPI.update(testId, { status });
      toast.success('Status updated');
      fetchTests();
    } catch { toast.error('Failed to update status'); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
          <FlaskConical size={13} /> Chemistry Tests
        </p>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2.5 py-1.5 rounded-lg hover:bg-orange-100">
          <Plus size={12} /> Assign Test
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Test Date</label>
              <input type="date" className={inputCls} value={form.testDate} onChange={e => setForm(p => ({ ...p, testDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Remarks</label>
              <input type="text" className={inputCls} value={form.remarks} placeholder="e.g. Lab test at site" onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
            <textarea rows={2} className={inputCls} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Assign'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : tests.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No chemistry tests assigned yet</p>
      ) : (
        <div className="space-y-2">
          {tests.map(t => (
            <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CHEM_STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>{t.status}</span>
                {t.testDate && <span className="text-xs text-gray-500 ml-2">{safeFormat(t.testDate, 'dd MMM yyyy')}</span>}
                {t.remarks && <span className="text-xs text-gray-400 ml-2">— {t.remarks}</span>}
              </div>
              <select
                value={t.status}
                onChange={e => handleStatusUpdate(t.id, e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400">
                {['PENDING', 'SCHEDULED', 'COMPLETED', 'PASSED', 'FAILED'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Probation = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showExtend, setShowExtend] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [acting, setActing] = useState(false);

  const [createForm, setCreateForm] = useState({ candidateId: '', startDate: '', endDate: '', reviewDate: '', remarks: '' });
  const [extendForm, setExtendForm] = useState({ extendedEndDate: '', extensionReason: '' });

  const fetchRecords = async (s = search, st = statusFilter) => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (s) params.search = s;
      if (st) params.status = st;
      const res = await probationAPI.getAll(params);
      setRecords(res.data.records);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load probation records'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRecords();
    candidateAPI.getAll({ limit: 200 }).then(r => setCandidates(r.data.data || [])).catch(() => {});
  }, []);

  const handleApprove = async (id) => {
    setActing(true);
    try {
      await probationAPI.approve(id);
      toast.success('Approved');
      fetchRecords();
      if (selected?.id === id) setSelected(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(false); }
  };

  const handleFail = async (id) => {
    if (!confirm('Mark this probation as FAILED? This will reject the candidate.')) return;
    setActing(true);
    try {
      await probationAPI.fail(id, { remarks: 'Failed probation review' });
      toast.success('Marked as failed');
      fetchRecords();
      setSelected(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(false); }
  };

  const handleExtend = async (e) => {
    e.preventDefault();
    setActing(true);
    try {
      await probationAPI.extend(showExtend.id, extendForm);
      toast.success('Probation extended');
      setShowExtend(null);
      setExtendForm({ extendedEndDate: '', extensionReason: '' });
      fetchRecords();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.candidateId || !createForm.startDate || !createForm.endDate) {
      return toast.error('Candidate, start date and end date are required');
    }
    setActing(true);
    try {
      await probationAPI.create(createForm);
      toast.success('Probation record created');
      setShowCreate(false);
      setCreateForm({ candidateId: '', startDate: '', endDate: '', reviewDate: '', remarks: '' });
      fetchRecords();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(false); }
  };

  const canApprove = ['BRANCH_MANAGER', 'COUNTRY_MANAGER', 'MD', 'ADMIN'].includes(user?.role);
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Probation Management</h2>
          <p className="text-sm text-gray-500">{total} record{total !== 1 ? 's' : ''}</p>
        </div>
        {['ADMIN', 'HR', 'BRANCH_MANAGER'].includes(user?.role) && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium">
            <Plus size={15} /> New Record
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Search candidate…" value={search}
            onChange={e => { setSearch(e.target.value); fetchRecords(e.target.value, statusFilter); }} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); fetchRecords(search, e.target.value); }}>
          <option value="">All Statuses</option>
          {['ONGOING', 'PASSED', 'EXTENDED', 'FAILED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="px-5 py-3 text-left">Candidate</th>
              <th className="px-5 py-3 text-left">Period</th>
              <th className="px-5 py-3 text-left">Days Left</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Approvals</th>
              <th className="px-5 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                  <td key={j} className="px-5 py-3.5"><div className="h-3 bg-gray-100 rounded animate-pulse w-24" /></td>
                ))}</tr>
              ))
            ) : records.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                <Award size={32} className="mx-auto mb-2 text-gray-200" />
                No probation records found
              </td></tr>
            ) : records.map(rec => {
              const dl = daysLeft(rec);
              const endDate = rec.extendedEndDate || rec.endDate;
              return (
                <tr key={rec.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800">{rec.candidate.firstName} {rec.candidate.lastName}</p>
                    <p className="text-xs text-gray-400">{rec.candidate.candidateId} · {rec.candidate.designation}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {safeFormat(rec.startDate, 'dd MMM yy')} → {safeFormat(endDate, 'dd MMM yy')}
                    {rec.extendedEndDate && <span className="ml-1 text-yellow-600">(extended)</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {rec.status === 'ONGOING' || rec.status === 'EXTENDED' ? (
                      <span className={`text-xs font-medium ${dl < 0 ? 'text-red-600' : dl <= 14 ? 'text-orange-500' : 'text-gray-600'}`}>
                        {dl < 0 ? `${Math.abs(dl)}d overdue` : `${dl}d`}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[rec.status] || 'bg-gray-100 text-gray-600'}`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="space-y-1">
                      <ApprovalDot value={rec.branchManagerApproval} label="Branch Mgr" />
                      <ApprovalDot value={rec.countryManagerApproval} label="Country Mgr" />
                      <ApprovalDot value={rec.mdApproval} label="MD" />
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {canApprove && rec.status === 'ONGOING' && (
                        <button onClick={() => handleApprove(rec.id)} disabled={acting}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
                          <CheckCircle size={12} /> Approve
                        </button>
                      )}
                      {['ADMIN', 'BRANCH_MANAGER', 'HR'].includes(user?.role) && rec.status === 'ONGOING' && (
                        <button onClick={() => { setShowExtend(rec); setExtendForm({ extendedEndDate: '', extensionReason: '' }); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-50 text-yellow-700 text-xs rounded-lg hover:bg-yellow-100">
                          <Clock size={12} /> Extend
                        </button>
                      )}
                      {['ADMIN', 'BRANCH_MANAGER', 'MD'].includes(user?.role) && rec.status === 'ONGOING' && (
                        <button onClick={() => handleFail(rec.id)} disabled={acting}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 disabled:opacity-50">
                          <XCircle size={12} /> Fail
                        </button>
                      )}
                      <button onClick={() => setSelected(selected?.id === rec.id ? null : rec)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expandable detail panel with chemistry test section */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">Probation Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Candidate</span><span className="font-medium">{selected.candidate?.firstName} {selected.candidate?.lastName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Start</span><span>{safeFormat(selected.startDate, 'dd MMM yyyy')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">End</span><span>{safeFormat(selected.extendedEndDate || selected.endDate, 'dd MMM yyyy')}</span></div>
              {selected.reviewDate && <div className="flex justify-between"><span className="text-gray-500">Review Date</span><span>{safeFormat(selected.reviewDate, 'dd MMM yyyy')}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              </div>
              {selected.remarks && <div><span className="text-gray-500">Remarks</span><p className="mt-1 text-gray-700 bg-gray-50 rounded-lg p-3">{selected.remarks}</p></div>}
              {selected.extensionReason && <div><span className="text-gray-500">Extension Reason</span><p className="mt-1 text-gray-700 bg-yellow-50 rounded-lg p-3">{selected.extensionReason}</p></div>}
              <div className="pt-2 border-t space-y-1.5">
                <p className="text-xs font-medium text-gray-500 mb-2">Approval Chain</p>
                <ApprovalDot value={selected.branchManagerApproval} label={selected.branchManagerApproval || 'Branch Manager — pending'} />
                <ApprovalDot value={selected.countryManagerApproval} label={selected.countryManagerApproval || 'Country Manager — pending'} />
                <ApprovalDot value={selected.mdApproval} label={selected.mdApproval || 'MD — pending'} />
              </div>

              {/* Chemistry Test Section */}
              <ChemistryTestSection
                candidateId={selected.candidate?.id}
                candidateName={`${selected.candidate?.firstName} ${selected.candidate?.lastName}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-5 py-4 border-b"><h3 className="font-semibold text-gray-900">New Probation Record</h3></div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Candidate *</label>
                <select required className={inputCls} value={createForm.candidateId} onChange={e => setCreateForm(p => ({ ...p, candidateId: e.target.value }))}>
                  <option value="">Select candidate</option>
                  {candidates.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.candidateId}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Start Date *</label>
                  <input required type="date" className={inputCls} value={createForm.startDate} onChange={e => setCreateForm(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">End Date *</label>
                  <input required type="date" className={inputCls} value={createForm.endDate} onChange={e => setCreateForm(p => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Review Date</label>
                <input type="date" className={inputCls} value={createForm.reviewDate} onChange={e => setCreateForm(p => ({ ...p, reviewDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Remarks</label>
                <textarea rows={2} className={inputCls} value={createForm.remarks} onChange={e => setCreateForm(p => ({ ...p, remarks: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={acting} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {acting ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend modal */}
      {showExtend && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Extend Probation — {showExtend.candidate?.firstName} {showExtend.candidate?.lastName}</h3>
            </div>
            <form onSubmit={handleExtend} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">New End Date *</label>
                <input required type="date" className={inputCls} value={extendForm.extendedEndDate} onChange={e => setExtendForm(p => ({ ...p, extendedEndDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Reason *</label>
                <textarea required rows={3} className={inputCls} value={extendForm.extensionReason} onChange={e => setExtendForm(p => ({ ...p, extensionReason: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowExtend(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={acting} className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50">
                  {acting ? 'Extending…' : 'Extend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Probation;
