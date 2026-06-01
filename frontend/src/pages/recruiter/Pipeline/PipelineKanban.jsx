import { useState, useEffect } from 'react';
import { pipelineAPI, mrfAPI } from '../../../services/api';
import { Layers, ChevronRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

const SCORE_COLOR = (score) => {
  if (score >= 75) return 'text-green-600';
  if (score >= 55) return 'text-yellow-600';
  return 'text-red-500';
};

export default function PipelineKanban() {
  const [mrfs, setMrfs] = useState([]);
  const [selectedMrf, setSelectedMrf] = useState('');
  const [stages, setStages] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    mrfAPI.getAll({ status: 'APPROVED', limit: 50 }).then(r => setMrfs(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedMrf) return;
    fetchPipeline();
  }, [selectedMrf]);

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const res = await pipelineAPI.getByMrf(selectedMrf);
      if (res.data.length === 0) {
        await pipelineAPI.initStages(selectedMrf);
        const res2 = await pipelineAPI.getByMrf(selectedMrf);
        setStages(res2.data);
      } else {
        setStages(res.data);
      }
    } catch { toast.error('Failed to load pipeline'); } finally { setLoading(false); }
  };

  const handleDragStart = (e, candidate, fromStageId) => {
    setDragging({ candidate, fromStageId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, toStageId) => {
    e.preventDefault();
    if (!dragging || dragging.fromStageId === toStageId) return;
    try {
      await pipelineAPI.moveCandidate({ candidateId: dragging.candidate.id, stageId: toStageId });
      toast.success(`Moved ${dragging.candidate.firstName} ${dragging.candidate.lastName}`);
      fetchPipeline();
    } catch { toast.error('Move failed'); }
    setDragging(null);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  return (
    <div className="p-6 space-y-5 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="h-7 w-7 text-indigo-600" /> Recruitment Pipeline
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kanban-style candidate pipeline per MRF</p>
        </div>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[260px]"
          value={selectedMrf}
          onChange={e => setSelectedMrf(e.target.value)}
        >
          <option value="">Select MRF to view pipeline</option>
          {mrfs.map(m => <option key={m.id} value={m.id}>{m.mrfNumber} — {m.designation}</option>)}
        </select>
      </div>

      {!selectedMrf ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Select an MRF to view its candidate pipeline</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Loading pipeline...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {stages.map(stage => (
            <div
              key={stage.id}
              className="flex-shrink-0 w-64 bg-gray-50 rounded-xl border border-gray-200 flex flex-col"
              onDrop={e => handleDrop(e, stage.id)}
              onDragOver={handleDragOver}
            >
              {/* Stage Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm font-semibold text-gray-800">{stage.name}</span>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">{stage.entries.length}</span>
              </div>

              {/* Candidate Cards */}
              <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                {stage.entries.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">No candidates</div>
                ) : stage.entries.map(entry => {
                  const c = entry.candidate;
                  const aiScore = c.aiScreeningResult?.matchScore;
                  return (
                    <div
                      key={entry.id}
                      draggable
                      onDragStart={e => handleDragStart(e, c, stage.id)}
                      className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow select-none"
                    >
                      <div className="flex items-start gap-2">
                        <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-gray-500 truncate">{c.designation}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-gray-400">{c.experience}m exp</span>
                        {aiScore != null && (
                          <span className={`font-semibold ${SCORE_COLOR(aiScore)}`}>AI: {aiScore}%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400">Drag and drop candidate cards between stages to move them through the pipeline.</p>
    </div>
  );
}
