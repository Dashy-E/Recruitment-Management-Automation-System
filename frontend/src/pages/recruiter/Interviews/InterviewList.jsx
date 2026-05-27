import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, MapPin, CheckCircle, XCircle, Star } from 'lucide-react';
import { interviewAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

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
            <label className="text-xs font-medium text-gray-600 mb-1 block">{l} (1-10)</label>
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
  const [feedbackInterviewId, setFeedbackInterviewId] = useState(null);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await interviewAPI.getAll({ status: statusFilter, limit: 20 });
      setInterviews(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load interviews'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInterviews(); }, [statusFilter]);

  const handleComplete = async (id) => {
    try { await interviewAPI.complete(id); toast.success('Interview marked complete'); fetchInterviews(); }
    catch { toast.error('Failed to update'); }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Reason for cancellation:');
    if (!reason) return;
    try { await interviewAPI.cancel(id, reason); toast.success('Interview cancelled'); fetchInterviews(); }
    catch { toast.error('Failed to cancel'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Interview Schedule</h2>
          <p className="text-sm text-gray-500">{total} total interviews</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Statuses</option>
          {['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : interviews.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">No interviews found</div>
        ) : interviews.map(iv => (
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
                <p className="text-sm text-gray-500">{iv.candidate?.designation}</p>
                <div className="flex items-center gap-4 mt-2.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={12} />{format(new Date(iv.scheduledAt), 'dd MMM yyyy')}</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{format(new Date(iv.scheduledAt), 'hh:mm a')} · {iv.duration} min</span>
                  <span className="flex items-center gap-1">{iv.mode === 'ONLINE' ? <Video size={12} /> : <MapPin size={12} />}{iv.mode}</span>
                  {iv.meetingLink && <a href={iv.meetingLink} target="_blank" className="text-indigo-600 hover:underline">Join Link</a>}
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
                  <button onClick={() => { setFeedbackInterviewId(iv.id); }} className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
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

      <Modal open={!!feedbackInterviewId} onClose={() => setFeedbackInterviewId(null)} title="Submit Interview Feedback" size="lg">
        {feedbackInterviewId && <FeedbackForm interviewId={feedbackInterviewId} onSuccess={() => { setFeedbackInterviewId(null); fetchInterviews(); }} />}
      </Modal>
    </div>
  );
};

export default InterviewList;
