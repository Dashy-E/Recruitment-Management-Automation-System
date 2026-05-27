import { CheckCircle2, Clock, XCircle } from "lucide-react";

type ApprovalStep = {
  level: number;
  approver: string;
  role: string;
  status: "Pending" | "Approved" | "Rejected";
  decidedAt?: string;
  remarks?: string;
};

const iconMap = {
  Approved: CheckCircle2,
  Pending: Clock,
  Rejected: XCircle
};

const toneMap = {
  Approved: "border-green-200 bg-green-50 text-green-700",
  Pending: "border-yellow-200 bg-yellow-50 text-yellow-800",
  Rejected: "border-red-200 bg-red-50 text-red-700"
};

export function ApprovalTimeline({ steps }: { steps: ApprovalStep[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
      <h3 className="text-base font-bold text-slate-950">Approval Workflow</h3>
      <div className="mt-4 space-y-3">
        {steps.map((step) => {
          const Icon = iconMap[step.status];

          return (
            <div key={step.level} className="flex gap-3 rounded-lg border border-slate-200 p-3">
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${toneMap[step.status]}`}>
                <Icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">Level {step.level}: {step.role}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {step.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{step.approver}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {step.decidedAt ? `Decided on ${step.decidedAt}` : "Waiting for action"}
                </p>
                {step.remarks ? <p className="mt-2 text-sm text-slate-700">{step.remarks}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
