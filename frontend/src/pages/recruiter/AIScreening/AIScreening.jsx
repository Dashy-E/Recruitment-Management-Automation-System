import { useState, useEffect } from 'react';
import { aiScreeningAPI, mrfAPI } from '../../../services/api';
import { Brain, Zap, Target, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const REC_CONFIG = {
  STRONGLY_RECOMMENDED: { label: 'Strong Match', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  RECOMMENDED: { label: 'Good Match', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  CONSIDER: { label: 'Consider', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  NOT_RECOMMENDED: { label: 'Weak Match', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AIScreening() {
  const [tab, setTab] = useState('screen');
  const [mrfs, setMrfs] = useState([]);
  const [jds, setJDs] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedMrf, setSelectedMrf] = useState('');
  const [selectedJd, setSelectedJd] = useState('');
  const [screening, setScreening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jdForm, setJdForm] = useState({ mrfId: '', title: '', description: '', requirements: '', skills: '', experience: '' });
  const [showJdForm, setShowJdForm] = useState(false);

  useEffect(() => {
    mrfAPI.getAll({ status: 'APPROVED', limit: 50 }).then(r => setMrfs(r.data.mrfs || [])).catch(() => {});
    aiScreeningAPI.getAllJDs().then(r => setJDs(r.data)).catch(() => {});
    aiScreeningAPI.getResults({ limit: 50 }).then(r => setResults(r.data.results || [])).catch(() => {});
  }, []);

  const handleBatchScreen = async () => {
    if (!selectedJd || !selectedMrf) return toast.error('Select MRF and JD first');
    try {
      setScreening(true);
      const res = await aiScreeningAPI.screenBatch({ jdId: selectedJd, mrfId: selectedMrf });
      toast.success(`Screened ${res.data.screened} candidates`);
      aiScreeningAPI.getResults({ limit: 50 }).then(r => setResults(r.data.results || []));
    } catch { toast.error('Screening failed'); } finally { setScreening(false); }
  };

  const handleCreateJD = async (e) => {
    e.preventDefault();
    try {
      const skills = jdForm.skills.split(',').map(s => s.trim()).filter(Boolean);
      await aiScreeningAPI.createJD({ ...jdForm, skills });
      toast.success('JD saved');
      setShowJdForm(false);
      aiScreeningAPI.getAllJDs().then(r => setJDs(r.data));
    } catch { toast.error('Failed to save JD'); }
  };

  const filteredResults = selectedMrf
    ? results.filter(r => r.jobDescription?.mrf?.mrfNumber && mrfs.find(m => m.id === selectedMrf)?.mrfNumber === r.jobDescription?.mrf?.mrfNumber)
    : results;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-7 w-7 text-purple-600" /> AI Resume Screening
          </h1>
          <p className="text-sm text-gray-500 mt-1">Match candidates to job descriptions using skill and experience analysis</p>
        </div>
        <button onClick={() => setShowJdForm(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Job Description
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">MRF</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[240px]" value={selectedMrf} onChange={e => setSelectedMrf(e.target.value)}>
            <option value="">All MRFs</option>
            {mrfs.map(m => <option key={m.id} value={m.id}>{m.mrfNumber} — {m.designation}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Job Description</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[240px]" value={selectedJd} onChange={e => setSelectedJd(e.target.value)}>
            <option value="">Select JD for batch screening</option>
            {jds.map(j => <option key={j.id} value={j.id}>{j.title} ({j.mrf?.mrfNumber})</option>)}
          </select>
        </div>
        <button
          onClick={handleBatchScreen}
          disabled={!selectedMrf || !selectedJd || screening}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="h-4 w-4" /> {screening ? 'Screening...' : 'Run Batch Screen'}
        </button>
      </div>

      {/* Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Screening Results ({filteredResults.length})</h2>
        </div>
        {filteredResults.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400">
            <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No screening results yet. Select an MRF + JD and run screening.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResults.map(r => {
              const rec = REC_CONFIG[r.recommendation] || REC_CONFIG.CONSIDER;
              const RecIcon = rec.icon;
              let matched = [], missing = [];
              try { matched = JSON.parse(r.skillsMatched || '[]'); } catch {}
              try { missing = JSON.parse(r.skillsMissing || '[]'); } catch {}

              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{r.candidate?.firstName} {r.candidate?.lastName}</h3>
                        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${rec.color}`}>
                          <RecIcon className="h-3 w-3" /> {rec.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{r.candidate?.email} · Status: {r.candidate?.status}</p>
                      {r.summary && <p className="text-xs text-gray-600 mt-2">{r.summary}</p>}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl font-bold" style={{ color: r.matchScore >= 75 ? '#16a34a' : r.matchScore >= 55 ? '#ca8a04' : '#dc2626' }}>
                        {r.matchScore}%
                      </div>
                      <p className="text-xs text-gray-400">Match Score</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.matchScore}%`, backgroundColor: r.matchScore >= 75 ? '#16a34a' : r.matchScore >= 55 ? '#ca8a04' : '#dc2626' }} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs">
                    {matched.length > 0 && (
                      <div>
                        <span className="text-gray-500 font-medium">Matched Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {matched.map(s => <span key={s} className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {missing.length > 0 && (
                      <div>
                        <span className="text-gray-500 font-medium">Missing Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {missing.map(s => <span key={s} className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {r.experienceGap > 0 && (
                      <div>
                        <span className="text-gray-500 font-medium">Experience Gap:</span>
                        <span className="ml-1 text-red-600">{r.experienceGap} year(s) short</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* JD Form Modal */}
      {showJdForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b"><h2 className="font-semibold text-gray-900">Add Job Description</h2></div>
            <form onSubmit={handleCreateJD} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MRF *</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={jdForm.mrfId} onChange={e => setJdForm({ ...jdForm, mrfId: e.target.value })}>
                  <option value="">Select MRF</option>
                  {mrfs.map(m => <option key={m.id} value={m.id}>{m.mrfNumber} — {m.designation}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={jdForm.title} onChange={e => setJdForm({ ...jdForm, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Required</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 3-5 years" value={jdForm.experience} onChange={e => setJdForm({ ...jdForm, experience: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma separated)</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="React, Node.js, PostgreSQL" value={jdForm.skills} onChange={e => setJdForm({ ...jdForm, skills: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                <textarea required rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={jdForm.description} onChange={e => setJdForm({ ...jdForm, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements *</label>
                <textarea required rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="List specific requirements, qualifications..." value={jdForm.requirements} onChange={e => setJdForm({ ...jdForm, requirements: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowJdForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Save JD</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
