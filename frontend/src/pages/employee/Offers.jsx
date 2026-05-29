import { useEffect, useState } from 'react';
import { offerAPI } from '../../services/api';
import { Mail, CheckCircle, XCircle, Clock, Building2, Calendar, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  DRAFT:    { color: 'bg-gray-100 text-gray-600',   icon: Clock,        label: 'Pending Review' },
  APPROVED: { color: 'bg-blue-50 text-blue-700',    icon: Clock,        label: 'Approved — Awaiting Dispatch' },
  SENT:     { color: 'bg-indigo-50 text-indigo-700',icon: Mail,         label: 'Offer Received' },
  ACCEPTED: { color: 'bg-green-50 text-green-700',  icon: CheckCircle,  label: 'Accepted' },
  REJECTED: { color: 'bg-red-50 text-red-600',      icon: XCircle,      label: 'Rejected' },
};

const Row = ({ label, value }) => (
  <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value}</span>
  </div>
);

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

const EmployeeOffers = () => {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    offerAPI.getMine()
      .then(r => setOffer(r.data))
      .catch(() => toast.error('Failed to load offer letter'))
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = async () => {
    setActing(true);
    try {
      await offerAPI.accept(offer.id);
      toast.success('Offer accepted!');
      setOffer(prev => ({ ...prev, status: 'ACCEPTED' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept offer');
    } finally { setActing(false); }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this offer?')) return;
    setActing(true);
    try {
      await offerAPI.reject(offer.id, 'Declined by candidate');
      toast.success('Offer declined');
      setOffer(prev => ({ ...prev, status: 'REJECTED' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject offer');
    } finally { setActing(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!offer) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
      <Mail size={48} className="text-gray-200" />
      <p className="text-base font-medium">No offer letter yet</p>
      <p className="text-sm text-gray-300">Your offer letter will appear here once it has been sent</p>
    </div>
  );

  const statusCfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Status banner */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl ${statusCfg.color}`}>
        <StatusIcon size={20} />
        <div>
          <p className="font-semibold text-sm">{statusCfg.label}</p>
          {offer.sentAt && <p className="text-xs opacity-70">Sent on {format(new Date(offer.sentAt), 'dd MMM yyyy')}</p>}
        </div>
        <span className="ml-auto text-xs font-mono opacity-60">{offer.offerNumber}</span>
      </div>

      {/* Offer details */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 size={16} className="text-teal-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Offer Details</h3>
        </div>
        <div className="px-5 py-2">
          <Row label="Designation" value={offer.designation} />
          <Row label="Department" value={offer.department} />
          {offer.joiningDate && <Row label="Joining Date" value={format(new Date(offer.joiningDate), 'dd MMM yyyy')} />}
          <Row label="Offer Valid Until" value={format(new Date(offer.expiryDate), 'dd MMM yyyy')} />
        </div>
      </div>

      {/* Salary breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <IndianRupee size={16} className="text-teal-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Compensation Breakdown</h3>
        </div>
        <div className="px-5 py-2">
          <Row label="Basic Salary" value={fmt(offer.basicSalary)} />
          {offer.hra > 0 && <Row label="HRA" value={fmt(offer.hra)} />}
          <Row label="Gross Salary" value={fmt(offer.grossSalary)} />
          <Row label="Net Salary" value={fmt(offer.netSalary)} />
        </div>
        <div className="px-5 py-3 bg-teal-50 flex justify-between items-center">
          <span className="text-sm font-semibold text-teal-700">Annual CTC</span>
          <span className="text-lg font-bold text-teal-700">{fmt(offer.ctc)}</span>
        </div>
      </div>

      {/* Action buttons — only shown when offer is SENT */}
      {offer.status === 'SENT' && (
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle size={16} /> Accept Offer
          </button>
          <button
            onClick={handleReject}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-xl font-medium text-sm hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle size={16} /> Decline
          </button>
        </div>
      )}

      {offer.status === 'ACCEPTED' && (
        <div className="flex items-center gap-3 px-5 py-4 bg-green-50 rounded-xl text-green-700">
          <CheckCircle size={18} />
          <p className="text-sm font-medium">You have accepted this offer. Welcome to the team!</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeOffers;
