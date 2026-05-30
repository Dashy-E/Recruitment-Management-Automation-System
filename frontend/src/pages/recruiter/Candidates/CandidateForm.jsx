import { useState, useEffect } from 'react';
import { candidateAPI, mrfAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const errCls = "border-red-400 focus:ring-red-400";

const F = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

const PHONE_RE = /^\d{10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[a-zA-Z\s\-']+$/;

function validate(form) {
  const e = {};
  if (!form.firstName.trim()) e.firstName = 'Required';
  else if (!NAME_RE.test(form.firstName.trim())) e.firstName = 'Letters only';

  if (!form.lastName.trim()) e.lastName = 'Required';
  else if (!NAME_RE.test(form.lastName.trim())) e.lastName = 'Letters only';

  if (!form.email.trim()) e.email = 'Required';
  else if (!EMAIL_RE.test(form.email)) e.email = 'Invalid email format';

  if (!form.phone.trim()) e.phone = 'Required';
  else if (!PHONE_RE.test(form.phone.replace(/\s/g, ''))) e.phone = 'Must be exactly 10 digits';

  if (form.alternatePhone && !PHONE_RE.test(form.alternatePhone.replace(/\s/g, ''))) {
    e.alternatePhone = 'Must be exactly 10 digits';
  }

  if (!form.designation.trim()) e.designation = 'Required';

  const exp = Number(form.experience);
  if (form.experience !== '' && (isNaN(exp) || exp < 0)) e.experience = 'Must be 0 or more';

  if (form.currentSalary !== '') {
    const v = Number(form.currentSalary);
    if (isNaN(v) || v < 0) e.currentSalary = 'Must be a positive number';
  }
  if (form.expectedSalary !== '') {
    const v = Number(form.expectedSalary);
    if (isNaN(v) || v < 0) e.expectedSalary = 'Must be a positive number';
  }
  if (form.noticePeriod !== '') {
    const v = Number(form.noticePeriod);
    if (isNaN(v) || v < 0) e.noticePeriod = 'Must be 0 or more';
  }

  if (form.dateOfBirth) {
    const dob = new Date(form.dateOfBirth);
    const today = new Date();
    if (dob >= today) {
      e.dateOfBirth = 'Must be in the past';
    } else {
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 16);
      if (dob > minAge) e.dateOfBirth = 'Candidate must be at least 16 years old';
    }
  }

  return e;
}

const CandidateForm = ({ candidate, onSuccess }) => {
  const [mrfs, setMrfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', alternatePhone: '',
    gender: '', dateOfBirth: '', designation: '', experience: 0,
    currentSalary: '', expectedSalary: '', noticePeriod: '',
    currentCompany: '', source: '', mrfId: '', city: '', country: 'India',
    skills: [],
  });

  useEffect(() => {
    mrfAPI.getAll({ status: 'APPROVED', limit: 100 }).then(r => setMrfs(r.data.data || [])).catch(() => {});
    if (candidate) {
      setForm({
        ...candidate,
        skills: typeof candidate.skills === 'string' ? JSON.parse(candidate.skills) : (candidate.skills || []),
        dateOfBirth: candidate.dateOfBirth ? candidate.dateOfBirth.split('T')[0] : '',
      });
    }
  }, [candidate]);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (touched[k]) setErrors(prev => ({ ...prev, [k]: validate({ ...form, [k]: v })[k] }));
  };

  const blur = (k) => {
    setTouched(p => ({ ...p, [k]: true }));
    setErrors(prev => ({ ...prev, [k]: validate(form)[k] }));
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm(p => ({ ...p, skills: [...p.skills, s] }));
      setSkillInput('');
    }
  };

  const removeSkill = (s) => setForm(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setTouched(Object.fromEntries(Object.keys(form).map(k => [k, true])));
    if (Object.keys(errs).length > 0) return toast.error('Fix the highlighted errors before submitting');

    setLoading(true);
    try {
      const payload = {
        ...form,
        experience: parseInt(form.experience) || 0,
        currentSalary: form.currentSalary !== '' ? parseFloat(form.currentSalary) : undefined,
        expectedSalary: form.expectedSalary !== '' ? parseFloat(form.expectedSalary) : undefined,
        noticePeriod: form.noticePeriod !== '' ? parseInt(form.noticePeriod) : undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        mrfId: form.mrfId || undefined,
      };

      if (candidate) await candidateAPI.update(candidate.id, payload);
      else await candidateAPI.create(payload);

      toast.success(candidate ? 'Candidate updated' : 'Candidate added');
      onSuccess();
    } catch (err) {
      if (err.response?.status === 409) toast.error(err.response.data.message);
      else toast.error('Failed to save candidate');
    } finally {
      setLoading(false);
    }
  };

  const f = (k) => ({
    className: `${inputCls} ${errors[k] ? errCls : ''}`,
    onBlur: () => blur(k),
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h4>
        <div className="grid grid-cols-2 gap-3">
          <F label="First Name" required error={errors.firstName}>
            <input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)} {...f('firstName')} placeholder="e.g. Amit" />
          </F>
          <F label="Last Name" required error={errors.lastName}>
            <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} {...f('lastName')} placeholder="e.g. Kumar" />
          </F>
          <F label="Email" required error={errors.email}>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} {...f('email')} placeholder="name@example.com" />
          </F>
          <F label="Phone (10 digits)" required error={errors.phone}>
            <input type="text" inputMode="numeric" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} {...f('phone')} placeholder="9876543210" />
          </F>
          <F label="Alternate Phone" error={errors.alternatePhone}>
            <input type="text" inputMode="numeric" value={form.alternatePhone} onChange={e => set('alternatePhone', e.target.value.replace(/\D/g, '').slice(0, 10))} {...f('alternatePhone')} placeholder="Optional" />
          </F>
          <F label="Gender">
            <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </F>
          <F label="Date of Birth" error={errors.dateOfBirth}>
            <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} {...f('dateOfBirth')} max={new Date().toISOString().split('T')[0]} />
          </F>
          <F label="City">
            <input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} placeholder="e.g. Mumbai" />
          </F>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Professional Details</h4>
        <div className="grid grid-cols-2 gap-3">
          <F label="Designation" required error={errors.designation}>
            <input type="text" value={form.designation} onChange={e => set('designation', e.target.value)} {...f('designation')} placeholder="e.g. Software Engineer" />
          </F>
          <F label="Experience (months)" error={errors.experience}>
            <input type="text" inputMode="numeric" value={form.experience} onChange={e => set('experience', e.target.value.replace(/\D/g, ''))} {...f('experience')} placeholder="e.g. 24 for 2 years" />
          </F>
          <F label="Current Company">
            <input type="text" value={form.currentCompany} onChange={e => set('currentCompany', e.target.value)} className={inputCls} placeholder="e.g. Acme Corp" />
          </F>
          <F label="Notice Period (days)" error={errors.noticePeriod}>
            <input type="text" inputMode="numeric" value={form.noticePeriod} onChange={e => set('noticePeriod', e.target.value.replace(/\D/g, ''))} {...f('noticePeriod')} placeholder="e.g. 30" />
          </F>
          <F label="Current Salary (₹ per annum)" error={errors.currentSalary}>
            <input type="text" inputMode="numeric" value={form.currentSalary} onChange={e => set('currentSalary', e.target.value.replace(/[^\d.]/g, ''))} {...f('currentSalary')} placeholder="e.g. 600000" />
          </F>
          <F label="Expected Salary (₹ per annum)" error={errors.expectedSalary}>
            <input type="text" inputMode="numeric" value={form.expectedSalary} onChange={e => set('expectedSalary', e.target.value.replace(/[^\d.]/g, ''))} {...f('expectedSalary')} placeholder="e.g. 800000" />
          </F>
          <F label="Source">
            <select value={form.source} onChange={e => set('source', e.target.value)} className={inputCls}>
              <option value="">Select Source</option>
              {['LinkedIn', 'Naukri', 'Indeed', 'Referral', 'Job Fair', 'Direct Application', 'Headhunting', 'Agency', 'Other'].map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Apply for MRF">
            <select value={form.mrfId} onChange={e => set('mrfId', e.target.value)} className={inputCls}>
              <option value="">Select MRF (optional)</option>
              {mrfs.map(m => <option key={m.id} value={m.id}>{m.mrfNumber} – {m.designation}</option>)}
            </select>
          </F>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Skills</h4>
        <div className="flex gap-2 mb-2">
          <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            className={inputCls} placeholder="Type skill and press Enter or +" />
          <button type="button" onClick={addSkill} className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.skills.map(s => (
            <span key={s} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">
              {s}
              <button type="button" onClick={() => removeSkill(s)}><X size={12} /></button>
            </span>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-60">
        {loading ? 'Saving...' : (candidate ? 'Update Candidate' : 'Add Candidate')}
      </button>
    </form>
  );
};

export default CandidateForm;
