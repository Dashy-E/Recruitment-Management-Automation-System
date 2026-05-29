import { useEffect, useState } from 'react';
import { departmentAPI, userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Building2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, u] = await Promise.all([departmentAPI.getAll(), userAPI.getAll()]);
      setDepartments(d.data);
      setUsers(u.data);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditDept(null); setForm({ name: '', description: '' }); setShowForm(true); };
  const openEdit = (dept) => { setEditDept(dept); setForm({ name: dept.name, description: dept.description || '' }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Department name is required');
    setSaving(true);
    try {
      if (editDept) {
        await departmentAPI.update(editDept.id, form);
        toast.success('Department updated');
      } else {
        await departmentAPI.create(form);
        toast.success('Department created');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (dept) => {
    try {
      await departmentAPI.update(dept.id, { isActive: !dept.isActive });
      toast.success(dept.isActive ? 'Department deactivated' : 'Department activated');
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const userCountFor = (deptId) => users.filter(u => u.departmentId === deptId).length;

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Departments</h2>
          <p className="text-sm text-gray-500">{departments.length} department{departments.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus size={16} /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 flex flex-col items-center gap-3 text-gray-400">
          <Building2 size={40} className="text-gray-200" />
          <p className="text-sm">No departments yet</p>
          <button onClick={openCreate} className="text-sm text-indigo-600 hover:underline">Create the first department</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => {
            const count = userCountFor(dept.id);
            return (
              <div key={dept.id} className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-3 ${dept.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{dept.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dept.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(dept)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleToggle(dept)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg" title="Toggle status">
                      {dept.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                  </div>
                </div>

                {dept.description && (
                  <p className="text-xs text-gray-500 leading-relaxed">{dept.description}</p>
                )}

                <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{count} user{count !== 1 ? 's' : ''} assigned</span>
                  {count > 0 && (
                    <div className="flex -space-x-1.5">
                      {users.filter(u => u.departmentId === dept.id).slice(0, 4).map(u => (
                        <div key={u.id} className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold border border-white" title={`${u.firstName} ${u.lastName}`}>
                          {u.firstName?.[0]}
                        </div>
                      ))}
                      {count > 4 && (
                        <div className="w-6 h-6 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-xs font-semibold border border-white">
                          +{count - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{editDept ? 'Edit Department' : 'New Department'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department Name *</label>
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Engineering, Sales, HR"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  className={inputCls}
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of this department"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? 'Saving…' : editDept ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
