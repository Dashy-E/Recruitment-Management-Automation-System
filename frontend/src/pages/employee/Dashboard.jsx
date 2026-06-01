import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { candidateAPI } from '../../services/api';
import { User, FileText, GraduationCap, ClipboardList, Mail, CheckCircle, Circle, Loader } from 'lucide-react';

// Shared recruitment journey definition — imported by CandidateDetail too
export const JOURNEY_STEPS = [
  { label: 'Applied',      statuses: ['APPLIED'] },
  { label: 'Shortlisted',  statuses: ['SHORTLISTED'] },
  { label: 'Interview',    statuses: ['INTERVIEW_SCHEDULED', 'SELECTED'] },
  { label: 'Training',     statuses: ['TRAINING_PENDING', 'TRAINING_IN_PROGRESS'] },
  { label: 'Exam',         statuses: ['EXAM_PENDING', 'EXAM_COMPLETED', 'FINAL_APPROVED'] },
  { label: 'Offer',        statuses: ['OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_REJECTED'] },
  { label: 'Onboarded',    statuses: ['ONBOARDED'] },
];

// Returns { currentStep (0-based index), done (bool for each step) }
export function getJourneyProgress(status) {
  if (!status) return { currentStep: -1 };
  const upper = status.toUpperCase();
  const idx = JOURNEY_STEPS.findIndex(s => s.statuses.includes(upper));
  return { currentStep: idx };
}

const JourneyBar = ({ status, compact = false }) => {
  const { currentStep } = getJourneyProgress(status);
  const rejected = status === 'REJECTED';

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-0'} flex-wrap`}>
      {JOURNEY_STEPS.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        const isLast = i === JOURNEY_STEPS.length - 1;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`
                ${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-xs'}
                rounded-full flex items-center justify-center font-semibold transition-colors
                ${rejected && active ? 'bg-red-100 text-red-600 border-2 border-red-400'
                  : done ? 'bg-indigo-600 text-white'
                  : active ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500 ring-2 ring-indigo-200'
                  : 'bg-gray-100 text-gray-400'}
              `}>
                {done ? <CheckCircle size={compact ? 12 : 14} /> : i + 1}
              </div>
              {!compact && (
                <span className={`text-xs mt-1 font-medium whitespace-nowrap ${done ? 'text-indigo-600' : active ? 'text-indigo-700' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              )}
            </div>
            {!isLast && (
              <div className={`${compact ? 'w-3 h-0.5 mx-0.5' : 'w-6 h-0.5 mx-1'} ${done ? 'bg-indigo-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export { JourneyBar };

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    candidateAPI.getAll({ search: user.email, limit: 5 })
      .then(r => {
        const list = r.data.data || [];
        const match = list.find(c => c.email.toLowerCase() === user.email.toLowerCase());
        setCandidate(match || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.email]);

  const quickLinks = [
    { label: 'My Profile',     to: '/employee/profile',    icon: User,         desc: 'View and update your profile',   color: 'indigo' },
    { label: 'Documents',      to: '/employee/documents',  icon: FileText,     desc: 'Manage your identity documents', color: 'blue' },
    { label: 'Training',       to: '/employee/training',   icon: GraduationCap,desc: 'View your training schedule',    color: 'emerald' },
    { label: 'Examinations',   to: '/employee/exams',      icon: ClipboardList,desc: 'Take your assessment exams',     color: 'orange' },
    { label: 'Offer Letter',   to: '/employee/offers',     icon: Mail,         desc: 'View your offer letter',         color: 'purple' },
  ];

  const status = candidate?.status;
  const { currentStep } = getJourneyProgress(status);
  const stepLabel = currentStep >= 0 ? JOURNEY_STEPS[currentStep]?.label : null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">Welcome, {user?.firstName}!</h2>
        <p className="text-teal-100">
          {loading ? 'Loading your status…' : status ? `Current stage: ${status.replace(/_/g, ' ')}` : 'Your recruitment journey at a glance'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map(({ label, to, icon: Icon, desc, color }) => (
          <Link key={to} to={to} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className={`w-11 h-11 bg-${color}-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-${color}-200 transition-colors`}>
              <Icon size={20} className={`text-${color}-600`} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{label}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recruitment Journey</h3>
          {loading && <Loader size={14} className="text-gray-400 animate-spin" />}
          {!loading && stepLabel && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
              Currently: {stepLabel}
            </span>
          )}
          {!loading && !candidate && (
            <span className="text-xs text-gray-400">No candidate record linked to this account</span>
          )}
          {!loading && status === 'REJECTED' && (
            <span className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-medium">Not progressed</span>
          )}
        </div>
        {loading ? (
          <div className="h-10 flex items-center gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="overflow-x-auto pb-1">
            <JourneyBar status={status || 'APPLIED'} />
          </div>
        )}
        {candidate && (
          <p className="text-xs text-gray-400 mt-3">
            Candidate ID: {candidate.candidateId} · {candidate.firstName} {candidate.lastName}
          </p>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
