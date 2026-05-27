import { useState, useEffect } from 'react';
import { candidateAPI, mrfAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { Upload, Plus, X } from 'lucide-react';

const CandidateForm = ({ candidate, onSuccess }) => {
  const [mrfs, setMrfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', alternatePhone: '',
    gender: '', dateOfBirth: '', designation: '', experience: 0,
    currentSalary: '', expectedSalary: '', noticePeriod: '',
    currentCompany: '', source: '', mrfId: '', city: '', country: 'India',
    skills: [],
  });

  useEffect(() => {
    mrfAPI.getAll({ status: 'APPROVED', limit: 100 }).then(r => setMrfs(r.data.data)).catch(() => {});
    if (candidate) {
      setForm({ ...candidate, skills: typeof candidate.skills === 'string' ? JSON.parse(candidate.skills) : (candidate.skills || []) });
    }
  }, [candidate]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addSkill = () => {
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      setForm(p => ({ ...p, skills: [...p.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.phone || !form.designation) return toast.error('Fill all required fields');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'skills') fd.append(k, Array.isArray(v) ? v.join(',') : v);
        else if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });
      if (resumeFile) fd.append('resume', resumeFile);

      if (candidate) await candidateAPI.update(candidate.id, form);
      else await candidateAPI.create(fd);

      toast.success(candidate ? 'Candidate updated' : 'Candidate added');
      onSuccess();
    } catch (err) {
      if (err.response?.status === 409) toast.error(err.response.data.message);
      else toast.error('Failed to save candidate');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const F = ({ label, required, children }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h4>
        <div className="grid grid-cols-2 gap-3">
          <F label="First Name" required><input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)} className={inputCls} required /></F>
          <F label="Last Name" required><input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} className={inputCls} required /></F>
          <F label="Email" required><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} required /></F>
          <F label="Phone" required><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} required /></F>
          <F label="Alt Phone"><input type="tel" value={form.alternatePhone} onChange={e => set('alternatePhone', e.target.value)} className={inputCls} /></F>
          <F label="Gender">
            <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </F>
          <F label="Date of Birth"><input type="date" value={form.dateOfBirth ? form.dateOfBirth.split('T')[0] : ''} onChange={e => set('dateOfBirth', e.target.value)} className={inputCls} /></F>
          <F label="City"><input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} /></F>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Professional Details</h4>
        <div className="grid grid-cols-2 gap-3">
          <F label="Designation" required><input type="text" value={form.designation} onChange={e => set('designation', e.target.value)} className={inputCls} required /></F>
          <F label="Experience (months)"><input type="number" min="0" value={form.experience} onChange={e => set('experience', e.target.value)} className={inputCls} /></F>
          <F label="Current Company"><input type="text" value={form.currentCompany} onChange={e => set('currentCompany', e.target.value)} className={inputCls} /></F>
          <F label="Notice Period (days)"><input type="number" min="0" value={form.noticePeriod} onChange={e => set('noticePeriod', e.target.value)} className={inputCls} /></F>
          <F label="Current Salary (₹)"><input type="number" value={form.currentSalary} onChange={e => set('currentSalary', e.target.value)} className={inputCls} /></F>
          <F label="Expected Salary (₹)"><input type="number" value={form.expectedSalary} onChange={e => set('expectedSalary', e.target.value)} className={inputCls} /></F>
          <F label="Source"><select value={form.source} onChange={e => set('source', e.target.value)} className={inputCls}>
            <option value="">Select Source</option>
            {['LinkedIn', 'Naukri', 'Indeed', 'Referral', 'Job Fair', 'Direct Application', 'Headhunting', 'Other'].map(s => <option key={s}>{s}</option>)}
          </select></F>
          <F label="Apply for MRF"><select value={form.mrfId} onChange={e => set('mrfId', e.target.value)} className={inputCls}>
            <option value="">Select MRF (optional)</option>
            {mrfs.map(m => <option key={m.id} value={m.id}>{m.mrfNumber} – {m.designation}</option>)}
          </select></F>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Skills</h4>
        <div className="flex gap-2 mb-2">
          <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} className={inputCls} placeholder="Type skill and press Enter" />
          <button type="button" onClick={addSkill} className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"><Plus size={16} /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.skills.map(s => (
            <span key={s} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">
              {s}<button type="button" onClick={() => setForm(p => ({ ...p, skills: p.skills.filter(x => x !== s) }))}><X size={12} /></button>
            </span>
          ))}
        </div>
      </div>

      {!candidate && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Resume Upload</h4>
          <label className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:border-indigo-400 transition-colors">
            <Upload size={20} className="text-gray-400 mb-1" />
            <span className="text-xs text-gray-500">{resumeFile ? resumeFile.name : 'Click to upload resume (PDF, DOC, DOCX)'}</span>
            <input type="file" accept=".pdf,.doc,.docx" onChange={e => setResumeFile(e.target.files[0])} className="hidden" />
          </label>
        </div>
      )}

      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-60">
        {loading ? 'Saving...' : (candidate ? 'Update Candidate' : 'Add Candidate')}
      </button>
    </form>
  );
};

export default CandidateForm;
