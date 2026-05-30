import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { candidateAPI, mrfAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import CandidateForm from './CandidateForm';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUSES = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED', 'HOLD', 'TRAINING_PENDING', 'TRAINING_IN_PROGRESS', 'EXAM_PENDING', 'EXAM_COMPLETED', 'OFFER_SENT', 'OFFER_ACCEPTED', 'ONBOARDED'];

const CandidateList = () => {
  const [searchParams] = useSearchParams();
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const mrfId = searchParams.get('mrfId');

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await candidateAPI.getAll({ page, limit: 12, status: statusFilter, search, mrfId });
      setCandidates(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load candidates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCandidates(); }, [page, statusFilter, search, mrfId]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this candidate?')) return;
    try { await candidateAPI.delete(id); toast.success('Candidate deleted'); fetchCandidates(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleStatusChange = async (id, status) => {
    try { await candidateAPI.updateStatus(id, status); toast.success('Status updated'); fetchCandidates(); }
    catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Candidates</h2>
          <p className="text-sm text-gray-500">{total} total candidates</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Plus size={16} /> Add Candidate
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, email, phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Candidate</th>
                <th className="px-5 py-3 text-left">Designation</th>
                <th className="px-5 py-3 text-left">Experience</th>
                <th className="px-5 py-3 text-left">Source</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Change Status</th>
                <th className="px-5 py-3 text-left">Added</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400">No candidates found</td></tr>
              ) : candidates.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <Link to={`/recruiter/candidates/${c.id}`} className="font-medium text-gray-800 hover:text-indigo-600 text-sm">{c.firstName} {c.lastName}</Link>
                      <p className="text-xs text-gray-400">{c.candidateId} · {c.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{c.designation}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{Math.floor(c.experience / 12)} yr {c.experience % 12} mo</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{c.source || '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3.5">
                    <select value={c.status} onChange={e => handleStatusChange(c.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{format(new Date(c.createdAt), 'dd MMM yy')}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <Link to={`/recruiter/candidates/${c.id}`} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View"><Eye size={15} /></Link>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border disabled:opacity-40"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add New Candidate" size="xl">
        <CandidateForm onSuccess={() => { setShowForm(false); fetchCandidates(); }} />
      </Modal>
    </div>
  );
};

export default CandidateList;
