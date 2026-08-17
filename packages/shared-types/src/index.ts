/**
 * Wire types shared between apps/api and its clients (web, staff-portal, mobile).
 * Deliberately decoupled from @kampus/db's Prisma types so client apps never
 * depend on @prisma/client — these are the JSON shapes the API actually returns.
 */

export type Role = "parent" | "teacher" | "admin" | "gate-staff";

export interface AuthUser {
  id: string;
  schoolId: string;
  name: string;
  role: Role;
  initials: string;
}

export interface Session {
  token: string;
  user: AuthUser;
}

export interface ChildSummary {
  id: string;
  name: string;
  className: string;
  avatarInitials: string;
  avatarColor: string;
  attendancePct: number;
  feeBalance: number;
  feeTotal: number;
  term: string;
  nextEvent: string | null;
}

export interface AttendanceEntry {
  date: string;
  status: "PRESENT" | "LATE" | "ABSENT";
}

export interface AssessmentComponent {
  label: string;
  type: string;
  score: number;
  maxScore: number;
  weightPct: number;
}

export interface SubjectGrade {
  subject: string;
  finalScore: number;
  letterGrade: string;
  remark: string;
  components: AssessmentComponent[];
}

export interface HomeworkItem {
  id: string;
  subject: string | null;
  title: string;
  due: string | null;
  status: "PENDING" | "SUBMITTED";
}

export interface FeeLineItemView {
  id: string;
  label: string;
  originalAmount: number;
  netAmount: number;
  status: "PAID" | "PENDING" | "OVERDUE";
  scholarshipNote: string | null;
  discountNote: string | null;
}

export interface LedgerEntryView {
  id: string;
  type: "CHARGE" | "PAYMENT" | "SCHOLARSHIP" | "DISCOUNT";
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface PickupNoticeView {
  id: string;
  studentName: string;
  pickupPersonName: string;
  relation: string;
  code: string;
  status: "PENDING" | "CONFIRMED";
  createdAt: string;
  confirmedAt: string | null;
}

export interface ParentVoiceView {
  id: string;
  category: "SUGGESTION" | "COMPLAINT" | "HONOUR_A_TEACHER" | "GENERAL";
  message: string;
  from: string;
  resolved: boolean;
  createdAt: string;
}

export interface NotificationView {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
