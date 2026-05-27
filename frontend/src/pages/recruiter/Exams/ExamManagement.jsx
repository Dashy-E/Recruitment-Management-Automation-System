import { useEffect, useState } from 'react';
import { examAPI, candidateAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';
import { Link2, CheckCircle, XCircle, Send } from 'lucide-react';
import { format } from 'date-fns';

const GenerateLinkForm = ({ onSuccess }) => {
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({ candidateId: '', examName: '', passingScore: 60, maxScore: 100, expiryHours: 72 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    candidateAPI.getAll({ status: 'EXAM_PENDING', limit: 100 }).then(r => setCandidates(r.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.candidateId) return toast.error('Select a candidate');
    setLoading(true);
    try {
      const res = await examAPI.generateLink(form);
      toast.success('Exam link generated');
      if (res.data.examLink) {
        navigator.clipboard.writeText(res.data.examLink).catch(() => {});
        toast.success('Link copied to clipboard!', { duration: 4000 });
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate link');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Candidate *</label>
        <select value={form.candidateId} onChange={e => setForm(p => ({ ...p, candidateId: e.target.value }))} className={inputCls} required>
          <option value="">Select Candidate</option>
          {candidates.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.candidateId})</option>)}
        </select>
        {candidates.length === 0 && <p className="text-xs text-amber-600 mt-1">No candidates with "Exam Pending" status</p>}
      </div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Exam Name *</label>
        <input type="text" value={form.examName} onChange={e => setForm(p => ({ ...p, examName: e.target.value }))} className={inputCls} placeholder="e.g. Product Knowledge Assessment" required /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Max Score</label>
          <input type="number" value={form.maxScore} onChange={e => setForm(p => ({ ...p, maxScore: parseFloat(e.target.value) }))} className={inputCls} /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Passing Score</label>
          <input type="number" value={form.passingScore} onChange={e => setForm(p => ({ ...p, passingScore: parseFloat(e.target.value) }))} className={inputCls} /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Link Expiry (hrs)</label>
          <input type="number" value={form.expiryHours} onChange={e => setForm(p => ({ ...p, expiryHours: parseInt(e.target.value) }))} className={inputCls} /></div>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
        <Link2 size={15} />{loading ? 'Generating...' : 'Generate Exam Link'}
      </button>
    </form>
  );
};

const ResultForm = ({ attempt, onSuccess }) => {
  const [form, setForm] = useState({ score: '', result: 'PASS', remarks: '' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await examAPI.updateResult(attempt.id, form);
      toast.success('Result updated');
      onSuccess();
    } catch { toast.error('Failed to update result'); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">Recording result for: <strong>{attempt.candidate?.firstName} {attempt.candidate?.lastName}</strong></p>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Score</label>
          <input type="number" value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} className={inputCls} placeholder={`Out of ${attempt.maxScore}`} /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Result</label>
          <select value={form.result} onChange={e => setForm(p => ({ ...p, result: e.target.value }))} className={inputCls}>
            <option value="PASS">Pass</option>
            <option value="FAIL">Fail</option>
          </select></div>
      </div>
      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Remarks</label>
        <textarea value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} className={inputCls} rows={2} /></div>
      <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700">Submit Result</button>
    </form>
  );
};

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [resultAttempt, setResultAttempt] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchExams = async () => {
    setLoading(true);
    try { const res = await examAPI.getAll({ status: statusFilter }); setExams(res.data); }
    catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExams(); }, [statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Examination Management</h2>
          <p className="text-sm text-gray-500">{exams.length} exam records</p>
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Statuses</option>
            {['PENDING', 'LINK_SENT', 'PASSED', 'FAILED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setShowGenerate(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            <Link2 size={16} /> Generate Link
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-5 py-3 text-left">Candidate</th>
              <th className="px-5 py-3 text-left">Exam</th>
              <th className="px-5 py-3 text-left">Attempt</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Score</th>
              <th className="px-5 py-3 text-left">Expiry</th>
              <th className="px-5 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
            ) : exams.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No exam records</td></tr>
            ) : exams.map(e => (
              <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <Link to={`/recruiter/candidates/${e.candidateId}`} className="font-medium text-gray-800 hover:text-indigo-600 text-sm">
                    {e.candidate?.firstName} {e.candidate?.lastName}
                  </Link>
                  <p className="text-xs text-gray-400">{e.candidate?.designation}</p>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{e.examName}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">#{e.attemptNumber}</td>
                <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                <td className="px-5 py-3.5 text-sm">
                  {e.score != null ? <span className={`font-semibold ${e.result === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>{e.score}/{e.maxScore}</span> : '—'}
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-500">
                  {e.linkExpiresAt ? format(new Date(e.linkExpiresAt), 'dd MMM, hh:mm a') : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {e.examLink && (
                      <button onClick={() => { navigator.clipboard.writeText(e.examLink); toast.success('Link copied!'); }} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        <Link2 size={12} /> Copy Link
                      </button>
                    )}
                    {['LINK_SENT', 'PENDING'].includes(e.status) && (
                      <button onClick={() => setResultAttempt(e)} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-100 flex items-center gap-1">
                        <CheckCircle size={12} /> Result
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Exam Link" size="md">
        <GenerateLinkForm onSuccess={() => { setShowGenerate(false); fetchExams(); }} />
      </Modal>
      <Modal open={!!resultAttempt} onClose={() => setResultAttempt(null)} title="Enter Exam Result" size="sm">
        {resultAttempt && <ResultForm attempt={resultAttempt} onSuccess={() => { setResultAttempt(null); fetchExams(); }} />}
      </Modal>
    </div>
  );
};

export default ExamManagement;
