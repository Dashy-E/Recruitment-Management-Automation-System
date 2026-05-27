import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Printer, Send } from "lucide-react";
import { ApprovalTimeline } from "@/components/approval-timeline";
import { PortalShell } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { getApprovalSummary, getMRFById, getMRFStatusTone } from "@/lib/mrf-data";
import { recruiterNav } from "@/lib/navigation";

export default async function MRFDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mrf = getMRFById(id);

  if (!mrf) {
    notFound();
  }

  return (
    <PortalShell
      title={`${mrf.requestNo} Detail`}
      subtitle="Review requisition details, approvals, audit history, printable PDF readiness, and recruitment handoff state."
      portalLabel="Recruiter Portal"
      navItems={recruiterNav.map((item) => ({
        ...item,
        active: item.href === "/recruiter/mrf"
      }))}
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link href="/recruiter/mrf" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to MRFs
        </Link>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
            <Printer aria-hidden="true" className="h-4 w-4" />
            Print
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
            <Download aria-hidden="true" className="h-4 w-4" />
            PDF
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">
            <Send aria-hidden="true" className="h-4 w-4" />
            Send Reminder
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{mrf.department}</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-950">{mrf.designation}</h3>
                <p className="mt-2 text-sm text-slate-600">{mrf.location}, {mrf.country}</p>
              </div>
              <StatusBadge label={getMRFStatusTone(mrf.status)} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoBlock label="Vacancies" value={String(mrf.vacancies)} />
              <InfoBlock label="Experience" value={mrf.requiredExperience} />
              <InfoBlock label="Budget" value={mrf.budgetRange} />
              <InfoBlock label="Approval" value={getApprovalSummary(mrf)} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoBlock label="Reporting Manager" value={mrf.reportingManager} />
              <InfoBlock label="Created By" value={mrf.createdBy} />
              <InfoBlock label="Created Date" value={mrf.createdAt} />
              <InfoBlock label="Submitted Date" value={mrf.submittedAt ?? "Not submitted"} />
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-700">Skills Required</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {mrf.skillsRequired.map((skill) => (
                  <span key={skill} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <h3 className="text-base font-bold text-slate-950">Audit History</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {mrf.auditTrail.map((event) => (
                <div key={`${event.actor}-${event.timestamp}`} className="flex flex-col gap-1 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{event.action}</p>
                    <p className="text-sm text-slate-500">{event.actor}</p>
                  </div>
                  <p className="text-sm text-slate-500">{event.timestamp}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <ApprovalTimeline steps={mrf.approvals} />
      </div>
    </PortalShell>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
