import { useEffect, useState } from 'react';
import { userAPI, departmentAPI } from '../../services/api';
import KPICard from '../../components/common/KPICard';
import { Users, Building2, Shield, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    userAPI.getAll().then(r => setUsers(r.data)).catch(() => {});
    departmentAPI.getAll().then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const roleBreakdown = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">System Administration</h2>
        <p className="text-slate-300">Manage users, roles, and system configuration</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Users" value={users.length} icon={Users} color="indigo" />
        <KPICard title="Active Users" value={users.filter(u => u.isActive).length} icon={Activity} color="green" />
        <KPICard title="Departments" value={departments.length} icon={Building2} color="blue" />
        <KPICard title="Roles" value={Object.keys(roleBreakdown).length} icon={Shield} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Users by Role</h3>
          <div className="space-y-2.5">
            {Object.entries(roleBreakdown).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{role.replace('_', ' ')}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(count / users.length) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-5 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Departments</h3>
          <div className="space-y-2">
            {departments.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{d.name}</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{users.filter(u => u.departmentId === d.id).length} users</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
