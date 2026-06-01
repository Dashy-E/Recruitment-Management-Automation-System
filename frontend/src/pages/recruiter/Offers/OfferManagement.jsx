import { useEffect, useState } from 'react';
import { offerAPI, candidateAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';
import { Plus, Send, Check, X, Eye } from 'lucide-react';
import { format } from 'date-fns';

const OfferForm = ({ onSuccess }) => {
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    candidateId: '', designation: '', department: '', joiningDate: '',
    expiryDate: '', basicSalary: '', hra: '', grossSalary: '', netSalary: '', ctc: '',
  });

  useEffect(() => {
    // Fetch eligible candidates and existing offers, then exclude already-offered candidates
    Promise.all([
      candidateAPI.getAll({ status: 'EXAM_COMPLETED', limit: 200 }),
      candidateAPI.getAll({ status: 'FINAL_APPROVED', limit: 200 }),
      offerAPI.getAll(),
    ]).then(([ec, fa, ofr]) => {
      const existingOfferCandidateIds = new Set(
        (Array.isArray(ofr.data) ? ofr.data : []).map(o => o.candidateId)
      );
      const all = [...(ec.data.data || []), ...(fa.data.data || [])];
      // Deduplicate and remove candidates who already have an offer
      const seen = new Set();
      setCandidates(all.filter(c => {
        if (seen.has(c.id) || existingOfferCandidateIds.has(c.id)) return false;
        seen.add(c.id);
        return true;
      }));
    }).catch(() => {})
      .finally(() => setLoadingCandidates(false));
  }, []);

  const calcSalary = (field, val) => {
    const updated = { ...form, [field]: val };
    const basic = parseFloat(updated.basicSalary) || 0;
    const hra = parseFloat(updated.hra) || 0;
    const gross = basic + hra;
    const net = gross * 0.9;
    const ctc = gross * 12 * 1.15;
    return { ...updated, grossSalary: gross.toFixed(0), netSalary: net.toFixed(0), ctc: ctc.toFixed(0) };
  };

  const handleSalaryChange = (field, val) => setForm(calcSalary(field, val));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.candidateId) return toast.error('Select a candidate');
    if (!form.designation.trim()) return toast.error('Designation is required');
    if (!form.department.trim()) return toast.error('Department is required');
    const basic = parseFloat(form.basicSalary);
    if (!form.basicSalary || isNaN(basic) || basic <= 0) return toast.error('Enter a valid basic salary');
    setLoading(true);
    try {
      await offerAPI.create({ ...form, expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString() });
      toast.success('Offer letter created');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create offer');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Candidate *</label>
          {loadingCandidates ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Loading eligible candidates…
            </div>
          ) : (
            <select value={form.candidateId} onChange={e => setForm(p => ({ ...p, candidateId: e.target.value }))} className={inputCls} required>
              <option value="">Select Candidate</option>
              {candidates.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.candidateId}) — {c.status.replace(/_/g, ' ')}</option>)}
            </select>
          )}
          {!loadingCandidates && candidates.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No eligible candidates. Candidates must have "Exam Completed" or "Final Approved" status and must not already have an offer letter.
            </p>
          )}
        </div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Designation *</label><input type="text" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} className={inputCls} required /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Department *</label><input type="text" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className={inputCls} required /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Joining Date</label><input type="date" value={form.joiningDate} onChange={e => setForm(p => ({ ...p, joiningDate: e.target.value }))} className={inputCls} /></div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Salary Structure (Monthly ₹)</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Basic Salary *</label><input type="number" value={form.basicSalary} onChange={e => handleSalaryChange('basicSalary', e.target.value)} className={inputCls} required /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">HRA</label><input type="number" value={form.hra} onChange={e => handleSalaryChange('hra', e.target.value)} className={inputCls} /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Gross Salary</label><input type="number" value={form.grossSalary} readOnly className={`${inputCls} bg-gray-50`} /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Net Salary (after 10% deduction)</label><input type="number" value={form.netSalary} readOnly className={`${inputCls} bg-gray-50`} /></div>
          <div className="col-span-2 bg-indigo-50 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-800">Annual CTC</span>
            <span className="text-xl font-bold text-indigo-700">₹{parseInt(form.ctc || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
        {loading ? 'Creating...' : 'Create Offer Letter'}
      </button>
    </form>
  );
};

const OfferDetail = ({ offer }) => {
  if (!offer) return null;
  const allowances = typeof offer.allowances === 'string' ? JSON.parse(offer.allowances) : [];
  const deductions = typeof offer.deductions === 'string' ? JSON.parse(offer.deductions) : [];

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-1">{offer.candidate?.firstName} {offer.candidate?.lastName}</h3>
        <p className="text-sm text-gray-600">{offer.designation} · {offer.department}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Basic Salary</span><span>₹{offer.basicSalary?.toLocaleString()}/mo</span></div>
        <div className="flex justify-between border-b pb-2"><span className="text-gray-500">HRA</span><span>₹{(offer.hra || 0)?.toLocaleString()}/mo</span></div>
        <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Gross Salary</span><span className="font-medium">₹{offer.grossSalary?.toLocaleString()}/mo</span></div>
        <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Net Salary</span><span className="font-medium">₹{offer.netSalary?.toLocaleString()}/mo</span></div>
        <div className="col-span-2 bg-indigo-50 rounded-lg px-4 py-3 flex justify-between">
          <span className="font-semibold text-indigo-800">Annual CTC</span>
          <span className="text-xl font-bold text-indigo-700">₹{offer.ctc?.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <div><span className="text-gray-500">Expiry: </span><span>{format(new Date(offer.expiryDate), 'dd MMM yyyy')}</span></div>
        <StatusBadge status={offer.status} />
      </div>
    </div>
  );
};

const OfferManagement = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewOffer, setViewOffer] = useState(null);

  const fetchOffers = async () => {
    setLoading(true);
    try { const res = await offerAPI.getAll(); setOffers(res.data); }
    catch { toast.error('Failed to load offers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOffers(); }, []);

  const handleApprove = async (id) => {
    try { await offerAPI.approve(id); toast.success('Offer approved'); fetchOffers(); }
    catch { toast.error('Failed to approve'); }
  };

  const handleSend = async (id) => {
    try { await offerAPI.send(id); toast.success('Offer marked as sent'); fetchOffers(); }
    catch { toast.error('Failed to send'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Offer Letters</h2>
          <p className="text-sm text-gray-500">{offers.length} offer letters</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Plus size={16} /> Create Offer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-5 py-3 text-left">Offer #</th>
              <th className="px-5 py-3 text-left">Candidate</th>
              <th className="px-5 py-3 text-left">Designation</th>
              <th className="px-5 py-3 text-left">CTC</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Expiry</th>
              <th className="px-5 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
            ) : offers.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No offers yet</td></tr>
            ) : offers.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 text-sm font-medium text-indigo-600">{o.offerNumber}</td>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium text-gray-800">{o.candidate?.firstName} {o.candidate?.lastName}</p>
                  <p className="text-xs text-gray-400">{o.candidate?.email}</p>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{o.designation}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-green-700">₹{o.ctc?.toLocaleString()}</td>
                <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{format(new Date(o.expiryDate), 'dd MMM yyyy')}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewOffer(o)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="View"><Eye size={14} /></button>
                    {o.status === 'DRAFT' && <button onClick={() => handleApprove(o.id)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Approve"><Check size={14} /></button>}
                    {o.status === 'APPROVED' && <button onClick={() => handleSend(o.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Mark Sent"><Send size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Offer Letter" size="lg">
        <OfferForm onSuccess={() => { setShowForm(false); fetchOffers(); }} />
      </Modal>
      <Modal open={!!viewOffer} onClose={() => setViewOffer(null)} title="Offer Letter Details" size="md">
        <OfferDetail offer={viewOffer} />
      </Modal>
    </div>
  );
};

export default OfferManagement;
