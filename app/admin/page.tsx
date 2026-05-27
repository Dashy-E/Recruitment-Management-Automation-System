import { Activity, Database, ShieldCheck, Users } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { PortalShell } from "@/components/portal-shell";
import { adminNav } from "@/lib/navigation";

export default function AdminDashboard() {
  return (
    <PortalShell
      title="System Administration"
      subtitle="Configure users, roles, permissions, portals, audit logs, master data, workflow rules, and system settings."
      portalLabel="Admin Portal"
      navItems={[...adminNav]}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Users" value="128" note="11 inactive accounts" icon={Users} tone="blue" />
        <KpiCard label="Roles" value="8" note="Permission mapping ready for RBAC" icon={ShieldCheck} tone="green" />
        <KpiCard label="Audit Events" value="1.9k" note="Critical changes tracked" icon={Activity} tone="orange" />
        <KpiCard label="Master Data" value="42" note="Departments, branches, templates" icon={Database} tone="cyan" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <DataTable
          title="Recent Audit Logs"
          columns={["Actor", "Entity", "Action", "Time", "Portal"]}
          rows={[
            ["Priya Singh", "Candidate", "Status Changed", "10:12", "Recruiter"],
            ["Rahul Mehta", "MRF", "Approved", "09:44", "Management"],
            ["System", "Email", "Retry Queued", "09:10", "Admin"]
          ]}
          actions="Actions"
        />
        <DataTable
          title="Role Permission Overview"
          columns={["Role", "Portal", "Users", "Sensitive Access", "Status"]}
          rows={[
            ["HR", "Recruiter", "24", "Documents, Offers", "Active"],
            ["Training Lead", "Training", "9", "Attendance, Remarks", "Active"],
            ["MD", "Management", "1", "Final Approval", "Active"]
          ]}
          actions="Edit"
        />
      </div>
    </PortalShell>
  );
}
