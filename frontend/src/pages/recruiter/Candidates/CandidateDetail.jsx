import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { candidateAPI, interviewAPI, userAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { JourneyBar } from '../../employee/Dashboard';
import { ArrowLeft, MessageSquare, Calendar, Edit2, Check, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const InterviewForm = ({ candidateId, onSuccess }) => {
  const [form, setForm] = useState({ candidateId, round: 1, interviewType: 'TECHNICAL', scheduledAt: '', duration: 60, mode: 'ONLINE', meetingLink: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.scheduledAt) e.scheduledAt = 'Date & time is required';
    else if (new Date(form.scheduledAt) <= new Date()) e.scheduledAt = 'Must be a future date & time';
    if (form.mode === 'ONLINE' && !form.meetingLink.trim()) e.meetingLink = 'Meeting link is required for online interviews';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await interviewAPI.create(form);
      toast.success('Interview scheduled — confirmation email sent to candidate');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule interview');
    } finally { setSubmitting(false); }
  };

  const inputCls = (field) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  // Build minimum datetime string for datetime-local (now + 5 min)
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Round</label>
          <input type="number" min="1" max="10" value={form.round} onChange={e => setForm(p => ({ ...p, round: parseInt(e.target.value) }))} className={inputCls()} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Type *</label>
          <select value={form.interviewType} onChange={e => setForm(p => ({ ...p, interviewType: e.target.value }))} className={inputCls()}>
            {['TECHNICAL', 'HR', 'PANEL', 'FINAL', 'APTITUDE'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Date & Time *</label>
          <input type="datetime-local" min={minDateTime} value={form.scheduledAt}
            onChange={e => { setForm(p => ({ ...p, scheduledAt: e.target.value })); setErrors(p => ({ ...p, scheduledAt: '' })); }}
            className={inputCls('scheduledAt')} required />
          {errors.scheduledAt && <p className="text-xs text-red-500 mt-1">{errors.scheduledAt}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Duration (min)</label>
          <input type="number" min="15" max="480" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) }))} className={inputCls()} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Mode *</label>
          <select value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value }))} className={inputCls()}>
            {['ONLINE', 'IN_PERSON', 'PHONE'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Meeting Link {form.mode === 'ONLINE' && <span className="text-red-500">*</span>}
          </label>
          <input type="url" value={form.meetingLink}
            onChange={e => { setForm(p => ({ ...p, meetingLink: e.target.value })); setErrors(p => ({ ...p, meetingLink: '' })); }}
            className={inputCls('meetingLink')} placeholder="https://meet.google.com/..." />
          {errors.meetingLink && <p className="text-xs text-red-500 mt-1">{errors.meetingLink}</p>}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={inputCls()} rows={3} placeholder="Any special instructions for the interviewer or candidate…" />
      </div>
      <p className="text-xs text-gray-400">A confirmation email will be sent to the candidate automatically.</p>
      <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
        {submitting ? 'Scheduling…' : 'Schedule Interview'}
      </button>
    </form>
  );
};

const CandidateDetail = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editCommentId, setEditCommentId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetch = () => {
    candidateAPI.getById(id).then(r => setCandidate(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [id]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      if (editCommentId) { await candidateAPI.editComment(id, editCommentId, commentText); setEditCommentId(null); }
      else await candidateAPI.addComment(id, commentText);
      setCommentText('');
      fetch();
    } catch { toast.error('Failed to save comment'); }
  };

  const handleStatusChange = async (status) => {
    try { await candidateAPI.updateStatus(id, status); toast.success('Status updated'); fetch(); }
    catch { toast.error('Failed to update status'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!candidate) return <div className="text-center text-gray-500 py-10">Candidate not found</div>;

  const skills = typeof candidate.skills === 'string' ? JSON.parse(candidate.skills) : (candidate.skills || []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'interviews', label: `Interviews (${candidate.interviews?.length || 0})` },
    { id: 'documents', label: `Documents (${candidate.documents?.length || 0})` },
    { id: 'comments', label: `Notes (${candidate.comments?.length || 0})` },
    { id: 'training', label: 'Training' },
    { id: 'exams', label: `Exams (${candidate.examAttempts?.length || 0})` },
    { id: 'offer', label: 'Offer' },
  ];

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/recruiter/candidates" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 mt-0.5"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-gray-800">{candidate.firstName} {candidate.lastName}</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{candidate.candidateId}</span>
            <StatusBadge status={candidate.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{candidate.designation} · {candidate.email} · {candidate.phone}</p>
        </div>
        <div className="flex gap-2">
          <select value={candidate.status} onChange={e => handleStatusChange(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {[
              'APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED',
              'TRAINING_PENDING', 'TRAINING_IN_PROGRESS',
              'EXAM_PENDING', 'EXAM_COMPLETED',
              'FINAL_APPROVED', 'HOLD', 'REJECTED',
              'OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'ONBOARDED',
            ].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button onClick={() => setShowInterviewForm(true)} className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700">
            <Calendar size={14} /> Schedule Interview
          </button>
        </div>
      </div>

      {/* Recruitment Journey */}
      <div className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recruitment Journey</span>
          <StatusBadge status={candidate.status} />
        </div>
        <div className="overflow-x-auto">
          <JourneyBar status={candidate.status} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Personal Details</h3>
            <div className="space-y-2.5">
              {[
                ['Email', candidate.email], ['Phone', candidate.phone], ['Alt Phone', candidate.alternatePhone],
                ['Gender', candidate.gender], ['City', candidate.city], ['Country', candidate.country],
                ['Date of Birth', candidate.dateOfBirth ? format(new Date(candidate.dateOfBirth), 'dd MMM yyyy') : '—'],
              ].map(([l, v]) => v && <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}</span><span className="text-gray-800 font-medium">{v}</span></div>)}
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Professional Details</h3>
            <div className="space-y-2.5">
              {[
                ['Designation', candidate.designation],
                ['Experience', `${Math.floor(candidate.experience / 12)} yr ${candidate.experience % 12} mo`],
                ['Current Company', candidate.currentCompany],
                ['Current Salary', candidate.currentSalary ? `₹${candidate.currentSalary.toLocaleString()}` : '—'],
                ['Expected Salary', candidate.expectedSalary ? `₹${candidate.expectedSalary.toLocaleString()}` : '—'],
                ['Notice Period', candidate.noticePeriod ? `${candidate.noticePeriod} days` : '—'],
                ['Source', candidate.source],
              ].map(([l, v]) => v && <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}</span><span className="text-gray-800 font-medium">{v}</span></div>)}
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map(s => <span key={s} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">{s}</span>)}
              {skills.length === 0 && <p className="text-sm text-gray-400">No skills added</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'interviews' && (
        <div className="space-y-3">
          {candidate.interviews?.map(iv => (
            <div key={iv.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Round {iv.round}</span>
                  <span className="text-xs text-gray-500">{iv.interviewType}</span>
                  <StatusBadge status={iv.status} />
                </div>
                <span className="text-sm text-gray-500">{format(new Date(iv.scheduledAt), 'dd MMM yyyy, hh:mm a')}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-gray-500">Mode: </span><span>{iv.mode}</span></div>
                <div><span className="text-gray-500">Duration: </span><span>{iv.duration} min</span></div>
                {iv.meetingLink && <div><a href={iv.meetingLink} target="_blank" className="text-indigo-600 hover:underline text-xs">Join Meeting</a></div>}
              </div>
              {iv.feedback?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-gray-500 mb-2">Feedback</p>
                  {iv.feedback.map(f => (
                    <div key={f.id} className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{f.interviewer?.firstName} {f.interviewer?.lastName}</span>
                        <span className={`font-medium ${f.recommendation === 'STRONGLY_RECOMMEND' ? 'text-green-600' : f.recommendation === 'NOT_RECOMMEND' ? 'text-red-600' : 'text-yellow-600'}`}>{f.recommendation}</span>
                      </div>
                      {f.overallScore && <div className="text-gray-600">Overall Score: <strong>{f.overallScore.toFixed(1)}/10</strong></div>}
                      {f.comments && <p className="text-gray-600">{f.comments}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(!candidate.interviews || candidate.interviews.length === 0) && <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">No interviews scheduled</div>}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="w-full">
            <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase"><th className="px-5 py-3 text-left">File Name</th><th className="px-5 py-3 text-left">Type</th><th className="px-5 py-3 text-left">Uploaded</th><th className="px-5 py-3 text-left">Verified</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {candidate.documents?.map(d => (
                <tr key={d.id}><td className="px-5 py-3 text-sm">{d.fileName}</td><td className="px-5 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{d.docType}</span></td><td className="px-5 py-3 text-sm text-gray-500">{format(new Date(d.uploadedAt), 'dd MMM yyyy')}</td><td className="px-5 py-3">{d.verified ? <Check size={16} className="text-green-600" /> : <X size={16} className="text-gray-400" />}</td></tr>
              ))}
              {(!candidate.documents || candidate.documents.length === 0) && <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">No documents uploaded</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-2">
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={2} placeholder="Add a note or comment..." />
            <div className="flex flex-col gap-2">
              <button onClick={handleAddComment} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 transition-colors font-medium">{editCommentId ? 'Update' : 'Add'}</button>
              {editCommentId && <button onClick={() => { setEditCommentId(null); setCommentText(''); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors">Cancel</button>}
            </div>
          </div>
          {candidate.comments?.map(c => (
            <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold">{c.commentedBy?.firstName?.[0]}</div>
                  <span className="text-sm font-medium text-gray-700">{c.commentedBy?.firstName} {c.commentedBy?.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{format(new Date(c.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                  <button onClick={() => { setEditCommentId(c.id); setCommentText(c.comment); }} className="p-1 text-gray-400 hover:text-indigo-600 rounded"><Edit2 size={13} /></button>
                </div>
              </div>
              <p className="text-sm text-gray-700">{c.comment}</p>
            </div>
          ))}
          {(!candidate.comments || candidate.comments.length === 0) && <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100 text-sm">No notes yet</div>}
        </div>
      )}

      {activeTab === 'training' && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          {candidate.trainingEnrollment ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Training Enrollment</h3>
                <StatusBadge status={candidate.trainingEnrollment.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Batch: </span><span>{candidate.trainingEnrollment.batch?.batchName}</span></div>
                <div><span className="text-gray-500">Code: </span><span>{candidate.trainingEnrollment.batch?.batchCode}</span></div>
                <div><span className="text-gray-500">Enrolled: </span><span>{format(new Date(candidate.trainingEnrollment.enrolledAt), 'dd MMM yyyy')}</span></div>
                {candidate.trainingEnrollment.completionDate && <div><span className="text-gray-500">Completed: </span><span>{format(new Date(candidate.trainingEnrollment.completionDate), 'dd MMM yyyy')}</span></div>}
              </div>
            </div>
          ) : <p className="text-center text-gray-400 text-sm py-6">Not enrolled in any training batch</p>}
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="space-y-3">
          {candidate.examAttempts?.map(e => (
            <div key={e.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">{e.examName} (Attempt {e.attemptNumber})</span>
                <StatusBadge status={e.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {e.score != null && <div><span className="text-gray-500">Score: </span><span className="font-semibold">{e.score}/{e.maxScore}</span></div>}
                {e.result && <div><span className="text-gray-500">Result: </span><span className={e.result === 'PASS' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{e.result}</span></div>}
                {e.sentAt && <div><span className="text-gray-500">Sent: </span><span>{format(new Date(e.sentAt), 'dd MMM yyyy')}</span></div>}
              </div>
              {e.examLink && <div className="mt-2"><a href={e.examLink} target="_blank" className="text-xs text-indigo-600 hover:underline">View Exam Link</a></div>}
            </div>
          ))}
          {(!candidate.examAttempts || candidate.examAttempts.length === 0) && <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100 text-sm">No exam attempts</div>}
        </div>
      )}

      {activeTab === 'offer' && (
        <div className="space-y-3">
          {candidate.offerLetter ? (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Offer Letter - {candidate.offerLetter.offerNumber}</h3>
                <StatusBadge status={candidate.offerLetter.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Designation: </span><span>{candidate.offerLetter.designation}</span></div>
                <div><span className="text-gray-500">Department: </span><span>{candidate.offerLetter.department}</span></div>
                <div><span className="text-gray-500">Basic Salary: </span><span>₹{candidate.offerLetter.basicSalary?.toLocaleString()}</span></div>
                <div><span className="text-gray-500">CTC: </span><span className="font-semibold text-green-700">₹{candidate.offerLetter.ctc?.toLocaleString()}</span></div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <FileText size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-3">No offer letter generated</p>
              <Link to="/recruiter/offers" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Generate Offer Letter →</Link>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={showInterviewForm} onClose={() => setShowInterviewForm(false)} title="Schedule Interview" size="lg">
        <InterviewForm candidateId={id} onSuccess={() => { setShowInterviewForm(false); fetch(); }} />
      </Modal>
    </div>
  );
};

export default CandidateDetail;
