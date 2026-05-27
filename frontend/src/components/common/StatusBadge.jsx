const statusConfig = {
  // Candidate statuses
  APPLIED: { label: 'Applied', class: 'bg-gray-100 text-gray-700' },
  SHORTLISTED: { label: 'Shortlisted', class: 'bg-blue-100 text-blue-700' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', class: 'bg-orange-100 text-orange-700' },
  SELECTED: { label: 'Selected', class: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', class: 'bg-red-100 text-red-700' },
  HOLD: { label: 'On Hold', class: 'bg-yellow-100 text-yellow-700' },
  TRAINING_PENDING: { label: 'Training Pending', class: 'bg-purple-100 text-purple-700' },
  TRAINING_IN_PROGRESS: { label: 'Training', class: 'bg-violet-100 text-violet-700' },
  EXAM_PENDING: { label: 'Exam Pending', class: 'bg-amber-100 text-amber-700' },
  EXAM_COMPLETED: { label: 'Exam Completed', class: 'bg-teal-100 text-teal-700' },
  OFFER_SENT: { label: 'Offer Sent', class: 'bg-cyan-100 text-cyan-700' },
  OFFER_ACCEPTED: { label: 'Offer Accepted', class: 'bg-emerald-100 text-emerald-700' },
  OFFER_REJECTED: { label: 'Offer Rejected', class: 'bg-rose-100 text-rose-700' },
  ONBOARDED: { label: 'Onboarded', class: 'bg-indigo-100 text-indigo-700' },
  PROBATION: { label: 'Probation', class: 'bg-slate-100 text-slate-700' },
  CONFIRMED: { label: 'Confirmed', class: 'bg-green-100 text-green-800' },
  FINAL_APPROVED: { label: 'Final Approved', class: 'bg-emerald-100 text-emerald-800' },
  // MRF statuses
  DRAFT: { label: 'Draft', class: 'bg-gray-100 text-gray-600' },
  PENDING: { label: 'Pending', class: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Approved', class: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Closed', class: 'bg-slate-100 text-slate-600' },
  // Interview/other
  SCHEDULED: { label: 'Scheduled', class: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Completed', class: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
  RESCHEDULED: { label: 'Rescheduled', class: 'bg-orange-100 text-orange-700' },
  // Training
  UPCOMING: { label: 'Upcoming', class: 'bg-blue-100 text-blue-700' },
  ONGOING: { label: 'Ongoing', class: 'bg-green-100 text-green-700' },
  ENROLLED: { label: 'Enrolled', class: 'bg-indigo-100 text-indigo-700' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-orange-100 text-orange-700' },
  DROPPED: { label: 'Dropped', class: 'bg-red-100 text-red-700' },
  // Exam
  LINK_SENT: { label: 'Link Sent', class: 'bg-blue-100 text-blue-700' },
  PASSED: { label: 'Passed', class: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Failed', class: 'bg-red-100 text-red-700' },
  PASS: { label: 'Pass', class: 'bg-green-100 text-green-700' },
  FAIL: { label: 'Fail', class: 'bg-red-100 text-red-700' },
  // Offer
  SENT: { label: 'Sent', class: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Accepted', class: 'bg-green-100 text-green-700' },
  EXPIRED: { label: 'Expired', class: 'bg-gray-100 text-gray-600' },
  PENDING_APPROVAL: { label: 'Pending Approval', class: 'bg-yellow-100 text-yellow-700' },
  // Priority
  LOW: { label: 'Low', class: 'bg-gray-100 text-gray-600' },
  NORMAL: { label: 'Normal', class: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'High', class: 'bg-orange-100 text-orange-700' },
  URGENT: { label: 'Urgent', class: 'bg-red-100 text-red-700' },
};

const StatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || { label: status, class: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class} ${className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
