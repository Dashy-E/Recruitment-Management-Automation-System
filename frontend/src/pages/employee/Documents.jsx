import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeDocuments = () => {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('ID_PROOF');

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Upload Document</h3>
        <div className="space-y-3">
          <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            {['ID_PROOF', 'CERTIFICATE', 'EDUCATION', 'RESUME', 'OTHER'].map(t => <option key={t}>{t}</option>)}
          </select>
          <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center cursor-pointer hover:border-teal-400 transition-colors">
            <Upload size={28} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">{file ? file.name : 'Click to select file'}</p>
            <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" />
          </label>
          <button onClick={() => toast.success('Document uploaded successfully')} className="w-full bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
            Upload Document
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3">My Documents</h3>
        <div className="text-center py-8 text-gray-400">
          <FileText size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No documents uploaded yet</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDocuments;
