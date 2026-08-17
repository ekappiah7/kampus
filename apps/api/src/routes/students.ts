import { Router } from "express";
import { prisma } from "@kampus/db";
import type { AttendanceEntry, ChildSummary, HomeworkItem, SubjectGrade } from "@kampus/shared-types";
import { requireAuth, requireRole } from "../middleware/auth";
import { rollUpGrade } from "../lib/grading";

export const studentsRouter = Router();
studentsRouter.use(requireAuth, requireRole("parent"));

async function assertOwnsChild(parentId: string, studentId: string) {
  const link = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId } },
  });
  return !!link;
}

studentsRouter.get("/children", async (req, res) => {
  const parentId = req.auth!.id;
  const term = await prisma.term.findFirst({ where: { schoolId: req.auth!.schoolId, isCurrent: true } });

  const links = await prisma.parentStudent.findMany({
    where: { parentId },
    include: {
      student: {
        include: {
          class: true,
          feeCharges: term ? { where: { termId: term.id } } : false,
          attendance: { orderBy: { date: "desc" }, take: 30 },
        },
      },
    },
  });

  const nextEvent = await prisma.event.findFirst({
    where: { schoolId: req.auth!.schoolId, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });

  const children: ChildSummary[] = links.map(({ student }) => {
    const charges = student.feeCharges ?? [];
    const feeTotal = charges.reduce((sum, c) => sum + c.netAmount, 0);
    const feeBalance = charges.filter((c) => c.status !== "PAID").reduce((sum, c) => sum + c.netAmount, 0);
    const presentCount = student.attendance.filter((a) => a.status !== "ABSENT").length;
    const attendancePct = student.attendance.length ? Math.round((presentCount / student.attendance.length) * 100) : 100;

    return {
      id: student.id,
      name: student.name,
      className: student.class.name,
      avatarInitials: student.avatarInitials ?? "?",
      avatarColor: student.avatarColor ?? "#E7F0F7",
      attendancePct,
      feeBalance,
      feeTotal,
      term: term ? `${term.name}, ${term.academicYear}` : "",
      nextEvent: nextEvent ? `${nextEvent.title} · ${nextEvent.time ?? ""}` : null,
    };
  });

  res.json(children);
});

studentsRouter.get("/children/:id/attendance", async (req, res) => {
  const { id } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: id },
    orderBy: { date: "desc" },
    take: 60,
  });
  const entries: AttendanceEntry[] = records.map((r) => ({ date: r.date.toISOString().slice(0, 10), status: r.status }));
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

/** School-wide announcements (admin posts, published) — not scoped to a child. */
studentsRouter.get("/announcements", async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { schoolId: req.auth!.schoolId, kind: "ANNOUNCEMENT", status: "APPROVED" },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });
  res.json(
    posts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      date: p.publishedAt?.toISOString() ?? p.createdAt.toISOString(),
    })),
  );
});
