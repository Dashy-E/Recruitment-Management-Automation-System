import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mrfAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import { ArrowLeft, MapPin, Users, Calendar, DollarSign, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const MRFDetail = () => {
  const { id } = useParams();
  const [mrf, setMrf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mrfAPI.getById(id).then(r => setMrf(r.data)).catch(() => toast.error('Failed to load MRF')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!mrf) return <div className="text-center text-gray-500 py-10">MRF not found</div>;

  const skills = typeof mrf.skills === 'string' ? JSON.parse(mrf.skills) : (mrf.skills || []);

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/recruiter/mrf" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ArrowLeft size={18} /></Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{mrf.designation}</h2>
          <p className="text-sm text-gray-500">{mrf.mrfNumber}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={mrf.priority} />
          <StatusBadge status={mrf.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Vacancies', value: mrf.vacancies },
          { icon: MapPin, label: 'Location', value: `${mrf.location || '—'}, ${mrf.country}` },
          { icon: Briefcase, label: 'Experience', value: mrf.experience || '—' },
          { icon: DollarSign, label: 'CTC Range', value: mrf.salaryMin ? `₹${(mrf.salaryMin/100000).toFixed(1)}L – ₹${(mrf.salaryMax/100000).toFixed(1)}L` : '—' },
          { icon: Calendar, label: 'Created On', value: format(new Date(mrf.createdAt), 'dd MMM yyyy') },
          { icon: Users, label: 'Department', value: mrf.department?.name },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => <span key={s} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">{s}</span>)}
            {skills.length === 0 && <p className="text-sm text-gray-400">No skills specified</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Approval Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Created by</span><span>{mrf.createdBy?.firstName} {mrf.createdBy?.lastName}</span></div>
            {mrf.approvedBy && <div className="flex justify-between"><span className="text-gray-500">Approved by</span><span>{mrf.approvedBy?.firstName} {mrf.approvedBy?.lastName}</span></div>}
            {mrf.approvedAt && <div className="flex justify-between"><span className="text-gray-500">Approved on</span><span>{format(new Date(mrf.approvedAt), 'dd MMM yyyy')}</span></div>}
            {mrf.rejectionReason && <div className="flex justify-between"><span className="text-gray-500">Rejection reason</span><span className="text-red-600">{mrf.rejectionReason}</span></div>}
          </div>
        </div>
      </div>

      {mrf.description && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Job Description</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{mrf.description}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Candidates ({mrf.candidates?.length || 0})</h3>
          <Link to={`/recruiter/candidates?mrfId=${mrf.id}`} className="text-xs text-indigo-600 hover:text-indigo-800">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {(mrf.candidates || []).map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{c.firstName} {c.lastName}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3"><Link to={`/recruiter/candidates/${c.id}`} className="text-xs text-indigo-600 hover:text-indigo-800">View</Link></td>
                </tr>
              ))}
              {(!mrf.candidates || mrf.candidates.length === 0) && <tr><td colSpan={3} className="px-5 py-6 text-center text-gray-400 text-sm">No candidates yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MRFDetail;
