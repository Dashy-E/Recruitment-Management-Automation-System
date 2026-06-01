import { useEffect, useState } from 'react';
import { examAPI, candidateAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ClipboardList, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  PENDING:     { color: 'bg-gray-100 text-gray-600',    icon: Clock,         label: 'Pending' },
  LINK_SENT:   { color: 'bg-blue-100 text-blue-700',    icon: ExternalLink,  label: 'Link Sent' },
  PASSED:      { color: 'bg-green-100 text-green-700',  icon: CheckCircle,   label: 'Passed' },
  FAILED:      { color: 'bg-red-100 text-red-600',      icon: XCircle,       label: 'Failed' },
  EXPIRED:     { color: 'bg-orange-100 text-orange-600',icon: Clock,         label: 'Expired' },
};

export default function EmployeeExams() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const cRes = await candidateAPI.getAll({ search: user.email, limit: 5 });
        const candidates = cRes.data.data || [];
        const match = candidates.find(c => c.email.toLowerCase() === user.email.toLowerCase());
        if (!match) { setLoading(false); return; }

        const eRes = await examAPI.getAll({ candidateId: match.id });
        setAttempts(Array.isArray(eRes.data) ? eRes.data : []);
      } catch {
        toast.error('Failed to load exam data');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [user.email]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <ClipboardList size={24} className="text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">My Examinations</h3>
            <p className="text-sm text-gray-500">Exam links and results</p>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No exam links received yet</p>
            <p className="text-xs mt-1">Exam links will appear here once training is complete</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((a, idx) => {
              const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = cfg.icon;
              const isExpired = a.linkExpiresAt && new Date(a.linkExpiresAt) < new Date() && a.status === 'LINK_SENT';
              return (
                <div key={a.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Attempt {idx + 1} — {a.examName || 'Examination'}
                      </p>
                      {a.sentAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Sent: {format(new Date(a.sentAt), 'dd MMM yyyy')}
                          {a.linkExpiresAt && ` · Expires: ${format(new Date(a.linkExpiresAt), 'dd MMM yyyy HH:mm')}`}
                        </p>
                      )}
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                      <StatusIcon size={12} /> {isExpired ? 'Expired' : cfg.label}
                    </span>
                  </div>

                  {a.examLink && !isExpired && a.status === 'LINK_SENT' && (
                    <a
                      href={a.examLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium"
                    >
                      <ExternalLink size={14} /> Open Exam
                    </a>
                  )}

                  {(a.status === 'PASSED' || a.status === 'FAILED') && (
                    <div className="bg-gray-50 rounded-lg px-4 py-3 flex gap-6 text-sm">
                      {a.score != null && (
                        <div>
                          <p className="text-xs text-gray-500">Score</p>
                          <p className="font-semibold text-gray-800">{a.score} / {a.maxScore}</p>
                        </div>
                      )}
                      {a.passingScore != null && (
                        <div>
                          <p className="text-xs text-gray-500">Passing</p>
                          <p className="font-semibold text-gray-800">{a.passingScore}</p>
                        </div>
                      )}
                      {a.completedAt && (
                        <div>
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="font-semibold text-gray-800">{format(new Date(a.completedAt), 'dd MMM yyyy')}</p>
                        </div>
                      )}
                      {a.remarks && (
                        <div>
                          <p className="text-xs text-gray-500">Remarks</p>
                          <p className="font-semibold text-gray-800">{a.remarks}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
