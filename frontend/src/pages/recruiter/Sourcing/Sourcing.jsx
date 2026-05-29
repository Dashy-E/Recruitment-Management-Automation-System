import { useState, useEffect } from 'react';
import { sourcingAPI, mrfAPI } from '../../../services/api';
import { Globe, Plus, ExternalLink, Copy, Check, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PLATFORMS = ['LINKEDIN', 'NAUKRI', 'INDEED', 'INTERNSHALA', 'MONSTER', 'SHINE', 'OTHER'];
const PLATFORM_COLORS = {
  LINKEDIN: 'bg-blue-100 text-blue-700',
  NAUKRI: 'bg-orange-100 text-orange-700',
  INDEED: 'bg-indigo-100 text-indigo-700',
  INTERNSHALA: 'bg-green-100 text-green-700',
  MONSTER: 'bg-purple-100 text-purple-700',
  SHINE: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-600',
};
const PLATFORM_LABELS = {
  LINKEDIN: 'LinkedIn', NAUKRI: 'Naukri', INDEED: 'Indeed',
  INTERNSHALA: 'Internshala', MONSTER: 'Monster India', SHINE: 'Shine', OTHER: 'Other',
};
const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

export default function Sourcing() {
  const [postings, setPostings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copied, setCopied] = useState(null);

  // Form state
  const [mrfs, setMrfs] = useState([]);
  const [form, setForm] = useState({ mrfId: '', platform: 'LINKEDIN', postUrl: '', expiresAt: '', notes: '' });
  const [generatedDesc, setGeneratedDesc] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPostings = async () => {
    setLoading(true);
    try {
      const res = await sourcingAPI.getAll({ platform: platformFilter || undefined, status: statusFilter || undefined });
      setPostings(res.data.postings);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load postings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPostings(); }, [platformFilter, statusFilter]);
  useEffect(() => {
    mrfAPI.getAll({ limit: 100 }).then(r => setMrfs(r.data.data || [])).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!form.mrfId || !form.platform) return toast.error('Select an MRF and platform first');
    setGenerating(true);
    try {
      const res = await sourcingAPI.generateDescription(form.mrfId, form.platform);
      setGeneratedDesc(res.data.description);
    } catch { toast.error('Failed to generate description'); }
    finally { setGenerating(false); }
  };

  const handleCopy = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleCreate = async () => {
    if (!form.mrfId || !form.platform) return toast.error('MRF and platform are required');
    setSaving(true);
    try {
      await sourcingAPI.create({ ...form, description: generatedDesc });
      toast.success('Job posting tracked');
      setShowForm(false);
      setForm({ mrfId: '', platform: 'LINKEDIN', postUrl: '', expiresAt: '', notes: '' });
      setGeneratedDesc('');
      fetchPostings();
    } catch { toast.error('Failed to save posting'); }
    finally { setSaving(false); }
  };

  const handleUpdateApplications = async (id, current) => {
    const val = prompt('Enter application count:', current);
    if (val === null) return;
    try {
      await sourcingAPI.update(id, { applications: parseInt(val) || 0 });
      toast.success('Updated');
      fetchPostings();
    } catch { toast.error('Failed to update'); }
  };

  const handleStatusToggle = async (posting) => {
    const next = posting.status === 'ACTIVE' ? 'PAUSED' : posting.status === 'PAUSED' ? 'CLOSED' : 'ACTIVE';
    try {
      await sourcingAPI.update(posting.id, { status: next });
      fetchPostings();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this posting from tracking?')) return;
    try { await sourcingAPI.delete(id); toast.success('Removed'); fetchPostings(); }
    catch { toast.error('Failed'); }
  };

  // Summary stats
  const totalApps = postings.reduce((s, p) => s + (p.applications || 0), 0);
  const activeCount = postings.filter(p => p.status === 'ACTIVE').length;
  const platformCounts = PLATFORMS.reduce((acc, p) => {
    acc[p] = postings.filter(x => x.platform === p).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Platform Sourcing</h2>
          <p className="text-sm text-gray-500">{total} job postings tracked · {totalApps} total applications · {activeCount} active</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus size={16} /> Track New Posting
        </button>
      </div>

      {/* Platform pill summary */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.filter(p => platformCounts[p] > 0).map(p => (
          <button key={p} onClick={() => setPlatformFilter(platformFilter === p ? '' : p)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${platformFilter === p ? 'ring-2 ring-offset-1 ring-indigo-500' : ''} ${PLATFORM_COLORS[p]}`}>
            {PLATFORM_LABELS[p]} ({platformCounts[p]})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Postings list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading...</div>
        ) : postings.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Globe size={32} className="mx-auto mb-2 opacity-30" />
            <p>No job postings tracked yet</p>
            <p className="text-xs mt-1">Track where you've posted jobs to monitor applications across platforms</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {postings.map(p => (
              <div key={p.id} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[p.platform]}`}>{PLATFORM_LABELS[p.platform]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                      {p.mrf && <span className="text-xs text-gray-400">{p.mrf.mrfNumber}</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.mrf?.location || 'Location TBD'} · Posted {format(new Date(p.postedAt), 'dd MMM yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <button onClick={() => handleUpdateApplications(p.id, p.applications)} className="text-lg font-bold text-indigo-600 hover:text-indigo-800 transition-colors" title="Click to update">
                        {p.applications}
                      </button>
                      <p className="text-xs text-gray-400">applications</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {p.postUrl && (
                        <a href={p.postUrl} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg" title="Open posting">
                          <ExternalLink size={15} />
                        </a>
                      )}
                      <button onClick={() => handleCopy(p.description, p.id)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg" title="Copy description">
                        {copied === p.id ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                      </button>
                      <button onClick={() => handleStatusToggle(p)} className="p-1.5 text-gray-400 hover:text-yellow-600 rounded-lg" title="Toggle status">
                        <RefreshCw size={15} />
                      </button>
                      <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                        {expandedId === p.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg" title="Remove">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
                {expandedId === p.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 leading-relaxed">{p.description}</pre>
                    {p.notes && <p className="mt-2 text-xs text-gray-500 italic">{p.notes}</p>}
                    {p.expiresAt && <p className="mt-1 text-xs text-red-500">Expires: {format(new Date(p.expiresAt), 'dd MMM yyyy')}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Posting Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setGeneratedDesc(''); }} title="Track Job Posting" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MRF / Position *</label>
              <select value={form.mrfId} onChange={e => setForm(f => ({ ...f, mrfId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select MRF</option>
                {mrfs.map(m => <option key={m.id} value={m.id}>{m.mrfNumber} — {m.designation}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Posting URL (optional)</label>
              <input type="url" value={form.postUrl} onChange={e => setForm(f => ({ ...f, postUrl: e.target.value }))}
                placeholder="https://linkedin.com/jobs/..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Job Description</label>
              <button onClick={handleGenerate} disabled={generating || !form.mrfId}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40">
                <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Generating…' : 'Auto-generate for ' + PLATFORM_LABELS[form.platform]}
              </button>
            </div>
            <textarea value={generatedDesc} onChange={e => setGeneratedDesc(e.target.value)}
              rows={8} placeholder="Click auto-generate or paste your job description..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {generatedDesc && (
              <button onClick={() => handleCopy(generatedDesc, 'modal')} className="mt-1 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                {copied === 'modal' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                Copy to clipboard
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g., 30-day sponsored listing, refreshed on 15th..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setGeneratedDesc(''); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Track Posting'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
