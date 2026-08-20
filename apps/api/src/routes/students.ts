import { Router } from "express";
import { prisma } from "@kampus/db";
import type { AttendanceEntry, ChildSummary, HomeworkItem, SubjectGrade } from "@kampus/shared-types";
import { requireAuth, requireRole } from "../middleware/auth";
import { rollUpGrade } from "../lib/grading";
import { initialsOf, avatarTint } from "../lib/codes";
import { studentBalance } from "../lib/fees";

export const studentsRouter = Router();
studentsRouter.use(requireAuth, requireRole("parent"));

/** Guards every child-scoped route: a parent may only read their own children. */
async function assertOwnsChild(parentId: string, studentId: string) {
  const link = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId } },
  });
  return !!link;
}

studentsRouter.get("/children", async (req, res) => {
  const parentId = req.auth!.id;
  const schoolId = req.auth!.schoolId;
  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });

  const links = await prisma.parentStudent.findMany({
    where: { parentId },
    include: { student: { include: { class: true, attendance: { orderBy: { date: "desc" }, take: 60 } } } },
    orderBy: { isPrimary: "desc" },
  });

  const nextEvent = await prisma.event.findFirst({
    where: { schoolId, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });

  const children: ChildSummary[] = [];
  for (const { student } of links) {
    const balance = term ? await studentBalance(student.id, term.id) : { billed: 0, paid: 0, balance: 0 };
    const present = student.attendance.filter((a) => a.status !== "ABSENT").length;
    const attendancePct = student.attendance.length ? Math.round((present / student.attendance.length) * 100) : 0;

    children.push({
      id: student.id,
      name: student.name,
      className: student.class.name,
      avatarInitials: student.avatarInitials ?? initialsOf(student.name),
      avatarColor: student.avatarColor ?? avatarTint(student.id),
      attendancePct,
      attendanceRecorded: student.attendance.length,
      feeBalance: balance.balance,
      feeTotal: balance.billed,
      term: term ? `${term.name}, ${term.academicYear}` : "",
      nextEvent: nextEvent ? `${nextEvent.title}${nextEvent.time ? ` · ${nextEvent.time}` : ""}` : null,
      admissionNo: student.admissionNo,
    });
  }

  res.json(children);
});

studentsRouter.get("/children/:id/attendance", async (req, res) => {
  const { id } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: id },
    orderBy: { date: "desc" },
    take: 90,
  });
  const entries: AttendanceEntry[] = records.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    status: r.status,
  }));
  res.json(entries);
});

studentsRouter.get("/children/:id/grades", async (req, res) => {
  const { id } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });

  const term = await prisma.term.findFirst({ where: { schoolId: req.auth!.schoolId, isCurrent: true } });
  if (!term) return res.json([]);

  const entries = await prisma.assessmentEntry.findMany({
    where: { studentId: id, termId: term.id },
    include: { subject: true },
    orderBy: { date: "asc" },
  });

  const bySubject = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = bySubject.get(e.subject.name) ?? [];
    list.push(e);
    bySubject.set(e.subject.name, list);
  }

  const grades: SubjectGrade[] = Array.from(bySubject.entries()).map(([subjectName, list]) =>
    rollUpGrade(
      subjectName,
      list.map((e) => ({ label: e.label, type: e.type, score: e.score, maxScore: e.maxScore, weightPct: e.weightPct })),
    ),
  );

  res.json(grades);
});

studentsRouter.get("/children/:id/homework", async (req, res) => {
  const { id } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });

  const statuses = await prisma.postStudentStatus.findMany({
    where: { studentId: id, post: { kind: "HOMEWORK", status: "APPROVED" } },
    include: { post: true },
    orderBy: { post: { createdAt: "desc" } },
  });

  const homework: HomeworkItem[] = statuses.map((s) => ({
    id: s.post.id,
    subject: s.post.subject,
    title: s.post.title,
    body: s.post.body,
    due: s.post.dueDate ? s.post.dueDate.toISOString().slice(0, 10) : null,
    status: s.status,
  }));
  res.json(homework);
});

studentsRouter.post("/children/:id/homework/:postId/submit", async (req, res) => {
  const { id, postId } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });

  const updated = await prisma.postStudentStatus.update({
    where: { postId_studentId: { postId, studentId: id } },
    data: { status: "SUBMITTED" },
  });
  res.json(updated);
});

/** School-wide and class announcements visible to this parent's children. */
studentsRouter.get("/announcements", async (req, res) => {
  const parentId = req.auth!.id;
  const links = await prisma.parentStudent.findMany({ where: { parentId }, include: { student: true } });
  const classIds = links.map((l) => l.student.classId);

  const posts = await prisma.post.findMany({
    where: {
      schoolId: req.auth!.schoolId,
      kind: "ANNOUNCEMENT",
      status: "APPROVED",
      OR: [{ classId: null }, { classId: { in: classIds } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 40,
  });

  res.json(
    posts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      tag: p.tag,
      date: (p.publishedAt ?? p.createdAt).toISOString(),
    })),
  );
});

/** Guardians approved to collect this child — shown on the pickup screen. */
studentsRouter.get("/children/:id/guardians", async (req, res) => {
  const { id } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });

  const links = await prisma.parentStudent.findMany({
    where: { studentId: id },
    include: { parent: true },
    orderBy: { isPrimary: "desc" },
  });
  res.json(
    links.map((l) => ({
      id: l.parent.id,
      name: l.parent.name,
      relation: l.isPrimary ? `${l.relation} (default)` : l.relation,
      initials: initialsOf(l.parent.name),
      avatarColor: avatarTint(l.parent.id),
    })),
  );
});
