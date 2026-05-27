import { useState, useEffect } from 'react';
import { incomingMailAPI } from '../../../services/api';
import { Inbox, UserPlus, CheckCircle, Trash2, Paperclip, Clock, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = {
  UNPROCESSED: 'bg-yellow-100 text-yellow-700',
  PROCESSED: 'bg-green-100 text-green-700',
  LINKED: 'bg-blue-100 text-blue-700',
  DISCARDED: 'bg-gray-100 text-gray-500',
};

export default function IncomingMail() {
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchMails = async () => {
    try {
      setLoading(true);
      const res = await incomingMailAPI.getAll({ status: statusFilter || undefined });
      setMails(res.data.mails || []);
    } catch { toast.error('Failed to load mails'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchMails(); }, [statusFilter]);

  const handleCreateCandidate = async (mailId) => {
    setProcessing(true);
    try {
      const res = await incomingMailAPI.createCandidate(mailId);
      toast.success(`Candidate profile created: ${res.data.candidate.firstName} ${res.data.candidate.lastName}`);
      fetchMails();
      if (selected?.id === mailId) {
        const updated = await incomingMailAPI.getById(mailId);
        setSelected(updated.data);
      }
    } catch (err) {
      if (err.response?.status === 409) toast.error('Candidate already exists in the system');
      else toast.error('Failed to create candidate');
    } finally { setProcessing(false); }
  };

  const handleDiscard = async (mailId) => {
    try {
      await incomingMailAPI.discard(mailId);
      toast.success('Mail discarded');
      fetchMails();
      if (selected?.id === mailId) setSelected(null);
    } catch { toast.error('Failed to discard'); }
  };

  const handleMarkProcessed = async (mailId) => {
    try {
      await incomingMailAPI.process(mailId, { status: 'PROCESSED', notes: 'Manually marked as processed' });
      toast.success('Mail marked as processed');
      fetchMails();
    } catch { toast.error('Failed'); }
  };

  const unprocessedCount = mails.filter(m => m.status === 'UNPROCESSED').length;

  return (
    <div className="p-6 space-y-5 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Inbox className="h-7 w-7 text-sky-600" /> Incoming Mail Processing
            {unprocessedCount > 0 && (
              <span className="ml-1 text-sm bg-yellow-500 text-white px-2 py-0.5 rounded-full">{unprocessedCount} new</span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review inbound applications and auto-create candidate profiles</p>
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="UNPROCESSED">Unprocessed</option>
          <option value="PROCESSED">Processed</option>
          <option value="LINKED">Linked</option>
          <option value="DISCARDED">Discarded</option>
        </select>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Mail List */}
        <div className="w-96 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 p-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {mails.length} Emails
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Loading...</div>
            ) : mails.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No emails</p>
              </div>
            ) : mails.map(m => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selected?.id === m.id ? 'bg-sky-50 border-r-2 border-sky-500' : ''}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.fromName || m.fromEmail}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                </div>
                <p className="text-xs text-gray-600 truncate">{m.subject}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">{format(new Date(m.receivedAt), 'dd MMM HH:mm')}</span>
                  {m.hasAttachment && <Paperclip className="h-3 w-3 text-gray-400" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mail Detail */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Inbox className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Select an email to view details</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{selected.subject}</h2>
                    <p className="text-sm text-gray-600 mt-1">From: <span className="font-medium">{selected.fromName || selected.fromEmail}</span> &lt;{selected.fromEmail}&gt;</p>
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(selected.receivedAt), 'dd MMMM yyyy, HH:mm')}</p>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                </div>

                {/* Action Buttons */}
                {selected.status === 'UNPROCESSED' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleCreateCandidate(selected.id)}
                      disabled={processing}
                      className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4" /> Auto-Create Candidate
                    </button>
                    <button
                      onClick={() => handleMarkProcessed(selected.id)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                    >
                      <CheckCircle className="h-4 w-4" /> Mark Processed
                    </button>
                    <button
                      onClick={() => handleDiscard(selected.id)}
                      className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" /> Discard
                    </button>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 p-5 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {selected.body || '(No body)'}
                </pre>

                {selected.hasAttachment && (() => {
                  let attachments = [];
                  try { attachments = JSON.parse(selected.attachments || '[]'); } catch {}
                  return attachments.length > 0 ? (
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">ATTACHMENTS</p>
                      <div className="space-y-2">
                        {attachments.map((a, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                            <Paperclip className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{a.name}</p>
                              {a.size && <p className="text-xs text-gray-500">{(a.size / 1024).toFixed(0)} KB</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
