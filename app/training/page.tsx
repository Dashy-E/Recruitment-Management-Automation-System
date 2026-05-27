import { CheckCircle2, ClipboardList, GraduationCap, Users } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { PortalShell } from "@/components/portal-shell";
import { trainingNav } from "@/lib/navigation";

export default function TrainingDashboard() {
  return (
    <PortalShell
      title="Training Operations"
      subtitle="Manage candidate batches, attendance, completion updates, training remarks, and recruitment notifications."
      portalLabel="Training Department Portal"
      navItems={[...trainingNav]}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Batches" value="7" note="3 chemistry batches running" icon={GraduationCap} tone="blue" />
        <KpiCard label="Enrolled Candidates" value="84" note="12 newly assigned by recruitment" icon={Users} tone="cyan" />
        <KpiCard label="Attendance Due" value="19" note="Today's sessions need marking" icon={ClipboardList} tone="orange" />
        <KpiCard label="Completed" value="31" note="Ready for exam eligibility" icon={CheckCircle2} tone="green" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <DataTable
          title="Training Batches"
          columns={["Batch", "Topic", "Trainer", "Capacity", "Status"]}
          rows={[
            ["B-2405", "Chemistry Basics", "Dr. Iyer", "18/25", "Active"],
            ["B-2406", "Safety and GMP", "M. Desai", "24/30", "Active"],
            ["B-2407", "Quality Documentation", "S. Rao", "12/20", "Pending"]
          ]}
          actions="Actions"
        />
        <DataTable
          title="Completion Updates"
          columns={["Candidate", "Batch", "Attendance", "Remarks", "Recruitment Update"]}
          rows={[
            ["Rohan Shah", "B-2405", "100%", "Complete", "Pending"],
            ["Mina Das", "B-2405", "82%", "Needs review", "Draft"],
            ["Ajay Verma", "B-2406", "76%", "Incomplete", "Blocked"]
          ]}
          actions="Actions"
        />
      </div>
    </PortalShell>
  );
}
