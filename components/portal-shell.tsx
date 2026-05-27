import Link from "next/link";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Medal,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";

type IconName =
  | "dashboard"
  | "mrf"
  | "candidates"
  | "interviews"
  | "training"
  | "exams"
  | "reports"
  | "notifications"
  | "settings"
  | "documents"
  | "approvals"
  | "roles"
  | "logout";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  active?: boolean;
};

const icons = {
  dashboard: LayoutDashboard,
  mrf: BriefcaseBusiness,
  candidates: Users,
  interviews: CalendarCheck,
  training: GraduationCap,
  exams: ClipboardCheck,
  reports: BarChart3,
  notifications: Bell,
  settings: Settings,
  documents: FileText,
  approvals: Medal,
  roles: ShieldCheck,
  logout: LogOut
};

export function PortalShell({
  title,
  subtitle,
  portalLabel,
  navItems,
  children
}: {
  title: string;
  subtitle: string;
  portalLabel: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {portalLabel}
          </p>
          <h1 className="mt-1 text-xl font-bold">Recruitment ERP</h1>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = icons[item.icon];

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                  item.active
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="lg:pl-72">
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">{portalLabel}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-normal text-slate-950">
                {title}
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm">
                <Bell aria-hidden="true" className="h-4 w-4" />
                Alerts
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm">
                <ListChecks aria-hidden="true" className="h-4 w-4" />
                New Task
              </button>
            </div>
          </div>
        </header>
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
