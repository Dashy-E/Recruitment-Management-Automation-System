import { useState, useEffect } from 'react';
import { employeeDocumentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, FileText, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

const DOC_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'ID_PROOF', label: 'Other ID Proof' },
  { value: 'EDUCATION', label: 'Education Certificate' },
  { value: 'CERTIFICATE', label: 'Professional Certificate' },
  { value: 'OTHER', label: 'Other' },
];

const DOC_NUMBER_RE = /^[a-zA-Z0-9\-\/\s]{2,50}$/;

const EMPTY_FORM = { docType: '', docNumber: '', issuingAuthority: '', issueDate: '', expiryDate: '' };

function validate(form) {
  const e = {};
  if (!form.docType) e.docType = 'Required';
  if (!form.docNumber.trim()) e.docNumber = 'Required';
  else if (!DOC_NUMBER_RE.test(form.docNumber.trim())) e.docNumber = 'Only letters, numbers, hyphens and spaces (2–50 chars)';
  if (!form.issuingAuthority.trim()) e.issuingAuthority = 'Required';
  if (!form.issueDate) e.issueDate = 'Required';
  else if (new Date(form.issueDate) >= new Date()) e.issueDate = 'Must be a past date';
  if (form.expiryDate && form.issueDate && new Date(form.expiryDate) <= new Date(form.issueDate))
    e.expiryDate = 'Must be after issue date';
  return e;
}

const cls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
const errCls = 'border-red-400 focus:ring-red-400';

const F = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

const today = () => new Date().toISOString().split('T')[0];

export default function EmployeeDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDocs = async () => {
    try {
      const res = await employeeDocumentAPI.getAll();
      setDocs(res.data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (touched[field]) setErrors(prev => ({ ...prev, [field]: validate({ ...form, [field]: value })[field] }));
  };

  const blur = (field) => {
    setTouched(p => ({ ...p, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validate(form)[field] }));
  };

  const openForm = () => { setForm(EMPTY_FORM); setErrors({}); setTouched({}); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(EMPTY_FORM).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await employeeDocumentAPI.create({
        docType: form.docType,
        docNumber: form.docNumber.trim(),
        issuingAuthority: form.issuingAuthority.trim(),
        issueDate: form.issueDate,
        expiryDate: form.expiryDate || undefined,
      });
      toast.success('Document saved');
      setShowForm(false);
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this document entry?')) return;
    setDeletingId(id);
    try {
      await employeeDocumentAPI.delete(id);
      toast.success('Document removed');
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch {
      toast.error('Failed to remove document');
    } finally {
      setDeletingId(null);
    }
  };

  const docLabel = (type) => DOC_TYPES.find(d => d.value === type)?.label || type;

  const isExpired = (expiryDate) => expiryDate && new Date(expiryDate) < new Date();

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">My Documents</h2>
          <p className="text-xs text-gray-500">Enter your document details below — no file uploads required</p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center gap-2 bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
        >
          <Plus size={15} /> Add Document
        </button>
      </div>

      {/* Document list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-2 text-gray-400">
            <FileText size={32} className="opacity-30" />
            <p className="text-sm">No documents added yet</p>
            <button onClick={openForm} className="text-sm text-teal-600 hover:underline">Add your first document</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-start justify-between p-4 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-teal-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800">{docLabel(doc.docType)}</p>
                      {isExpired(doc.expiryDate) && (
                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">Expired</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      No: <span className="font-medium text-gray-700">{doc.docNumber}</span>
                      {' · '}Issued by {doc.issuingAuthority}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Issued: {format(new Date(doc.issueDate), 'dd MMM yyyy')}
                      {doc.expiryDate && ` · Expires: ${format(new Date(doc.expiryDate), 'dd MMM yyyy')}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Add Document</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <F label="Document Type" required error={touched.docType && errors.docType}>
                <select
                  className={`${cls} ${touched.docType && errors.docType ? errCls : ''}`}
                  value={form.docType}
                  onChange={e => set('docType', e.target.value)}
                  onBlur={() => blur('docType')}
                >
                  <option value="">Select type</option>
                  {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </F>

              <F label="Document Number" required error={touched.docNumber && errors.docNumber}>
                <input
                  className={`${cls} ${touched.docNumber && errors.docNumber ? errCls : ''}`}
                  placeholder="e.g. ABCDE1234F, 1234 5678 9012"
                  value={form.docNumber}
                  onChange={e => set('docNumber', e.target.value)}
                  onBlur={() => blur('docNumber')}
                  maxLength={50}
                />
              </F>

              <F label="Issuing Authority" required error={touched.issuingAuthority && errors.issuingAuthority}>
                <input
                  className={`${cls} ${touched.issuingAuthority && errors.issuingAuthority ? errCls : ''}`}
                  placeholder="e.g. UIDAI, Income Tax Dept, Regional Transport Office"
                  value={form.issuingAuthority}
                  onChange={e => set('issuingAuthority', e.target.value)}
                  onBlur={() => blur('issuingAuthority')}
                  maxLength={100}
                />
              </F>

              <div className="grid grid-cols-2 gap-3">
                <F label="Issue Date" required error={touched.issueDate && errors.issueDate}>
                  <input
                    type="date"
                    className={`${cls} ${touched.issueDate && errors.issueDate ? errCls : ''}`}
                    value={form.issueDate}
                    max={today()}
                    onChange={e => set('issueDate', e.target.value)}
                    onBlur={() => blur('issueDate')}
                  />
                </F>

                <F label="Expiry Date" error={touched.expiryDate && errors.expiryDate}>
                  <input
                    type="date"
                    className={`${cls} ${touched.expiryDate && errors.expiryDate ? errCls : ''}`}
                    value={form.expiryDate}
                    min={form.issueDate || undefined}
                    onChange={e => set('expiryDate', e.target.value)}
                    onBlur={() => blur('expiryDate')}
                  />
                </F>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
