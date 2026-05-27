import { Search, SlidersHorizontal } from "lucide-react";

export function DataTable({
  title,
  columns,
  rows,
  actions
}: {
  title: string;
  columns: string[];
  rows: string[][];
  actions?: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-panel">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        <div className="flex flex-wrap gap-2">
          <label className="flex h-10 min-w-56 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            <Search aria-hidden="true" className="h-4 w-4" />
            <input className="w-full bg-transparent outline-none" placeholder="Search" />
          </label>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
              {actions ? <th className="px-4 py-3 font-semibold">{actions}</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={row.join("-")} className="text-slate-700">
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
                {actions ? (
                  <td className="px-4 py-3">
                    <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      View
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
        <span>Showing 1-5</span>
        <span>PDF and CSV exports enabled in module phase</span>
      </div>
    </section>
  );
}
