import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { agencyAPI, mrfAPI, candidateAPI } from '../../services/api';
import { Building2, Users, TrendingUp, Plus, Send, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function AgencyDashboard() {
  const { user } = useAuth();
  const [agency, setAgency] = useState(null);
  const [perf, setPerf] = useState(null);
  const [mrfs, setMrfs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitForm, setSubmitForm] = useState({ mrfId: '', candidateName: '', email: '', phone: '', experience: '', notes: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [myRes, mrfRes] = await Promise.all([
          agencyAPI.getMy(),
          mrfAPI.getAll({ status: 'APPROVED', limit: 20 }),
        ]);
        setAgency(myRes.data.agency);
        setPerf(myRes.data.performance);
        setSubmissions(myRes.data.agency?.submissions || []);
        setMrfs(mrfRes.data.mrfs || []);
      } catch { toast.error('Failed to load data'); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agency) return;
    try {
      const nameParts = submitForm.candidateName.trim().split(' ');
      const cRes = await candidateAPI.create({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || 'N/A',
        email: submitForm.email,
        phone: submitForm.phone,
        designation: 'To be assigned',
        experience: parseInt(submitForm.experience) || 0,
        source: 'Agency',
        mrfId: submitForm.mrfId || undefined,
      });
      await agencyAPI.submitCandidate(agency.id, {
        mrfId: submitForm.mrfId,
        candidateId: cRes.data.id,
        notes: submitForm.notes,
      });
      toast.success('Candidate submitted successfully');
      setShowSubmit(false);
      setSubmitForm({ mrfId: '', candidateName: '', email: '', phone: '', experience: '', notes: '' });
      const detail = await agencyAPI.getById(agency.id);
      setSubmissions(detail.data.submissions || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  const successRate = perf?.successRate ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agency Partner Portal</h1>
          <p className="text-sm text-gray-500">{agency?.name} · Welcome, {user?.firstName}</p>
        </div>
        <button onClick={() => setShowSubmit(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Submit Candidate
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Send, label: 'Total Submitted', val: perf?.totalSubmissions ?? 0, color: 'text-blue-600 bg-blue-50' },
          { icon: Users, label: 'Candidates Placed', val: perf?.placed ?? 0, color: 'text-green-600 bg-green-50' },
          { icon: TrendingUp, label: 'Success Rate', val: `${successRate}%`, color: 'text-indigo-600 bg-indigo-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${k.color} flex items-center justify-center`}>
              <k.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{k.val}</p>
              <p className="text-sm text-gray-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Agency Info */}
      {agency && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Agency Information
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-xs text-gray-500">Agency Code</p><p className="font-medium">{agency.agencyCode}</p></div>
            <div><p className="text-xs text-gray-500">Contact</p><p className="font-medium">{agency.contactPerson}</p></div>
            <div><p className="text-xs text-gray-500">Location</p><p className="font-medium">{agency.city}, {agency.state}</p></div>
            <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{agency.email}</p></div>
            <div><p className="text-xs text-gray-500">Phone</p><p className="font-medium">{agency.phone}</p></div>
            <div><p className="text-xs text-gray-500">Tier</p><p className="font-medium">{agency.tier}</p></div>
          </div>
        </div>
      )}

      {/* Open MRFs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Open Positions (MRFs)</h2>
        {mrfs.length === 0 ? (
          <p className="text-sm text-gray-400">No open positions</p>
        ) : (
          <div className="space-y-3">
            {mrfs.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{m.designation}</p>
                  <p className="text-xs text-gray-500">{m.mrfNumber} · {m.location} · {m.vacancies} vacancies</p>
                </div>
                <button
                  onClick={() => { setSubmitForm(prev => ({ ...prev, mrfId: m.id })); setShowSubmit(true); }}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                >
                  Submit Candidate <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">My Submissions</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-gray-400">No submissions yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              {['Candidate', 'Position', 'Submitted', 'Status'].map(h => <th key={h} className="pb-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {submissions.slice(0, 10).map(s => (
                <tr key={s.id}>
                  <td className="py-2.5 font-medium text-gray-900">{s.candidate?.firstName} {s.candidate?.lastName}</td>
                  <td className="py-2.5 text-gray-600">{s.mrf?.mrfNumber}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{format(new Date(s.submittedAt), 'dd MMM yyyy')}</td>
                  <td className="py-2.5"><span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b"><h2 className="font-semibold text-gray-900">Submit Candidate Profile</h2></div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position (MRF) *</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={submitForm.mrfId} onChange={e => setSubmitForm({ ...submitForm, mrfId: e.target.value })}>
                  <option value="">Select position</option>
                  {mrfs.map(m => <option key={m.id} value={m.id}>{m.designation} — {m.mrfNumber}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={submitForm.candidateName} onChange={e => setSubmitForm({ ...submitForm, candidateName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={submitForm.experience} onChange={e => setSubmitForm({ ...submitForm, experience: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input required type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={submitForm.email} onChange={e => setSubmitForm({ ...submitForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={submitForm.phone} onChange={e => setSubmitForm({ ...submitForm, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={submitForm.notes} onChange={e => setSubmitForm({ ...submitForm, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowSubmit(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
