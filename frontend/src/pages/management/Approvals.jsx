import { useEffect, useState } from 'react';
import { mrfAPI, offerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';
import { ShieldCheck, FileText, Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const Section = ({ icon: Icon, title, count, color, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <Icon size={17} className={color} />
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{count} pending</span>
      </div>
    </div>
    {children}
  </div>
);

const EmptyRow = ({ cols, msg }) => (
  <tr><td colSpan={cols} className="px-5 py-10 text-center text-sm text-gray-400">{msg}</td></tr>
);

const Approvals = () => {
  const { user } = useAuth();
  const isMD = user?.role === 'MD' || user?.role === 'MANAGING_DIRECTOR';
  const [mrfs, setMrfs] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null); // { type: 'mrf'|'offer', id }
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [m, o] = await Promise.all([
        mrfAPI.getAll({ status: 'PENDING', limit: 50 }),
        offerAPI.getAll({ status: 'DRAFT', limit: 50 }),
      ]);
      setMrfs(m.data.data || []);
      setOffers(Array.isArray(o.data) ? o.data : []);
    } catch {
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const approveMRF = async (id) => {
    setActing(true);
    try {
      await mrfAPI.approve(id);
      toast.success('MRF approved');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally { setActing(false); }
  };

  const approveOffer = async (id) => {
    setActing(true);
    try {
      await offerAPI.approve(id);
      toast.success('Offer letter approved');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally { setActing(false); }
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a reason');
    setActing(true);
    try {
      if (rejectModal.type === 'mrf') await mrfAPI.reject(rejectModal.id, rejectReason);
      toast.success('Rejected successfully');
      setRejectModal(null);
      setRejectReason('');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally { setActing(false); }
  };

  const totalPending = mrfs.length + offers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Approvals</h2>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading…' : `${totalPending} item${totalPending !== 1 ? 's' : ''} awaiting your approval`}
          </p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-300 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {totalPending === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3 text-gray-400">
          <ShieldCheck size={40} className="text-gray-200" />
          <p className="text-sm font-medium">All caught up!</p>
          <p className="text-xs text-gray-300">No pending approvals at this time</p>
        </div>
      )}

      {/* MRF Approvals */}
      {(mrfs.length > 0 || loading) && (
        <Section icon={FileText} title="MRF Approvals" count={mrfs.length} color="text-indigo-600">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 text-left">MRF #</th>
                  <th className="px-5 py-3 text-left">Designation</th>
                  <th className="px-5 py-3 text-left">Department</th>
                  <th className="px-5 py-3 text-left">Vacancies</th>
                  <th className="px-5 py-3 text-left">Priority</th>
                  <th className="px-5 py-3 text-left">Submitted</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading
                  ? <EmptyRow cols={7} msg="Loading…" />
                  : mrfs.length === 0
                    ? <EmptyRow cols={7} msg="No pending MRFs" />
                    : mrfs.map(mrf => (
                        <tr key={mrf.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3.5 font-medium text-indigo-600">{mrf.mrfNumber}</td>
                          <td className="px-5 py-3.5 text-gray-800">{mrf.designation}</td>
                          <td className="px-5 py-3.5 text-gray-500">{mrf.department?.name || '—'}</td>
                          <td className="px-5 py-3.5 text-gray-600">{mrf.vacancies}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={mrf.priority} /></td>
                          <td className="px-5 py-3.5 text-gray-400 text-xs">{format(new Date(mrf.createdAt), 'dd MMM yyyy')}</td>
                          <td className="px-5 py-3.5">
                            {isMD ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => approveMRF(mrf.id)}
                                  disabled={acting}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                  <CheckCircle size={13} /> Approve
                                </button>
                                <button
                                  onClick={() => { setRejectModal({ type: 'mrf', id: mrf.id }); setRejectReason(''); }}
                                  disabled={acting}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 disabled:opacity-50"
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">MD approval required</span>
                            )}
                          </td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Offer Letter Approvals */}
      {(offers.length > 0 || loading) && (
        <Section icon={Mail} title="Offer Letter Approvals" count={offers.length} color="text-orange-500">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 text-left">Offer #</th>
                  <th className="px-5 py-3 text-left">Candidate</th>
                  <th className="px-5 py-3 text-left">Designation</th>
                  <th className="px-5 py-3 text-left">CTC</th>
                  <th className="px-5 py-3 text-left">Expires</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading
                  ? <EmptyRow cols={6} msg="Loading…" />
                  : offers.length === 0
                    ? <EmptyRow cols={6} msg="No pending offer letters" />
                    : offers.map(offer => (
                        <tr key={offer.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3.5 font-medium text-indigo-600">{offer.offerNumber}</td>
                          <td className="px-5 py-3.5 text-gray-800">
                            {offer.candidate?.firstName} {offer.candidate?.lastName}
                            <p className="text-xs text-gray-400">{offer.candidate?.email}</p>
                          </td>
                          <td className="px-5 py-3.5 text-gray-600">{offer.designation}</td>
                          <td className="px-5 py-3.5 font-medium text-gray-700">₹{offer.ctc?.toLocaleString('en-IN')}</td>
                          <td className="px-5 py-3.5 text-gray-400 text-xs">{format(new Date(offer.expiryDate), 'dd MMM yyyy')}</td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => approveOffer(offer.id)}
                              disabled={acting}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                          </td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Rejection Reason</h3>
              <p className="text-xs text-gray-400 mt-0.5">This will be recorded and visible to the requester</p>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                placeholder="Explain why this is being rejected…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setRejectModal(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={confirmReject} disabled={acting || !rejectReason.trim()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {acting ? 'Rejecting…' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
