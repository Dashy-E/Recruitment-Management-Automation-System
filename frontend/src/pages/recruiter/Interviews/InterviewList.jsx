import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, MapPin, CheckCircle, XCircle, Star, Search, Plus } from 'lucide-react';
import { interviewAPI, candidateAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ScheduleForm = ({ onSuccess }) => {
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    candidateId: '', round: 1, interviewType: 'TECHNICAL',
    scheduledAt: '', duration: 60, mode: 'ONLINE', meetingLink: '', notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch SHORTLISTED and INTERVIEW_SCHEDULED candidates
    Promise.all([
      candidateAPI.getAll({ status: 'SHORTLISTED', limit: 100 }),
      candidateAPI.getAll({ status: 'INTERVIEW_SCHEDULED', limit: 100 }),
      candidateAPI.getAll({ status: 'SELECTED', limit: 100 }),
    ]).then(([s, is, sel]) => {
      const all = [
        ...(s.data.data || []),
        ...(is.data.data || []),
        ...(sel.data.data || []),
      ];
      // deduplicate by id
      const seen = new Set();
      setCandidates(all.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; }));
    }).catch(() => toast.error('Failed to load candidates'))
      .finally(() => setLoadingCandidates(false));
  }, []);

  const minDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  const validate = () => {
    const e = {};
    if (!form.candidateId) e.candidateId = 'Select a candidate.';
    if (!form.scheduledAt) e.scheduledAt = 'Date & time is required.';
    else if (new Date(form.scheduledAt) <= new Date()) e.scheduledAt = 'Must be a future date & time.';
    if (form.mode === 'ONLINE' && !form.meetingLink.trim()) e.meetingLink = 'Meeting link is required for online interviews.';
    if (form.meetingLink && !/^https?:\/\/.+/.test(form.meetingLink.trim())) e.meetingLink = 'Enter a valid URL (must start with http:// or https://).';
    const dur = parseInt(form.duration, 10);
    if (isNaN(dur) || dur < 15) e.duration = 'Minimum 15 minutes.';
    if (dur > 480) e.duration = 'Cannot exceed 480 minutes (8 hrs).';
    return e;
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await interviewAPI.create(form);
      toast.success('Interview scheduled — confirmation email sent to candidate');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule interview');
    } finally { setSubmitting(false); }
  };

  const cls = (f) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[f] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;
  const Err = ({ f }) => errors[f] ? <p className="text-xs text-red-500 mt-1">{errors[f]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Candidate *</label>
        {loadingCandidates ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2"><div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Loading candidates…</div>
        ) : (
          <select value={form.candidateId} onChange={e => set('candidateId', e.target.value)} className={cls('candidateId')}>
            <option value="">Select candidate</option>
            {candidates.map(c => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.candidateId}) — {c.status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        )}
        {!loadingCandidates && candidates.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">No candidates with Shortlisted / Interview Scheduled / Selected status.</p>
        )}
        <Err f="candidateId" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Round</label>
          <input type="text" inputMode="numeric" value={form.round} onChange={e => set('round', e.target.value.replace(/[^0-9]/g, '') || 1)} className={cls('')} maxLength={2} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Interview Type</label>
          <select value={form.interviewType} onChange={e => set('interviewType', e.target.value)} className={cls('')}>
            {['TECHNICAL', 'HR', 'PANEL', 'FINAL', 'APTITUDE'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Date & Time *</label>
          <input type="datetime-local" min={minDateTime} value={form.scheduledAt} onChange={e => { set('scheduledAt', e.target.value); setErrors(p => ({ ...p, scheduledAt: '' })); }} className={cls('scheduledAt')} />
          <Err f="scheduledAt" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Duration (minutes)</label>
          <input type="text" inputMode="numeric" value={form.duration} onChange={e => set('duration', e.target.value.replace(/[^0-9]/g, ''))} className={cls('duration')} maxLength={3} />
          <Err f="duration" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Mode</label>
          <select value={form.mode} onChange={e => { set('mode', e.target.value); if (e.target.value !== 'ONLINE') set('meetingLink', ''); }} className={cls('')}>
            {['ONLINE', 'IN_PERSON', 'PHONE'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Meeting / Location URL {form.mode === 'ONLINE' && <span className="text-red-500">*</span>}
          </label>
          <input
            type="url"
            value={form.meetingLink}
            onChange={e => { set('meetingLink', e.target.value); setErrors(p => ({ ...p, meetingLink: '' })); }}
            className={cls('meetingLink')}
            placeholder={form.mode === 'ONLINE' ? 'https://meet.google.com/...' : 'Optional venue URL'}
            disabled={form.mode === 'PHONE'}
          />
          <Err f="meetingLink" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Notes / Instructions</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={cls('')} rows={2} placeholder="Any special instructions for the panel or candidate…" maxLength={500} />
      </div>

      <p className="text-xs text-gray-400">A confirmation email will be sent to the candidate automatically.</p>

      <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
        {submitting ? 'Scheduling…' : 'Schedule Interview'}
      </button>
    </form>
  );
};

const FeedbackForm = ({ interviewId, onSuccess }) => {
  const [form, setForm] = useState({ technicalScore: '', communicationScore: '', problemSolvingScore: '', cultureFitScore: '', recommendation: 'RECOMMEND', strengths: '', weaknesses: '', comments: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await interviewAPI.submitFeedback(interviewId, form);
      toast.success('Feedback submitted');
      onSuccess();
    } catch { toast.error('Failed to submit feedback'); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[['Technical', 'technicalScore'], ['Communication', 'communicationScore'], ['Problem Solving', 'problemSolvingScore'], ['Culture Fit', 'cultureFitScore']].map(([l, k]) => (
          <div key={k}>
            <label className="text-xs font-medium text-gray-600 mb-1 block">{l} (1–10)</label>
            <input type="number" min="1" max="10" value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} className={inputCls} />
          </div>
        ))}
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Recommendation</label>
        <select value={form.recommendation} onChange={e => setForm(p => ({ ...p, recommendation: e.target.value }))} className={inputCls}>
          {['STRONGLY_RECOMMEND', 'RECOMMEND', 'NEUTRAL', 'NOT_RECOMMEND'].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Strengths</label><textarea value={form.strengths} onChange={e => setForm(p => ({ ...p, strengths: e.target.value }))} className={inputCls} rows={2} /></div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Weaknesses</label><textarea value={form.weaknesses} onChange={e => setForm(p => ({ ...p, weaknesses: e.target.value }))} className={inputCls} rows={2} /></div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Overall Comments</label><textarea value={form.comments} onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} className={inputCls} rows={3} /></div>
      <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Submit Feedback</button>
    </form>
  );
};

const InterviewList = () => {
  const [interviews, setInterviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [feedbackInterviewId, setFeedbackInterviewId] = useState(null);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await interviewAPI.getAll({ status: statusFilter, limit: 100 });
      setInterviews(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load interviews'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInterviews(); }, [statusFilter]);

  const handleComplete = async (id) => {
    try {
      await interviewAPI.complete(id);
      toast.success('Interview marked complete — candidate moved to Selected');
      fetchInterviews();
    } catch { toast.error('Failed to update'); }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Reason for cancellation:');
    if (!reason) return;
    try { await interviewAPI.cancel(id, reason); toast.success('Interview cancelled'); fetchInterviews(); }
    catch { toast.error('Failed to cancel'); }
  };

  const filtered = search.trim()
    ? interviews.filter(iv => {
        const name = `${iv.candidate?.firstName ?? ''} ${iv.candidate?.lastName ?? ''}`.toLowerCase();
        return name.includes(search.trim().toLowerCase());
      })
    : interviews;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Interview Schedule</h2>
          <p className="text-sm text-gray-500">{total} total interviews</p>
        </div>
        <button
          onClick={() => setShowSchedule(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus size={15} /> Schedule Interview
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by candidate name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
            {search ? `No interviews found for "${search}"` : 'No interviews found'}
            {!search && <p className="text-xs mt-2 text-gray-300">Click "Schedule Interview" to create one</p>}
          </div>
        ) : filtered.map(iv => (
          <div key={iv.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/recruiter/candidates/${iv.candidateId}`} className="font-medium text-gray-800 hover:text-indigo-600">
                    {iv.candidate?.firstName} {iv.candidate?.lastName}
                  </Link>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">Round {iv.round}</span>
                  <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">{iv.interviewType}</span>
                  <StatusBadge status={iv.status} />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">{iv.candidate?.designation}</p>
                  {iv.candidate?.status && iv.candidate.status !== 'INTERVIEW_SCHEDULED' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      ['ONBOARDED','OFFER_ACCEPTED','OFFER_SENT','EXAM_COMPLETED','EXAM_PENDING','TRAINING_IN_PROGRESS','TRAINING_PENDING'].includes(iv.candidate.status)
                        ? 'bg-emerald-50 text-emerald-700'
                        : iv.candidate.status === 'REJECTED'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      Candidate now: {iv.candidate.status.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={12} />{format(new Date(iv.scheduledAt), 'dd MMM yyyy')}</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{format(new Date(iv.scheduledAt), 'hh:mm a')} · {iv.duration} min</span>
                  <span className="flex items-center gap-1">{iv.mode === 'ONLINE' ? <Video size={12} /> : <MapPin size={12} />}{iv.mode}</span>
                  {iv.meetingLink && <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Join Link</a>}
                </div>
                {iv.feedback?.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <Star size={12} className="text-yellow-500" />
                    <span className="text-xs text-gray-500">Avg Score: {(iv.feedback.reduce((acc, f) => acc + (f.overallScore || 0), 0) / iv.feedback.length).toFixed(1)}/10</span>
                    <span className="text-xs text-gray-400">({iv.feedback.length} feedback)</span>
                  </div>
                )}
              </div>
              {iv.status === 'SCHEDULED' && (
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => setFeedbackInterviewId(iv.id)} className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                    <Star size={12} /> Feedback
                  </button>
                  <button onClick={() => handleComplete(iv.id)} className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                    <CheckCircle size={12} /> Complete
                  </button>
                  <button onClick={() => handleCancel(iv.id)} className="flex items-center gap-1.5 text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                    <XCircle size={12} /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Interview" size="lg">
        <ScheduleForm onSuccess={() => { setShowSchedule(false); fetchInterviews(); }} />
      </Modal>

      <Modal open={!!feedbackInterviewId} onClose={() => setFeedbackInterviewId(null)} title="Submit Interview Feedback" size="lg">
        {feedbackInterviewId && <FeedbackForm interviewId={feedbackInterviewId} onSuccess={() => { setFeedbackInterviewId(null); fetchInterviews(); }} />}
      </Modal>
    </div>
  );
};

export default InterviewList;
