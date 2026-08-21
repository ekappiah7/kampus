import { Router } from "express";
import { z } from "zod";
import { prisma } from "@kampus/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { initialsOf, avatarTint } from "../lib/codes";
import { audit } from "../lib/audit";
import { rollUpGrade } from "../lib/grading";
import multer from "multer";
import {
  buildMarkSheet,
  markSheetFilename,
  nameKey,
  parseMarkSheet,
  type SheetComponent,
  type SheetContext,
  type SheetPupil,
} from "../lib/markSheet";

export const staffRouter = Router();
staffRouter.use(requireAuth, requireRole("teacher", "admin", "gate-staff"));

/**
 * The class a request applies to: a teacher's homeroom by default, or any class in
 * the school when an admin passes ?classId. Admins have no homeroom, so they must
 * choose one — that's what the class picker in the portal is for.
 */
async function resolveClass(req: Express.Request & { query: Record<string, unknown> }) {
  const auth = req.auth!;
  const requested = typeof req.query.classId === "string" ? req.query.classId : undefined;
  if (requested) {
    return prisma.class.findFirst({ where: { id: requested, schoolId: auth.schoolId } });
  }
  if (auth.role === "teacher") {
    const staff = await prisma.staff.findUnique({ where: { id: auth.id } });
    if (staff?.classId) return prisma.class.findUnique({ where: { id: staff.classId } });
  }
  return null;
}

async function currentTerm(schoolId: string) {
  return prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
}

/** Classes this user may act on — drives the portal's class picker. */
staffRouter.get("/my-classes", async (req, res) => {
  const auth = req.auth!;
  if (auth.role === "teacher") {
    const staff = await prisma.staff.findUnique({ where: { id: auth.id }, include: { homeroomClass: true } });
    return res.json(staff?.homeroomClass ? [{ id: staff.homeroomClass.id, name: staff.homeroomClass.name }] : []);
  }
  const classes = await prisma.class.findMany({ where: { schoolId: auth.schoolId }, orderBy: { order: "asc" } });
  res.json(classes.map((c) => ({ id: c.id, name: c.name })));
});

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

staffRouter.get("/roster", async (req, res) => {
  const cls = await resolveClass(req as never);
  if (!cls) return res.status(400).json({ error: "No class selected. Choose a class to continue." });

  const dateParam = typeof req.query.date === "string" ? new Date(req.query.date) : new Date();
  dateParam.setHours(0, 0, 0, 0);

  const students = await prisma.student.findMany({
    where: { classId: cls.id, active: true },
    orderBy: { name: "asc" },
  });
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: { in: students.map((s) => s.id) }, date: dateParam },
  });
  const byStudent = new Map(records.map((r) => [r.studentId, r.status]));

  res.json({
    class: { id: cls.id, name: cls.name },
    date: dateParam.toISOString().slice(0, 10),
    /** Null status = not yet marked today, which the UI shows differently from "present". */
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      initials: s.avatarInitials ?? initialsOf(s.name),
      avatarColor: s.avatarColor ?? avatarTint(s.id),
      monitored: s.monitored,
      status: byStudent.get(s.id) ?? null,
    })),
  });
});

const markSchema = z.object({
  date: z.string().optional(),
  marks: z.array(z.object({ studentId: z.string(), status: z.enum(["PRESENT", "LATE", "ABSENT"]) })).min(1),
});

staffRouter.post("/roster/attendance", requireRole("teacher", "admin"), async (req, res) => {
  const parsed = markSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const auth = req.auth!;

  const date = parsed.data.date ? new Date(parsed.data.date) : new Date();
  date.setHours(0, 0, 0, 0);

  // Only mark pupils that belong to this school — never trust ids from the client.
  const ids = parsed.data.marks.map((m) => m.studentId);
  const valid = await prisma.student.findMany({ where: { id: { in: ids }, schoolId: auth.schoolId }, select: { id: true } });
  const validIds = new Set(valid.map((v) => v.id));

  await prisma.$transaction(
    parsed.data.marks
      .filter((m) => validIds.has(m.studentId))
      .map((m) =>
        prisma.attendanceRecord.upsert({
          where: { studentId_date: { studentId: m.studentId, date } },
          update: { status: m.status, markedByStaffId: auth.id },
          create: { studentId: m.studentId, date, status: m.status, markedByStaffId: auth.id },
        }),
      ),
  );

  // Notify guardians of absentees — the alert parents actually care about.
  const absentees = parsed.data.marks.filter((m) => m.status === "ABSENT" && validIds.has(m.studentId));
  for (const a of absentees) {
    const student = await prisma.student.findUnique({ where: { id: a.studentId }, include: { guardians: true } });
    if (!student) continue;
    for (const g of student.guardians) {
      await prisma.notification.create({
        data: {
          schoolId: auth.schoolId,
          parentId: g.parentId,
          type: "ANNOUNCEMENT",
          title: "Attendance alert",
          body: `${student.name} was marked absent on ${date.toLocaleDateString("en-GB")}.`,
        },
      });
    }
  }

  res.json({ ok: true, marked: parsed.data.marks.length });
});

// ---------------------------------------------------------------------------
// Grades — spreadsheet-style entry
// ---------------------------------------------------------------------------

/**
 * The grade sheet: pupils as rows, one column per assessment component for the
 * chosen subject. Returns the full grid in one call so the teacher can fill it in
 * like a mark book rather than opening each pupil in turn.
 */
/**
 * Everything the grade grid needs: the pupils, the assessment columns, and the marks
 * already recorded. The on-screen grid, the Excel template and the importer all read
 * from here, so a column can never mean one thing in the browser and another in the
 * spreadsheet.
 */
async function loadGradeSheet(schoolId: string, classId: string, subjectId?: string) {
  const subjects = await prisma.subject.findMany({ where: { classId }, orderBy: { name: "asc" } });
  if (!subjects.length) return { subjects: [], subject: null, components: [], students: [], entries: [] };

  const subject = subjectId ? subjects.find((s) => s.id === subjectId) : subjects[0];
  if (!subject) return { subjects, subject: null, components: [], students: [], entries: [] };

  const term = await currentTerm(schoolId);
  if (!term) return { subjects, subject, components: [], students: [], entries: [] };

  const students = await prisma.student.findMany({ where: { classId, active: true }, orderBy: { name: "asc" } });
  const entries = await prisma.assessmentEntry.findMany({
    where: { subjectId: subject.id, termId: term.id, studentId: { in: students.map((s) => s.id) } },
  });

  const componentMap = new Map<string, SheetComponent>();
  for (const e of entries) {
    const key = `${e.type}::${e.label}`;
    if (!componentMap.has(key)) componentMap.set(key, { key, label: e.label, type: e.type, weightPct: e.weightPct, maxScore: e.maxScore });
  }

  return { subjects, subject, components: Array.from(componentMap.values()), students, entries };
}

staffRouter.get("/grade-sheet", requireRole("teacher", "admin"), async (req, res) => {
  const auth = req.auth!;
  const cls = await resolveClass(req as never);
  if (!cls) return res.status(400).json({ error: "No class selected" });

  const term = await currentTerm(auth.schoolId);
  if (!term) return res.status(400).json({ error: "No current term. Ask your administrator to open one." });

  const subjectId = typeof req.query.subjectId === "string" ? req.query.subjectId : undefined;
  const sheet = await loadGradeSheet(auth.schoolId, cls.id, subjectId);
  if (!sheet.subjects.length) return res.json({ class: cls, term, subjects: [], subject: null, components: [], rows: [] });
  if (!sheet.subject) return res.status(404).json({ error: "Subject not found" });

  const rows = sheet.students.map((s) => {
    const scores: Record<string, number | null> = {};
    for (const c of sheet.components) {
      const entry = sheet.entries.find((e) => e.studentId === s.id && `${e.type}::${e.label}` === c.key);
      scores[c.key] = entry ? entry.score : null;
    }
    const own = sheet.entries.filter((e) => e.studentId === s.id);
    const rolled = own.length
      ? rollUpGrade(
          sheet.subject!.name,
          own.map((e) => ({ label: e.label, type: e.type, score: e.score, maxScore: e.maxScore, weightPct: e.weightPct })),
        )
      : null;
    return {
      studentId: s.id,
      name: s.name,
      initials: s.avatarInitials ?? initialsOf(s.name),
      avatarColor: s.avatarColor ?? avatarTint(s.id),
      monitored: s.monitored,
      scores,
      finalScore: rolled?.finalScore ?? null,
      letterGrade: rolled?.letterGrade ?? null,
    };
  });

  res.json({
    class: { id: cls.id, name: cls.name },
    term: { id: term.id, name: term.name, academicYear: term.academicYear },
    subjects: sheet.subjects.map((s) => ({ id: s.id, name: s.name })),
    subject: { id: sheet.subject.id, name: sheet.subject.name },
    components: sheet.components,
    rows,
  });
});

const componentSchema = z.object({
  subjectId: z.string(),
  type: z.enum(["CLASSWORK", "QUIZ", "GROUP_WORK", "PROJECT", "HOMEWORK_COMPLETION", "MID_TERM_EXAM", "END_OF_TERM_EXAM"]),
  label: z.string().min(1),
  weightPct: z.number().positive().max(100),
  maxScore: z.number().positive().default(100),
});

/**
 * Adds a column to the grade sheet by creating a zero-scored entry for every pupil.
 * Doing it up front means the teacher types into a complete grid instead of
 * creating rows one at a time.
 */
staffRouter.post("/grade-sheet/components", requireRole("teacher", "admin"), async (req, res) => {
  const parsed = componentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const auth = req.auth!;

  const subject = await prisma.subject.findFirst({ where: { id: parsed.data.subjectId, schoolId: auth.schoolId } });
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  const term = await currentTerm(auth.schoolId);
  if (!term) return res.status(400).json({ error: "No current term" });

  const students = await prisma.student.findMany({ where: { classId: subject.classId, active: true } });
  const existing = await prisma.assessmentEntry.findFirst({
    where: { subjectId: subject.id, termId: term.id, type: parsed.data.type, label: parsed.data.label },
  });
  if (existing) return res.status(409).json({ error: "That assessment already exists for this subject" });

  const totalWeight = await prisma.assessmentEntry.findMany({
    where: { subjectId: subject.id, termId: term.id },
    distinct: ["type", "label"],
    select: { weightPct: true },
  });
  const used = totalWeight.reduce((sum, e) => sum + e.weightPct, 0);
  if (used + parsed.data.weightPct > 100) {
    return res.status(400).json({ error: `Weights would total ${used + parsed.data.weightPct}%. Only ${100 - used}% remains.` });
  }

  await prisma.assessmentEntry.createMany({
    data: students.map((s) => ({
      studentId: s.id,
      subjectId: subject.id,
      termId: term.id,
      type: parsed.data.type,
      label: parsed.data.label,
      date: new Date(),
      score: 0,
      maxScore: parsed.data.maxScore,
      weightPct: parsed.data.weightPct,
      enteredByStaffId: auth.id,
    })),
  });

  res.status(201).json({ ok: true, students: students.length });
});

/**
 * Removes an assessment column and every score under it.
 *
 * The counterpart to adding one. A teacher who creates "Quiz 2" at the wrong weight,
 * or twice, otherwise has a column they can never get rid of and a weight total that
 * will not reach 100.
 */
staffRouter.delete("/grade-sheet/components", requireRole("teacher", "admin"), async (req, res) => {
  const auth = req.auth!;
  const subjectId = typeof req.query.subjectId === "string" ? req.query.subjectId : undefined;
  const componentKey = typeof req.query.componentKey === "string" ? req.query.componentKey : undefined;
  if (!subjectId || !componentKey) return res.status(400).json({ error: "Pick the assessment to remove." });

  const subject = await prisma.subject.findFirst({ where: { id: subjectId, schoolId: auth.schoolId } });
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  const term = await currentTerm(auth.schoolId);
  if (!term) return res.status(400).json({ error: "No current term" });

  const [type, ...labelParts] = componentKey.split("::");
  const label = labelParts.join("::");
  const { count } = await prisma.assessmentEntry.deleteMany({
    where: { subjectId: subject.id, termId: term.id, type: type as never, label },
  });
  if (!count) return res.status(404).json({ error: "That assessment is not on this subject." });

  audit(auth, "grade.component.delete", { schoolId: auth.schoolId, entity: `subject:${subject.id}`, detail: `${label} (${count} score rows)` });
  res.json({ ok: true, removed: count });
});

const saveSheetSchema = z.object({
  subjectId: z.string(),
  scores: z.array(z.object({ studentId: z.string(), componentKey: z.string(), score: z.number().min(0) })),
});

/** Bulk save of the whole grid — one request per "Save Grades" click. */
staffRouter.post("/grade-sheet", requireRole("teacher", "admin"), async (req, res) => {
  const parsed = saveSheetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const auth = req.auth!;

  const subject = await prisma.subject.findFirst({ where: { id: parsed.data.subjectId, schoolId: auth.schoolId } });
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  const term = await currentTerm(auth.schoolId);
  if (!term) return res.status(400).json({ error: "No current term" });

  let updated = 0;
  for (const row of parsed.data.scores) {
    const [type, ...labelParts] = row.componentKey.split("::");
    const label = labelParts.join("::");
    const entry = await prisma.assessmentEntry.findFirst({
      where: { studentId: row.studentId, subjectId: subject.id, termId: term.id, type: type as never, label },
    });
    if (!entry) continue;
    if (row.score > entry.maxScore) {
      return res.status(400).json({ error: `A score of ${row.score} exceeds the maximum of ${entry.maxScore} for "${label}".` });
    }
    if (entry.score === row.score) continue;
    await prisma.assessmentEntry.update({ where: { id: entry.id }, data: { score: row.score, enteredByStaffId: auth.id } });
    updated++;
  }

  audit(auth, "grade.save", { schoolId: auth.schoolId, entity: `subject:${subject.id}`, detail: `${updated} score(s)` });
  res.json({ ok: true, updated });
});


// ---------------------------------------------------------------------------
// Excel mark sheet: download the grid, fill it in offline, upload it back
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

async function sheetContext(schoolId: string, staffId: string, cls: { id: string; name: string }, subject: { id: string; name: string }) {
  const [school, term, staff] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId } }),
    currentTerm(schoolId),
    prisma.staff.findUnique({ where: { id: staffId } }),
  ]);
  if (!school || !term) return null;
  const ctx: SheetContext = {
    schoolName: school.name,
    schoolId: school.id,
    className: cls.name,
    classId: cls.id,
    subjectName: subject.name,
    subjectId: subject.id,
    termName: term.name,
    academicYear: term.academicYear,
    termId: term.id,
    teacherName: staff?.name ?? "—",
  };
  return ctx;
}

staffRouter.get("/grade-sheet/template", requireRole("teacher", "admin"), async (req, res) => {
  const auth = req.auth!;
  const cls = await resolveClass(req as never);
  if (!cls) return res.status(400).json({ error: "No class selected" });

  const subjectId = typeof req.query.subjectId === "string" ? req.query.subjectId : undefined;
  const sheet = await loadGradeSheet(auth.schoolId, cls.id, subjectId);
  if (!sheet.subject) return res.status(400).json({ error: "This class has no subjects yet." });

  const ctx = await sheetContext(auth.schoolId, auth.id, cls, sheet.subject);
  if (!ctx) return res.status(400).json({ error: "No current term. Ask your administrator to open one." });

  const pupils: SheetPupil[] = sheet.students.map((s) => {
    const scores: Record<string, number | null> = {};
    for (const c of sheet.components) {
      const entry = sheet.entries.find((e) => e.studentId === s.id && `${e.type}::${e.label}` === c.key);
      scores[c.key] = entry ? entry.score : null;
    }
    return { studentId: s.id, name: s.name, scores };
  });

  const buffer = await buildMarkSheet(ctx, sheet.components, pupils);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${markSheetFilename(ctx)}"`);
  res.send(buffer);
});

interface ImportChange {
  name: string;
  column: string;
  from: number | null;
  to: number;
}

/**
 * Reads an uploaded mark sheet and reports exactly what it would change.
 *
 * Nothing is written unless `commit=1`. A teacher who grabs last term's file, or the
 * wrong subject's file, should find that out from a summary — not from discovering a
 * term of marks overwritten. The dry run and the commit share this one code path so
 * the preview can't drift from what actually happens.
 */
staffRouter.post("/grade-sheet/import", requireRole("teacher", "admin"), upload.single("file"), async (req, res) => {
  const auth = req.auth!;
  if (!req.file) return res.status(400).json({ error: "Attach the filled-in mark sheet." });

  const cls = await resolveClass(req as never);
  if (!cls) return res.status(400).json({ error: "No class selected" });

  const term = await currentTerm(auth.schoolId);
  if (!term) return res.status(400).json({ error: "No current term. Ask your administrator to open one." });

  let parsed;
  try {
    parsed = await parseMarkSheet(req.file.buffer, req.file.originalname ?? "upload.xlsx");
  } catch {
    return res.status(400).json({ error: "That file could not be read as a spreadsheet. Save it as .xlsx or .csv and try again." });
  }

  // The file's own metadata picks the subject when it has any — that is the whole
  // point of it — and it is checked against this school so one school's sheet can
  // never be applied to another's marks.
  const problems = [...parsed.problems];
  if (parsed.meta && parsed.meta.schoolId && parsed.meta.schoolId !== auth.schoolId) {
    return res.status(400).json({ error: "That mark sheet belongs to a different school." });
  }
  if (parsed.meta && parsed.meta.termId && parsed.meta.termId !== term.id) {
    return res.status(400).json({
      error: "That mark sheet was downloaded for a different term. Download a fresh one for the current term.",
    });
  }

  const subjectId =
    parsed.meta?.subjectId ?? (typeof req.query.subjectId === "string" ? req.query.subjectId : undefined);
  const sheet = await loadGradeSheet(auth.schoolId, cls.id, subjectId);
  if (!sheet.subject) return res.status(400).json({ error: "Could not tell which subject this sheet is for. Pick one and try again." });
  if (parsed.meta?.classId && parsed.meta.classId !== cls.id) {
    return res.status(400).json({ error: `That mark sheet is for a different class, not ${cls.name}.` });
  }
  if (!sheet.components.length) {
    return res.status(400).json({ error: `${sheet.subject.name} has no assessments yet. Add them first, then download a template.` });
  }

  // --- resolve every parsed cell against real pupils and real columns -------
  const byId = new Map(sheet.students.map((s) => [s.id, s]));
  const byName = new Map(sheet.students.map((s) => [nameKey(s.name), s]));
  const componentByKey = new Map(sheet.components.map((c) => [c.key, c]));
  const componentByLabel = new Map(sheet.components.map((c) => [nameKey(c.label), c]));

  const changes: ImportChange[] = [];
  const outOfRange: { name: string; column: string; score: number; max: number }[] = [];
  const unmatchedPupils = new Set<string>();
  const unmatchedColumns = new Set<string>();
  let unchanged = 0;

  const writes: { entryId: string; score: number }[] = [];

  for (const cell of parsed.scores) {
    const student = cell.studentId ? byId.get(cell.studentId) : byName.get(nameKey(cell.rowLabel));
    if (!student) {
      unmatchedPupils.add(cell.rowLabel);
      continue;
    }
    const component = cell.componentKey ? componentByKey.get(cell.componentKey) : componentByLabel.get(nameKey(cell.columnLabel));
    if (!component) {
      unmatchedColumns.add(cell.columnLabel);
      continue;
    }
    if (cell.score < 0 || cell.score > component.maxScore) {
      outOfRange.push({ name: student.name, column: component.label, score: cell.score, max: component.maxScore });
      continue;
    }

    const entry = sheet.entries.find((e) => e.studentId === student.id && `${e.type}::${e.label}` === component.key);
    if (!entry) {
      unmatchedColumns.add(component.label);
      continue;
    }
    if (entry.score === cell.score) {
      unchanged++;
      continue;
    }
    changes.push({ name: student.name, column: component.label, from: entry.score > 0 ? entry.score : null, to: cell.score });
    writes.push({ entryId: entry.id, score: cell.score });
  }

  const commit = req.query.commit === "1" && outOfRange.length === 0;

  if (commit && writes.length) {
    await prisma.$transaction(
      writes.map((w) => prisma.assessmentEntry.update({ where: { id: w.entryId }, data: { score: w.score, enteredByStaffId: auth.id } })),
    );
    audit(auth, "grade.import", {
      schoolId: auth.schoolId,
      entity: `subject:${sheet.subject.id}`,
      detail: `${writes.length} score(s) from ${req.file.originalname ?? "a spreadsheet"}`,
    });
  }

  res.json({
    committed: commit,
    subject: { id: sheet.subject.id, name: sheet.subject.name },
    class: { id: cls.id, name: cls.name },
    term: { id: term.id, name: term.name },
    updated: commit ? writes.length : 0,
    pending: writes.length,
    unchanged,
    // The full list would be unreadable for a class of forty; the count carries the
    // rest so the teacher still knows the scale of what they are about to apply.
    changes: changes.slice(0, 60),
    changeCount: changes.length,
    outOfRange,
    unmatchedPupils: Array.from(unmatchedPupils),
    unmatchedColumns: Array.from(unmatchedColumns),
    problems,
  });
});

/**
 * The class broadsheet — every pupil against every subject, with the term average and
 * position. Schools here assemble this by hand at the end of term to rank the class
 * and fill report cards from; it is the one sheet the head actually asks for.
 */
staffRouter.get("/broadsheet", requireRole("teacher", "admin"), async (req, res) => {
  const auth = req.auth!;
  const cls = await resolveClass(req as never);
  if (!cls) return res.status(400).json({ error: "No class selected" });

  const [school, term] = await Promise.all([
    prisma.school.findUnique({ where: { id: auth.schoolId } }),
    currentTerm(auth.schoolId),
  ]);
  if (!school || !term) return res.status(400).json({ error: "No current term. Ask your administrator to open one." });

  const [subjects, students] = await Promise.all([
    prisma.subject.findMany({ where: { classId: cls.id }, orderBy: { name: "asc" } }),
    prisma.student.findMany({ where: { classId: cls.id, active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!subjects.length) return res.status(400).json({ error: "This class has no subjects yet." });

  const entries = await prisma.assessmentEntry.findMany({
    where: { termId: term.id, subjectId: { in: subjects.map((s) => s.id) }, studentId: { in: students.map((s) => s.id) } },
  });

  const rows = students.map((s) => {
    const perSubject = subjects.map((subj) => {
      const own = entries.filter((e) => e.studentId === s.id && e.subjectId === subj.id);
      if (!own.length) return null;
      return rollUpGrade(subj.name, own.map((e) => ({ label: e.label, type: e.type, score: e.score, maxScore: e.maxScore, weightPct: e.weightPct })))
        .finalScore;
    });
    const marked = perSubject.filter((v): v is number => v !== null);
    const average = marked.length ? Math.round(marked.reduce((a, b) => a + b, 0) / marked.length) : null;
    return { name: s.name, perSubject, average };
  });

  // Equal averages share a position, and the next position skips accordingly —
  // two pupils on 2nd means the next is 4th, which is how schools rank here.
  const ordered = [...rows].filter((r) => r.average !== null).sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
  const position = new Map<string, number>();
  ordered.forEach((r, i) => {
    const prev = ordered[i - 1];
    position.set(r.name, prev && prev.average === r.average ? position.get(prev.name)! : i + 1);
  });

  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = school.name;
  const ws = wb.addWorksheet("Broadsheet", { views: [{ state: "frozen", xSplit: 2, ySplit: 5 }] });

  const lastCol = 3 + subjects.length + 1;
  ws.mergeCells(1, 1, 1, lastCol);
  ws.getCell(1, 1).value = school.name;
  ws.getCell(1, 1).font = { size: 16, bold: true };
  ws.getCell(1, 1).alignment = { horizontal: "center" };
  ws.mergeCells(2, 1, 2, lastCol);
  ws.getCell(2, 1).value = `${cls.name} — Broadsheet — ${term.name} ${term.academicYear}`;
  ws.getCell(2, 1).font = { size: 12, bold: true };
  ws.getCell(2, 1).alignment = { horizontal: "center" };

  const header = ws.getRow(5);
  header.getCell(1).value = "#";
  header.getCell(2).value = "Pupil name";
  subjects.forEach((s, i) => (header.getCell(3 + i).value = s.name));
  header.getCell(3 + subjects.length).value = "Average";
  header.getCell(4 + subjects.length).value = "Position";
  header.height = 34;
  header.eachCell((c) => {
    c.font = { bold: true, size: 10 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC629" } };
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });

  ws.getColumn(1).width = 5;
  ws.getColumn(2).width = 30;
  subjects.forEach((_, i) => (ws.getColumn(3 + i).width = 13));
  ws.getColumn(3 + subjects.length).width = 11;
  ws.getColumn(4 + subjects.length).width = 10;

  rows.forEach((r, i) => {
    const row = ws.getRow(6 + i);
    row.getCell(1).value = i + 1;
    row.getCell(2).value = r.name;
    row.getCell(2).font = { bold: true };
    r.perSubject.forEach((v, j) => {
      const cell = row.getCell(3 + j);
      cell.value = v;
      cell.alignment = { horizontal: "center" };
      if (v !== null && v < 50) cell.font = { color: { argb: "FFC74747" } };
    });
    row.getCell(3 + subjects.length).value = r.average;
    row.getCell(3 + subjects.length).font = { bold: true };
    row.getCell(3 + subjects.length).alignment = { horizontal: "center" };
    row.getCell(4 + subjects.length).value = position.get(r.name) ?? null;
    row.getCell(4 + subjects.length).alignment = { horizontal: "center" };
  });

  ws.getRow(7 + rows.length).getCell(2).value = "Blank cells mean no marks have been recorded for that subject yet.";
  ws.getRow(7 + rows.length).getCell(2).font = { italic: true, size: 9, color: { argb: "FF6B6F76" } };

  const safe = (v: string) => v.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${safe(cls.name)}-${safe(term.name)}-broadsheet.xlsx"`);
  res.send(buffer);
});

// ---------------------------------------------------------------------------
// Posts & approvals
// ---------------------------------------------------------------------------

const postSchema = z.object({
  kind: z.enum(["HOMEWORK", "ANNOUNCEMENT"]),
  audience: z.enum(["WHOLE_SCHOOL", "BY_LEVEL"]).optional(),
  classId: z.string().optional().nullable(),
  subject: z.string().optional(),
  tag: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  dueDate: z.string().optional(),
});

staffRouter.post("/posts", requireRole("teacher", "admin"), async (req, res) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const auth = req.auth!;
  const isAdmin = auth.role === "admin";

  // A teacher can only post to their own class; an admin chooses.
  let classId = parsed.data.classId ?? null;
  if (auth.role === "teacher") {
    const staff = await prisma.staff.findUnique({ where: { id: auth.id } });
    classId = staff?.classId ?? null;
    if (!classId) return res.status(400).json({ error: "You have no class assigned. Ask your administrator." });
  }
  if (parsed.data.audience === "WHOLE_SCHOOL") classId = null;

  const post = await prisma.post.create({
    data: {
      schoolId: auth.schoolId,
      kind: parsed.data.kind,
      audience: parsed.data.audience ?? "BY_LEVEL",
      classId,
      subject: parsed.data.subject,
      tag: parsed.data.tag,
      title: parsed.data.title,
      body: parsed.data.body,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      authorStaffId: auth.id,
      // Admin publishes directly; a teacher's post waits for approval.
      status: isAdmin ? "APPROVED" : "PENDING",
      approvedByStaffId: isAdmin ? auth.id : undefined,
      publishedAt: isAdmin ? new Date() : undefined,
    },
  });

  if (post.status === "APPROVED") await fanOutPost(post.id);
  res.status(201).json(post);
});

/** Creates per-pupil rows and notifies guardians once a post goes live. */
async function fanOutPost(postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.status !== "APPROVED") return;

  const students = await prisma.student.findMany({
    where: { schoolId: post.schoolId, active: true, ...(post.classId ? { classId: post.classId } : {}) },
    include: { guardians: true },
  });

  if (post.kind === "HOMEWORK") {
    await prisma.postStudentStatus.createMany({
      data: students.map((s) => ({ postId: post.id, studentId: s.id })),
      skipDuplicates: true,
    });
  }

  const parentIds = new Set(students.flatMap((s) => s.guardians.map((g) => g.parentId)));
  for (const parentId of parentIds) {
    await prisma.notification.create({
      data: {
        schoolId: post.schoolId,
        parentId,
        type: post.kind === "HOMEWORK" ? "HOMEWORK" : "ANNOUNCEMENT",
        title: post.kind === "HOMEWORK" ? "New homework" : "New announcement",
        body: post.title,
      },
    });
  }
}

staffRouter.get("/posts/mine", async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { authorStaffId: req.auth!.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json(
    posts.map((p) => ({
      id: p.id,
      kind: p.kind,
      title: p.title,
      body: p.body,
      status: p.status,
      tag: p.tag,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

staffRouter.get("/approvals", requireRole("admin"), async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { schoolId: req.auth!.schoolId, status: "PENDING" },
    include: { author: true, class: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(
    posts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      kind: p.kind,
      className: p.class?.name ?? "Whole school",
      authorName: p.author.name,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

staffRouter.post("/approvals/:id/approve", requireRole("admin"), async (req, res) => {
  const auth = req.auth!;
  const post = await prisma.post.findFirst({ where: { id: req.params.id, schoolId: auth.schoolId } });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const updated = await prisma.post.update({
    where: { id: post.id },
    data: { status: "APPROVED", approvedByStaffId: auth.id, publishedAt: new Date() },
  });
  await fanOutPost(post.id);
  await prisma.notification.create({
    data: {
      schoolId: auth.schoolId,
      type: "POST_APPROVED",
      title: "Your post was approved",
      body: post.title,
    },
  });
  audit(auth, "post.approve", { schoolId: auth.schoolId, entity: `post:${post.id}`, detail: post.title });
  res.json(updated);
});

staffRouter.post("/approvals/:id/reject", requireRole("admin"), async (req, res) => {
  const auth = req.auth!;
  const post = await prisma.post.findFirst({ where: { id: req.params.id, schoolId: auth.schoolId } });
  if (!post) return res.status(404).json({ error: "Post not found" });
  const updated = await prisma.post.update({ where: { id: post.id }, data: { status: "REJECTED" } });
  audit(auth, "post.reject", { schoolId: auth.schoolId, entity: `post:${post.id}`, detail: post.title });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

staffRouter.get("/messages/threads", async (req, res) => {
  const auth = req.auth!;
  const threads = await prisma.messageThread.findMany({
    where: { staffId: auth.id },
    include: {
      parent: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { senderParentId: { not: null }, readAt: null } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    threads.map((t) => ({
      id: t.id,
      parentId: t.parentId,
      parentName: t.parent.name,
      initials: initialsOf(t.parent.name),
      avatarColor: avatarTint(t.parentId),
      preview: t.messages[0]?.body ?? "",
      lastAt: t.messages[0]?.createdAt.toISOString() ?? t.createdAt.toISOString(),
      unread: t._count.messages,
    })),
  );
});

staffRouter.get("/messages/threads/:id", async (req, res) => {
  const auth = req.auth!;
  const thread = await prisma.messageThread.findFirst({
    where: { id: req.params.id, staffId: auth.id },
    include: { parent: true, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!thread) return res.status(404).json({ error: "Conversation not found" });

  await prisma.message.updateMany({
    where: { threadId: thread.id, senderParentId: { not: null }, readAt: null },
    data: { readAt: new Date() },
  });

  res.json({
    id: thread.id,
    parentName: thread.parent.name,
    messages: thread.messages.map((m) => ({
      id: m.id,
      body: m.body,
      fromStaff: !!m.senderStaffId,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

const sendSchema = z.object({ parentId: z.string().optional(), threadId: z.string().optional(), body: z.string().min(1) });

staffRouter.post("/messages/send", async (req, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const auth = req.auth!;

  let threadId = parsed.data.threadId;
  if (!threadId) {
    if (!parsed.data.parentId) return res.status(400).json({ error: "Choose a parent to message" });
    const parent = await prisma.parent.findFirst({ where: { id: parsed.data.parentId, schoolId: auth.schoolId } });
    if (!parent) return res.status(404).json({ error: "Parent not found" });
    const thread = await prisma.messageThread.upsert({
      where: { staffId_parentId: { staffId: auth.id, parentId: parent.id } },
      update: {},
      create: { schoolId: auth.schoolId, staffId: auth.id, parentId: parent.id },
    });
    threadId = thread.id;
  } else {
    const owned = await prisma.messageThread.findFirst({ where: { id: threadId, staffId: auth.id } });
    if (!owned) return res.status(404).json({ error: "Conversation not found" });
  }

  const message = await prisma.message.create({
    data: { threadId, senderStaffId: auth.id, body: parsed.data.body },
  });
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
  if (thread) {
    await prisma.notification.create({
      data: {
        schoolId: auth.schoolId,
        parentId: thread.parentId,
        type: "ANNOUNCEMENT",
        title: `Message from ${auth.name}`,
        body: parsed.data.body.slice(0, 120),
      },
    });
  }
  res.status(201).json({ id: message.id, threadId });
});

/** Parents a staff member can start a conversation with. */
staffRouter.get("/messages/contacts", async (req, res) => {
  const auth = req.auth!;
  let where: Record<string, unknown> = { schoolId: auth.schoolId };
  if (auth.role === "teacher") {
    const staff = await prisma.staff.findUnique({ where: { id: auth.id } });
    if (staff?.classId) where = { schoolId: auth.schoolId, children: { some: { student: { classId: staff.classId } } } };
  }
  const parents = await prisma.parent.findMany({
    where,
    include: { children: { include: { student: true } } },
    orderBy: { name: "asc" },
  });
  res.json(
    parents.map((p) => ({
      id: p.id,
      name: p.name,
      children: p.children.map((c) => c.student.name).join(", "),
    })),
  );
});

// ---------------------------------------------------------------------------
// Parent Voice inbox
// ---------------------------------------------------------------------------

staffRouter.get("/voice", requireRole("admin"), async (req, res) => {
  const submissions = await prisma.parentVoiceSubmission.findMany({
    where: { schoolId: req.auth!.schoolId },
    include: { parent: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    submissions.map((s) => ({
      id: s.id,
      category: s.category,
      message: s.message,
      from: s.parent?.name ?? s.authorName ?? "Anonymous",
      aboutStaffName: s.aboutStaffName,
      resolved: s.resolved,
      adminResponse: s.adminResponse,
      createdAt: s.createdAt.toISOString(),
    })),
  );
});

staffRouter.patch("/voice/:id", requireRole("admin"), async (req, res) => {
  const parsed = z.object({ resolved: z.boolean().optional(), adminResponse: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const auth = req.auth!;

  const submission = await prisma.parentVoiceSubmission.findFirst({
    where: { id: req.params.id, schoolId: auth.schoolId },
  });
  if (!submission) return res.status(404).json({ error: "Submission not found" });

  const updated = await prisma.parentVoiceSubmission.update({
    where: { id: submission.id },
    data: {
      ...parsed.data,
      ...(parsed.data.adminResponse ? { respondedByStaffId: auth.id } : {}),
    },
  });

  if (parsed.data.adminResponse && submission.parentId) {
    await prisma.notification.create({
      data: {
        schoolId: auth.schoolId,
        parentId: submission.parentId,
        type: "VOICE_RESPONSE",
        title: "The school replied to your message",
        body: parsed.data.adminResponse.slice(0, 120),
      },
    });
  }
  res.json(updated);
});
