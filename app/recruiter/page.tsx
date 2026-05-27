import { CalendarCheck, ClipboardCheck, FileClock, FileText, Users } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { PortalShell } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { recruiterNav } from "@/lib/navigation";

const candidates = [
  ["Asha Menon", "Chemist", "5 yrs", "HPLC, QC", "Interview Scheduled", "May 30", "Pending", "Exam Pending"],
  ["Rohan Shah", "Plant Supervisor", "8 yrs", "Safety, GMP", "Selected", "Completed", "Pending", "Pending"],
  ["Neha Rao", "Analyst", "2 yrs", "GC, LIMS", "Shortlisted", "Jun 1", "Training Pending", "Pending"],
  ["Imran Khan", "QA Officer", "4 yrs", "CAPA, Audit", "Applied", "Not Set", "Pending", "Pending"]
];

export default function RecruiterDashboard() {
  return (
    <PortalShell
      title="Recruiter Dashboard"
      subtitle="Track active requisitions, candidates, interviews, training handoffs, exams, and offers from one operational view."
      portalLabel="Recruiter Portal"
      navItems={[...recruiterNav]}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Active MRFs" value="18" note="6 waiting for HR or manager approval" icon={FileText} tone="blue" />
        <KpiCard label="Pending Interviews" value="27" note="9 scheduled this week" icon={CalendarCheck} tone="orange" />
        <KpiCard label="Candidates" value="246" note="42 shortlisted for active vacancies" icon={Users} tone="cyan" />
        <KpiCard label="Offer Pending" value="11" note="4 need management approval" icon={FileClock} tone="purple" />
        <KpiCard label="Exam Pending" value="16" note="Training completion required for 5" icon={ClipboardCheck} tone="green" />
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-panel">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base font-bold">Candidate Pipeline</h3>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Import CSV</button>
            <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Add Candidate</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {["Candidate Name", "Designation", "Experience", "Skills", "Status", "Interview Date", "Training Status", "Exam Status", "Actions"].map((column) => (
                  <th key={column} className="px-4 py-3 font-semibold">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((candidate) => (
                <tr key={candidate[0]} className="text-slate-700">
                  {candidate.slice(0, 4).map((cell, cellIndex) => (
                    <td key={`${candidate[0]}-${cellIndex}`} className="px-4 py-3">{cell}</td>
                  ))}
                  <td className="px-4 py-3"><StatusBadge label={candidate[4]} /></td>
                  <td className="px-4 py-3">{candidate[5]}</td>
                  <td className="px-4 py-3"><StatusBadge label={candidate[6]} /></td>
                  <td className="px-4 py-3"><StatusBadge label={candidate[7]} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">View</button>
                      <button className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">Schedule</button>
                      <button className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">PDF</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <DataTable
          title="MRF Approval Queue"
          columns={["MRF No", "Department", "Designation", "Vacancies", "Status"]}
          rows={[
            ["MRF-1024", "Quality", "QA Officer", "3", "Manager Pending"],
            ["MRF-1025", "Production", "Shift Chemist", "5", "HR Pending"],
            ["MRF-1026", "R&D", "Research Associate", "2", "Approved"]
          ]}
          actions="Actions"
        />
        <DataTable
          title="Upcoming Interviews"
          columns={["Candidate", "Round", "Panel", "Date", "Mode"]}
          rows={[
            ["Asha Menon", "Technical", "Dr. Sharma", "May 30", "Teams"],
            ["Karan Patel", "HR", "Priya Singh", "Jun 1", "Office"],
            ["Neha Rao", "Screening", "Anil Nair", "Jun 1", "Phone"]
          ]}
          actions="Actions"
        />
      </div>
    </PortalShell>
  );
}
