export type MRFStatus =
  | "Draft"
  | "Submitted"
  | "Partially Approved"
  | "Approved"
  | "Rejected"
  | "Closed";

export type MRFApproval = {
  level: number;
  approver: string;
  role: string;
  status: "Pending" | "Approved" | "Rejected";
  decidedAt?: string;
  remarks?: string;
};

export type MRFRecord = {
  id: string;
  requestNo: string;
  department: string;
  designation: string;
  vacancies: number;
  requiredExperience: string;
  skillsRequired: string[];
  budgetRange: string;
  reportingManager: string;
  location: string;
  country: string;
  status: MRFStatus;
  createdBy: string;
  createdAt: string;
  submittedAt?: string;
  approvals: MRFApproval[];
  auditTrail: {
    actor: string;
    action: string;
    timestamp: string;
  }[];
};

export const mrfRecords: MRFRecord[] = [
  {
    id: "mrf-1024",
    requestNo: "MRF-1024",
    department: "Quality",
    designation: "QA Officer",
    vacancies: 3,
    requiredExperience: "3-5 years",
    skillsRequired: ["CAPA", "GMP", "Audit readiness"],
    budgetRange: "INR 5.5L - 7.5L",
    reportingManager: "Rahul Mehta",
    location: "Mumbai Branch",
    country: "India",
    status: "Partially Approved",
    createdBy: "Priya Singh",
    createdAt: "2026-05-24",
    submittedAt: "2026-05-25",
    approvals: [
      {
        level: 1,
        approver: "Neeraj Kapoor",
        role: "HR Manager",
        status: "Approved",
        decidedAt: "2026-05-25",
        remarks: "Budget and role justification verified."
      },
      {
        level: 2,
        approver: "Rahul Mehta",
        role: "Reporting Manager",
        status: "Pending"
      }
    ],
    auditTrail: [
      { actor: "Priya Singh", action: "Created draft", timestamp: "2026-05-24 10:20" },
      { actor: "Priya Singh", action: "Submitted for approval", timestamp: "2026-05-25 09:15" },
      { actor: "Neeraj Kapoor", action: "Approved level 1", timestamp: "2026-05-25 13:40" }
    ]
  },
  {
    id: "mrf-1025",
    requestNo: "MRF-1025",
    department: "Production",
    designation: "Shift Chemist",
    vacancies: 5,
    requiredExperience: "2-4 years",
    skillsRequired: ["Batch operations", "Safety", "Documentation"],
    budgetRange: "INR 4.2L - 6.2L",
    reportingManager: "Meera Desai",
    location: "Vadodara Plant",
    country: "India",
    status: "Submitted",
    createdBy: "Amit Nair",
    createdAt: "2026-05-26",
    submittedAt: "2026-05-26",
    approvals: [
      {
        level: 1,
        approver: "Neeraj Kapoor",
        role: "HR Manager",
        status: "Pending"
      },
      {
        level: 2,
        approver: "Meera Desai",
        role: "Reporting Manager",
        status: "Pending"
      }
    ],
    auditTrail: [
      { actor: "Amit Nair", action: "Created draft", timestamp: "2026-05-26 11:10" },
      { actor: "Amit Nair", action: "Submitted for approval", timestamp: "2026-05-26 11:32" }
    ]
  },
  {
    id: "mrf-1026",
    requestNo: "MRF-1026",
    department: "R&D",
    designation: "Research Associate",
    vacancies: 2,
    requiredExperience: "1-3 years",
    skillsRequired: ["Synthesis", "Analytical chemistry", "ELN"],
    budgetRange: "INR 6.0L - 8.5L",
    reportingManager: "Dr. Kavita Iyer",
    location: "Bengaluru R&D Center",
    country: "India",
    status: "Approved",
    createdBy: "Priya Singh",
    createdAt: "2026-05-20",
    submittedAt: "2026-05-21",
    approvals: [
      {
        level: 1,
        approver: "Neeraj Kapoor",
        role: "HR Manager",
        status: "Approved",
        decidedAt: "2026-05-21",
        remarks: "Approved for hiring."
      },
      {
        level: 2,
        approver: "Dr. Kavita Iyer",
        role: "Reporting Manager",
        status: "Approved",
        decidedAt: "2026-05-22",
        remarks: "Critical role for active project."
      }
    ],
    auditTrail: [
      { actor: "Priya Singh", action: "Created draft", timestamp: "2026-05-20 15:12" },
      { actor: "Priya Singh", action: "Submitted for approval", timestamp: "2026-05-21 09:02" },
      { actor: "Neeraj Kapoor", action: "Approved level 1", timestamp: "2026-05-21 12:11" },
      { actor: "Dr. Kavita Iyer", action: "Approved level 2", timestamp: "2026-05-22 16:00" }
    ]
  }
];

export function getMRFById(id: string) {
  return mrfRecords.find((mrf) => mrf.id === id);
}

export function getMRFStatusTone(status: MRFStatus) {
  switch (status) {
    case "Approved":
      return "Approved";
    case "Rejected":
      return "Rejected";
    case "Partially Approved":
    case "Submitted":
      return "Pending";
    case "Closed":
      return "Complete";
    default:
      return "Applied";
  }
}

export function getApprovalSummary(mrf: MRFRecord) {
  const approved = mrf.approvals.filter((approval) => approval.status === "Approved").length;
  return `${approved}/${mrf.approvals.length} approvals complete`;
}
