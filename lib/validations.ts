import { z } from "zod";

export const mrfSchema = z
  .object({
    departmentId: z.string().min(1, "Department is required"),
    designation: z.string().min(1, "Designation is required"),
    vacancies: z.coerce.number().int().positive("Vacancies must be greater than zero"),
    requiredExperience: z.coerce.number().min(0, "Experience cannot be negative"),
    skillsRequired: z.array(z.string().min(1)).min(1, "At least one skill is required"),
    budgetMin: z.coerce.number().positive("Minimum CTC is required"),
    budgetMax: z.coerce.number().positive("Maximum CTC is required"),
    reportingManagerId: z.string().min(1, "Reporting manager is required"),
    location: z.string().min(1, "Location is required")
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    path: ["budgetMax"],
    message: "Maximum CTC must be greater than or equal to minimum CTC"
  });

export const candidateSchema = z.object({
  name: z.string().min(2, "Candidate name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  resumeDocumentId: z.string().min(1, "Resume file is required"),
  experienceYears: z.coerce.number().min(0, "Experience cannot be negative"),
  skills: z.array(z.string().min(1)).default([])
});

export const interviewSchema = z.object({
  candidateId: z.string().min(1, "Candidate is required"),
  roundName: z.string().min(1, "Interview round is required"),
  scheduledAt: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: "Interview date cannot be in the past"
  }),
  interviewerIds: z.array(z.string().min(1)).min(1, "At least one interviewer is required"),
  mode: z.string().min(1, "Interview mode is required")
});

export const interviewFeedbackSchema = z.object({
  interviewId: z.string().min(1),
  score: z.coerce.number().min(0).max(100),
  recommendation: z.enum(["STRONG_HIRE", "HIRE", "HOLD", "NO_HIRE"]),
  remarks: z.string().min(1, "Feedback is mandatory after interview"),
  competencyJson: z.record(z.unknown())
});

export const offerLetterSchema = z.object({
  candidateStatus: z.literal("SELECTED", {
    errorMap: () => ({ message: "Candidate must be selected before offer generation" })
  }),
  ctcApproved: z.literal(true, {
    errorMap: () => ({ message: "CTC must be approved" })
  }),
  ctcAmount: z.coerce.number().positive("Approved CTC is required"),
  expiryDate: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: "Offer expiry date must be in the future"
  }),
  salaryBreakup: z.record(z.unknown())
});

export const trainingEnrollmentSchema = z.object({
  candidateStatus: z.enum(["OFFER_ACCEPTED", "TRAINING_PENDING"]),
  batchId: z.string().min(1, "Training batch is required")
});

export const attendanceSchema = z.object({
  completedSessions: z.coerce.number().int().min(0),
  totalSessions: z.coerce.number().int().positive()
}).refine((data) => data.completedSessions <= data.totalSessions, {
  path: ["completedSessions"],
  message: "Attendance cannot exceed total sessions"
});

export const examLinkSchema = z.object({
  trainingCompleted: z.literal(true, {
    errorMap: () => ({ message: "Training completion is mandatory before exam link generation" })
  }),
  attemptNo: z.coerce.number().int().min(1),
  maxAttempts: z.coerce.number().int().min(1)
}).refine((data) => data.attemptNo <= data.maxAttempts, {
  path: ["attemptNo"],
  message: "Exam attempt limit exceeded"
});

export function nextExamFailureStatus(attemptNo: number, maxAttempts = 2) {
  return attemptNo >= maxAttempts ? "REJECT_OR_HOLD_REVIEW" : "RETAKE_ALLOWED";
}

export function requiresHrFinalReview(recommendations: string[]) {
  const uniqueRecommendations = new Set(recommendations);
  return uniqueRecommendations.size > 1;
}
