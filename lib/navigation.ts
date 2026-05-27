export const recruiterNav = [
  { label: "Dashboard", href: "/recruiter", icon: "dashboard", active: true },
  { label: "MRF Management", href: "/recruiter/mrf", icon: "mrf" },
  { label: "Candidates", href: "/recruiter/candidates", icon: "candidates" },
  { label: "Interviews", href: "/recruiter/interviews", icon: "interviews" },
  { label: "Training Coordination", href: "/recruiter/training", icon: "training" },
  { label: "Examinations", href: "/recruiter/exams", icon: "exams" },
  { label: "Reports", href: "/recruiter/reports", icon: "reports" },
  { label: "Notifications", href: "/recruiter/notifications", icon: "notifications" },
  { label: "Settings", href: "/recruiter/settings", icon: "settings" },
  { label: "Logout", href: "/", icon: "logout" }
] as const;

export const employeeNav = [
  { label: "Dashboard", href: "/employee", icon: "dashboard", active: true },
  { label: "My Profile", href: "/employee/profile", icon: "candidates" },
  { label: "Documents", href: "/employee/documents", icon: "documents" },
  { label: "Training Sessions", href: "/employee/training", icon: "training" },
  { label: "Examinations", href: "/employee/exams", icon: "exams" },
  { label: "Results", href: "/employee/results", icon: "reports" },
  { label: "Offer Letter", href: "/employee/offer", icon: "mrf" },
  { label: "Notifications", href: "/employee/notifications", icon: "notifications" },
  { label: "Logout", href: "/", icon: "logout" }
] as const;

export const trainingNav = [
  { label: "Dashboard", href: "/training", icon: "dashboard", active: true },
  { label: "Training Batches", href: "/training/batches", icon: "training" },
  { label: "Attendance", href: "/training/attendance", icon: "interviews" },
  { label: "Candidate Progress", href: "/training/progress", icon: "candidates" },
  { label: "Completion Reports", href: "/training/reports", icon: "reports" },
  { label: "Notifications", href: "/training/notifications", icon: "notifications" },
  { label: "Logout", href: "/", icon: "logout" }
] as const;

export const managementNav = [
  { label: "Dashboard", href: "/management", icon: "dashboard", active: true },
  { label: "Hiring Analytics", href: "/management/analytics", icon: "reports" },
  { label: "Approvals", href: "/management/approvals", icon: "approvals" },
  { label: "Final Reports", href: "/management/reports", icon: "documents" },
  { label: "Probation", href: "/management/probation", icon: "roles" },
  { label: "Notifications", href: "/management/notifications", icon: "notifications" },
  { label: "Logout", href: "/", icon: "logout" }
] as const;

export const adminNav = [
  { label: "Dashboard", href: "/admin", icon: "dashboard", active: true },
  { label: "User Management", href: "/admin/users", icon: "candidates" },
  { label: "Role Management", href: "/admin/roles", icon: "roles" },
  { label: "Portal Configuration", href: "/admin/portals", icon: "settings" },
  { label: "Audit Logs", href: "/admin/audit", icon: "documents" },
  { label: "Master Data", href: "/admin/master-data", icon: "mrf" },
  { label: "Reports", href: "/admin/reports", icon: "reports" },
  { label: "Logout", href: "/", icon: "logout" }
] as const;
