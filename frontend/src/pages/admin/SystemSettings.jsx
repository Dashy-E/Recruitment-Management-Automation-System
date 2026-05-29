import { useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, Bell, Shield, Database, Globe, Save } from 'lucide-react';

const STORAGE_KEY = 'recruitpro_settings';

const defaults = {
  companyName: 'RecruitPro Corp',
  companyEmail: 'hr@company.com',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  sessionTimeout: '60',
  passwordMinLength: '8',
  requireMFA: false,
  emailNotifications: true,
  interviewReminders: true,
  offerAlerts: true,
  probationAlerts: true,
  autoArchiveDays: '90',
  maxFileSize: '10',
};

const load = () => {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return defaults; }
};

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
        <Icon size={16} className="text-indigo-600" />
      </div>
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
    </div>
    <div className="px-5 py-4 space-y-4">{children}</div>
  </div>
);

const Field = ({ label, hint, children }) => (
  <div className="flex items-center justify-between gap-6">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const inputCls = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56';

const SystemSettings = () => {
  const [s, setS] = useState(load);
  const set = (key, val) => setS(prev => ({ ...prev, [key]: val }));

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    toast.success('Settings saved');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">System Settings</h2>
          <p className="text-sm text-gray-500">Configure global application behaviour</p>
        </div>
        <button onClick={save} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Save size={15} /> Save Changes
        </button>
      </div>

      <Section icon={Globe} title="General">
        <Field label="Company Name">
          <input className={inputCls} value={s.companyName} onChange={e => set('companyName', e.target.value)} />
        </Field>
        <Field label="Company Email">
          <input className={inputCls} type="email" value={s.companyEmail} onChange={e => set('companyEmail', e.target.value)} />
        </Field>
        <Field label="Timezone">
          <select className={inputCls} value={s.timezone} onChange={e => set('timezone', e.target.value)}>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
          </select>
        </Field>
        <Field label="Date Format">
          <select className={inputCls} value={s.dateFormat} onChange={e => set('dateFormat', e.target.value)}>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </Field>
      </Section>

      <Section icon={Shield} title="Security">
        <Field label="Session Timeout" hint="Minutes of inactivity before auto-logout">
          <select className={inputCls} value={s.sessionTimeout} onChange={e => set('sessionTimeout', e.target.value)}>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="120">2 hours</option>
            <option value="480">8 hours</option>
          </select>
        </Field>
        <Field label="Minimum Password Length">
          <select className={inputCls} value={s.passwordMinLength} onChange={e => set('passwordMinLength', e.target.value)}>
            <option value="6">6 characters</option>
            <option value="8">8 characters</option>
            <option value="10">10 characters</option>
            <option value="12">12 characters</option>
          </select>
        </Field>
        <Field label="Require MFA" hint="Two-factor authentication for all users">
          <Toggle checked={s.requireMFA} onChange={v => set('requireMFA', v)} />
        </Field>
      </Section>

      <Section icon={Bell} title="Notifications">
        <Field label="Email Notifications" hint="Send email alerts for key events">
          <Toggle checked={s.emailNotifications} onChange={v => set('emailNotifications', v)} />
        </Field>
        <Field label="Interview Reminders" hint="Remind interviewers 24 hrs before scheduled interviews">
          <Toggle checked={s.interviewReminders} onChange={v => set('interviewReminders', v)} />
        </Field>
        <Field label="Offer Letter Alerts" hint="Notify HR when an offer is accepted or rejected">
          <Toggle checked={s.offerAlerts} onChange={v => set('offerAlerts', v)} />
        </Field>
        <Field label="Probation Due Alerts" hint="Alert managers 2 weeks before probation end date">
          <Toggle checked={s.probationAlerts} onChange={v => set('probationAlerts', v)} />
        </Field>
      </Section>

      <Section icon={Database} title="Data & Storage">
        <Field label="Auto-archive Candidates After" hint="Days since last activity before moving to archive">
          <select className={inputCls} value={s.autoArchiveDays} onChange={e => set('autoArchiveDays', e.target.value)}>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">1 year</option>
          </select>
        </Field>
        <Field label="Max File Upload Size" hint="Maximum size per document upload">
          <select className={inputCls} value={s.maxFileSize} onChange={e => set('maxFileSize', e.target.value)}>
            <option value="5">5 MB</option>
            <option value="10">10 MB</option>
            <option value="25">25 MB</option>
            <option value="50">50 MB</option>
          </select>
        </Field>
        <Field label="Database" hint="Current storage backend">
          <span className="text-sm text-gray-500 font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">SQLite (dev.db)</span>
        </Field>
      </Section>

      <Section icon={Settings} title="About">
        <Field label="Application Version">
          <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">RecruitPro ERP v3.0</span>
        </Field>
        <Field label="API Base URL">
          <span className="text-sm text-gray-500 font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">http://localhost:5000/api</span>
        </Field>
        <Field label="Frontend URL">
          <span className="text-sm text-gray-500 font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">http://localhost:5173</span>
        </Field>
      </Section>
    </div>
  );
};

export default SystemSettings;
