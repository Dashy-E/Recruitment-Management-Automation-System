import { useEffect, useState } from 'react';
import { auditLogAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Database, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';

const ACTION_COLORS = {
  CREATE: 'bg-green-50 text-green-700',
  UPDATE: 'bg-blue-50 text-blue-700',
  DELETE: 'bg-red-50 text-red-700',
  LOGIN:  'bg-purple-50 text-purple-700',
  APPROVE: 'bg-indigo-50 text-indigo-700',
  REJECT: 'bg-orange-50 text-orange-700',
};

const actionColor = (action) => {
  const key = Object.keys(ACTION_COLORS).find(k => action?.toUpperCase().startsWith(k));
  return key ? ACTION_COLORS[key] : 'bg-gray-100 text-gray-600';
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ entity: '', action: '', page: 1 });

  const fetchLogs = async (f = filters) => {
    setLoading(true);
    try {
      const params = { limit: 50, page: f.page };
      if (f.entity) params.entity = f.entity;
      if (f.action) params.action = f.action;
      const res = await auditLogAPI.getAll(params);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    auditLogAPI.getEntities().then(r => setEntities(r.data)).catch(() => {});
    fetchLogs();
  }, []);

  const applyFilters = (next) => {
    const merged = { ...filters, ...next, page: 1 };
    setFilters(merged);
    fetchLogs(merged);
  };

  const changePage = (p) => {
    const merged = { ...filters, page: p };
    setFilters(merged);
    fetchLogs(merged);
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Audit Logs</h2>
          <p className="text-sm text-gray-500">{total} total entries</p>
        </div>
        <button onClick={() => fetchLogs()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-300 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Filter by action..."
            value={filters.action}
            onChange={e => applyFilters({ action: e.target.value })}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.entity}
          onChange={e => applyFilters({ entity: e.target.value })}
        >
          <option value="">All entities</option>
          {entities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {logs.length === 0 && !loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Database size={40} className="text-gray-200" />
            <p className="text-sm">No audit log entries found</p>
            <p className="text-xs text-gray-300">Logs are recorded automatically as users perform actions</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3 text-left">Timestamp</th>
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Action</th>
                <th className="px-5 py-3 text-left">Entity</th>
                <th className="px-5 py-3 text-left">Entity ID</th>
                <th className="px-5 py-3 text-left">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm:ss')}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{log.user?.firstName} {log.user?.lastName}</p>
                        <p className="text-xs text-gray-400">{log.user?.role?.replace('_', ' ')}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${actionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{log.entity}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{log.entityId ? log.entityId.slice(0, 12) + '…' : '—'}</td>
                      <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{log.ipAddress || '—'}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {filters.page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={filters.page <= 1}
              onClick={() => changePage(filters.page - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >Previous</button>
            <button
              disabled={filters.page >= totalPages}
              onClick={() => changePage(filters.page + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
