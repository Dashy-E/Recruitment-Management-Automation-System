import { useState, useEffect } from 'react';
import { mrfAPI, departmentAPI } from '../../../services/api';
import { INDIAN_LOCATIONS } from '../../../constants/locations';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';

const Err = ({ msg }) => msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

const F = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    <Err msg={error} />
  </div>
);

const inputBase = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors";
const cls = (err) => `${inputBase} ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

const BLANK = {
  departmentId: '', designation: '', vacancies: '1', experience: '',
  skills: [], salaryMin: '', salaryMax: '', location: '',
  branch: '', country: 'India', reportingManager: '',
  priority: 'NORMAL', description: '', status: 'DRAFT',
};

function validate(form) {
  const e = {};

  if (!form.departmentId) e.departmentId = 'Department is required.';

  const desig = form.designation.trim();
  if (!desig) e.designation = 'Designation is required.';
  else if (desig.length < 2) e.designation = 'Must be at least 2 characters.';
  else if (desig.length > 100) e.designation = 'Must be 100 characters or fewer.';

  const vac = parseInt(form.vacancies, 10);
  if (!form.vacancies && form.vacancies !== 0) e.vacancies = 'Number of vacancies is required.';
  else if (isNaN(vac) || vac < 1) e.vacancies = 'Must be at least 1.';
  else if (vac > 999) e.vacancies = 'Cannot exceed 999.';

  if (form.experience && !/^\d{1,2}$/.test(form.experience)) e.experience = 'Enter a number between 0 and 99.';

  const sMin = form.salaryMin !== '' ? parseFloat(form.salaryMin) : null;
  const sMax = form.salaryMax !== '' ? parseFloat(form.salaryMax) : null;

  if (form.salaryMin !== '' && (isNaN(sMin) || sMin < 0)) e.salaryMin = 'Enter a valid positive amount.';
  if (form.salaryMax !== '' && (isNaN(sMax) || sMax < 0)) e.salaryMax = 'Enter a valid positive amount.';
  if (sMin !== null && sMax !== null && sMax <= sMin) e.salaryMax = 'Max salary must be greater than min salary.';

  if (form.branch.trim().length > 100) e.branch = 'Must be 100 characters or fewer.';

  const rm = form.reportingManager.trim();
  if (rm && !/^[a-zA-Z\s.'-]{2,80}$/.test(rm)) e.reportingManager = 'Only letters and basic punctuation (2–80 chars).';

  if (form.description.trim().length > 5000) e.description = 'Must be 5000 characters or fewer.';

  return e;
}

const MRFForm = ({ mrf, onSuccess }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skillErr, setSkillErr] = useState('');
  const [form, setForm] = useState(BLANK);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    departmentAPI.getAll().then(r => setDepartments(r.data)).catch(() => {});
    if (mrf) {
      setForm({
        ...BLANK,
        ...mrf,
        vacancies: String(mrf.vacancies ?? 1),
        salaryMin: mrf.salaryMin != null ? String(mrf.salaryMin) : '',
        salaryMax: mrf.salaryMax != null ? String(mrf.salaryMax) : '',
        skills: typeof mrf.skills === 'string' ? JSON.parse(mrf.skills) : (mrf.skills || []),
      });
    }
  }, [mrf]);

  const set = (key, val) => {
    setForm(p => {
      const next = { ...p, [key]: val };
      if (touched[key]) setErrors(validate(next));
      return next;
    });
  };

  const blur = (key) => {
    setTouched(p => ({ ...p, [key]: true }));
    setErrors(validate(form));
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) { setSkillErr('Enter a skill name.'); return; }
    if (s.length > 50) { setSkillErr('Skill must be 50 characters or fewer.'); return; }
    if (!/^[a-zA-Z0-9\s\+\#\.\-\/]{1,50}$/.test(s)) { setSkillErr('Only letters, numbers, and +#.-/ allowed.'); return; }
    if (form.skills.includes(s)) { setSkillErr('Skill already added.'); return; }
    setForm(p => ({ ...p, skills: [...p.skills, s] }));
    setSkillInput('');
    setSkillErr('');
  };

  const removeSkill = (s) => setForm(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the errors before saving.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        designation: form.designation.trim(),
        branch: form.branch.trim(),
        reportingManager: form.reportingManager.trim(),
        description: form.description.trim(),
        vacancies: parseInt(form.vacancies, 10),
        salaryMin: form.salaryMin !== '' ? parseFloat(form.salaryMin) : undefined,
        salaryMax: form.salaryMax !== '' ? parseFloat(form.salaryMax) : undefined,
        experience: form.experience !== '' ? form.experience : undefined,
      };
      if (mrf) await mrfAPI.update(mrf.id, payload);
      else await mrfAPI.create(payload);
      toast.success(mrf ? 'MRF updated' : 'MRF created');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save MRF');
    } finally { setLoading(false); }
  };

  const numericOnly = (val) => val.replace(/[^0-9]/g, '');

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <F label="Department" required error={touched.departmentId && errors.departmentId}>
          <select
            value={form.departmentId}
            onChange={e => set('departmentId', e.target.value)}
            onBlur={() => blur('departmentId')}
            className={cls(touched.departmentId && errors.departmentId)}
          >
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </F>

        <F label="Designation / Role" required error={touched.designation && errors.designation}>
          <input
            type="text"
            value={form.designation}
            onChange={e => set('designation', e.target.value)}
            onBlur={() => blur('designation')}
            className={cls(touched.designation && errors.designation)}
            placeholder="e.g. Senior Software Engineer"
            maxLength={100}
          />
        </F>

        <F label="Number of Vacancies" required error={touched.vacancies && errors.vacancies}>
          <input
            type="text"
            inputMode="numeric"
            value={form.vacancies}
            onChange={e => set('vacancies', numericOnly(e.target.value))}
            onBlur={() => blur('vacancies')}
            className={cls(touched.vacancies && errors.vacancies)}
            placeholder="e.g. 3"
            maxLength={3}
          />
        </F>

        <F label="Experience Required (years)" error={touched.experience && errors.experience}>
          <input
            type="text"
            inputMode="numeric"
            value={form.experience}
            onChange={e => set('experience', numericOnly(e.target.value))}
            onBlur={() => blur('experience')}
            className={cls(touched.experience && errors.experience)}
            placeholder="e.g. 3"
            maxLength={2}
          />
        </F>

        <F label="Min Salary — CTC (₹)" error={touched.salaryMin && errors.salaryMin}>
          <input
            type="text"
            inputMode="numeric"
            value={form.salaryMin}
            onChange={e => set('salaryMin', numericOnly(e.target.value))}
            onBlur={() => blur('salaryMin')}
            className={cls(touched.salaryMin && errors.salaryMin)}
            placeholder="e.g. 500000"
          />
        </F>

        <F label="Max Salary — CTC (₹)" error={touched.salaryMax && errors.salaryMax}>
          <input
            type="text"
            inputMode="numeric"
            value={form.salaryMax}
            onChange={e => set('salaryMax', numericOnly(e.target.value))}
            onBlur={() => blur('salaryMax')}
            className={cls(touched.salaryMax && errors.salaryMax)}
            placeholder="e.g. 1000000"
          />
        </F>

        <F label="Location (City)" error={touched.location && errors.location}>
          <select
            value={form.location}
            onChange={e => set('location', e.target.value)}
            onBlur={() => blur('location')}
            className={cls(touched.location && errors.location)}
          >
            <option value="">Select city</option>
            {INDIAN_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </F>

        <F label="Branch / Office" error={touched.branch && errors.branch}>
          <input
            type="text"
            value={form.branch}
            onChange={e => set('branch', e.target.value)}
            onBlur={() => blur('branch')}
            className={cls(touched.branch && errors.branch)}
            placeholder="e.g. Mumbai HQ"
            maxLength={100}
          />
        </F>

        <F label="Reporting Manager" error={touched.reportingManager && errors.reportingManager}>
          <input
            type="text"
            value={form.reportingManager}
            onChange={e => set('reportingManager', e.target.value)}
            onBlur={() => blur('reportingManager')}
            className={cls(touched.reportingManager && errors.reportingManager)}
            placeholder="e.g. Rajesh Sharma"
            maxLength={80}
          />
        </F>

        <F label="Priority">
          <select
            value={form.priority}
            onChange={e => set('priority', e.target.value)}
            className={cls(false)}
          >
            {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </F>

      </div>

      <F label="Required Skills">
        <div className="flex gap-2 mb-1">
          <input
            type="text"
            value={skillInput}
            onChange={e => { setSkillInput(e.target.value); setSkillErr(''); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            className={cls(!!skillErr)}
            placeholder="Type a skill and press Enter or +"
            maxLength={50}
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm"
          >
            <Plus size={16} />
          </button>
        </div>
        <Err msg={skillErr} />
        <div className="flex flex-wrap gap-2 mt-2">
          {form.skills.map(s => (
            <span key={s} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">
              {s}
              <button type="button" onClick={() => removeSkill(s)}><X size={12} /></button>
            </span>
          ))}
        </div>
      </F>

      <F label="Job Description" error={touched.description && errors.description}>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          onBlur={() => blur('description')}
          className={cls(touched.description && errors.description)}
          rows={4}
          placeholder="Detailed job description..."
          maxLength={5000}
        />
        <p className="text-xs text-gray-400 mt-0.5 text-right">{form.description.length}/5000</p>
      </F>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-60"
        >
          {loading ? 'Saving…' : (mrf ? 'Update MRF' : 'Create MRF')}
        </button>
      </div>
    </form>
  );
};

export default MRFForm;
