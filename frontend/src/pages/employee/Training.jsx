import { GraduationCap, Calendar, User, MapPin } from 'lucide-react';

const EmployeeTraining = () => (
  <div className="max-w-2xl space-y-5">
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <GraduationCap size={24} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Training Schedule</h3>
          <p className="text-sm text-gray-500">Your assigned training sessions</p>
        </div>
      </div>
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No training sessions assigned yet</p>
        <p className="text-xs mt-1">Training will be visible once you're enrolled in a batch</p>
      </div>
    </div>
  </div>
);

export default EmployeeTraining;
