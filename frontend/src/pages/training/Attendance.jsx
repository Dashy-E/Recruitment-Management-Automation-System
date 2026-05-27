import { useEffect, useState } from 'react';
import { trainingAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { UserCheck, Save } from 'lucide-react';

const TrainingAttendance = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batchDetail, setBatchDetail] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    trainingAPI.getBatches().then(r => setBatches(r.data)).catch(() => {});
  }, []);

  const loadBatch = async (batchId) => {
    setSelectedBatch(batchId);
    if (!batchId) { setBatchDetail(null); return; }
    try {
      const res = await trainingAPI.getBatchById(batchId);
      setBatchDetail(res.data);
      const initial = {};
      res.data.enrollments?.forEach(e => { initial[e.candidateId] = false; });
      setAttendance(initial);
    } catch { toast.error('Failed to load batch'); }
  };

  const toggleAttendance = (candidateId) => setAttendance(p => ({ ...p, [candidateId]: !p[candidateId] }));

  const saveAttendance = async () => {
    if (!selectedBatch || !date) return toast.error('Select batch and date');
    const records = Object.entries(attendance).map(([candidateId, present]) => ({ candidateId, present }));
    try {
      await trainingAPI.markAttendance({ batchId: selectedBatch, date, records });
      toast.success('Attendance saved');
    } catch { toast.error('Failed to save attendance'); }
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-800">Attendance Management</h2>

      <div className="flex gap-3 flex-wrap">
        <select value={selectedBatch} onChange={e => loadBatch(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-48">
          <option value="">Select Training Batch</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.batchName}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {batchDetail && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-emerald-600" />
              <span className="font-semibold text-gray-800 text-sm">{batchDetail.batchName} · {date}</span>
            </div>
            <span className="text-sm text-gray-500">{presentCount}/{batchDetail.enrollments?.length || 0} present</span>
          </div>
          <div className="divide-y divide-gray-100">
            {batchDetail.enrollments?.map(e => (
              <div key={e.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.candidate?.firstName} {e.candidate?.lastName}</p>
                  <p className="text-xs text-gray-400">{e.candidate?.designation}</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => toggleAttendance(e.candidateId)} className={`w-12 h-6 rounded-full transition-colors ${attendance[e.candidateId] ? 'bg-emerald-500' : 'bg-gray-200'} relative`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${attendance[e.candidateId] ? 'left-7' : 'left-1'}`} />
                  </div>
                  <span className={`text-xs font-medium ${attendance[e.candidateId] ? 'text-emerald-600' : 'text-gray-400'}`}>{attendance[e.candidateId] ? 'Present' : 'Absent'}</span>
                </label>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t bg-gray-50">
            <button onClick={saveAttendance} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
              <Save size={15} /> Save Attendance
            </button>
          </div>
        </div>
      )}
      {!selectedBatch && <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100 text-sm">Select a training batch to mark attendance</div>}
    </div>
  );
};

export default TrainingAttendance;
