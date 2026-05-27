import { BarChart3, ClipboardCheck, FileCheck2, TrendingUp } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { PortalShell } from "@/components/portal-shell";
import { managementNav } from "@/lib/navigation";

export default function ManagementDashboard() {
  return (
    <PortalShell
      title="Management Review"
      subtitle="Consolidated hiring analytics, approvals, probation confirmations, and printable summaries for leadership."
      portalLabel="Management Portal"
      navItems={[...managementNav]}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Hiring Analytics" value="72%" note="Candidate conversion this quarter" icon={BarChart3} tone="blue" />
        <KpiCard label="Open Approvals" value="14" note="MRF, offers, and final reports" icon={ClipboardCheck} tone="orange" />
        <KpiCard label="Probation Reviews" value="9" note="4 confirmations due this week" icon={FileCheck2} tone="purple" />
        <KpiCard label="Hiring Trend" value="+18%" note="Improvement over last quarter" icon={TrendingUp} tone="green" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <DataTable
          title="Approval Queue"
          columns={["Item", "Department", "Owner", "Submitted", "Status"]}
          rows={[
            ["MRF-1024", "Quality", "R. Mehta", "May 26", "Pending"],
            ["Offer-441", "Production", "P. Singh", "May 25", "Pending"],
            ["Final Report-91", "R&D", "A. Nair", "May 24", "Approved"]
          ]}
          actions="Actions"
        />
        <DataTable
          title="Department Hiring Metrics"
          columns={["Department", "Vacancies", "Selected", "Training", "Onboarded"]}
          rows={[
            ["Quality", "14", "8", "5", "3"],
            ["Production", "22", "13", "7", "6"],
            ["R&D", "6", "3", "2", "1"]
          ]}
          actions="Report"
        />
      </div>
    </PortalShell>
  );
}
