import type {
  AnnouncementView,
  AttendanceEntry,
  CafeteriaItem,
  ChildSummary,
  DashboardStats,
  EventView,
  FeeStatement,
  GradeSheet,
  GuardianView,
  HomeworkItem,
  LedgerEntryView,
  NotificationView,
  ParentVoiceView,
  PickupNoticeView,
  ReportCardData,
  RosterView,
  Session,
  SubjectGrade,
} from "@kampus/shared-types";

export interface FeeItemView {
  id: string;
  label: string;
  amount: number;
  classId: string | null;
  className: string;
  archived: boolean;
  archivedReason: string | null;
  /** How many pupil charges exist for this item — decides delete vs withdraw. */
  billedCount: number;
}

export interface FeeOverviewRow {
  studentId: string;
  name: string;
  className: string;
  billed: number;
  paid: number;
  balance: number;
  credit: number;
  status: string;
}

/** What an uploaded mark sheet would change, or did change when committed. */
export interface MarkSheetImportReport {
  committed: boolean;
  subject: { id: string; name: string };
  class: { id: string; name: string };
  term: { id: string; name: string };
  updated: number;
  pending: number;
  unchanged: number;
  changes: { name: string; column: string; from: number | null; to: number }[];
  changeCount: number;
  outOfRange: { name: string; column: string; score: number; max: number }[];
  unmatchedPupils: string[];
  unmatchedColumns: string[];
  problems: string[];
}

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null | undefined;
  /** Called when the server rejects our token, so the app can bounce to sign-in. */
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Turns zod's flattened error shape into something a person can read. */
function readableError(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "error" in body) {
    const err = (body as { error: unknown }).error;
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const flat = err as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
      const field = Object.values(flat.fieldErrors ?? {})
        .flat()
        .filter(Boolean);
      const all = [...(flat.formErrors ?? []), ...field];
      if (all.length) return all.join(" ");
    }
  }
  return fallback;
}

export function createApiClient({ baseUrl, getToken, onUnauthorized }: ApiClientOptions) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getToken?.();
    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init?.headers,
        },
      });
    } catch {
      throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
    }

    if (res.status === 401) {
      onUnauthorized?.();
      throw new ApiError(401, "Your session has expired. Please sign in again.");
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, readableError(body, res.statusText));
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  /**
   * Fetches a file and hands it to the browser's downloads.
   *
   * Can't go through `request` — that parses JSON, and these endpoints return a
   * spreadsheet. The auth header still has to be attached by hand, which is why a
   * plain link to the URL would not work.
   */
  async function download(path: string, fallbackName: string): Promise<void> {
    const token = getToken?.();
    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    } catch {
      throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
    }
    if (res.status === 401) {
      onUnauthorized?.();
      throw new ApiError(401, "Your session has expired. Please sign in again.");
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, readableError(body, "That file could not be prepared."));
    }

    const disposition = res.headers.get("Content-Disposition") ?? "";
    const named = /filename="?([^"]+)"?/.exec(disposition)?.[1];
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = named ?? fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  /** Multipart POST. Content-Type is left unset so the browser writes its own boundary. */
  async function upload<T>(path: string, file: File, field = "file"): Promise<T> {
    const token = getToken?.();
    const form = new FormData();
    form.append(field, file);
    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
    } catch {
      throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
    }
    if (res.status === 401) {
      onUnauthorized?.();
      throw new ApiError(401, "Your session has expired. Please sign in again.");
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, readableError(body, "That file could not be read."));
    }
    return (await res.json()) as T;
  }

  const post = <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
  const patch = <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  const put = <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) });
  const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

  return {
    request,
    download,
    upload,
    baseUrl,

    setup: {
      status: () => request<{ initialised: boolean }>("/setup/status"),
      run: (payload: unknown) => post<Session & { school: { id: string; name: string; subdomain: string } }>("/setup", payload),
    },

    auth: {
      staffLogin: (email: string, password: string, schoolSubdomain?: string) =>
        post<Session>("/auth/staff/login", { email, password, schoolSubdomain }),
      parentLogin: (phone: string, password: string, schoolSubdomain?: string) =>
        post<Session>("/auth/parent/login", { phone, password, schoolSubdomain }),
      lookupCode: (code: string) =>
        request<{ name: string; schoolName: string; audience: "staff" | "parent"; role: string }>(
          `/auth/redeem/${encodeURIComponent(code)}`,
        ),
      redeem: (code: string, password: string) =>
        post<Session & { audience: "staff" | "parent" }>("/auth/redeem", { code, password }),
      changePassword: (currentPassword: string, newPassword: string) =>
        post<{ ok: true }>("/auth/change-password", { currentPassword, newPassword }),
      me: () => request<{ user: Record<string, unknown>; school: Record<string, unknown> }>("/auth/me"),
    },

    // --- Parent -------------------------------------------------------------
    students: {
      children: () => request<ChildSummary[]>("/students/children"),
      attendance: (childId: string) => request<AttendanceEntry[]>(`/students/children/${childId}/attendance`),
      grades: (childId: string) => request<SubjectGrade[]>(`/students/children/${childId}/grades`),
      homework: (childId: string) => request<HomeworkItem[]>(`/students/children/${childId}/homework`),
      submitHomework: (childId: string, postId: string) =>
        post(`/students/children/${childId}/homework/${postId}/submit`),
      announcements: () => request<AnnouncementView[]>("/students/announcements"),
      guardians: (childId: string) => request<GuardianView[]>(`/students/children/${childId}/guardians`),
    },

    fees: {
      statement: (childId: string) => request<FeeStatement>(`/fees/children/${childId}/fees`),
      ledger: (childId: string) => request<LedgerEntryView[]>(`/fees/children/${childId}/ledger`),
      pay: (childId: string, amount: number, method: string, payerReference?: string) =>
        post<{ payment: unknown; balance: number }>(`/fees/children/${childId}/payments`, { amount, method, payerReference }),
      cashReference: (childId: string, amount: number) =>
        post<{ reference: string; amount: number; reused: boolean }>(`/fees/children/${childId}/cash-reference`, { amount }),
    },

    pickup: {
      send: (studentId: string, pickupPersonName: string, relation: string, pickupTime?: string) =>
        post<PickupNoticeView>("/pickup", { studentId, pickupPersonName, relation, pickupTime }),
      forChild: (childId: string) => request<PickupNoticeView[]>(`/pickup/children/${childId}`),
      deskQueue: () => request<PickupNoticeView[]>("/pickup/desk/queue"),
      deskHistory: () => request<PickupNoticeView[]>("/pickup/desk/history"),
      confirm: (code: string) => post<PickupNoticeView>("/pickup/desk/confirm", { code }),
    },

    voice: {
      submit: (category: string, message: string, aboutStaffName?: string) =>
        post("/voice", { category, message, aboutStaffName }),
      mine: () => request<ParentVoiceView[]>("/voice/mine"),
      staffList: () => request<{ id: string; name: string; title: string | null }[]>("/voice/staff-list"),
    },

    notifications: {
      list: () => request<NotificationView[]>("/notifications"),
      markRead: (id: string) => post(`/notifications/${id}/read`),
    },

    events: { list: () => request<EventView[]>("/events") },

    reports: {
      get: (studentId: string, termId?: string) =>
        request<ReportCardData>(`/reports/${studentId}${termId ? `?termId=${termId}` : ""}`),
      printUrl: (studentId: string, termId?: string) =>
        `${baseUrl}/reports/${studentId}/print${termId ? `?termId=${termId}` : ""}`,
      saveRemarks: (studentId: string, payload: unknown) => put(`/reports/${studentId}/remarks`, payload),
      publish: (payload: { termId?: string; classId?: string }) => post<{ published: number }>("/reports/publish", payload),
    },

    // --- Staff --------------------------------------------------------------
    staff: {
      myClasses: () => request<{ id: string; name: string }[]>("/staff/my-classes"),
      roster: (classId?: string, date?: string) =>
        request<RosterView>(`/staff/roster${query({ classId, date })}`),
      markAttendance: (marks: { studentId: string; status: string }[], date?: string) =>
        post<{ ok: true; marked: number }>("/staff/roster/attendance", { marks, date }),
      gradeSheet: (classId?: string, subjectId?: string) =>
        request<GradeSheet>(`/staff/grade-sheet${query({ classId, subjectId })}`),
      addComponent: (payload: unknown) => post("/staff/grade-sheet/components", payload),
      removeComponent: (subjectId: string, componentKey: string) =>
        del<{ ok: true; removed: number }>(`/staff/grade-sheet/components${query({ subjectId, componentKey })}`),
      saveGradeSheet: (subjectId: string, scores: { studentId: string; componentKey: string; score: number }[]) =>
        post<{ ok: true; updated: number }>("/staff/grade-sheet", { subjectId, scores }),
      markSheetTemplate: (classId?: string, subjectId?: string) =>
        download(`/staff/grade-sheet/template${query({ classId, subjectId })}`, "mark-sheet.xlsx"),
      importMarkSheet: (file: File, opts: { classId?: string; subjectId?: string; commit?: boolean }) =>
        upload<MarkSheetImportReport>(
          `/staff/grade-sheet/import${query({ classId: opts.classId, subjectId: opts.subjectId, commit: opts.commit ? "1" : undefined })}`,
          file,
        ),
      broadsheet: (classId?: string) => download(`/staff/broadsheet${query({ classId })}`, "broadsheet.xlsx"),
      createPost: (payload: unknown) => post("/staff/posts", payload),
      myPosts: () => request<{ id: string; kind: string; title: string; body: string; status: string; tag: string | null; createdAt: string }[]>("/staff/posts/mine"),
      approvals: () =>
        request<{ id: string; title: string; body: string; kind: string; className: string; authorName: string; createdAt: string }[]>(
          "/staff/approvals",
        ),
      approve: (id: string) => post(`/staff/approvals/${id}/approve`),
      reject: (id: string) => post(`/staff/approvals/${id}/reject`),
      threads: () =>
        request<{ id: string; parentId: string; parentName: string; initials: string; avatarColor: string; preview: string; lastAt: string; unread: number }[]>(
          "/staff/messages/threads",
        ),
      thread: (id: string) =>
        request<{ id: string; parentName: string; messages: { id: string; body: string; fromStaff: boolean; createdAt: string }[] }>(
          `/staff/messages/threads/${id}`,
        ),
      sendMessage: (payload: { threadId?: string; parentId?: string; body: string }) =>
        post<{ id: string; threadId: string }>("/staff/messages/send", payload),
      contacts: () => request<{ id: string; name: string; children: string }[]>("/staff/messages/contacts"),
      voiceInbox: () => request<ParentVoiceView[]>("/staff/voice"),
      respondVoice: (id: string, payload: { resolved?: boolean; adminResponse?: string }) => patch(`/staff/voice/${id}`, payload),
    },

    // --- Admin --------------------------------------------------------------
    admin: {
      dashboard: () => request<DashboardStats>("/admin/dashboard"),
      classes: () =>
        request<{ id: string; name: string; order: number; studentCount: number; teachers: { id: string; name: string }[]; subjects: { id: string; name: string }[] }[]>(
          "/admin/classes",
        ),
      createClass: (payload: { name: string; order?: number }) => post("/admin/classes", payload),
      deleteClass: (id: string) => del(`/admin/classes/${id}`),
      createSubject: (payload: { classId: string; name: string }) => post("/admin/subjects", payload),
      deleteSubject: (id: string) => del(`/admin/subjects/${id}`),
      bulkSubjects: (classIds: string[], names: string[]) => post<{ created: number }>("/admin/subjects/bulk", { classIds, names }),
      terms: () =>
        request<{ id: string; name: string; academicYear: string; startDate: string; endDate: string; isCurrent: boolean }[]>("/admin/terms"),
      createTerm: (payload: unknown) => post("/admin/terms", payload),
      setCurrentTerm: (id: string) => post(`/admin/terms/${id}/set-current`),
      staff: () =>
        request<{ id: string; name: string; email: string; role: string; title: string | null; phone: string | null; status: string; className: string | null; classId: string | null; initials: string; pendingAccessCode: string | null }[]>(
          "/admin/staff",
        ),
      createStaff: (payload: unknown) => post<{ id: string; name: string; email: string; accessCode: string }>("/admin/staff", payload),
      updateStaff: (id: string, payload: unknown) => patch(`/admin/staff/${id}`, payload),
      deleteStaff: (id: string) => del(`/admin/staff/${id}`),
      resetStaffAccess: (id: string) => post<{ accessCode: string }>(`/admin/staff/${id}/reset-access`),
      students: (params?: { classId?: string; search?: string }) =>
        request<{ id: string; name: string; admissionNo: string | null; className: string; classId: string; active: boolean; monitored: boolean; initials: string; avatarColor: string; guardians: { id: string; name: string; phone: string; relation: string; isPrimary: boolean }[] }[]>(
          `/admin/students${query(params ?? {})}`,
        ),
      createStudent: (payload: unknown) =>
        post<{ id: string; name: string; className: string; guardian: { name: string; phone: string; accessCode?: string } | null }>(
          "/admin/students",
          payload,
        ),
      updateStudent: (id: string, payload: unknown) => patch(`/admin/students/${id}`, payload),
      deleteStudent: (id: string) => del(`/admin/students/${id}`),
      unlinkGuardian: (studentId: string, parentId: string) => del(`/admin/students/${studentId}/guardians/${parentId}`),
      addGuardian: (studentId: string, payload: unknown) =>
        post<{ id: string; name: string; phone: string; accessCode?: string }>(`/admin/students/${studentId}/guardians`, payload),
      parents: () =>
        request<{ id: string; name: string; phone: string; email: string | null; initials: string; pendingAccessCode: string | null; children: { id: string; name: string; relation: string }[] }[]>(
          "/admin/parents",
        ),
      resetParentAccess: (id: string) => post<{ accessCode: string }>(`/admin/parents/${id}/reset-access`),
      updateParent: (id: string, payload: unknown) => patch(`/admin/parents/${id}`, payload),
      deleteParent: (id: string) => del(`/admin/parents/${id}`),
      feeItems: (includeArchived?: boolean) =>
        request<FeeItemView[]>(`/admin/fee-items${includeArchived ? "?includeArchived=1" : ""}`),
      createFeeItem: (payload: unknown) => post("/admin/fee-items", payload),
      deleteFeeItem: (id: string) => del(`/admin/fee-items/${id}`),
      withdrawFeeItem: (id: string, reason: string) => post<{ reversed: number; amount: number }>(`/admin/fee-items/${id}/withdraw`, { reason }),
      restoreFeeItem: (id: string) => post(`/admin/fee-items/${id}/restore`),
      waiveFee: (payload: { studentId: string; feeLineItemId: string; reason: string }) =>
        post<{ amount: number }>("/admin/fee-items/waive", payload),
      studentCharges: (studentId: string) =>
        request<{ feeLineItemId: string; label: string; amount: number; netAmount: number }[]>(`/admin/students/${studentId}/charges`),
      billFeeItem: (id: string) => post<{ billed: number }>(`/admin/fee-items/${id}/bill`),
      feeOverview: () =>
        request<{ expected: number; collected: number; outstanding: number; rows: FeeOverviewRow[] }>("/admin/fee-overview"),
      pendingCash: () =>
        request<{ id: string; reference: string | null; amount: number; studentName: string; parentName: string | null; createdAt: string }[]>(
          "/admin/payments/pending-cash",
        ),
      confirmPayment: (id: string, amount?: number) => post(`/admin/payments/${id}/confirm`, amount ? { amount } : {}),
      manualPayment: (payload: { studentId: string; amount: number; note?: string }) => post("/admin/payments/manual", payload),
      createScholarship: (payload: unknown) => post("/admin/scholarships", payload),
      createDiscount: (payload: unknown) => post("/admin/discounts", payload),
      inquiries: () =>
        request<{ id: string; parentName: string; phone: string; childAge: string | null; interestedLevel: string | null; message: string | null; status: string; createdAt: string }[]>(
          "/admin/inquiries",
        ),
      updateInquiry: (id: string, status: string) => patch(`/admin/inquiries/${id}`, { status }),
      audit: () =>
        request<{ id: string; actorName: string | null; action: string; entity: string | null; detail: string | null; createdAt: string }[]>(
          "/admin/audit",
        ),
    },

    content: {
      get: () => request<Record<string, unknown>>("/content"),
      updateSchool: (payload: unknown) => patch("/content/school", payload),
      update: (payload: unknown) => patch("/content", payload),
      add: (collection: string, payload: unknown) => post(`/content/${collection}`, payload),
      remove: (collection: string, id: string) => del(`/content/${collection}/${id}`),
      addEvent: (payload: unknown) => post("/content/events", payload),
      removeEvent: (id: string) => del(`/content/events/${id}`),
      saveMenu: (payload: unknown) => put("/content/cafeteria", payload),
    },

    school: {
      site: (subdomain = "default") => request<Record<string, unknown>>(`/public/site/${subdomain}`),
      cafeteria: (subdomain = "default") => request<CafeteriaItem[]>(`/public/cafeteria/${subdomain}`),
    },
  };
}

function query(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return `?${new URLSearchParams(entries as [string, string][]).toString()}`;
}

export type ApiClient = ReturnType<typeof createApiClient>;
