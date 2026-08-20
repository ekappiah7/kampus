/**
 * Wire types shared between apps/api and its clients (web, staff-portal, parent-app).
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
  title?: string | null;
  className?: string | null;
}

export interface Session {
  token: string;
  user: AuthUser;
}

export interface SchoolBrand {
  id: string;
  name: string;
  shortName?: string | null;
  primaryColor: string;
  logoUrl: string | null;
}

export interface ChildSummary {
  id: string;
  name: string;
  className: string;
  avatarInitials: string;
  avatarColor: string;
  attendancePct: number;
  /** How many days have actually been marked — 0 means "no data yet", not "0% attendance". */
  attendanceRecorded: number;
  feeBalance: number;
  feeTotal: number;
  term: string;
  nextEvent: string | null;
  admissionNo: string | null;
}

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

export interface AttendanceEntry {
  date: string;
  status: AttendanceStatus;
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
  body: string;
  due: string | null;
  status: "PENDING" | "SUBMITTED";
}

export interface FeeLineView {
  chargeId: string;
  feeLineItemId: string;
  label: string;
  originalAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  netAmount: number;
  scholarshipNote: string | null;
  discountNote: string | null;
  status: "PAID" | "PENDING" | "OVERDUE";
}

export interface FeeStatement {
  term: string | null;
  lines: FeeLineView[];
  billed: number;
  paid: number;
  balance: number;
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
  pickupTime: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

export type VoiceCategory = "SUGGESTION" | "COMPLAINT" | "HONOUR_A_TEACHER" | "GENERAL";

export interface ParentVoiceView {
  id: string;
  category: VoiceCategory;
  message: string;
  from: string;
  aboutStaffName: string | null;
  resolved: boolean;
  adminResponse: string | null;
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

export interface AnnouncementView {
  id: string;
  title: string;
  body: string;
  tag: string | null;
  date: string;
}

export interface GuardianView {
  id: string;
  name: string;
  relation: string;
  initials: string;
  avatarColor: string;
}

export interface EventView {
  id: string;
  title: string;
  date: string;
  time: string | null;
}

export interface CafeteriaItem {
  id: string;
  dayOfWeek: string;
  main: string;
  side: string | null;
}

// --- Staff-side ------------------------------------------------------------

export interface RosterStudent {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  monitored: boolean;
  status: AttendanceStatus | null;
}

export interface RosterView {
  class: { id: string; name: string };
  date: string;
  students: RosterStudent[];
}

export interface GradeSheetComponent {
  key: string;
  label: string;
  type: string;
  weightPct: number;
  maxScore: number;
}

export interface GradeSheetRow {
  studentId: string;
  name: string;
  initials: string;
  avatarColor: string;
  monitored: boolean;
  scores: Record<string, number | null>;
  finalScore: number | null;
  letterGrade: string | null;
}

export interface GradeSheet {
  class: { id: string; name: string };
  term: { id: string; name: string; academicYear: string };
  subjects: { id: string; name: string }[];
  subject: { id: string; name: string } | null;
  components: GradeSheetComponent[];
  rows: GradeSheetRow[];
}

export interface DashboardStats {
  students: number;
  staff: number;
  classes: number;
  term: { id: string; name: string; academicYear: string } | null;
  fees: { expected: number; collected: number; outstanding: number };
  actionable: {
    pendingApprovals: number;
    openVoice: number;
    newInquiries: number;
    pendingPickups: number;
    pendingCash: number;
  };
}

export interface ReportCardData {
  school: { name: string; logoUrl: string | null; address: string | null; phone: string | null; gesRegNo: string | null };
  student: { id: string; name: string; admissionNo: string | null; className: string };
  term: { name: string; academicYear: string; startDate: string; endDate: string };
  subjects: SubjectGrade[];
  overall: { average: number; position: number | null; classSize: number };
  attendance: { present: number; late: number; absent: number; total: number; percentage: number };
  remarks: {
    teacher: string | null;
    headTeacher: string | null;
    conduct: string | null;
    attitude: string | null;
    interest: string | null;
  };
  nextTermBegins: string | null;
  published: boolean;
}
