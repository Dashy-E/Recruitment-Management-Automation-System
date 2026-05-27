import { ClipboardList } from 'lucide-react';

const EmployeeExams = () => (
  <div className="max-w-2xl space-y-5">
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
          <ClipboardList size={24} className="text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">My Examinations</h3>
          <p className="text-sm text-gray-500">Exam links and results</p>
        </div>
      </div>
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No exam links received yet</p>
        <p className="text-xs mt-1">Exam links will be sent to your email once training is complete</p>
      </div>
    </div>
  </div>
);

export default EmployeeExams;
