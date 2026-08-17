import type {
  AttendanceEntry,
  ChildSummary,
  FeeLineItemView,
  HomeworkItem,
  LedgerEntryView,
  NotificationView,
  ParentVoiceView,
  PickupNoticeView,
  Session,
  SubjectGrade,
} from "@kampus/shared-types";

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null | undefined;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function createApiClient({ baseUrl, getToken }: ApiClientOptions) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getToken?.();
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.error ? JSON.stringify(body.error) : res.statusText);
    }
    return res.json() as Promise<T>;
  }

  return {
    auth: {
      parentLogin: (schoolSubdomain: string, phone: string, password: string) =>
        request<Session>("/auth/parent/login", { method: "POST", body: JSON.stringify({ schoolSubdomain, phone, password }) }),
      staffLogin: (schoolSubdomain: string, email: string, password: string) =>
        request<Session>("/auth/staff/login", { method: "POST", body: JSON.stringify({ schoolSubdomain, email, password }) }),
    },
    students: {
      children: () => request<ChildSummary[]>("/students/children"),
      attendance: (childId: string) => request<AttendanceEntry[]>(`/students/children/${childId}/attendance`),
      grades: (childId: string) => request<SubjectGrade[]>(`/students/children/${childId}/grades`),
      homework: (childId: string) => request<HomeworkItem[]>(`/students/children/${childId}/homework`),
      submitHomework: (childId: string, postId: string) =>
        request(`/students/children/${childId}/homework/${postId}/submit`, { method: "POST" }),
      announcements: () => request<{ id: string; title: string; body: string; date: string }[]>("/students/announcements"),
    },
    fees: {
      lineItems: (childId: string) => request<FeeLineItemView[]>(`/fees/children/${childId}/fees`),
      ledger: (childId: string) => request<LedgerEntryView[]>(`/fees/children/${childId}/ledger`),
      pay: (childId: string, amount: number, method: string) =>
        request(`/fees/children/${childId}/payments`, { method: "POST", body: JSON.stringify({ amount, method }) }),
    },
    pickup: {
      send: (studentId: string, pickupPersonName: string, relation: string) =>
        request<PickupNoticeView>("/pickup", { method: "POST", body: JSON.stringify({ studentId, pickupPersonName, relation }) }),
      forChild: (childId: string) => request<PickupNoticeView[]>(`/pickup/children/${childId}`),
      deskQueue: () => request<PickupNoticeView[]>("/pickup/desk/queue"),
      deskHistory: () => request<PickupNoticeView[]>("/pickup/desk/history"),
      confirm: (code: string) => request<PickupNoticeView>("/pickup/desk/confirm", { method: "POST", body: JSON.stringify({ code }) }),
    },
    voice: {
      submit: (category: string, message: string, aboutStaffName?: string) =>
        request("/voice", { method: "POST", body: JSON.stringify({ category, message, aboutStaffName }) }),
      inbox: () => request<ParentVoiceView[]>("/voice/inbox"),
      respond: (id: string, patch: { resolved?: boolean; adminResponse?: string }) =>
        request(`/voice/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    },
    notifications: {
      list: () => request<NotificationView[]>("/notifications"),
      markRead: (id: string) => request(`/notifications/${id}/read`, { method: "POST" }),
    },
    events: {
      list: () => request("/events"),
    },
    staff: {
      roster: () => request("/staff/roster"),
      markAttendance: (marks: { studentId: string; status: string }[]) =>
        request("/staff/roster/attendance", { method: "POST", body: JSON.stringify({ marks }) }),
      subjects: () => request("/staff/subjects"),
      submitGrade: (payload: unknown) => request("/staff/grades", { method: "POST", body: JSON.stringify(payload) }),
      createPost: (payload: unknown) => request("/staff/posts", { method: "POST", body: JSON.stringify(payload) }),
      myPosts: () => request("/staff/posts/mine"),
      approvals: () => request("/staff/approvals"),
      approve: (id: string) => request(`/staff/approvals/${id}/approve`, { method: "POST" }),
      reject: (id: string) => request(`/staff/approvals/${id}/reject`, { method: "POST" }),
      manageStudents: () => request("/staff/manage/students"),
      manageStaff: () => request("/staff/manage/staff"),
      setStudentActive: (id: string, active: boolean) =>
        request(`/staff/manage/students/${id}`, { method: "PATCH", body: JSON.stringify({ active }) }),
      feeOverview: () => request("/staff/fee-overview"),
      createScholarship: (payload: unknown) => request("/staff/scholarships", { method: "POST", body: JSON.stringify(payload) }),
      createDiscount: (payload: unknown) => request("/staff/discounts", { method: "POST", body: JSON.stringify(payload) }),
      messageThreads: () => request("/staff/messages/threads"),
    },
    school: {
      bySubdomain: (subdomain: string) => request(`/schools/${subdomain}`),
      cafeteria: (subdomain: string) => request(`/cafeteria/${subdomain}`),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
