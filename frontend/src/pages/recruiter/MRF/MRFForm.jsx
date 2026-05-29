import { useState, useEffect } from 'react';
import { mrfAPI, departmentAPI } from '../../../services/api';
import { INDIAN_LOCATIONS } from '../../../constants/locations';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';

const F = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    {children}
  </div>
);

const MRFForm = ({ mrf, onSuccess }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    departmentId: '', designation: '', vacancies: 1, experience: '',
    skills: [], salaryMin: '', salaryMax: '', location: '',
    branch: '', country: 'India', reportingManager: '',
    priority: 'NORMAL', description: '', status: 'DRAFT',
  });

  useEffect(() => {
    departmentAPI.getAll().then(r => setDepartments(r.data)).catch(() => {});
    if (mrf) {
      setForm({
        ...mrf,
        skills: typeof mrf.skills === 'string' ? JSON.parse(mrf.skills) : (mrf.skills || []),
      });
    }
  }, [mrf]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const addSkill = () => {
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      setForm(p => ({ ...p, skills: [...p.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkill = (s) => setForm(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.departmentId || !form.designation || !form.vacancies) return toast.error('Fill all required fields');
    setLoading(true);
    try {
      const payload = { ...form, vacancies: parseInt(form.vacancies), salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : undefined, salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : undefined };
      if (mrf) await mrfAPI.update(mrf.id, payload);
      else await mrfAPI.create(payload);
      toast.success(mrf ? 'MRF updated' : 'MRF created');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save MRF');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <F label="Department" required>
          <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} className={inputCls} required>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </F>
        <F label="Designation / Role" required>
          <input type="text" value={form.designation} onChange={e => set('designation', e.target.value)} className={inputCls} placeholder="e.g. Senior Software Engineer" required />
        </F>
        <F label="Number of Vacancies" required>
          <input type="number" min="1" value={form.vacancies} onChange={e => set('vacancies', e.target.value)} className={inputCls} required />
        </F>
        <F label="Experience Required">
          <input type="text" value={form.experience} onChange={e => set('experience', e.target.value)} className={inputCls} placeholder="e.g. 3-5 years" />
        </F>
        <F label="Min Salary (CTC)">
          <input type="text" inputMode="numeric" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} className={inputCls} placeholder="e.g. 500000" />
        </F>
        <F label="Max Salary (CTC)">
          <input type="text" inputMode="numeric" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} className={inputCls} placeholder="e.g. 1000000" />
        </F>
        <F label="Location (City)">
          <select value={form.location} onChange={e => set('location', e.target.value)} className={inputCls}>
            <option value="">Select city</option>
            {INDIAN_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </F>
        <F label="Branch / Office">
          <input type="text" value={form.branch} onChange={e => set('branch', e.target.value)} className={inputCls} />
        </F>
        <F label="Reporting Manager">
          <input type="text" value={form.reportingManager} onChange={e => set('reportingManager', e.target.value)} className={inputCls} />
        </F>
        <F label="Priority">
          <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputCls}>
            {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </F>
      </div>

      <F label="Required Skills">
        <div className="flex gap-2 mb-2">
          <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} className={inputCls} placeholder="Type skill and press Enter" />
          <button type="button" onClick={addSkill} className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm">
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
      </F>

      <F label="Job Description">
        <textarea value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} rows={4} placeholder="Detailed job description..." />
      </F>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-60">
          {loading ? 'Saving...' : (mrf ? 'Update MRF' : 'Create MRF')}
        </button>
      </div>
    </form>
  );
};

export default MRFForm;
