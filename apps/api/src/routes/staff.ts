import { Router } from "express";
import { z } from "zod";
import { prisma } from "@kampus/db";
import { requireAuth, requireRole } from "../middleware/auth";

export const staffRouter = Router();
staffRouter.use(requireAuth, requireRole("teacher", "admin"));

/** Teacher's own class roster, for attendance marking. */
staffRouter.get("/roster", requireRole("teacher"), async (req, res) => {
  const teacher = await prisma.staff.findUnique({ where: { id: req.auth!.id } });
  if (!teacher?.classId) return res.status(400).json({ error: "No homeroom class assigned" });

  const students = await prisma.student.findMany({ where: { classId: teacher.classId, active: true }, orderBy: { name: "asc" } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRecords = await prisma.attendanceRecord.findMany({ where: { studentId: { in: students.map((s) => s.id) }, date: today } });
  const byStudent = new Map(todayRecords.map((r) => [r.studentId, r.status]));

  res.json(students.map((s) => ({ id: s.id, name: s.name, initials: s.avatarInitials, avatarColor: s.avatarColor, status: byStudent.get(s.id) ?? "PRESENT" })));
});

const markSchema = z.object({ marks: z.array(z.object({ studentId: z.string(), status: z.enum(["PRESENT", "LATE", "ABSENT"]) })) });

/** Bulk attendance write — backs both per-row marking and "Mark All Present". */
staffRouter.post("/roster/attendance", requireRole("teacher"), async (req, res) => {
  const parsed = markSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.$transaction(
    parsed.data.marks.map((m) =>
      prisma.attendanceRecord.upsert({
        where: { studentId_date: { studentId: m.studentId, date: today } },
        update: { status: m.status, markedByStaffId: req.auth!.id },
        create: { studentId: m.studentId, date: today, status: m.status, markedByStaffId: req.auth!.id },
      }),
    ),
  );
  res.json({ ok: true });
});

/** Grades Entry — teacher adds/edits a weighted CA line item for a student/subject/term. */
const gradeEntrySchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  termId: z.string(),
  type: z.enum(["CLASSWORK", "QUIZ", "GROUP_WORK", "PROJECT", "HOMEWORK_COMPLETION", "MID_TERM_EXAM", "END_OF_TERM_EXAM"]),
  label: z.string(),
  score: z.number(),
  maxScore: z.number().default(100),
  weightPct: z.number(),
});

staffRouter.get("/subjects", requireRole("teacher"), async (req, res) => {
  const teacher = await prisma.staff.findUnique({ where: { id: req.auth!.id } });
  if (!teacher?.classId) return res.status(400).json({ error: "No homeroom class assigned" });
  const subjects = await prisma.subject.findMany({ where: { classId: teacher.classId } });
  res.json(subjects);
});

staffRouter.post("/grades", requireRole("teacher"), async (req, res) => {
  const parsed = gradeEntrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const entry = await prisma.assessmentEntry.create({
    data: { ...parsed.data, date: new Date(), enteredByStaffId: req.auth!.id },
  });
  res.status(201).json(entry);
});

staffRouter.get("/grades/:studentId/:subjectId/:termId", requireRole("teacher"), async (req, res) => {
  const { studentId, subjectId, termId } = req.params;
  const entries = await prisma.assessmentEntry.findMany({ where: { studentId, subjectId, termId }, orderBy: { date: "asc" } });
  res.json(entries);
});

/** Homework / class posts (teacher) and School Announcements (admin, published directly). */
const postSchema = z.object({
  kind: z.enum(["HOMEWORK", "ANNOUNCEMENT"]),
  classId: z.string().optional(),
  subject: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  dueDate: z.string().optional(),
});

staffRouter.post("/posts", async (req, res) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const isAdmin = req.auth!.role === "admin";

  const post = await prisma.post.create({
    data: {
      schoolId: req.auth!.schoolId,
      kind: parsed.data.kind,
      classId: parsed.data.classId,
      subject: parsed.data.subject,
      title: parsed.data.title,
      body: parsed.data.body,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      authorStaffId: req.auth!.id,
      // Admin posts publish immediately; teacher posts wait for admin approval.
      status: isAdmin ? "APPROVED" : "PENDING",
      approvedByStaffId: isAdmin ? req.auth!.id : undefined,
      publishedAt: isAdmin ? new Date() : undefined,
    },
  });

  if (post.classId && post.status === "APPROVED") {
    const students = await prisma.student.findMany({ where: { classId: post.classId, active: true } });
    await prisma.postStudentStatus.createMany({ data: students.map((s) => ({ postId: post.id, studentId: s.id })) });
  }

  res.status(201).json(post);
});

staffRouter.get("/posts/mine", async (req, res) => {
  const posts = await prisma.post.findMany({ where: { authorStaffId: req.auth!.id }, orderBy: { createdAt: "desc" }, take: 20 });
  res.json(posts);
});

/** Pending Approvals queue — teacher posts awaiting admin sign-off. */
staffRouter.get("/approvals", requireRole("admin"), async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { schoolId: req.auth!.schoolId, status: "PENDING" },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(posts);
});

staffRouter.post("/approvals/:id/approve", requireRole("admin"), async (req, res) => {
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status: "APPROVED", approvedByStaffId: req.auth!.id, publishedAt: new Date() },
  });
  if (post.classId) {
    const students = await prisma.student.findMany({ where: { classId: post.classId, active: true } });
    await prisma.postStudentStatus.createMany({ data: students.map((s) => ({ postId: post.id, studentId: s.id })), skipDuplicates: true });
  }
  res.json(post);
});

staffRouter.post("/approvals/:id/reject", requireRole("admin"), async (req, res) => {
  const post = await prisma.post.update({ where: { id: req.params.id }, data: { status: "REJECTED" } });
  res.json(post);
});

/** Manage Staff & Students (admin). */
staffRouter.get("/manage/students", requireRole("admin"), async (req, res) => {
  const students = await prisma.student.findMany({ where: { schoolId: req.auth!.schoolId }, include: { class: true }, orderBy: { name: "asc" } });
  res.json(students.map((s) => ({ id: s.id, name: s.name, className: s.class.name, active: s.active })));
});

staffRouter.get("/manage/staff", requireRole("admin"), async (req, res) => {
  const staff = await prisma.staff.findMany({ where: { schoolId: req.auth!.schoolId }, orderBy: { name: "asc" } });
  res.json(staff.map((s) => ({ id: s.id, name: s.name, title: s.title, role: s.role, phone: s.phone, status: s.status })));
});

const statusSchema = z.object({ active: z.boolean() });
staffRouter.patch("/manage/students/:id", requireRole("admin"), async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const student = await prisma.student.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(student);
});

/** Fee Overview (admin) — collections dashboard for the current term. */
staffRouter.get("/fee-overview", requireRole("admin"), async (req, res) => {
  const term = await prisma.term.findFirst({ where: { schoolId: req.auth!.schoolId, isCurrent: true } });
  if (!term) return res.json({ expected: 0, collected: 0, outstanding: 0, rows: [] });

  const charges = await prisma.studentFeeCharge.findMany({
    where: { termId: term.id, student: { schoolId: req.auth!.schoolId } },
    include: { student: { include: { class: true } } },
  });

  const byStudent = new Map<string, { name: string; className: string; net: number; outstanding: number }>();
  for (const c of charges) {
    const key = c.studentId;
    const row = byStudent.get(key) ?? { name: c.student.name, className: c.student.class.name, net: 0, outstanding: 0 };
    row.net += c.netAmount;
    if (c.status !== "PAID") row.outstanding += c.netAmount;
    byStudent.set(key, row);
  }

  const rows = Array.from(byStudent.values()).map((r) => ({
    name: r.name,
    className: r.className,
    balance: r.outstanding,
    status: r.outstanding === 0 ? "Paid" : r.outstanding === r.net ? "Overdue" : "Pending",
  }));

  const expected = rows.reduce((s, r) => s + r.balance, 0) + charges.filter((c) => c.status === "PAID").reduce((s, c) => s + c.netAmount, 0);
  const outstanding = rows.reduce((s, r) => s + r.balance, 0);
  res.json({ expected, collected: expected - outstanding, outstanding, rows });
});

/** New feature: admin marks a scholarship on a student, scoped to specific fee line items. */
const scholarshipSchema = z.object({
  studentId: z.string(),
  name: z.string(),
  sponsor: z.string().optional(),
  validFrom: z.string(),
  validTo: z.string().optional(),
  coverage: z.array(z.object({ feeLineItemId: z.string(), subsidyType: z.enum(["FIXED", "PERCENT"]), subsidyValue: z.number() })),
});
staffRouter.post("/scholarships", requireRole("admin"), async (req, res) => {
  const parsed = scholarshipSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { coverage, ...rest } = parsed.data;
  const scholarship = await prisma.scholarship.create({
    data: {
      ...rest,
      validFrom: new Date(rest.validFrom),
      validTo: rest.validTo ? new Date(rest.validTo) : undefined,
      coverage: { create: coverage },
    },
    include: { coverage: true },
  });
  res.status(201).json(scholarship);
});

/** New feature: admin applies a discount — fixed/percent, one line item or total, one-time or recurring. */
const discountSchema = z.object({
  studentId: z.string(),
  feeLineItemId: z.string().optional(),
  amountType: z.enum(["FIXED", "PERCENT"]),
  value: z.number(),
  recurring: z.boolean().default(false),
  termId: z.string().optional(),
  reason: z.string().min(1),
});
staffRouter.post("/discounts", requireRole("admin"), async (req, res) => {
  const parsed = discountSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const discount = await prisma.discount.create({ data: { ...parsed.data, appliedByStaffId: req.auth!.id } });
  res.status(201).json(discount);
});

/** Messages — parent conversation threads. */
staffRouter.get("/messages/threads", async (req, res) => {
  const threads = await prisma.messageThread.findMany({
    where: { staffId: req.auth!.id },
    include: { parent: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  res.json(threads.map((t) => ({ id: t.id, parent: t.parent.name, preview: t.messages[0]?.body ?? "", time: t.messages[0]?.createdAt })));
});
