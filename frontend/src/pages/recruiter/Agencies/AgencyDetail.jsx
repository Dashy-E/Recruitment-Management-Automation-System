import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { agencyAPI } from '../../../services/api';
import { Building2, ArrowLeft, Star, TrendingUp, Users, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = { SUBMITTED: 'bg-blue-100 text-blue-700', SHORTLISTED: 'bg-yellow-100 text-yellow-700', SELECTED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700' };

export default function AgencyDetail() {
  const { id } = useParams();
  const [agency, setAgency] = useState(null);
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [agRes, perfRes] = await Promise.all([agencyAPI.getById(id), agencyAPI.getPerformance(id)]);
        setAgency(agRes.data);
        setPerf(perfRes.data);
      } catch {
        toast.error('Failed to load agency');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!agency) return <div className="p-8 text-center text-gray-500">Agency not found</div>;

  let specs = [];
  try { specs = JSON.parse(agency.specializations || '[]'); } catch {}

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/recruiter/agencies" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{agency.name}</h1>
          <p className="text-sm text-gray-500">{agency.agencyCode} · {agency.city}, {agency.state}</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Submissions', val: agency.totalSubmissions, color: 'text-blue-600' },
          { icon: CheckCircle, label: 'Placed', val: agency.successfulHires, color: 'text-green-600' },
          { icon: TrendingUp, label: 'Success Rate', val: `${perf?.successRate ?? 0}%`, color: 'text-indigo-600' },
          { icon: Star, label: 'Rating', val: agency.rating || 'N/A', color: 'text-yellow-500' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <k.icon className={`h-6 w-6 mx-auto mb-1 ${k.color}`} />
            <p className="text-xl font-bold text-gray-900">{k.val}</p>
            <p className="text-xs text-gray-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Details */}
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Agency Details</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Contact Person', agency.contactPerson],
                ['Email', agency.email],
                ['Phone', agency.phone],
                ['City', agency.city],
                ['State', agency.state],
                ['Country', agency.country],
                ['Tier', agency.tier],
                ['Status', agency.status],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-gray-500 text-xs">{k}</dt>
                  <dd className="font-medium text-gray-900">{v || '—'}</dd>
                </div>
              ))}
            </dl>
            {specs.length > 0 && (
              <div className="mt-4">
                <dt className="text-gray-500 text-xs mb-2">Specializations</dt>
                <div className="flex flex-wrap gap-2">
                  {specs.map(s => <span key={s} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">{s}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Submissions</h2>
            {agency.submissions?.length === 0 ? (
              <p className="text-sm text-gray-400">No submissions yet</p>
            ) : (
              <div className="space-y-3">
                {(agency.submissions || []).map(sub => (
                  <div key={sub.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sub.candidate?.firstName} {sub.candidate?.lastName}</p>
                      <p className="text-xs text-gray-500">{sub.mrf?.mrfNumber} · {format(new Date(sub.submittedAt), 'dd MMM yyyy')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[sub.status] || 'bg-gray-100 text-gray-600'}`}>{sub.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contacts + Locations */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Contacts</h2>
            {agency.contacts?.length === 0 ? (
              <p className="text-xs text-gray-400">No contacts added</p>
            ) : (
              <div className="space-y-3">
                {(agency.contacts || []).map(c => (
                  <div key={c.id} className="text-sm">
                    <p className="font-medium text-gray-900">{c.name} {c.isPrimary && <span className="text-xs text-indigo-600">(Primary)</span>}</p>
                    {c.designation && <p className="text-xs text-gray-500">{c.designation}</p>}
                    {c.email && <p className="text-xs text-gray-600">{c.email}</p>}
                    {c.phone && <p className="text-xs text-gray-600">{c.phone}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Locations</h2>
            {agency.locations?.length === 0 ? (
              <p className="text-xs text-gray-400">No locations assigned</p>
            ) : (
              <div className="space-y-1.5">
                {(agency.locations || []).map(l => (
                  <div key={l.id} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-900">{l.location?.city}</span>
                    <span className="text-gray-400 text-xs">{l.location?.state}</span>
                    {l.isPrimary && <span className="text-xs text-indigo-600">Primary</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
