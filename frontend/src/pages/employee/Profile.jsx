import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Building2, Shield } from 'lucide-react';

const EmployeeProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center text-2xl font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-gray-500">{user?.role?.replace('_', ' ')}</p>
            {user?.department && <p className="text-sm text-indigo-600">{user.department.name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: Shield, label: 'Role', value: user?.role?.replace('_', ' ') },
            { icon: Building2, label: 'Department', value: user?.department?.name || '—' },
            { icon: User, label: 'Status', value: user?.isActive ? 'Active' : 'Inactive' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
