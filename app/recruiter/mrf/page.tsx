import Link from "next/link";
import { Download, FilePlus2, Printer, Search, SlidersHorizontal } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { getApprovalSummary, getMRFStatusTone, mrfRecords } from "@/lib/mrf-data";
import { recruiterNav } from "@/lib/navigation";

export default function MRFManagementPage() {
  return (
    <PortalShell
      title="MRF Management"
      subtitle="Create manpower requisitions, track approval progress, preserve audit history, and generate printable MRF documents."
      portalLabel="Recruiter Portal"
      navItems={recruiterNav.map((item) => ({
        ...item,
        active: item.href === "/recruiter/mrf"
      }))}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
          <p className="text-sm font-semibold text-slate-500">Total MRFs</p>
          <p className="mt-2 text-3xl font-bold">{mrfRecords.length}</p>
          <p className="mt-1 text-sm text-slate-600">Across active departments</p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
          <p className="text-sm font-semibold text-slate-500">Pending Approvals</p>
          <p className="mt-2 text-3xl font-bold">
            {mrfRecords.filter((mrf) => ["Submitted", "Partially Approved"].includes(mrf.status)).length}
          </p>
          <p className="mt-1 text-sm text-slate-600">Requires HR or manager action</p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
          <p className="text-sm font-semibold text-slate-500">Approved Vacancies</p>
          <p className="mt-2 text-3xl font-bold">
            {mrfRecords.filter((mrf) => mrf.status === "Approved").reduce((sum, mrf) => sum + mrf.vacancies, 0)}
          </p>
          <p className="mt-1 text-sm text-slate-600">Ready for candidate sourcing</p>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-panel">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-950">Manpower Requisitions</h3>
            <p className="mt-1 text-sm text-slate-600">Pagination, search, sorting, filters, PDF, and CSV export are represented in this workflow surface.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex h-10 min-w-60 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              <Search aria-hidden="true" className="h-4 w-4" />
              <input className="w-full bg-transparent outline-none" placeholder="Search MRFs" />
            </label>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              Filter
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
              <Download aria-hidden="true" className="h-4 w-4" />
              CSV
            </button>
            <Link
              href="/recruiter/mrf/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white"
            >
              <FilePlus2 aria-hidden="true" className="h-4 w-4" />
              New MRF
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {["MRF No", "Department", "Designation", "Vacancies", "Budget", "Manager", "Status", "Approval", "Actions"].map((column) => (
                  <th key={column} className="px-4 py-3 font-semibold">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mrfRecords.map((mrf) => (
                <tr key={mrf.id} className="text-slate-700">
                  <td className="px-4 py-3 font-semibold text-slate-950">{mrf.requestNo}</td>
                  <td className="px-4 py-3">{mrf.department}</td>
                  <td className="px-4 py-3">{mrf.designation}</td>
                  <td className="px-4 py-3">{mrf.vacancies}</td>
                  <td className="px-4 py-3">{mrf.budgetRange}</td>
                  <td className="px-4 py-3">{mrf.reportingManager}</td>
                  <td className="px-4 py-3"><StatusBadge label={getMRFStatusTone(mrf.status)} /></td>
                  <td className="px-4 py-3">{getApprovalSummary(mrf)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/recruiter/mrf/${mrf.id}`} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                        View
                      </Link>
                      <button className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                        <Printer aria-hidden="true" className="h-3.5 w-3.5" />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          <span>Showing {mrfRecords.length} requisitions</span>
          <span>Soft delete, audit rollback, and workflow escalation supported by schema</span>
        </div>
      </section>
    </PortalShell>
  );
}
