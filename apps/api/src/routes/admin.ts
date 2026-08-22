import { Router } from "express";
import { z } from "zod";
import { prisma } from "@kampus/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { accessCode, avatarTint, initialsOf } from "../lib/codes";
import { audit } from "../lib/audit";
import { billClass, recomputeCharges, reverseCharge, studentBalance } from "../lib/fees";
import { normalisePhone } from "./auth";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("admin"));

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

adminRouter.get("/dashboard", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });

  const [students, staffCount, classes, pendingApprovals, openVoice, newInquiries, pendingPickups, pendingCash] =
    await Promise.all([
      prisma.student.count({ where: { schoolId, active: true } }),
      prisma.staff.count({ where: { schoolId, status: "ACTIVE" } }),
      prisma.class.count({ where: { schoolId } }),
      prisma.post.count({ where: { schoolId, status: "PENDING" } }),
      prisma.parentVoiceSubmission.count({ where: { schoolId, resolved: false } }),
      prisma.admissionInquiry.count({ where: { schoolId, status: "NEW" } }),
      prisma.pickupNotice.count({ where: { student: { schoolId }, status: "PENDING" } }),
      prisma.payment.count({ where: { student: { schoolId }, method: "CASH", status: "PENDING" } }),
    ]);

  let fees = { expected: 0, collected: 0, outstanding: 0 };
  if (term) {
    const charges = await prisma.studentFeeCharge.findMany({
      where: { termId: term.id, student: { schoolId } },
      select: { netAmount: true },
    });
    const payments = await prisma.feeLedgerEntry.aggregate({
      where: { termId: term.id, type: "PAYMENT", student: { schoolId } },
      _sum: { amount: true },
    });
    const expected = charges.reduce((s, c) => s + c.netAmount, 0);
    const collected = Math.abs(payments._sum.amount ?? 0);
    fees = {
      expected: Math.round(expected * 100) / 100,
      collected: Math.round(collected * 100) / 100,
      outstanding: Math.round(Math.max(expected - collected, 0) * 100) / 100,
    };
  }

  res.json({
    students,
    staff: staffCount,
    classes,
    term: term ? { id: term.id, name: term.name, academicYear: term.academicYear } : null,
    fees,
    actionable: { pendingApprovals, openVoice, newInquiries, pendingPickups, pendingCash },
  });
});

// ---------------------------------------------------------------------------
// Classes & subjects
// ---------------------------------------------------------------------------

adminRouter.get("/classes", async (req, res) => {
  const classes = await prisma.class.findMany({
    where: { schoolId: req.auth!.schoolId },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { students: true } },
      classTeachers: { select: { id: true, name: true } },
      subjects: { orderBy: { name: "asc" } },
    },
  });
  res.json(
    classes.map((c) => ({
      id: c.id,
      name: c.name,
      order: c.order,
      studentCount: c._count.students,
      teachers: c.classTeachers,
      subjects: c.subjects.map((s) => ({ id: s.id, name: s.name })),
    })),
  );
});

const classSchema = z.object({ name: z.string().min(1), order: z.number().int().optional() });

adminRouter.post("/classes", async (req, res) => {
  const parsed = classSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;

  const existing = await prisma.class.findUnique({ where: { schoolId_name: { schoolId, name: parsed.data.name } } });
  if (existing) return res.status(409).json({ error: "A class with that name already exists" });

  const max = await prisma.class.aggregate({ where: { schoolId }, _max: { order: true } });
  const created = await prisma.class.create({
    data: { schoolId, name: parsed.data.name, order: parsed.data.order ?? (max._max.order ?? 0) + 1 },
  });
  audit(req.auth!, "class.create", { schoolId, entity: `class:${created.id}`, detail: created.name });
  res.status(201).json(created);
});

adminRouter.patch("/classes/:id", async (req, res) => {
  const parsed = classSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const cls = await prisma.class.findFirst({ where: { id: req.params.id, schoolId: req.auth!.schoolId } });
  if (!cls) return res.status(404).json({ error: "Class not found" });
  const updated = await prisma.class.update({ where: { id: cls.id }, data: parsed.data });
  res.json(updated);
});

adminRouter.delete("/classes/:id", async (req, res) => {
  const cls = await prisma.class.findFirst({
    where: { id: req.params.id, schoolId: req.auth!.schoolId },
    include: { _count: { select: { students: true } } },
  });
  if (!cls) return res.status(404).json({ error: "Class not found" });
  if (cls._count.students > 0) {
    return res.status(409).json({ error: `Move the ${cls._count.students} pupil(s) in this class first.` });
  }
  await prisma.class.delete({ where: { id: cls.id } });
  audit(req.auth!, "class.delete", { schoolId: req.auth!.schoolId, entity: `class:${cls.id}`, detail: cls.name });
  res.json({ ok: true });
});

const subjectSchema = z.object({ classId: z.string(), name: z.string().min(1) });

adminRouter.post("/subjects", async (req, res) => {
  const parsed = subjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const cls = await prisma.class.findFirst({ where: { id: parsed.data.classId, schoolId } });
  if (!cls) return res.status(404).json({ error: "Class not found" });

  const existing = await prisma.subject.findUnique({
    where: { classId_name: { classId: cls.id, name: parsed.data.name } },
  });
  if (existing) return res.status(409).json({ error: "That subject already exists for this class" });

  const created = await prisma.subject.create({ data: { schoolId, classId: cls.id, name: parsed.data.name } });
  res.status(201).json(created);
});

adminRouter.delete("/subjects/:id", async (req, res) => {
  const subject = await prisma.subject.findFirst({ where: { id: req.params.id, schoolId: req.auth!.schoolId } });
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  await prisma.subject.delete({ where: { id: subject.id } });
  res.json({ ok: true });
});

/** Applies a set of subjects to several classes at once — saves a lot of clicking at setup. */
const bulkSubjectsSchema = z.object({ classIds: z.array(z.string()).min(1), names: z.array(z.string().min(1)).min(1) });

adminRouter.post("/subjects/bulk", async (req, res) => {
  const parsed = bulkSubjectsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const classes = await prisma.class.findMany({ where: { id: { in: parsed.data.classIds }, schoolId } });

  let created = 0;
  for (const cls of classes) {
    for (const name of parsed.data.names) {
      const exists = await prisma.subject.findUnique({ where: { classId_name: { classId: cls.id, name } } });
      if (exists) continue;
      await prisma.subject.create({ data: { schoolId, classId: cls.id, name } });
      created++;
    }
  }
  res.status(201).json({ created });
});

// ---------------------------------------------------------------------------
// Terms
// ---------------------------------------------------------------------------

adminRouter.get("/terms", async (req, res) => {
  const terms = await prisma.term.findMany({ where: { schoolId: req.auth!.schoolId }, orderBy: { startDate: "desc" } });
  res.json(terms);
});

const termSchema = z.object({
  name: z.string().min(1),
  academicYear: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  isCurrent: z.boolean().optional(),
});

adminRouter.post("/terms", async (req, res) => {
  const parsed = termSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const { isCurrent, ...rest } = parsed.data;

  // Exactly one term may be current — everything else keys off it.
  if (isCurrent) await prisma.term.updateMany({ where: { schoolId }, data: { isCurrent: false } });

  const created = await prisma.term.create({
    data: {
      schoolId,
      ...rest,
      startDate: new Date(rest.startDate),
      endDate: new Date(rest.endDate),
      isCurrent: isCurrent ?? (await prisma.term.count({ where: { schoolId } })) === 0,
    },
  });
  audit(req.auth!, "term.create", { schoolId, entity: `term:${created.id}`, detail: `${created.name} ${created.academicYear}` });
  res.status(201).json(created);
});

/**
 * Correcting a term.
 *
 * A term named wrongly — "Term 1" where the school says "First Term" — prints on
 * every report card that references it, so it has to be fixable without touching
 * the marks and fees already hanging off it. Renaming does exactly that: the id
 * never changes, so nothing attached to it moves.
 */
adminRouter.patch("/terms/:id", async (req, res) => {
  const parsed = termSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const term = await prisma.term.findFirst({ where: { id: req.params.id, schoolId } });
  if (!term) return res.status(404).json({ error: "Term not found" });

  const { isCurrent, startDate, endDate, ...rest } = parsed.data;
  if (isCurrent) await prisma.term.updateMany({ where: { schoolId }, data: { isCurrent: false } });

  const updated = await prisma.term.update({
    where: { id: term.id },
    data: {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(isCurrent === undefined ? {} : { isCurrent }),
    },
  });
  audit(req.auth!, "term.update", { schoolId, entity: `term:${term.id}`, detail: `${updated.name} ${updated.academicYear}` });
  res.json(updated);
});

/** Only an empty term can go. One with marks or fees behind it is the school's record. */
adminRouter.delete("/terms/:id", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const term = await prisma.term.findFirst({ where: { id: req.params.id, schoolId } });
  if (!term) return res.status(404).json({ error: "Term not found" });

  // Attendance is dated rather than term-scoped, so it is counted by date range.
  const [marks, charges, attendance, reportCards] = await Promise.all([
    prisma.assessmentEntry.count({ where: { termId: term.id } }),
    prisma.studentFeeCharge.count({ where: { termId: term.id } }),
    prisma.attendanceRecord.count({ where: { date: { gte: term.startDate, lte: term.endDate } } }),
    prisma.reportCard.count({ where: { termId: term.id } }),
  ]);
  const history = [
    { one: "recorded mark", many: "recorded marks", n: marks },
    { one: "fee charge", many: "fee charges", n: charges },
    { one: "attendance record", many: "attendance records", n: attendance },
    { one: "report card", many: "report cards", n: reportCards },
  ].filter((r) => r.n > 0);

  if (history.length) {
    return res.status(409).json({
      error: `${term.name} has ${describeHistory(history)} behind it and cannot be deleted. Rename it instead, or make another term current.`,
      history,
    });
  }
  if (term.isCurrent) {
    const others = await prisma.term.count({ where: { schoolId, NOT: { id: term.id } } });
    if (others > 0) return res.status(400).json({ error: "Make another term current before deleting this one." });
  }

  await prisma.term.delete({ where: { id: term.id } });
  audit(req.auth!, "term.delete", { schoolId, entity: `term:${term.id}`, detail: `${term.name} ${term.academicYear}` });
  res.json({ ok: true });
});

adminRouter.post("/terms/:id/set-current", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const term = await prisma.term.findFirst({ where: { id: req.params.id, schoolId } });
  if (!term) return res.status(404).json({ error: "Term not found" });
  await prisma.term.updateMany({ where: { schoolId }, data: { isCurrent: false } });
  const updated = await prisma.term.update({ where: { id: term.id }, data: { isCurrent: true } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

adminRouter.get("/staff", async (req, res) => {
  const staff = await prisma.staff.findMany({
    where: { schoolId: req.auth!.schoolId },
    include: { homeroomClass: true },
    orderBy: { name: "asc" },
  });
  res.json(
    staff.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      title: s.title,
      phone: s.phone,
      status: s.status,
      className: s.homeroomClass?.name ?? null,
      classId: s.classId,
      initials: initialsOf(s.name),
      pendingAccessCode: s.accessCode,
    })),
  );
});

const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["TEACHER", "ADMIN", "GATE_STAFF"]),
  title: z.string().optional(),
  phone: z.string().optional(),
  classId: z.string().optional().nullable(),
});

adminRouter.post("/staff", async (req, res) => {
  const parsed = staffSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.staff.findUnique({ where: { schoolId_email: { schoolId, email } } });
  if (existing) return res.status(409).json({ error: "A staff member with that email already exists" });

  const code = accessCode();
  const created = await prisma.staff.create({
    data: {
      schoolId,
      name: parsed.data.name,
      email,
      role: parsed.data.role,
      title: parsed.data.title,
      phone: parsed.data.phone,
      classId: parsed.data.classId || null,
      accessCode: code,
      mustSetPassword: true,
    },
  });
  audit(req.auth!, "staff.create", { schoolId, entity: `staff:${created.id}`, detail: `${created.name} (${created.role})` });
  // The code is returned once, for the admin to hand over.
  res.status(201).json({ id: created.id, name: created.name, email: created.email, accessCode: code });
});

adminRouter.patch("/staff/:id", async (req, res) => {
  const parsed = staffSchema.partial().extend({ status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const staff = await prisma.staff.findFirst({ where: { id: req.params.id, schoolId } });
  if (!staff) return res.status(404).json({ error: "Staff member not found" });

  const { email, ...rest } = parsed.data;
  const updated = await prisma.staff.update({
    where: { id: staff.id },
    data: { ...rest, ...(email ? { email: email.toLowerCase().trim() } : {}) },
  });
  audit(req.auth!, "staff.update", { schoolId, entity: `staff:${staff.id}`, detail: staff.name });
  res.json(updated);
});

/** Reissues an access code — for "I lost my code" and for password resets. */
adminRouter.post("/staff/:id/reset-access", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const staff = await prisma.staff.findFirst({ where: { id: req.params.id, schoolId } });
  if (!staff) return res.status(404).json({ error: "Staff member not found" });
  const code = accessCode();
  await prisma.staff.update({
    where: { id: staff.id },
    data: { accessCode: code, passwordHash: null, mustSetPassword: true },
  });
  audit(req.auth!, "staff.reset_access", { schoolId, entity: `staff:${staff.id}`, detail: staff.name });
  res.json({ accessCode: code });
});

// ---------------------------------------------------------------------------
// Students & guardians
// ---------------------------------------------------------------------------

adminRouter.get("/students", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const classId = typeof req.query.classId === "string" ? req.query.classId : undefined;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;

  const students = await prisma.student.findMany({
    where: {
      schoolId,
      ...(classId ? { classId } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    },
    include: {
      class: true,
      guardians: { include: { parent: true } },
    },
    orderBy: [{ class: { order: "asc" } }, { name: "asc" }],
  });

  res.json(
    students.map((s) => ({
      id: s.id,
      name: s.name,
      admissionNo: s.admissionNo,
      className: s.class.name,
      classId: s.classId,
      active: s.active,
      monitored: s.monitored,
      initials: s.avatarInitials ?? initialsOf(s.name),
      avatarColor: s.avatarColor ?? avatarTint(s.id),
      guardians: s.guardians.map((g) => ({
        id: g.parent.id,
        name: g.parent.name,
        phone: g.parent.phone,
        relation: g.relation,
        isPrimary: g.isPrimary,
      })),
    })),
  );
});

const studentSchema = z.object({
  name: z.string().min(2),
  classId: z.string(),
  admissionNo: z.string().optional(),
  dateOfBirth: z.string().optional(),
  monitored: z.boolean().optional(),
  /** Optionally create/link a guardian in the same step — the common case. */
  guardian: z
    .object({
      name: z.string().min(2),
      phone: z.string().min(6),
      email: z.string().email().optional().or(z.literal("")),
      relation: z.string().min(2),
    })
    .optional(),
});

adminRouter.post("/students", async (req, res) => {
  const parsed = studentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const { guardian, ...student } = parsed.data;

  const cls = await prisma.class.findFirst({ where: { id: student.classId, schoolId } });
  if (!cls) return res.status(404).json({ error: "Class not found" });

  const created = await prisma.student.create({
    data: {
      schoolId,
      classId: cls.id,
      name: student.name,
      admissionNo: student.admissionNo,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
      monitored: student.monitored ?? false,
      avatarInitials: initialsOf(student.name),
    },
  });
  await prisma.student.update({ where: { id: created.id }, data: { avatarColor: avatarTint(created.id) } });

  let guardianResult: { name: string; phone: string; accessCode?: string } | null = null;
  if (guardian) {
    const phone = normalisePhone(guardian.phone);
    let parent = await prisma.parent.findUnique({ where: { schoolId_phone: { schoolId, phone } } });
    let issuedCode: string | undefined;

    if (!parent) {
      issuedCode = accessCode();
      parent = await prisma.parent.create({
        data: {
          schoolId,
          name: guardian.name,
          phone,
          email: guardian.email || null,
          accessCode: issuedCode,
          mustSetPassword: true,
        },
      });
    } else if (parent.accessCode) {
      // Existing parent who hasn't redeemed yet — hand back the same code.
      issuedCode = parent.accessCode;
    }

    await prisma.parentStudent.create({
      data: { parentId: parent.id, studentId: created.id, relation: guardian.relation, isPrimary: true },
    });
    guardianResult = { name: parent.name, phone: parent.phone, accessCode: issuedCode };
  }

  // Bill the new pupil for whatever the class is already charged this term.
  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (term) {
    const items = await prisma.feeLineItem.findMany({ where: { schoolId, OR: [{ classId: cls.id }, { classId: null }] } });
    for (const item of items) {
      await prisma.studentFeeCharge.create({
        data: {
          studentId: created.id,
          feeLineItemId: item.id,
          termId: term.id,
          originalAmount: item.amount,
          netAmount: item.amount,
        },
      });
      await prisma.feeLedgerEntry.create({
        data: { studentId: created.id, termId: term.id, type: "CHARGE", amount: item.amount, feeLineItemId: item.id, note: `Charged ${item.label}` },
      });
    }
    if (items.length) await recomputeCharges(created.id, term.id);
  }

  audit(req.auth!, "student.create", { schoolId, entity: `student:${created.id}`, detail: `${created.name} → ${cls.name}` });
  res.status(201).json({ id: created.id, name: created.name, className: cls.name, guardian: guardianResult });
});

adminRouter.patch("/students/:id", async (req, res) => {
  const parsed = studentSchema
    .partial()
    .omit({ guardian: true })
    .extend({ active: z.boolean().optional() })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const student = await prisma.student.findFirst({ where: { id: req.params.id, schoolId } });
  if (!student) return res.status(404).json({ error: "Pupil not found" });

  const { dateOfBirth, ...rest } = parsed.data;
  const updated = await prisma.student.update({
    where: { id: student.id },
    data: { ...rest, ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}) },
  });
  audit(req.auth!, "student.update", { schoolId, entity: `student:${student.id}`, detail: student.name });
  res.json(updated);
});

/** Adds an additional guardian to an existing pupil (second parent, grandparent…). */
const guardianSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  relation: z.string().min(2),
  isPrimary: z.boolean().optional(),
});

adminRouter.post("/students/:id/guardians", async (req, res) => {
  const parsed = guardianSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const student = await prisma.student.findFirst({ where: { id: req.params.id, schoolId } });
  if (!student) return res.status(404).json({ error: "Pupil not found" });

  const phone = normalisePhone(parsed.data.phone);
  let parent = await prisma.parent.findUnique({ where: { schoolId_phone: { schoolId, phone } } });
  let issuedCode: string | undefined;
  if (!parent) {
    issuedCode = accessCode();
    parent = await prisma.parent.create({
      data: { schoolId, name: parsed.data.name, phone, email: parsed.data.email || null, accessCode: issuedCode },
    });
  } else if (parent.accessCode) {
    issuedCode = parent.accessCode;
  }

  const link = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
  });
  if (link) return res.status(409).json({ error: "That guardian is already linked to this pupil" });

  if (parsed.data.isPrimary) {
    await prisma.parentStudent.updateMany({ where: { studentId: student.id }, data: { isPrimary: false } });
  }
  await prisma.parentStudent.create({
    data: {
      parentId: parent.id,
      studentId: student.id,
      relation: parsed.data.relation,
      isPrimary: parsed.data.isPrimary ?? false,
    },
  });

  res.status(201).json({ id: parent.id, name: parent.name, phone: parent.phone, accessCode: issuedCode });
});

adminRouter.get("/parents", async (req, res) => {
  const parents = await prisma.parent.findMany({
    where: { schoolId: req.auth!.schoolId },
    include: { children: { include: { student: true } } },
    orderBy: { name: "asc" },
  });
  res.json(
    parents.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      email: p.email,
      initials: initialsOf(p.name),
      pendingAccessCode: p.accessCode,
      children: p.children.map((c) => ({ id: c.student.id, name: c.student.name, relation: c.relation })),
    })),
  );
});

adminRouter.post("/parents/:id/reset-access", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const parent = await prisma.parent.findFirst({ where: { id: req.params.id, schoolId } });
  if (!parent) return res.status(404).json({ error: "Parent not found" });
  const code = accessCode();
  await prisma.parent.update({
    where: { id: parent.id },
    data: { accessCode: code, passwordHash: null, mustSetPassword: true },
  });
  audit(req.auth!, "parent.reset_access", { schoolId, entity: `parent:${parent.id}`, detail: parent.name });
  res.json({ accessCode: code });
});


// ---------------------------------------------------------------------------
// Editing and removing people
// ---------------------------------------------------------------------------

/**
 * Removing a person is two operations, and which one applies depends on whether
 * they have a history in the school.
 *
 * A pupil who was typed in twice, or a teacher added by mistake, should just go.
 * A pupil who has a term of marks, attendance and a fee ledger must not — deleting
 * them would silently rewrite the school's own records, and "the child left" is a
 * different fact from "the child was never here". That case is a deactivation,
 * which the register already supports.
 *
 * So: count what depends on the record, and let the count decide.
 */
/**
 * Billing is *not* history.
 *
 * Adding a pupil bills them for the class's fee items straight away, so a pupil has
 * a charge and a ledger row within a second of being created. Counting those as
 * history would mean a name typed twice could never be removed — which is exactly
 * the case this feature exists for.
 *
 * What actually can't be undone is money that moved and school work that happened.
 * So a pupil's unpaid charges are derived billing, cleared with them; a single
 * payment, mark or attendance record stops the deletion dead.
 */
async function studentHistory(studentId: string) {
  const [attendance, marks, payments, settled, reportCards, pickups, homework] = await Promise.all([
    prisma.attendanceRecord.count({ where: { studentId } }),
    prisma.assessmentEntry.count({ where: { studentId } }),
    prisma.payment.count({ where: { studentId } }),
    prisma.feeLedgerEntry.count({ where: { studentId, type: "PAYMENT" } }),
    prisma.reportCard.count({ where: { studentId } }),
    prisma.pickupNotice.count({ where: { studentId } }),
    prisma.postStudentStatus.count({ where: { studentId } }),
  ]);
  return [
    { one: "attendance record", many: "attendance records", n: attendance },
    { one: "recorded mark", many: "recorded marks", n: marks },
    { one: "payment", many: "payments", n: Math.max(payments, settled) },
    { one: "report card", many: "report cards", n: reportCards },
    { one: "pickup notice", many: "pickup notices", n: pickups },
    { one: "homework record", many: "homework records", n: homework },
  ].filter((r) => r.n > 0);
}

async function parentHistory(parentId: string) {
  const [payments, pickups, voice, messages] = await Promise.all([
    prisma.payment.count({ where: { parentId } }),
    prisma.pickupNotice.count({ where: { requestedByParentId: parentId } }),
    prisma.parentVoiceSubmission.count({ where: { parentId } }),
    prisma.message.count({ where: { senderParentId: parentId } }),
  ]);
  return [
    { one: "payment", many: "payments", n: payments },
    { one: "pickup notice", many: "pickup notices", n: pickups },
    { one: "Parent Voice message", many: "Parent Voice messages", n: voice },
    { one: "message", many: "messages", n: messages },
  ].filter((r) => r.n > 0);
}

async function staffHistory(staffId: string) {
  const [posts, attendance, marks, ledger, pickups, discounts, messages] = await Promise.all([
    prisma.post.count({ where: { authorStaffId: staffId } }),
    prisma.attendanceRecord.count({ where: { markedByStaffId: staffId } }),
    prisma.assessmentEntry.count({ where: { enteredByStaffId: staffId } }),
    prisma.feeLedgerEntry.count({ where: { createdByStaffId: staffId } }),
    prisma.pickupNotice.count({ where: { confirmedByStaffId: staffId } }),
    prisma.discount.count({ where: { appliedByStaffId: staffId } }),
    prisma.message.count({ where: { senderStaffId: staffId } }),
  ]);
  return [
    { one: "post", many: "posts", n: posts },
    { one: "attendance register", many: "attendance registers", n: attendance },
    { one: "recorded mark", many: "recorded marks", n: marks },
    { one: "ledger entry", many: "ledger entries", n: ledger },
    { one: "confirmed pickup", many: "confirmed pickups", n: pickups },
    { one: "discount", many: "discounts", n: discounts },
    { one: "message", many: "messages", n: messages },
  ].filter((r) => r.n > 0);
}

/** "3 attendance records and 12 recorded marks" — plain enough to act on. */
function describeHistory(rows: { one: string; many: string; n: number }[]): string {
  const parts = rows.map((r) => `${r.n} ${r.n === 1 ? r.one : r.many}`);
  if (parts.length === 1) return parts[0]!;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

adminRouter.delete("/students/:id", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const student = await prisma.student.findFirst({ where: { id: req.params.id, schoolId } });
  if (!student) return res.status(404).json({ error: "Pupil not found" });

  const history = await studentHistory(student.id);
  if (history.length) {
    return res.status(409).json({
      error: `${student.name} has ${describeHistory(history)} on record. Deactivate instead — that keeps the history and takes them off the register.`,
      history,
    });
  }

  // Guardian links cascade. The billing rows do not, and they are derived — the
  // pupil was auto-billed on creation and never paid — so they go with the pupil.
  await prisma.$transaction([
    prisma.feeLedgerEntry.deleteMany({ where: { studentId: student.id } }),
    prisma.studentFeeCharge.deleteMany({ where: { studentId: student.id } }),
    prisma.scholarshipCoverage.deleteMany({ where: { scholarship: { studentId: student.id } } }),
    prisma.scholarship.deleteMany({ where: { studentId: student.id } }),
    prisma.discount.deleteMany({ where: { studentId: student.id } }),
    prisma.student.delete({ where: { id: student.id } }),
  ]);
  audit(req.auth!, "student.delete", { schoolId, entity: `student:${student.id}`, detail: student.name });
  res.json({ ok: true });
});

adminRouter.delete("/parents/:id", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const parent = await prisma.parent.findFirst({ where: { id: req.params.id, schoolId } });
  if (!parent) return res.status(404).json({ error: "Parent not found" });

  const history = await parentHistory(parent.id);
  if (history.length) {
    return res.status(409).json({
      error: `${parent.name} has ${describeHistory(history)} on record and cannot be removed.`,
      history,
    });
  }

  const children = await prisma.parentStudent.count({ where: { parentId: parent.id } });
  if (children > 0) {
    return res.status(409).json({
      error: `${parent.name} is still linked to ${children} pupil(s). Unlink them first, so no child is left without a guardian.`,
    });
  }

  await prisma.parent.delete({ where: { id: parent.id } });
  audit(req.auth!, "parent.delete", { schoolId, entity: `parent:${parent.id}`, detail: parent.name });
  res.json({ ok: true });
});

adminRouter.delete("/staff/:id", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const staff = await prisma.staff.findFirst({ where: { id: req.params.id, schoolId } });
  if (!staff) return res.status(404).json({ error: "Staff member not found" });

  if (staff.id === req.auth!.id) {
    return res.status(400).json({ error: "You can't remove your own account." });
  }
  if (staff.role === "ADMIN") {
    const admins = await prisma.staff.count({ where: { schoolId, role: "ADMIN" } });
    if (admins <= 1) return res.status(400).json({ error: "This is the school's only administrator." });
  }

  const history = await staffHistory(staff.id);
  if (history.length) {
    return res.status(409).json({
      error: `${staff.name} has ${describeHistory(history)} on record. Set them to Inactive instead — that keeps the trail of who did what.`,
      history,
    });
  }

  await prisma.staff.delete({ where: { id: staff.id } });
  audit(req.auth!, "staff.delete", { schoolId, entity: `staff:${staff.id}`, detail: staff.name });
  res.json({ ok: true });
});

const parentUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

adminRouter.patch("/parents/:id", async (req, res) => {
  const parsed = parentUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const parent = await prisma.parent.findFirst({ where: { id: req.params.id, schoolId } });
  if (!parent) return res.status(404).json({ error: "Parent not found" });

  const { phone, email, ...rest } = parsed.data;
  // Phone is the parent's login, and it is unique per school — a clash has to be a
  // clear message rather than a database error.
  if (phone) {
    const normalised = normalisePhone(phone);
    const clash = await prisma.parent.findFirst({ where: { schoolId, phone: normalised, NOT: { id: parent.id } } });
    if (clash) return res.status(409).json({ error: `${clash.name} already uses that phone number.` });
  }

  const updated = await prisma.parent.update({
    where: { id: parent.id },
    data: {
      ...rest,
      ...(phone ? { phone: normalisePhone(phone) } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
    },
  });
  audit(req.auth!, "parent.update", { schoolId, entity: `parent:${parent.id}`, detail: parent.name });
  res.json(updated);
});

/** Removes one guardian link, without touching the parent or the pupil. */
adminRouter.delete("/students/:id/guardians/:parentId", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const student = await prisma.student.findFirst({ where: { id: req.params.id, schoolId } });
  if (!student) return res.status(404).json({ error: "Pupil not found" });

  const link = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId: req.params.parentId, studentId: student.id } },
  });
  if (!link) return res.status(404).json({ error: "That guardian is not linked to this pupil." });

  const remaining = await prisma.parentStudent.count({ where: { studentId: student.id } });
  if (remaining <= 1) {
    return res.status(409).json({ error: "Add another guardian first — a pupil must always have at least one." });
  }

  await prisma.parentStudent.delete({ where: { id: link.id } });
  audit(req.auth!, "guardian.unlink", { schoolId, entity: `student:${student.id}`, detail: student.name });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Fees: line items, billing, scholarships, discounts, cash confirmation
// ---------------------------------------------------------------------------

adminRouter.get("/fee-items", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const items = await prisma.feeLineItem.findMany({
    where: { schoolId, ...(req.query.includeArchived === "1" ? {} : { archived: false }) },
    include: { class: true, _count: { select: { charges: true } } },
    orderBy: [{ archived: "asc" }, { class: { order: "asc" } }, { label: "asc" }],
  });
  res.json(
    items.map((i) => ({
      id: i.id,
      label: i.label,
      amount: i.amount,
      classId: i.classId,
      className: i.class?.name ?? "All levels",
      archived: i.archived,
      archivedReason: i.archivedReason,
      // Drives the UI's choice between a plain delete and a withdrawal.
      billedCount: i._count.charges,
    })),
  );
});

const feeItemSchema = z.object({ label: z.string().min(1), amount: z.number().nonnegative(), classId: z.string().optional().nullable() });

adminRouter.post("/fee-items", async (req, res) => {
  const parsed = feeItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const created = await prisma.feeLineItem.create({
    data: { schoolId, label: parsed.data.label, amount: parsed.data.amount, classId: parsed.data.classId || null },
  });
  audit(req.auth!, "fee_item.create", { schoolId, entity: `fee_item:${created.id}`, detail: `${created.label} GH₵${created.amount}` });
  res.status(201).json(created);
});

/**
 * Removes a fee item that was never billed. Once pupils have been charged, the item
 * has to be withdrawn instead (below) so the ledger keeps its history.
 */
adminRouter.delete("/fee-items/:id", async (req, res) => {
  const item = await prisma.feeLineItem.findFirst({ where: { id: req.params.id, schoolId: req.auth!.schoolId } });
  if (!item) return res.status(404).json({ error: "Fee item not found" });
  const charged = await prisma.studentFeeCharge.count({ where: { feeLineItemId: item.id } });
  if (charged > 0) {
    return res.status(409).json({
      error: `This item is billed to ${charged} pupil(s). Withdraw it instead — that reverses the charges and keeps the record.`,
      billedCount: charged,
    });
  }

  // A withdrawn item still has ledger rows pointing at it — the CHARGE and its
  // REVERSAL. Those rows stay: the money history is not ours to erase. Only the link
  // is dropped, and each row's note already names the fee in words, so the ledger
  // still reads correctly once the item itself is gone.
  await prisma.$transaction([
    prisma.feeLedgerEntry.updateMany({ where: { feeLineItemId: item.id }, data: { feeLineItemId: null } }),
    prisma.scholarshipCoverage.deleteMany({ where: { feeLineItemId: item.id } }),
    prisma.discount.deleteMany({ where: { feeLineItemId: item.id } }),
    prisma.feeLineItem.delete({ where: { id: item.id } }),
  ]);
  audit(req.auth!, "fee_item.delete", { schoolId: item.schoolId, entity: `fee_item:${item.id}`, detail: item.label });
  res.json({ ok: true });
});

const withdrawSchema = z.object({ reason: z.string().min(1).max(200) });

/**
 * Drops a fee item that has already been billed — an excursion called off, a levy
 * the PTA reversed, a charge raised in error.
 *
 * Every pupil's charge for the current term is reversed, so balances fall by the
 * amount and anyone who already paid is left holding a credit rather than losing
 * the money. Earlier terms are left alone: those bills are closed business.
 */
adminRouter.post("/fee-items/:id/withdraw", async (req, res) => {
  const parsed = withdrawSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Say briefly why this fee is being withdrawn." });

  const schoolId = req.auth!.schoolId;
  const item = await prisma.feeLineItem.findFirst({ where: { id: req.params.id, schoolId } });
  if (!item) return res.status(404).json({ error: "Fee item not found" });

  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (!term) return res.status(400).json({ error: "Set a current term first" });

  const charges = await prisma.studentFeeCharge.findMany({
    where: { feeLineItemId: item.id, termId: term.id },
    select: { studentId: true },
  });

  let reversed = 0;
  let amount = 0;
  for (const c of charges) {
    const value = await reverseCharge(c.studentId, item.id, term.id, `${item.label} withdrawn — ${parsed.data.reason}`, req.auth!.id);
    if (value !== null) {
      reversed++;
      amount += value;
    }
  }

  await prisma.feeLineItem.update({
    where: { id: item.id },
    data: { archived: true, archivedAt: new Date(), archivedReason: parsed.data.reason },
  });

  audit(req.auth!, "fee_item.withdraw", {
    schoolId,
    entity: `fee_item:${item.id}`,
    detail: `${item.label} — ${reversed} pupil(s), GH₵${Math.round(amount * 100) / 100} reversed — ${parsed.data.reason}`,
  });
  res.json({ reversed, amount: Math.round(amount * 100) / 100 });
});

/** Puts a withdrawn item back in the active list. It is not re-billed automatically. */
adminRouter.post("/fee-items/:id/restore", async (req, res) => {
  const item = await prisma.feeLineItem.findFirst({ where: { id: req.params.id, schoolId: req.auth!.schoolId } });
  if (!item) return res.status(404).json({ error: "Fee item not found" });
  await prisma.feeLineItem.update({
    where: { id: item.id },
    data: { archived: false, archivedAt: null, archivedReason: null },
  });
  audit(req.auth!, "fee_item.restore", { schoolId: item.schoolId, entity: `fee_item:${item.id}`, detail: item.label });
  res.json({ ok: true });
});

const waiveSchema = z.object({ studentId: z.string(), feeLineItemId: z.string(), reason: z.string().min(1).max(200) });

/**
 * Drops one fee from one pupil — the commoner case by far. A child who does not take
 * the bus, or who left mid-term, should not carry a charge the rest of the class does.
 */
adminRouter.post("/fee-items/waive", async (req, res) => {
  const parsed = waiveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Pick a pupil and a fee item, and say why." });

  const schoolId = req.auth!.schoolId;
  const [student, item, term] = await Promise.all([
    prisma.student.findFirst({ where: { id: parsed.data.studentId, schoolId } }),
    prisma.feeLineItem.findFirst({ where: { id: parsed.data.feeLineItemId, schoolId } }),
    prisma.term.findFirst({ where: { schoolId, isCurrent: true } }),
  ]);
  if (!student) return res.status(404).json({ error: "Pupil not found" });
  if (!item) return res.status(404).json({ error: "Fee item not found" });
  if (!term) return res.status(400).json({ error: "Set a current term first" });

  const amount = await reverseCharge(student.id, item.id, term.id, `${item.label} waived — ${parsed.data.reason}`, req.auth!.id);
  if (amount === null) return res.status(409).json({ error: `${student.name} was not billed for ${item.label} this term.` });

  audit(req.auth!, "fee_item.waive", {
    schoolId,
    entity: `student:${student.id}`,
    detail: `${item.label} GH₵${amount} waived for ${student.name} — ${parsed.data.reason}`,
  });
  res.json({ amount });
});

/** The fee items a pupil is actually carrying this term, for the waive picker. */
adminRouter.get("/students/:id/charges", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const student = await prisma.student.findFirst({ where: { id: req.params.id, schoolId } });
  if (!student) return res.status(404).json({ error: "Pupil not found" });
  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (!term) return res.json([]);

  const charges = await prisma.studentFeeCharge.findMany({
    where: { studentId: student.id, termId: term.id },
    include: { feeLineItem: true },
    orderBy: { feeLineItem: { label: "asc" } },
  });
  res.json(charges.map((c) => ({ feeLineItemId: c.feeLineItemId, label: c.feeLineItem.label, amount: c.originalAmount, netAmount: c.netAmount })));
});

/** Bills a fee item to every active pupil it applies to, for the current term. */
adminRouter.post("/fee-items/:id/bill", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const item = await prisma.feeLineItem.findFirst({ where: { id: req.params.id, schoolId } });
  if (!item) return res.status(404).json({ error: "Fee item not found" });
  if (item.archived) {
    return res.status(400).json({ error: `${item.label} has been withdrawn. Restore it first if you want to bill it again.` });
  }
  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (!term) return res.status(400).json({ error: "Set a current term first" });

  const created = await billClass(item.id, term.id);
  audit(req.auth!, "fee_item.bill", { schoolId, entity: `fee_item:${item.id}`, detail: `${item.label} → ${created} pupil(s)` });
  res.json({ billed: created });
});

adminRouter.get("/fee-overview", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (!term) return res.json({ expected: 0, collected: 0, outstanding: 0, rows: [] });

  const students = await prisma.student.findMany({
    where: { schoolId, active: true },
    include: { class: true },
    orderBy: [{ class: { order: "asc" } }, { name: "asc" }],
  });

  const rows = [];
  let expected = 0;
  let collected = 0;
  for (const s of students) {
    const { billed, paid, balance, credit } = await studentBalance(s.id, term.id);
    expected += billed;
    collected += paid;
    rows.push({
      studentId: s.id,
      name: s.name,
      className: s.class.name,
      billed,
      paid,
      balance,
      credit,
      status: credit > 0 ? "In credit" : balance === 0 ? (billed > 0 ? "Paid" : "Not billed") : paid > 0 ? "Part-paid" : "Outstanding",
    });
  }

  res.json({
    expected: Math.round(expected * 100) / 100,
    collected: Math.round(collected * 100) / 100,
    outstanding: Math.round(Math.max(expected - collected, 0) * 100) / 100,
    rows,
  });
});

/** Cash payments awaiting confirmation at the front office. */
adminRouter.get("/payments/pending-cash", async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { student: { schoolId: req.auth!.schoolId }, method: "CASH", status: "PENDING" },
    include: { student: true, parent: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      amount: p.amount,
      studentName: p.student.name,
      parentName: p.parent?.name ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

const confirmCashSchema = z.object({ amount: z.number().positive().optional() });

adminRouter.post("/payments/:id/confirm", async (req, res) => {
  const parsed = confirmCashSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;

  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, student: { schoolId } },
    include: { student: true },
  });
  if (!payment) return res.status(404).json({ error: "Payment not found" });
  if (payment.status === "SUCCESS") return res.status(409).json({ error: "This payment is already confirmed" });

  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (!term) return res.status(400).json({ error: "No current term" });

  const amount = parsed.data.amount ?? payment.amount;
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCESS", amount, confirmedByStaffId: req.auth!.id, confirmedAt: new Date() },
  });
  await prisma.feeLedgerEntry.create({
    data: {
      studentId: payment.studentId,
      termId: term.id,
      type: "PAYMENT",
      amount: -amount,
      paymentId: payment.id,
      note: `Cash received at office (${payment.reference})`,
      createdByStaffId: req.auth!.id,
    },
  });
  await recomputeCharges(payment.studentId, term.id);
  await prisma.notification.create({
    data: {
      schoolId,
      parentId: payment.parentId,
      type: "FEE_REMINDER",
      title: "Payment received",
      body: `GH₵${amount} received for ${payment.student.name}. Thank you.`,
    },
  });

  audit(req.auth!, "payment.confirm", { schoolId, entity: `payment:${payment.id}`, detail: `GH₵${amount} for ${payment.student.name}` });
  res.json(updated);
});

/** Records a payment taken directly at the office, with no parent-app step. */
const manualPaymentSchema = z.object({ studentId: z.string(), amount: z.number().positive(), note: z.string().optional() });

/** Every settled payment this term, newest first — what a reversal is chosen from. */
adminRouter.get("/payments", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const payments = await prisma.payment.findMany({
    where: { student: { schoolId }, status: { in: ["SUCCESS", "REVERSED"] } },
    include: { student: true, parent: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(
    payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      reference: p.reference,
      status: p.status,
      studentId: p.studentId,
      studentName: p.student.name,
      parentName: p.parent?.name ?? null,
      reversedReason: p.reversedReason,
      createdAt: p.createdAt.toISOString(),
      confirmedAt: p.confirmedAt?.toISOString() ?? null,
    })),
  );
});

const reversePaymentSchema = z.object({ reason: z.string().min(1).max(200) });

/**
 * Undoes a payment confirmed in error — the wrong pupil, the wrong amount, a cash
 * reference confirmed twice.
 *
 * The payment row is not deleted and its ledger entry is not touched. A REVERSAL is
 * appended beside it carrying the reason, exactly as a withdrawn fee is handled, so
 * a year later the record shows money received and money undone rather than a hole
 * where a payment used to be. That is the difference between a correction and a
 * cover-up, and a bursar's ledger has to be able to tell them apart.
 */
adminRouter.post("/payments/:id/reverse", async (req, res) => {
  const parsed = reversePaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Say briefly why this payment is being reversed." });

  const schoolId = req.auth!.schoolId;
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, student: { schoolId } },
    include: { student: true, ledgerEntry: true },
  });
  if (!payment) return res.status(404).json({ error: "Payment not found" });
  if (payment.status === "REVERSED") return res.status(409).json({ error: "This payment has already been reversed." });
  if (payment.status !== "SUCCESS") return res.status(409).json({ error: "Only a confirmed payment can be reversed." });

  // The reversal belongs to the term the payment was credited to, not today's term —
  // otherwise reversing an old payment would move money between terms.
  const termId = payment.ledgerEntry?.termId ?? (await prisma.term.findFirst({ where: { schoolId, isCurrent: true } }))?.id;
  if (!termId) return res.status(400).json({ error: "No term to reverse this against." });

  await prisma.$transaction([
    prisma.feeLedgerEntry.create({
      data: {
        studentId: payment.studentId,
        termId,
        type: "REVERSAL",
        // The payment sits in the ledger as a negative; undoing it is the positive.
        amount: payment.amount,
        note: `Payment reversed — ${parsed.data.reason}`,
        createdByStaffId: req.auth!.id,
      },
    }),
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REVERSED", reversedAt: new Date(), reversedReason: parsed.data.reason },
    }),
  ]);

  await recomputeCharges(payment.studentId, termId);
  await prisma.notification.create({
    data: {
      schoolId,
      parentId: payment.parentId,
      type: "FEE_REMINDER",
      title: "A payment was corrected",
      body: `A payment of GH₵${payment.amount} on ${payment.student.name}'s account has been reversed. Please contact the school office.`,
    },
  });

  audit(req.auth!, "payment.reverse", {
    schoolId,
    entity: `payment:${payment.id}`,
    detail: `GH₵${payment.amount} for ${payment.student.name} — ${parsed.data.reason}`,
  });
  res.json({ ok: true, amount: payment.amount });
});

adminRouter.post("/payments/manual", async (req, res) => {
  const parsed = manualPaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const student = await prisma.student.findFirst({ where: { id: parsed.data.studentId, schoolId } });
  if (!student) return res.status(404).json({ error: "Pupil not found" });
  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (!term) return res.status(400).json({ error: "Set a current term first" });

  const payment = await prisma.payment.create({
    data: {
      studentId: student.id,
      amount: parsed.data.amount,
      method: "CASH",
      status: "SUCCESS",
      reference: `OFFICE-${Date.now().toString(36).toUpperCase()}`,
      confirmedByStaffId: req.auth!.id,
      confirmedAt: new Date(),
    },
  });
  await prisma.feeLedgerEntry.create({
    data: {
      studentId: student.id,
      termId: term.id,
      type: "PAYMENT",
      amount: -parsed.data.amount,
      paymentId: payment.id,
      note: parsed.data.note || "Payment received at office",
      createdByStaffId: req.auth!.id,
    },
  });
  await recomputeCharges(student.id, term.id);

  audit(req.auth!, "payment.manual", { schoolId, entity: `student:${student.id}`, detail: `GH₵${parsed.data.amount}` });
  res.status(201).json(payment);
});

const scholarshipSchema = z.object({
  studentId: z.string(),
  name: z.string().min(2),
  sponsor: z.string().optional(),
  validFrom: z.string(),
  validTo: z.string().optional(),
  notes: z.string().optional(),
  coverage: z
    .array(
      z.object({
        feeLineItemId: z.string(),
        subsidyType: z.enum(["FIXED", "PERCENT"]),
        subsidyValue: z.number().positive(),
      }),
    )
    .min(1, "Choose at least one fee item to cover"),
});

adminRouter.post("/scholarships", async (req, res) => {
  const parsed = scholarshipSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const { studentId, coverage, validFrom, validTo, ...rest } = parsed.data;

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) return res.status(404).json({ error: "Pupil not found" });

  const created = await prisma.scholarship.create({
    data: {
      studentId,
      ...rest,
      validFrom: new Date(validFrom),
      validTo: validTo ? new Date(validTo) : null,
      coverage: { create: coverage },
    },
    include: { coverage: true },
  });

  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (term) await recomputeCharges(studentId, term.id);

  audit(req.auth!, "scholarship.create", { schoolId, entity: `student:${studentId}`, detail: `${created.name} for ${student.name}` });
  res.status(201).json(created);
});

adminRouter.delete("/scholarships/:id", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const scholarship = await prisma.scholarship.findFirst({
    where: { id: req.params.id, student: { schoolId } },
  });
  if (!scholarship) return res.status(404).json({ error: "Scholarship not found" });
  await prisma.scholarship.delete({ where: { id: scholarship.id } });
  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (term) await recomputeCharges(scholarship.studentId, term.id);
  res.json({ ok: true });
});

const discountSchema = z.object({
  studentId: z.string(),
  feeLineItemId: z.string().optional().nullable(),
  amountType: z.enum(["FIXED", "PERCENT"]),
  value: z.number().positive(),
  recurring: z.boolean().optional(),
  reason: z.string().min(2),
});

adminRouter.post("/discounts", async (req, res) => {
  const parsed = discountSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const student = await prisma.student.findFirst({ where: { id: parsed.data.studentId, schoolId } });
  if (!student) return res.status(404).json({ error: "Pupil not found" });
  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (!term) return res.status(400).json({ error: "Set a current term first" });

  const created = await prisma.discount.create({
    data: {
      studentId: parsed.data.studentId,
      feeLineItemId: parsed.data.feeLineItemId || null,
      amountType: parsed.data.amountType,
      value: parsed.data.value,
      recurring: parsed.data.recurring ?? false,
      termId: parsed.data.recurring ? null : term.id,
      reason: parsed.data.reason,
      appliedByStaffId: req.auth!.id,
    },
  });
  await recomputeCharges(parsed.data.studentId, term.id);

  audit(req.auth!, "discount.apply", {
    schoolId,
    entity: `student:${student.id}`,
    detail: `${parsed.data.reason} — ${parsed.data.amountType === "PERCENT" ? `${parsed.data.value}%` : `GH₵${parsed.data.value}`}`,
  });
  res.status(201).json(created);
});

adminRouter.delete("/discounts/:id", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const discount = await prisma.discount.findFirst({ where: { id: req.params.id, student: { schoolId } } });
  if (!discount) return res.status(404).json({ error: "Discount not found" });
  await prisma.discount.delete({ where: { id: discount.id } });
  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (term) await recomputeCharges(discount.studentId, term.id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Admissions inbox
// ---------------------------------------------------------------------------

adminRouter.get("/inquiries", async (req, res) => {
  const inquiries = await prisma.admissionInquiry.findMany({
    where: { schoolId: req.auth!.schoolId },
    orderBy: { createdAt: "desc" },
  });
  res.json(inquiries);
});

adminRouter.patch("/inquiries/:id", async (req, res) => {
  const parsed = z.object({ status: z.enum(["NEW", "CONTACTED", "ENROLLED", "CLOSED"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const inquiry = await prisma.admissionInquiry.findFirst({ where: { id: req.params.id, schoolId: req.auth!.schoolId } });
  if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });
  const updated = await prisma.admissionInquiry.update({ where: { id: inquiry.id }, data: parsed.data });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

adminRouter.get("/audit", async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    where: { schoolId: req.auth!.schoolId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(logs);
});
