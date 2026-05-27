import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { agencyAPI } from '../../../services/api';
import { Building2, Plus, Search, Star, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const TIER_COLORS = {
  PREMIUM: 'bg-yellow-100 text-yellow-800',
  STANDARD: 'bg-blue-100 text-blue-800',
  BASIC: 'bg-gray-100 text-gray-700',
};

export default function AgencyList() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', contactPerson: '', email: '', phone: '', city: '', state: '', country: 'India', tier: 'STANDARD', specializations: '' });

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const res = await agencyAPI.getAll({ search, tier: tierFilter });
      setAgencies(res.data.agencies || []);
    } catch {
      toast.error('Failed to load agencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgencies(); }, [search, tierFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const specs = form.specializations.split(',').map(s => s.trim()).filter(Boolean);
      await agencyAPI.create({ ...form, specializations: specs });
      toast.success('Agency created');
      setShowForm(false);
      setForm({ name: '', contactPerson: '', email: '', phone: '', city: '', state: '', country: 'India', tier: 'STANDARD', specializations: '' });
      fetchAgencies();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create agency');
    }
  };

  const successRate = (a) =>
    a.totalSubmissions ? Math.round((a.successfulHires / a.totalSubmissions) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-indigo-600" /> Agency Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage staffing agency partnerships and submissions</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Agency
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full" placeholder="Search agencies..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
          <option value="">All Tiers</option>
          <option value="PREMIUM">Premium</option>
          <option value="STANDARD">Standard</option>
          <option value="BASIC">Basic</option>
        </select>
      </div>

      {/* Agency Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : agencies.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No agencies found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agencies.map(a => (
            <Link key={a.id} to={`/recruiter/agencies/${a.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{a.name}</h3>
                  <p className="text-xs text-gray-500">{a.agencyCode}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${TIER_COLORS[a.tier] || 'bg-gray-100 text-gray-600'}`}>{a.tier}</span>
              </div>
              <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                <p>{a.contactPerson} · {a.city}, {a.state}</p>
                <p>{a.email}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{a.totalSubmissions} submissions</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-green-600">{successRate(a)}% success</span>
                </div>
                {a.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span>{a.rating}</span>
                  </div>
                )}
              </div>
              {a.specializations && (() => {
                try {
                  const specs = JSON.parse(a.specializations);
                  return specs.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {specs.slice(0, 3).map(s => <span key={s} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                  ) : null;
                } catch { return null; }
              })()}
            </Link>
          ))}
        </div>
      )}

      {/* Add Agency Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b"><h2 className="text-lg font-semibold">Add New Agency</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })}>
                    <option value="BASIC">Basic</option>
                    <option value="STANDARD">Standard</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input required type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specializations (comma separated)</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="IT, Sales, Operations" value={form.specializations} onChange={e => setForm({ ...form, specializations: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Create Agency</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
