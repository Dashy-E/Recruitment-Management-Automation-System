import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, FileText, GraduationCap, ClipboardList, Mail, Bell } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();

  const quickLinks = [
    { label: 'My Profile', to: '/employee/profile', icon: User, desc: 'View and update your profile', color: 'indigo' },
    { label: 'Documents', to: '/employee/documents', icon: FileText, desc: 'Upload and view your documents', color: 'blue' },
    { label: 'Training', to: '/employee/training', icon: GraduationCap, desc: 'View your training schedule', color: 'emerald' },
    { label: 'Examinations', to: '/employee/exams', icon: ClipboardList, desc: 'Take your assessment exams', color: 'orange' },
    { label: 'Offer Letter', to: '/employee/offers', icon: Mail, desc: 'View your offer letter', color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">Welcome, {user?.firstName}!</h2>
        <p className="text-teal-100">Your recruitment journey at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map(({ label, to, icon: Icon, desc, color }) => (
          <Link key={to} to={to} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className={`w-11 h-11 bg-${color}-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-${color}-200 transition-colors`}>
              <Icon size={20} className={`text-${color}-600`} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{label}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Recruitment Journey</h3>
        <div className="flex items-center justify-between flex-wrap gap-2">
          {['Application', 'Shortlisted', 'Interview', 'Selected', 'Training', 'Exam', 'Offer', 'Onboarded'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${i < 3 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</div>
              <span className={`text-xs ${i < 3 ? 'text-indigo-700 font-medium' : 'text-gray-400'}`}>{step}</span>
              {i < 7 && <div className={`w-4 h-0.5 ${i < 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
