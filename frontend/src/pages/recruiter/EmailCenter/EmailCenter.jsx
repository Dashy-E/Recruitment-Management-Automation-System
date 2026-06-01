import { useState, useEffect } from 'react';
import { communicationAPI, candidateAPI } from '../../../services/api';
import { Mail, Plus, Eye, Send, FileText, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CATEGORIES = ['All', 'INTERVIEW', 'OFFER', 'TRAINING', 'EXAM', 'REJECTION', 'AGENCY'];
const CHANNEL_COLORS = { EMAIL: 'bg-blue-100 text-blue-700', SMS: 'bg-green-100 text-green-700', WHATSAPP: 'bg-emerald-100 text-emerald-700' };

export default function EmailCenter() {
  const [tab, setTab] = useState('compose');
  const [templates, setTemplates] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [catFilter, setCatFilter] = useState('All');
  const [compose, setCompose] = useState({ candidateIds: [], templateId: '', subject: '', body: '', channel: 'EMAIL' });
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', body: '', category: 'GENERAL', variables: '' });

  useEffect(() => {
    communicationAPI.getTemplates().then(r => setTemplates(r.data)).catch(() => {});
    communicationAPI.getAll({ limit: 50 }).then(r => setCommunications(r.data.communications || [])).catch(() => {});
    candidateAPI.getAll({ limit: 100 }).then(r => setCandidates(r.data.data || [])).catch(() => {});
  }, []);

  const handlePreview = async (tmplId) => {
    try {
      const tmpl = templates.find(t => t.id === tmplId);
      setPreview(tmpl);
      setCompose(prev => ({ ...prev, templateId: tmplId, subject: tmpl.subject, body: tmpl.body }));
    } catch { toast.error('Failed to load preview'); }
  };

  const handleSend = async () => {
    if (!compose.candidateIds.length) return toast.error('Select at least one candidate');
    if (!compose.subject || !compose.body) return toast.error('Subject and body are required');
    try {
      setLoading(true);
      const res = await communicationAPI.send(compose);
      toast.success(`Sent to ${res.data.sent} candidate(s)`);
      setCompose({ candidateIds: [], templateId: '', subject: '', body: '', channel: 'EMAIL' });
      setPreview(null);
      communicationAPI.getAll({ limit: 50 }).then(r => setCommunications(r.data.communications || []));
    } catch { toast.error('Send failed'); } finally { setLoading(false); }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const vars = templateForm.variables.split(',').map(v => v.trim()).filter(Boolean);
      await communicationAPI.createTemplate({ ...templateForm, variables: vars });
      toast.success('Template created');
      setShowTemplateForm(false);
      communicationAPI.getTemplates().then(r => setTemplates(r.data));
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const filteredTemplates = catFilter === 'All' ? templates : templates.filter(t => t.category === catFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-7 w-7 text-indigo-600" /> Email & Communication Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">Send emails, manage templates, track communications</p>
        </div>
        <button onClick={() => setShowTemplateForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {['compose', 'templates', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Compose Tab */}
      {tab === 'compose' && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To (Candidates)</label>
                <select multiple className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-28"
                  onChange={e => setCompose(prev => ({ ...prev, candidateIds: [...e.target.selectedOptions].map(o => o.value) }))}>
                  {candidates.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template (optional)</label>
                <div className="flex gap-2">
                  <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={compose.templateId}
                    onChange={e => e.target.value ? handlePreview(e.target.value) : setCompose(prev => ({ ...prev, templateId: '' }))}>
                    <option value="">No template</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={compose.channel} onChange={e => setCompose(prev => ({ ...prev, channel: e.target.value }))}>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={compose.subject} onChange={e => setCompose(prev => ({ ...prev, subject: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
                <textarea rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" value={compose.body} onChange={e => setCompose(prev => ({ ...prev, body: e.target.value }))} />
              </div>
              <button onClick={handleSend} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                <Send className="h-4 w-4" /> {loading ? 'Sending...' : `Send to ${compose.candidateIds.length || 0} Candidate(s)`}
              </button>
            </div>
          </div>

          <div className="col-span-2">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Eye className="h-4 w-4" /> Preview</h3>
              {preview ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Subject:</p>
                  <p className="text-sm font-medium text-gray-900 mb-3">{compose.subject}</p>
                  <p className="text-xs text-gray-500 mb-1">Body:</p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans bg-white rounded-lg p-3 border border-gray-200">{compose.body}</pre>
                  {preview.variables && (() => {
                    try {
                      const vars = JSON.parse(preview.variables);
                      return vars.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Variables in template:</p>
                          <div className="flex flex-wrap gap-1">
                            {vars.map(v => <span key={v} className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">{`{{${v}}}`}</span>)}
                          </div>
                        </div>
                      ) : null;
                    } catch { return null; }
                  })()}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Select a template to preview</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${catFilter === c ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">{t.name}</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{t.category}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{t.subject}</p>
                <p className="text-xs text-gray-600 line-clamp-3">{t.body}</p>
                <button onClick={() => { setTab('compose'); handlePreview(t.id); }} className="mt-3 text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  <Send className="h-3 w-3" /> Use template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Candidate', 'Subject', 'Channel', 'Sent By', 'Date'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {communications.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No communications yet</td></tr>
              ) : communications.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.candidate ? `${c.candidate.firstName} ${c.candidate.lastName}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.subject}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHANNEL_COLORS[c.channel] || 'bg-gray-100 text-gray-600'}`}>{c.channel}</span></td>
                  <td className="px-4 py-3 text-gray-600">{c.sentBy?.firstName} {c.sentBy?.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(c.sentAt), 'dd MMM yyyy HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Template Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b"><h2 className="font-semibold text-gray-900">New Email Template</h2></div>
            <form onSubmit={handleCreateTemplate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={templateForm.category} onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}>
                  {['INTERVIEW', 'OFFER', 'TRAINING', 'EXAM', 'REJECTION', 'AGENCY', 'GENERAL'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={templateForm.subject} onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
                <textarea required rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-xs" placeholder="Use {{variableName}} for dynamic content" value={templateForm.body} onChange={e => setTemplateForm({ ...templateForm, body: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variables (comma separated)</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="candidateName, designation, company" value={templateForm.variables} onChange={e => setTemplateForm({ ...templateForm, variables: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowTemplateForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Create Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
