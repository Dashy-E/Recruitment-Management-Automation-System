import { clsx } from "clsx";

const statusStyles: Record<string, string> = {
  Applied: "bg-slate-100 text-slate-700",
  Shortlisted: "bg-blue-100 text-blue-700",
  "Interview Scheduled": "bg-orange-100 text-orange-700",
  Selected: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  "Training Pending": "bg-purple-100 text-purple-700",
  "Exam Pending": "bg-yellow-100 text-yellow-800",
  "Final Approved": "bg-emerald-100 text-emerald-700",
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-700",
  Failed: "bg-red-100 text-red-700",
  Complete: "bg-emerald-100 text-emerald-700",
  Active: "bg-cyan-100 text-cyan-700"
};

export function StatusBadge({ label }: { label: string }) {
  return (
    <span
      className={clsx(
        "inline-flex min-w-24 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold",
        statusStyles[label] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {label}
    </span>
  );
}
