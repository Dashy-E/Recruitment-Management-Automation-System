import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { examAPI, candidateAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';
import { Link2, CheckCircle, Users } from 'lucide-react';
import { format } from 'date-fns';

const GenerateLinkForm = ({ onSuccess }) => {
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ examName: '', passingScore: 60, maxScore: 100, expiryHours: 72 });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    candidateAPI.getAll({ status: 'EXAM_PENDING', limit: 200 })
      .then(r => setCandidates(r.data.data || []))
      .catch(() => toast.error('Failed to load candidates'))
      .finally(() => setLoadingCandidates(false));
  }, []);

  const toggleCandidate = (id) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const toggleAll = () =>
    setSelected(selected.length === candidates.length ? [] : candidates.map(c => c.id));

  const validate = () => {
    const e = {};
    if (!selected.length) e.candidates = 'Select at least one candidate.';
    if (!form.examName.trim()) e.examName = 'Exam name is required.';
    else if (form.examName.trim().length < 3) e.examName = 'Must be at least 3 characters.';
    const max = parseFloat(form.maxScore);
    const pass = parseFloat(form.passingScore);
    if (isNaN(max) || max < 1) e.maxScore = 'Must be at least 1.';
    if (isNaN(pass) || pass < 1) e.passingScore = 'Must be at least 1.';
    if (!isNaN(max) && !isNaN(pass) && pass >= max) e.passingScore = 'Passing score must be less than max score.';
    const exp = parseInt(form.expiryHours, 10);
    if (isNaN(exp) || exp < 1) e.expiryHours = 'Must be at least 1 hour.';
    if (exp > 720) e.expiryHours = 'Cannot exceed 720 hours (30 days).';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    const successes = [];
    const failures = [];
    for (const candidateId of selected) {
      try {
        const res = await examAPI.generateLink({ candidateId, ...form });
        successes.push({ candidateId, examLink: res.data.examLink });
      } catch (err) {
        const candidate = candidates.find(c => c.id === candidateId);
        failures.push({ name: `${candidate?.firstName} ${candidate?.lastName}`, reason: err.response?.data?.message || 'Unknown error' });
      }
    }
    setLoading(false);
    setResults({ successes, failures });
    if (successes.length) toast.success(`${successes.length} exam link(s) generated`);
    if (failures.length) toast.error(`${failures.length} failed — see details`);
  };

  const cls = (f) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[f] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  if (results) {
    return (
      <div className="space-y-4">
        {results.successes.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-green-800">{results.successes.length} link(s) generated successfully</p>
            {results.successes.map(r => {
              const c = candidates.find(x => x.id === r.candidateId);
              return (
                <div key={r.candidateId} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-green-100">
                  <span className="text-gray-700 font-medium">{c?.firstName} {c?.lastName} ({c?.candidateId})</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(r.examLink); toast.success('Link copied!'); }}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <Link2 size={11} /> Copy Link
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {results.failures.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
            <p className="text-sm font-semibold text-red-800">{results.failures.length} failed</p>
            {results.failures.map((f, i) => (
              <p key={i} className="text-xs text-red-700">{f.name}: {f.reason}</p>
            ))}
          </div>
        )}
        <button onClick={() => { setResults(null); setSelected([]); onSuccess(); }} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Candidate multi-select */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">
            Candidates * <span className="text-gray-400 font-normal">(Exam Pending status)</span>
          </label>
          {candidates.length > 0 && (
            <button type="button" onClick={toggleAll} className="text-xs text-indigo-600 hover:text-indigo-800">
              {selected.length === candidates.length ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>
        {loadingCandidates ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-3"><div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Loading…</div>
        ) : candidates.length === 0 ? (
          <div className="border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 text-xs text-amber-700">
            No candidates with "Exam Pending" status.<br />
            Candidates must complete training and have their enrollment marked Complete before an exam link can be generated.
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
            {candidates.map(c => (
              <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggleCandidate(c.id)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{c.firstName} {c.lastName}</span>
                  <span className="text-xs text-gray-400 ml-2">({c.candidateId})</span>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{c.designation}</span>
              </label>
            ))}
          </div>
        )}
        {selected.length > 0 && <p className="text-xs text-indigo-600 mt-1">{selected.length} candidate(s) selected</p>}
        {errors.candidates && <p className="text-xs text-red-500 mt-1">{errors.candidates}</p>}
      </div>

      {/* Exam details */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Exam Name *</label>
        <input type="text" value={form.examName} onChange={e => setForm(p => ({ ...p, examName: e.target.value }))} className={cls('examName')} placeholder="e.g. Product Knowledge Assessment" maxLength={100} />
        {errors.examName && <p className="text-xs text-red-500 mt-1">{errors.examName}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Max Score *</label>
          <input type="text" inputMode="numeric" value={form.maxScore} onChange={e => setForm(p => ({ ...p, maxScore: e.target.value.replace(/[^0-9.]/g, '') }))} className={cls('maxScore')} />
          {errors.maxScore && <p className="text-xs text-red-500 mt-1">{errors.maxScore}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Passing Score *</label>
          <input type="text" inputMode="numeric" value={form.passingScore} onChange={e => setForm(p => ({ ...p, passingScore: e.target.value.replace(/[^0-9.]/g, '') }))} className={cls('passingScore')} />
          {errors.passingScore && <p className="text-xs text-red-500 mt-1">{errors.passingScore}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Link Expiry (hrs) *</label>
          <input type="text" inputMode="numeric" value={form.expiryHours} onChange={e => setForm(p => ({ ...p, expiryHours: e.target.value.replace(/[^0-9]/g, '') }))} className={cls('expiryHours')} />
          {errors.expiryHours && <p className="text-xs text-red-500 mt-1">{errors.expiryHours}</p>}
        </div>
      </div>

      <button type="submit" disabled={loading || !candidates.length} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
        <Link2 size={15} />
        {loading ? `Generating… (${selected.length} candidates)` : `Generate Links for ${selected.length || 0} Candidate(s)`}
      </button>
    </form>
  );
};

const ResultForm = ({ attempt, onSuccess }) => {
  const [form, setForm] = useState({ score: '', result: 'PASS', remarks: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    const score = parseFloat(form.score);
    if (form.score === '' || isNaN(score) || score < 0) e.score = 'Enter a valid score (0 or above).';
    if (!isNaN(score) && score > attempt.maxScore) e.score = `Cannot exceed max score of ${attempt.maxScore}.`;
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await examAPI.updateResult(attempt.id, form);
      toast.success('Result updated');
      onSuccess();
    } catch { toast.error('Failed to update result'); }
  };

  const cls = (f) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[f] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;
  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-gray-600">Recording result for: <strong>{attempt.candidate?.firstName} {attempt.candidate?.lastName}</strong></p>
      <p className="text-xs text-gray-400">Max score: {attempt.maxScore} · Passing: {attempt.passingScore}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Score *</label>
          <input type="text" inputMode="numeric" value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value.replace(/[^0-9.]/g, '') }))} className={cls('score')} placeholder={`0 – ${attempt.maxScore}`} />
          {errors.score && <p className="text-xs text-red-500 mt-1">{errors.score}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Result</label>
          <select value={form.result} onChange={e => setForm(p => ({ ...p, result: e.target.value }))} className={cls('')}>
            <option value="PASS">Pass</option>
            <option value="FAIL">Fail</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Remarks</label>
        <textarea value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} className={cls('')} rows={2} maxLength={500} />
      </div>
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
            <Users size={15} /> Generate Links
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
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">Loading…</td></tr>
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

      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Exam Links" size="md">
        <GenerateLinkForm onSuccess={() => { setShowGenerate(false); fetchExams(); }} />
      </Modal>
      <Modal open={!!resultAttempt} onClose={() => setResultAttempt(null)} title="Enter Exam Result" size="sm">
        {resultAttempt && <ResultForm attempt={resultAttempt} onSuccess={() => { setResultAttempt(null); fetchExams(); }} />}
      </Modal>
    </div>
  );
};

export default ExamManagement;
