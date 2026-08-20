import { Router } from "express";
import { z } from "zod";
import { prisma } from "@kampus/db";
import { requireAuth } from "../middleware/auth";
import { buildReportCard, renderReportCardHtml } from "../lib/reportCard";
import { audit } from "../lib/audit";

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

/** A parent may read their own child's card; staff may read any pupil in their school. */
async function canAccess(auth: NonNullable<Express.Request["auth"]>, studentId: string): Promise<boolean> {
  if (auth.role === "parent") {
    const link = await prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: auth.id, studentId } },
    });
    return !!link;
  }
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: auth.schoolId } });
  return !!student;
}

async function resolveTerm(schoolId: string, termId?: string) {
  if (termId) return prisma.term.findFirst({ where: { id: termId, schoolId } });
  return prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
}

reportsRouter.get("/:studentId", async (req, res) => {
  const auth = req.auth!;
  if (!(await canAccess(auth, req.params.studentId))) return res.status(403).json({ error: "Not permitted" });

  const term = await resolveTerm(auth.schoolId, typeof req.query.termId === "string" ? req.query.termId : undefined);
  if (!term) return res.status(400).json({ error: "No term selected" });

  const data = await buildReportCard(req.params.studentId, term.id);
  if (!data) return res.status(404).json({ error: "Pupil not found" });

  // Parents only see a card once the school has published it.
  if (auth.role === "parent" && !data.published) {
    return res.status(404).json({ error: "This term's report has not been published yet." });
  }
  res.json(data);
});

/** Printable report — the browser's "Save as PDF" turns this into the file a school hands out. */
reportsRouter.get("/:studentId/print", async (req, res) => {
  const auth = req.auth!;
  if (!(await canAccess(auth, req.params.studentId))) return res.status(403).send("Not permitted");

  const term = await resolveTerm(auth.schoolId, typeof req.query.termId === "string" ? req.query.termId : undefined);
  if (!term) return res.status(400).send("No term selected");

  const data = await buildReportCard(req.params.studentId, term.id);
  if (!data) return res.status(404).send("Pupil not found");
  if (auth.role === "parent" && !data.published) {
    return res.status(404).send("This term's report has not been published yet.");
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderReportCardHtml(data));
});

const remarkSchema = z.object({
  termId: z.string().optional(),
  teacherRemark: z.string().optional(),
  headTeacherRemark: z.string().optional(),
  conduct: z.string().optional(),
  attitude: z.string().optional(),
  interest: z.string().optional(),
  nextTermBegins: z.string().optional(),
});

/** Teachers and admins write the human parts of the report. */
reportsRouter.put("/:studentId/remarks", async (req, res) => {
  const auth = req.auth!;
  if (auth.role === "parent") return res.status(403).json({ error: "Not permitted" });
  if (!(await canAccess(auth, req.params.studentId))) return res.status(403).json({ error: "Not permitted" });

  const parsed = remarkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const term = await resolveTerm(auth.schoolId, parsed.data.termId);
  if (!term) return res.status(400).json({ error: "No term selected" });

  const { termId: _ignored, nextTermBegins, ...remarks } = parsed.data;
  const data = {
    ...remarks,
    ...(nextTermBegins ? { nextTermBegins: new Date(nextTermBegins) } : {}),
  };

  const saved = await prisma.reportCard.upsert({
    where: { studentId_termId: { studentId: req.params.studentId, termId: term.id } },
    update: data,
    create: { studentId: req.params.studentId, termId: term.id, ...data },
  });
  audit(auth, "report.remark", { schoolId: auth.schoolId, entity: `student:${req.params.studentId}` });
  res.json(saved);
});

const publishSchema = z.object({ termId: z.string().optional(), classId: z.string().optional() });

/**
 * Publishing freezes position/class size onto each card and makes it visible to
 * parents. Done per class so a head teacher releases a whole year group at once.
 */
reportsRouter.post("/publish", async (req, res) => {
  const auth = req.auth!;
  if (auth.role !== "admin") return res.status(403).json({ error: "Only an administrator can publish reports" });

  const parsed = publishSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const term = await resolveTerm(auth.schoolId, parsed.data.termId);
  if (!term) return res.status(400).json({ error: "No term selected" });

  const students = await prisma.student.findMany({
    where: { schoolId: auth.schoolId, active: true, ...(parsed.data.classId ? { classId: parsed.data.classId } : {}) },
    include: { guardians: true },
  });

  let published = 0;
  for (const student of students) {
    const data = await buildReportCard(student.id, term.id);
    if (!data || data.subjects.length === 0) continue;

    await prisma.reportCard.upsert({
      where: { studentId_termId: { studentId: student.id, termId: term.id } },
      update: {
        published: true,
        publishedAt: new Date(),
        classPosition: data.overall.position,
        classSize: data.overall.classSize,
      },
      create: {
        studentId: student.id,
        termId: term.id,
        published: true,
        publishedAt: new Date(),
        classPosition: data.overall.position,
        classSize: data.overall.classSize,
      },
    });

    for (const guardian of student.guardians) {
      await prisma.notification.create({
        data: {
          schoolId: auth.schoolId,
          parentId: guardian.parentId,
          type: "GRADE_POSTED",
          title: "Report card available",
          body: `${student.name}'s ${term.name} report card is ready to view.`,
        },
      });
    }
    published++;
  }

  audit(auth, "report.publish", { schoolId: auth.schoolId, detail: `${published} report(s) for ${term.name}` });
  res.json({ published });
});
