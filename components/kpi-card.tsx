import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "orange" | "cyan" | "red" | "purple";
};

const tones = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  orange: "bg-orange-50 text-orange-700",
  cyan: "bg-cyan-50 text-cyan-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-purple-50 text-purple-700"
};

export function KpiCard({ label, value, note, icon: Icon, tone }: KpiCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${tones[tone]}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{note}</p>
    </section>
  );
}
