import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mrfAPI, sourcingAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { ArrowLeft, MapPin, Users, Calendar, DollarSign, Briefcase, Send, Globe, Mail, ChevronDown, ChevronUp, Check, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Candidates', 'Agency Outreach', 'Job Postings'];

const WORKER_TYPE_COLORS = { PERMANENT: 'bg-blue-100 text-blue-700', CONTRACTUAL: 'bg-orange-100 text-orange-700', CASUAL: 'bg-yellow-100 text-yellow-700' };
const AGENCY_TYPE_COLORS = { HIRING: 'bg-indigo-100 text-indigo-700', MANPOWER: 'bg-orange-100 text-orange-700' };
const PLATFORM_LABELS = { LINKEDIN: 'LinkedIn', NAUKRI: 'Naukri', INDEED: 'Indeed', INTERNSHALA: 'Internshala', MONSTER: 'Monster', SHINE: 'Shine', OTHER: 'Other' };
const PLATFORM_COLORS = { LINKEDIN: 'bg-blue-100 text-blue-700', NAUKRI: 'bg-orange-100 text-orange-700', INDEED: 'bg-indigo-100 text-indigo-700', INTERNSHALA: 'bg-green-100 text-green-700', MONSTER: 'bg-purple-100 text-purple-700', SHINE: 'bg-yellow-100 text-yellow-700', OTHER: 'bg-gray-100 text-gray-600' };

export default function MRFDetail() {
  const { id } = useParams();
  const [mrf, setMrf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');

  // Outreach
  const [suggestedAgencies, setSuggestedAgencies] = useState([]);
  const [outreachHistory, setOutreachHistory] = useState([]);
  const [selectedAgencies, setSelectedAgencies] = useState([]);
  const [outreachForm, setOutreachForm] = useState({ subject: '', body: '' });
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [sendingOutreach, setSendingOutreach] = useState(false);
  const [expandedOutreach, setExpandedOutreach] = useState(null);
  const [loadingAgencies, setLoadingAgencies] = useState(false);

  // Job Postings
  const [jobPostings, setJobPostings] = useState([]);

  const fetchMrf = useCallback(() => {
    mrfAPI.getById(id).then(r => setMrf(r.data)).catch(() => toast.error('Failed to load MRF')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchMrf(); }, [fetchMrf]);

  const loadOutreach = useCallback(async () => {
    setLoadingAgencies(true);
    try {
      const [agRes, histRes] = await Promise.all([mrfAPI.getSuggestedAgencies(id), mrfAPI.getOutreach(id)]);
      setSuggestedAgencies(agRes.data.agencies || []);
      setOutreachHistory(histRes.data || []);
    } catch { toast.error('Failed to load outreach data'); }
    finally { setLoadingAgencies(false); }
  }, [id]);

  const loadPostings = useCallback(async () => {
    try {
      const res = await sourcingAPI.getByMrf(id);
      setJobPostings(res.data || []);
    } catch {}
  }, [id]);

  useEffect(() => {
    if (tab === 'Agency Outreach') loadOutreach();
    if (tab === 'Job Postings') loadPostings();
  }, [tab, loadOutreach, loadPostings]);

  const prefillOutreach = () => {
    if (!mrf) return;
    const skills = (() => { try { return JSON.parse(mrf.skills || '[]'); } catch { return []; } })();
    setOutreachForm({
      subject: `Requirement: ${mrf.designation} — ${mrf.mrfNumber}`,
      body: `Dear {{agencyName}},

We have an immediate requirement for the following position and would like to partner with you for sourcing candidates.

Position: {{designation}}
Vacancies: {{vacancies}}
Experience Required: {{experience}}
Location: {{location}}
MRF Reference: {{mrfNumber}}
${skills.length ? 'Key Skills: ' + skills.join(', ') : ''}
${mrf.salaryMin ? 'CTC Range: ₹' + (mrf.salaryMin / 100000).toFixed(1) + 'L – ₹' + (mrf.salaryMax / 100000).toFixed(1) + 'L' : ''}

Please share suitable CVs at the earliest. Kindly reply to this email with candidate profiles and your agency fee structure.

Looking forward to your response.

Best regards,
HR Team`,
    });
    setShowOutreachModal(true);
  };

  const handleSendOutreach = async () => {
    if (!selectedAgencies.length) return toast.error('Select at least one agency');
    if (!outreachForm.subject || !outreachForm.body) return toast.error('Subject and body are required');
    setSendingOutreach(true);
    try {
      const res = await mrfAPI.sendOutreach(id, { agencyIds: selectedAgencies, ...outreachForm });
      toast.success(`Outreach sent to ${res.data.sent} agency${res.data.sent !== 1 ? 's' : ''}`);
      setShowOutreachModal(false);
      setSelectedAgencies([]);
      loadOutreach();
    } catch { toast.error('Failed to send outreach'); }
    finally { setSendingOutreach(false); }
  };

  const toggleAgency = (agencyId) => setSelectedAgencies(s => s.includes(agencyId) ? s.filter(x => x !== agencyId) : [...s, agencyId]);
  const toggleAll = () => setSelectedAgencies(s => s.length === suggestedAgencies.length ? [] : suggestedAgencies.map(a => a.id));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!mrf) return <div className="text-center text-gray-500 py-10">MRF not found</div>;

  const skills = (() => { try { return JSON.parse(mrf.skills || '[]'); } catch { return []; } })();

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/recruiter/mrf" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ArrowLeft size={18} /></Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{mrf.designation}</h2>
          <p className="text-sm text-gray-500">{mrf.mrfNumber}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {mrf.workerType && <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${WORKER_TYPE_COLORS[mrf.workerType] || 'bg-gray-100 text-gray-600'}`}>{mrf.workerType}</span>}
          <StatusBadge status={mrf.priority} />
          <StatusBadge status={mrf.status} />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Vacancies', value: mrf.vacancies },
          { icon: MapPin, label: 'Location', value: `${mrf.location || '—'}, ${mrf.country}` },
          { icon: Briefcase, label: 'Experience', value: mrf.experience || '—' },
          { icon: DollarSign, label: 'CTC Range', value: mrf.salaryMin ? `₹${(mrf.salaryMin / 100000).toFixed(1)}L – ₹${(mrf.salaryMax / 100000).toFixed(1)}L` : '—' },
          { icon: Calendar, label: 'Created On', value: format(new Date(mrf.createdAt), 'dd MMM yyyy') },
          { icon: Users, label: 'Department', value: mrf.department?.name },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-indigo-600" /></div>
            <div><p className="text-xs text-gray-500">{label}</p><p className="text-sm font-medium text-gray-800">{value}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview tab */}
      {tab === 'Overview' && (
        <div className="space-y-5">
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
        </div>
      )}

      {/* Candidates tab */}
      {tab === 'Candidates' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Candidates ({mrf.candidates?.length || 0})</h3>
            <Link to={`/recruiter/candidates?mrfId=${mrf.id}`} className="text-xs text-indigo-600 hover:text-indigo-800">View All</Link>
          </div>
          <table className="w-full">
            <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase"><th className="px-5 py-3 text-left">Name</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-left">Action</th></tr></thead>
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
      )}

      {/* Agency Outreach tab */}
      {tab === 'Agency Outreach' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Suggested <span className={`font-semibold px-1.5 py-0.5 rounded text-xs ${mrf.workerType === 'PERMANENT' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                  {mrf.workerType === 'PERMANENT' ? 'Hiring' : 'Manpower'}
                </span> agencies for <strong>{mrf.location || 'this location'}</strong>
              </p>
            </div>
            <button onClick={prefillOutreach} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
              <Send size={14} /> Send Outreach
            </button>
          </div>

          {loadingAgencies ? (
            <div className="py-10 text-center text-gray-400">Loading agencies...</div>
          ) : (
            <>
              {/* Suggested agencies */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{suggestedAgencies.length} Suggested Agencies</p>
                  {suggestedAgencies.length > 0 && (
                    <button onClick={toggleAll} className="text-xs text-indigo-600 hover:text-indigo-800">
                      {selectedAgencies.length === suggestedAgencies.length ? 'Deselect all' : 'Select all'}
                    </button>
                  )}
                </div>
                {suggestedAgencies.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">No agencies of this type found. Add agencies in the Agencies section.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {suggestedAgencies.map(a => (
                      <div key={a.id} className={`px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedAgencies.includes(a.id) ? 'bg-indigo-50' : ''}`}
                        onClick={() => toggleAgency(a.id)}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedAgencies.includes(a.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                          {selectedAgencies.includes(a.id) && <Check size={12} className="text-white" />}
                        </div>
                        <Building2 size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-800">{a.name}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${AGENCY_TYPE_COLORS[a.agencyType]}`}>{a.agencyType}</span>
                            {a.locationScore === 2 && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">City match</span>}
                            {a.locationScore === 1 && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">State match</span>}
                          </div>
                          <p className="text-xs text-gray-400">{a.city ? `${a.city}, ` : ''}{a.state} · {a.tier} · {a.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-gray-700">{a.totalSubmissions > 0 ? Math.round((a.successfulHires / a.totalSubmissions) * 100) + '%' : '—'}</p>
                          <p className="text-xs text-gray-400">success rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outreach history */}
              {outreachHistory.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outreach History ({outreachHistory.length})</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {outreachHistory.map(o => (
                      <div key={o.id} className="px-5 py-3.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{o.agency?.name}</p>
                            <p className="text-xs text-gray-400">{o.subject} · Sent {format(new Date(o.sentAt), 'dd MMM yyyy HH:mm')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === 'RESPONDED' ? 'bg-green-100 text-green-700' : o.status === 'CLOSED' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span>
                            {o.replies?.length > 0 && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{o.replies.length} repl{o.replies.length === 1 ? 'y' : 'ies'}</span>}
                            <button onClick={() => setExpandedOutreach(expandedOutreach === o.id ? null : o.id)} className="text-gray-400 hover:text-gray-600">
                              {expandedOutreach === o.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>
                        {expandedOutreach === o.id && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{o.body}</pre>
                            {o.replies?.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-gray-500 mb-2">Replies received:</p>
                                {o.replies.map(r => (
                                  <div key={r.id} className="text-xs text-gray-600 bg-green-50 rounded-lg px-3 py-2 mb-1">
                                    <span className="font-medium">{r.fromEmail}</span> · {r.subject} · {format(new Date(r.receivedAt), 'dd MMM HH:mm')}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Job Postings tab */}
      {tab === 'Job Postings' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link to="/recruiter/sourcing" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
              <Globe size={14} /> Manage all postings →
            </Link>
          </div>
          {jobPostings.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400 border border-gray-100 shadow-sm">
              <Globe size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No job postings tracked for this MRF</p>
              <Link to="/recruiter/sourcing" className="mt-2 inline-block text-xs text-indigo-600 hover:text-indigo-800">Go to Sourcing → Track a posting</Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {jobPostings.map(p => (
                <div key={p.id} className="px-5 py-3.5 flex items-center gap-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PLATFORM_COLORS[p.platform]}`}>{PLATFORM_LABELS[p.platform] || p.platform}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-400">Posted {format(new Date(p.postedAt), 'dd MMM yyyy')} · {p.applications} applications</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : p.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                  {p.postUrl && <a href={p.postUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-600"><Globe size={14} /></a>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outreach Compose Modal */}
      <Modal open={showOutreachModal} onClose={() => setShowOutreachModal(false)} title="Send Agency Outreach" size="xl">
        <div className="space-y-4">
          {selectedAgencies.length > 0 && (
            <div className="bg-indigo-50 rounded-lg px-4 py-2.5 text-sm text-indigo-700">
              Sending to <strong>{selectedAgencies.length}</strong> agenc{selectedAgencies.length === 1 ? 'y' : 'ies'}
            </div>
          )}
          {selectedAgencies.length === 0 && (
            <div className="bg-yellow-50 rounded-lg px-4 py-2.5 text-sm text-yellow-700">
              No agencies selected. Go back and select agencies first.
            </div>
          )}
          <p className="text-xs text-gray-500">Available variables: <code className="bg-gray-100 px-1 rounded">{'{{agencyName}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{designation}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{vacancies}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{location}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{mrfNumber}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{experience}}'}</code></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input type="text" value={outreachForm.subject} onChange={e => setOutreachForm(f => ({ ...f, subject: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Body *</label>
            <textarea value={outreachForm.body} onChange={e => setOutreachForm(f => ({ ...f, body: e.target.value }))}
              rows={12} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowOutreachModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSendOutreach} disabled={sendingOutreach || !selectedAgencies.length}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              <Send size={14} /> {sendingOutreach ? 'Sending…' : `Send to ${selectedAgencies.length} agenc${selectedAgencies.length === 1 ? 'y' : 'ies'}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
