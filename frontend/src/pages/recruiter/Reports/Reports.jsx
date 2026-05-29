import { useEffect, useState } from 'react';
import { reportAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Download, AlertCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import toast from 'react-hot-toast';

const safeFormat = (value, fmt) => {
  if (!value) return '—';
  const d = new Date(value);
  return isValid(d) ? format(d, fmt) : '—';
};

const Reports = () => {
  const [activeReport, setActiveReport] = useState('candidates');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ from: '', to: '', status: '' });

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (activeReport === 'candidates') res = await reportAPI.candidates(filters);
      else if (activeReport === 'interviews') res = await reportAPI.interviews(filters);
      else if (activeReport === 'training') res = await reportAPI.training();
      else if (activeReport === 'exams') res = await reportAPI.exams();
      else if (activeReport === 'mrf') res = await reportAPI.mrf();
      const d = res?.data;
      setData(Array.isArray(d) ? d : []);
    } catch (err) {
      setError('Failed to load report. Please try again.');
      toast.error('Failed to load report');
      setData([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [activeReport]);

  const reportTabs = [
    { id: 'candidates', label: 'Candidate Report' },
    { id: 'interviews', label: 'Interview Report' },
    { id: 'training', label: 'Training Report' },
    { id: 'exams', label: 'Exam Report' },
    { id: 'mrf', label: 'MRF Report' },
  ];

  const handleExportCSV = () => {
    if (!data.length) return toast.error('No data to export');
    const skipKeys = ['id', 'createdById', 'addedById', 'departmentId', 'mrfId', 'candidateId'];
    const headers = Object.keys(data[0]).filter(k => !skipKeys.includes(k));
    const rows = data.map(row => headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val).replace(/"/g, '""');
    }));
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${activeReport}-report-${format(new Date(), 'yyyyMMdd')}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Reports & Analytics</h2>
        <button onClick={handleExportCSV} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {reportTabs.map(t => (
          <button key={t.id} onClick={() => setActiveReport(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeReport === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {['candidates', 'interviews'].includes(activeReport) && (
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {activeReport === 'candidates' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Statuses</option>
                {['APPLIED','SHORTLISTED','INTERVIEW_SCHEDULED','SELECTED','TRAINING_PENDING','TRAINING_IN_PROGRESS','EXAM_PENDING','EXAM_COMPLETED','OFFER_SENT','OFFER_ACCEPTED','ONBOARDED','CONFIRMED','REJECTED'].map(s =>
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          )}
          {activeReport === 'interviews' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Statuses</option>
                {['SCHEDULED','COMPLETED','CANCELLED','NO_SHOW'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={fetchReport} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">Apply</button>
            <button onClick={() => { setFilters({ from: '', to: '', status: '' }); setTimeout(fetchReport, 0); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Clear</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <FileText size={16} className="text-indigo-600" />
          <h3 className="font-semibold text-gray-700 text-sm">
            {reportTabs.find(t => t.id === activeReport)?.label}
            {!loading && !error && <span className="ml-1 font-normal text-gray-400">({data.length} records)</span>}
          </h3>
        </div>

        {error ? (
          <div className="flex items-center gap-2 p-8 text-red-600 justify-center text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No data for selected filters</div>
        ) : activeReport === 'candidates' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Designation</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Source</th>
                <th className="px-5 py-3 text-left">Added</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {data.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xs text-indigo-600">{c.candidateId}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{c.firstName} {c.lastName}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{c.designation}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 text-sm text-gray-500">{c.source || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{safeFormat(c.createdAt, 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeReport === 'interviews' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 text-left">Candidate</th>
                <th className="px-5 py-3 text-left">Round</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Scheduled</th>
                <th className="px-5 py-3 text-left">Feedback</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {data.map(iv => (
                  <tr key={iv.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{iv.candidate?.firstName} {iv.candidate?.lastName}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">Round {iv.round}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{iv.interviewType}</td>
                    <td className="px-5 py-3"><StatusBadge status={iv.status} /></td>
                    <td className="px-5 py-3 text-sm text-gray-500">{safeFormat(iv.scheduledAt, 'dd MMM, hh:mm a')}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{iv.feedback?.length || 0} submitted</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeReport === 'mrf' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 text-left">MRF #</th>
                <th className="px-5 py-3 text-left">Designation</th>
                <th className="px-5 py-3 text-left">Department</th>
                <th className="px-5 py-3 text-left">Location</th>
                <th className="px-5 py-3 text-left">Vacancies</th>
                <th className="px-5 py-3 text-left">Candidates</th>
                <th className="px-5 py-3 text-left">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {data.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-indigo-600">{m.mrfNumber}</td>
                    <td className="px-5 py-3 text-sm text-gray-800">{m.designation}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{m.department?.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{m.location || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{m.vacancies}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{m._count?.candidates || 0}</td>
                    <td className="px-5 py-3"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeReport === 'exams' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 text-left">Candidate</th>
                <th className="px-5 py-3 text-left">Exam</th>
                <th className="px-5 py-3 text-left">Attempt</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Score</th>
                <th className="px-5 py-3 text-left">Result</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {data.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{e.candidate?.firstName} {e.candidate?.lastName}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{e.examName}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">#{e.attemptNumber}</td>
                    <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-5 py-3 text-sm font-medium">{e.score != null ? `${e.score}/${e.maxScore}` : '—'}</td>
                    <td className="px-5 py-3 text-sm">{e.result || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeReport === 'training' ? (
          <div className="p-5 space-y-3">
            {data.map(b => (
              <div key={b.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 text-sm">{b.batchName}</span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                  <span>{b.designation}</span>
                  <span>{b._count?.enrollments || 0} enrolled</span>
                  <span>{safeFormat(b.startDate, 'dd MMM')} – {safeFormat(b.endDate, 'dd MMM yyyy')}</span>
                  {b.trainer && <span>Trainer: {b.trainer}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Reports;
