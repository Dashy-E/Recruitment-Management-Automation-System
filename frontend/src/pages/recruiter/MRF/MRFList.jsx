import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, FileText, Eye, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { mrfAPI, departmentAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import MRFForm from './MRFForm';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';

const MRFList = () => {
  const { user } = useAuth();
  const [mrfs, setMrfs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editMRF, setEditMRF] = useState(null);

  const canApprove = ['ADMIN', 'HR', 'BRANCH_MANAGER', 'COUNTRY_MANAGER', 'MD'].includes(user?.role);

  const fetchMRFs = async () => {
    setLoading(true);
    try {
      const res = await mrfAPI.getAll({ page, limit: 10, status: statusFilter, search });
      setMrfs(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load MRFs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMRFs(); }, [page, statusFilter, search]);

  const handleApprove = async (id) => {
    try { await mrfAPI.approve(id); toast.success('MRF approved'); fetchMRFs(); }
    catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try { await mrfAPI.reject(id, reason); toast.success('MRF rejected'); fetchMRFs(); }
    catch { toast.error('Failed to reject'); }
  };

  const handleSubmit = async (id) => {
    try { await mrfAPI.submit(id); toast.success('MRF submitted for approval'); fetchMRFs(); }
    catch { toast.error('Failed to submit'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Manpower Requisition Forms</h2>
          <p className="text-sm text-gray-500">{total} total MRFs</p>
        </div>
        <button
          onClick={() => { setEditMRF(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New MRF
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by designation or MRF number..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">MRF #</th>
                <th className="px-5 py-3 text-left">Designation</th>
                <th className="px-5 py-3 text-left">Department</th>
                <th className="px-5 py-3 text-left">Vacancies</th>
                <th className="px-5 py-3 text-left">Priority</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Candidates</th>
                <th className="px-5 py-3 text-left">Created</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : mrfs.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-400">No MRFs found</td></tr>
              ) : mrfs.map(mrf => (
                <tr key={mrf.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-indigo-600">{mrf.mrfNumber}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-800">{mrf.designation}</p>
                    <p className="text-xs text-gray-400">{mrf.location}, {mrf.country}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{mrf.department?.name}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">{mrf.vacancies}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={mrf.priority} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={mrf.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{mrf._count?.candidates || 0}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {format(new Date(mrf.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <Link to={`/recruiter/mrf/${mrf.id}`} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View">
                        <Eye size={15} />
                      </Link>
                      {mrf.status === 'DRAFT' && (
                        <button onClick={() => handleSubmit(mrf.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Submit">
                          <FileText size={15} />
                        </button>
                      )}
                      {mrf.status === 'PENDING' && canApprove && (
                        <>
                          <button onClick={() => handleApprove(mrf.id)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Approve">
                            <Check size={15} />
                          </button>
                          <button onClick={() => handleReject(mrf.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Reject">
                            <X size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border disabled:opacity-40 hover:bg-white transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border disabled:opacity-40 hover:bg-white transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MRF Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editMRF ? 'Edit MRF' : 'Create New MRF'} size="xl">
        <MRFForm mrf={editMRF} onSuccess={() => { setShowForm(false); fetchMRFs(); }} />
      </Modal>
    </div>
  );
};

export default MRFList;
