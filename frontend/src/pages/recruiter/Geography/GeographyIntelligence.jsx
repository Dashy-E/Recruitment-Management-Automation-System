import { useState, useEffect } from 'react';
import { geographyAPI } from '../../../services/api';
import { MapPin, Building2, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const ZONE_COLORS = {
  'Zone-N1': 'bg-blue-100 text-blue-700',
  'Zone-N2': 'bg-blue-50 text-blue-600',
  'Zone-S1': 'bg-green-100 text-green-700',
  'Zone-S2': 'bg-green-50 text-green-600',
  'Zone-S3': 'bg-emerald-100 text-emerald-700',
  'Zone-W1': 'bg-purple-100 text-purple-700',
  'Zone-W2': 'bg-purple-50 text-purple-600',
  'Zone-E1': 'bg-orange-100 text-orange-700',
};

export default function GeographyIntelligence() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('');

  useEffect(() => {
    geographyAPI.getIntelligence()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load geography data'))
      .finally(() => setLoading(false));
  }, []);

  const zones = [...new Set(data.map(d => d.zone).filter(Boolean))].sort();

  const filtered = data.filter(d => {
    const matchSearch = `${d.city} ${d.state}`.toLowerCase().includes(search.toLowerCase());
    const matchZone = !selectedZone || d.zone === selectedZone;
    return matchSearch && matchZone;
  });

  const totalCandidates = filtered.reduce((s, d) => s + d.candidateCount, 0);
  const totalAgencies = filtered.reduce((s, d) => s + d.agencyCount, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="h-7 w-7 text-teal-600" /> Geographic Workforce Intelligence
        </h1>
        <p className="text-sm text-gray-500 mt-1">Candidate distribution and agency coverage by location</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: MapPin, label: 'Cities', val: data.length, color: 'text-teal-600 bg-teal-50' },
          { icon: Users, label: 'Total Candidates', val: data.reduce((s, d) => s + d.candidateCount, 0), color: 'text-blue-600 bg-blue-50' },
          { icon: Building2, label: 'Agency Offices', val: data.reduce((s, d) => s + d.agencyCount, 0), color: 'text-indigo-600 bg-indigo-50' },
          { icon: TrendingUp, label: 'Active Pipeline', val: data.reduce((s, d) => s + d.activeCount, 0), color: 'text-green-600 bg-green-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${k.color} flex items-center justify-center`}>
              <k.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{k.val}</p>
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48"
          placeholder="Search city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
          <option value="">All Zones</option>
          {zones.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>

      {/* Location Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(loc => (
            <div key={loc.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{loc.city}</h3>
                  <p className="text-xs text-gray-500">{loc.state}</p>
                </div>
                {loc.zone && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ZONE_COLORS[loc.zone] || 'bg-gray-100 text-gray-600'}`}>{loc.zone}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-blue-700">{loc.candidateCount}</p>
                  <p className="text-xs text-blue-600">Candidates</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-green-700">{loc.agencyCount}</p>
                  <p className="text-xs text-green-600">Agencies</p>
                </div>
              </div>

              {loc.activeCount > 0 && (
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${loc.candidateCount ? (loc.activeCount / loc.candidateCount) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{loc.activeCount} active</span>
                </div>
              )}

              {loc.activeAgencies.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Active Agencies:</p>
                  <div className="flex flex-wrap gap-1">
                    {loc.activeAgencies.slice(0, 2).map(a => (
                      <span key={a.id} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full truncate max-w-[120px]">{a.name}</span>
                    ))}
                    {loc.activeAgencies.length > 2 && (
                      <span className="text-xs text-gray-400">+{loc.activeAgencies.length - 2} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
