import { useEffect, useState } from 'react';
import { userAPI, departmentAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { Plus, ToggleLeft, ToggleRight, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

const ROLES = ['ADMIN', 'HR', 'RECRUITER', 'INTERVIEWER', 'TRAINING', 'BRANCH_MANAGER', 'COUNTRY_MANAGER', 'MD', 'EMPLOYEE'];

const UserForm = ({ user, departments, onSuccess }) => {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'RECRUITER', departmentId: '', ...(user || {}) });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        const payload = { email: form.email, firstName: form.firstName, lastName: form.lastName, role: form.role, departmentId: form.departmentId || null };
        if (form.password) payload.password = form.password;
        await userAPI.update(user.id, payload);
      } else await userAPI.create(form);
      toast.success(user ? 'User updated' : 'User created');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">First Name *</label><input type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className={inputCls} required /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Last Name *</label><input type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className={inputCls} required /></div>
        <div className="col-span-2"><label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} required /></div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Password {user ? <span className="font-normal text-gray-400">(leave blank to keep current)</span> : '*'}
          </label>
          <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputCls} required={!user} placeholder={user ? 'Enter new password to change' : 'Minimum 8 characters'} />
        </div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Role *</label><select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={inputCls}>
          {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Department</label><select value={form.departmentId || ''} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value || null }))} className={inputCls}>
          <option value="">No Department</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select></div>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}</button>
    </form>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, d] = await Promise.all([userAPI.getAll(), departmentAPI.getAll()]);
      setUsers(u.data);
      setDepartments(d.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (id) => {
    try { await userAPI.toggleStatus(id); toast.success('Status updated'); fetchData(); }
    catch { toast.error('Failed to toggle'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await userAPI.delete(id); toast.success('User deleted'); fetchData(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-500">{users.length} total users</p>
        </div>
        <button onClick={() => { setEditUser(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <th className="px-5 py-3 text-left">User</th><th className="px-5 py-3 text-left">Role</th><th className="px-5 py-3 text-left">Department</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-left">Last Login</th><th className="px-5 py-3 text-left">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-semibold">{u.firstName?.[0]}{u.lastName?.[0]}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5"><span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">{u.role?.replace('_', ' ')}</span></td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{u.department?.name || '—'}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{u.lastLogin ? format(new Date(u.lastLogin), 'dd MMM, hh:mm a') : 'Never'}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditUser(u); setShowForm(true); }} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit"><Edit2 size={14} /></button>
                    <button onClick={() => handleToggle(u.id)} className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg" title="Toggle">{u.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}</button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editUser ? 'Edit User' : 'Create New User'} size="md">
        <UserForm user={editUser} departments={departments} onSuccess={() => { setShowForm(false); fetchData(); }} />
      </Modal>
    </div>
  );
};

export default AdminUsers;
