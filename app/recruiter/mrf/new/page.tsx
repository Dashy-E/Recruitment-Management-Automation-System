import Link from "next/link";
import { ArrowLeft, Save, Send } from "lucide-react";
import { fieldClassName, FormField, textareaClassName } from "@/components/form-field";
import { PortalShell } from "@/components/portal-shell";
import { recruiterNav } from "@/lib/navigation";

export default function NewMRFPage() {
  return (
    <PortalShell
      title="Create MRF"
      subtitle="Capture role, vacancy, budget, skills, location, and approval routing before submitting the requisition."
      portalLabel="Recruiter Portal"
      navItems={recruiterNav.map((item) => ({
        ...item,
        active: item.href === "/recruiter/mrf"
      }))}
    >
      <div className="mb-4">
        <Link href="/recruiter/mrf" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to MRFs
        </Link>
      </div>

      <form className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <h3 className="text-base font-bold text-slate-950">Requisition Details</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FormField label="Department" required>
              <select className={fieldClassName} defaultValue="">
                <option value="" disabled>Select department</option>
                <option>Quality</option>
                <option>Production</option>
                <option>R&D</option>
                <option>Training</option>
              </select>
            </FormField>
            <FormField label="Designation / Role" required>
              <input className={fieldClassName} placeholder="QA Officer" />
            </FormField>
            <FormField label="Number of Vacancies" required hint="Must be greater than zero">
              <input className={fieldClassName} min={1} type="number" placeholder="3" />
            </FormField>
            <FormField label="Required Experience" required hint="Experience cannot be negative">
              <input className={fieldClassName} min={0} type="number" placeholder="3" />
            </FormField>
            <FormField label="Minimum CTC" required>
              <input className={fieldClassName} min={0} type="number" placeholder="550000" />
            </FormField>
            <FormField label="Maximum CTC" required>
              <input className={fieldClassName} min={0} type="number" placeholder="750000" />
            </FormField>
            <FormField label="Reporting Manager" required>
              <select className={fieldClassName} defaultValue="">
                <option value="" disabled>Select manager</option>
                <option>Rahul Mehta</option>
                <option>Meera Desai</option>
                <option>Dr. Kavita Iyer</option>
              </select>
            </FormField>
            <FormField label="Location / Branch / Country" required>
              <input className={fieldClassName} placeholder="Mumbai Branch, India" />
            </FormField>
          </div>

          <div className="mt-4">
            <FormField label="Skills Required" required hint="Separate skills with commas. These feed candidate-role matching later.">
              <textarea className={textareaClassName} placeholder="GMP, CAPA, audit readiness, documentation" />
            </FormField>
          </div>

          <div className="mt-4">
            <FormField label="Role Summary">
              <textarea className={textareaClassName} placeholder="Describe business need, project context, and hiring priority." />
            </FormField>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <h3 className="text-base font-bold text-slate-950">Approval Rules</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>MRF requires HR approval and reporting manager approval.</p>
              <p>If either approver rejects the request, status becomes Rejected.</p>
              <p>All submitted changes are written to audit history.</p>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <h3 className="text-base font-bold text-slate-950">Validation</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Vacancies must be greater than zero.</li>
              <li>CTC range is mandatory.</li>
              <li>Designation and department are mandatory.</li>
              <li>Maximum CTC must be greater than minimum CTC.</li>
            </ul>
          </section>

          <div className="flex gap-2">
            <button type="button" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
              <Save aria-hidden="true" className="h-4 w-4" />
              Save Draft
            </button>
            <button type="button" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">
              <Send aria-hidden="true" className="h-4 w-4" />
              Submit
            </button>
          </div>
        </aside>
      </form>
    </PortalShell>
  );
}
