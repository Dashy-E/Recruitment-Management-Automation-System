import { useState, useEffect } from 'react';
import { casualWorkerAPI } from '../../../services/api';
import { HardHat, Plus, Search, CheckCircle, XCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = { ACTIVE: 'bg-green-100 text-green-700', INACTIVE: 'bg-gray-100 text-gray-600', TERMINATED: 'bg-red-100 text-red-700' };

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', designation: '',
  aadhaarNumber: '', panNumber: '', address: '', city: '', state: '', country: 'India',
  workerType: 'CASUAL', contractStart: '', contractEnd: '',
  dailyRate: '', monthlyRate: '', bankAccount: '', ifscCode: '',
  department: '', siteLocation: '',
};

export default function CasualWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const res = await casualWorkerAPI.getAll();
      setWorkers(res.data.workers || []);
    } catch { toast.error('Failed to load workers'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkers(); }, []);

  const filtered = workers.filter(w =>
    `${w.firstName} ${w.lastName} ${w.email} ${w.designation}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await casualWorkerAPI.create(form);
      toast.success('Worker onboarded successfully');
      setShowForm(false);
      setForm(emptyForm);
      fetchWorkers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to onboard worker');
    } finally { setSubmitting(false); }
  };

  const handleVerify = async (id, field) => {
    try {
      await casualWorkerAPI.verify(id, { [field]: true });
      toast.success('Verified');
      fetchWorkers();
    } catch { toast.error('Verification failed'); }
  };

  const F = ({ label, name, type = 'text', placeholder, half }) => (
    <div className={half ? '' : 'col-span-2'}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} placeholder={placeholder} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })} />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardHat className="h-7 w-7 text-orange-500" /> Casual & Contractual Workers
          </h1>
          <p className="text-sm text-gray-500 mt-1">Fast-track onboarding for casual, contractual, and daily-wage workers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium">
          <Plus className="h-4 w-4" /> Onboard Worker
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full" placeholder="Search workers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{['Worker', 'Type', 'Designation', 'Site', 'Contract', 'Aadhaar', 'PAN', 'Status'].map(h =>
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
            )}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No workers found</td></tr>
            ) : filtered.map(w => {
              const cw = w.casualWorker;
              return (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{w.firstName} {w.lastName}</p>
                    <p className="text-xs text-gray-500">{w.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium">{cw?.workerType || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{w.designation}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{cw?.siteLocation || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {cw?.contractStart ? format(new Date(cw.contractStart), 'dd MMM yy') : '—'}
                    {cw?.contractEnd ? ` → ${format(new Date(cw.contractEnd), 'dd MMM yy')}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    {cw?.aadhaarVerified
                      ? <CheckCircle className="h-4 w-4 text-green-500" />
                      : <button onClick={() => handleVerify(w.id, 'aadhaarVerified')} title="Click to verify">
                          <XCircle className="h-4 w-4 text-gray-300 hover:text-orange-400 cursor-pointer" />
                        </button>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {cw?.panVerified
                      ? <CheckCircle className="h-4 w-4 text-green-500" />
                      : <button onClick={() => handleVerify(w.id, 'panVerified')} title="Click to verify">
                          <XCircle className="h-4 w-4 text-gray-300 hover:text-orange-400 cursor-pointer" />
                        </button>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[cw?.status] || 'bg-gray-100 text-gray-600'}`}>{cw?.status || '—'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Onboard Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold text-gray-900">Fast-Track Worker Onboarding</h2>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Personal Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label><input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label><input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Email *</label><input required type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label><input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Aadhaar Number</label><input maxLength={12} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.aadhaarNumber} onChange={e => setForm({ ...form, aadhaarNumber: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">PAN Number</label><input maxLength={10} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.panNumber} onChange={e => setForm({ ...form, panNumber: e.target.value })} /></div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contract Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Designation *</label><input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Worker Type</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.workerType} onChange={e => setForm({ ...form, workerType: e.target.value })}>
                      <option value="CASUAL">Casual</option>
                      <option value="CONTRACTUAL">Contractual</option>
                      <option value="DAILY_WAGE">Daily Wage</option>
                    </select>
                  </div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Contract Start *</label><input required type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.contractStart} onChange={e => setForm({ ...form, contractStart: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Contract End</label><input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.contractEnd} onChange={e => setForm({ ...form, contractEnd: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Daily Rate (₹)</label><input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.dailyRate} onChange={e => setForm({ ...form, dailyRate: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Monthly Rate (₹)</label><input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.monthlyRate} onChange={e => setForm({ ...form, monthlyRate: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Department</label><input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Site Location</label><input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.siteLocation} onChange={e => setForm({ ...form, siteLocation: e.target.value })} /></div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bank Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Bank Account</label><input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code</label><input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.ifscCode} onChange={e => setForm({ ...form, ifscCode: e.target.value })} /></div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50">
                  {submitting ? 'Onboarding...' : 'Onboard Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
