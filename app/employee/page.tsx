import { ClipboardCheck, FileText, GraduationCap, UploadCloud } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { PortalShell } from "@/components/portal-shell";
import { employeeNav } from "@/lib/navigation";

export default function EmployeeDashboard() {
  return (
    <PortalShell
      title="Employee Onboarding"
      subtitle="A focused workspace for documents, training sessions, chemistry classes, exams, offer letters, and status updates."
      portalLabel="Employee Portal"
      navItems={[...employeeNav]}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Training Schedule" value="3" note="Next class starts tomorrow" icon={GraduationCap} tone="blue" />
        <KpiCard label="Pending Exams" value="1" note="Link expires in 22 hours" icon={ClipboardCheck} tone="orange" />
        <KpiCard label="Documents" value="4/6" note="Two uploads still required" icon={UploadCloud} tone="red" />
        <KpiCard label="Letters" value="2" note="Offer and appointment available" icon={FileText} tone="green" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <DataTable
          title="Assigned Training Sessions"
          columns={["Session", "Batch", "Date", "Attendance", "Status"]}
          rows={[
            ["Chemistry Basics", "B-2405", "May 29", "Pending", "Active"],
            ["Safety and GMP", "B-2405", "May 31", "Pending", "Active"],
            ["Quality Documentation", "B-2405", "Jun 3", "Pending", "Active"]
          ]}
          actions="Actions"
        />
        <DataTable
          title="Required Documents"
          columns={["Document", "Version", "Verification", "Updated"]}
          rows={[
            ["Resume", "v2", "Verified", "May 20"],
            ["ID Proof", "v1", "Verified", "May 20"],
            ["Education Certificates", "v1", "Pending", "May 21"],
            ["Experience Letter", "Missing", "Pending", "-"]
          ]}
          actions="Actions"
        />
      </div>
    </PortalShell>
  );
}
