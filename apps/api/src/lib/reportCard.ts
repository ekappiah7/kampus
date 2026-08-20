import { prisma } from "@kampus/db";
import { rollUpGrade } from "./grading";
import type { SubjectGrade } from "@kampus/shared-types";

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

/** Weighted average across a pupil's subjects — the figure positions are ranked on. */
function averageOf(subjects: SubjectGrade[]): number {
  if (!subjects.length) return 0;
  return Math.round(subjects.reduce((sum, s) => sum + s.finalScore, 0) / subjects.length);
}

async function subjectsFor(studentId: string, termId: string): Promise<SubjectGrade[]> {
  const entries = await prisma.assessmentEntry.findMany({
    where: { studentId, termId },
    include: { subject: true },
    orderBy: { date: "asc" },
  });

  const bySubject = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = bySubject.get(e.subject.name) ?? [];
    list.push(e);
    bySubject.set(e.subject.name, list);
  }

  return Array.from(bySubject.entries()).map(([name, list]) =>
    rollUpGrade(
      name,
      list.map((e) => ({ label: e.label, type: e.type, score: e.score, maxScore: e.maxScore, weightPct: e.weightPct })),
    ),
  );
}

/**
 * Builds a full report card. Class position is computed live across every active
 * pupil in the class so it stays correct as marks are entered, then frozen onto
 * the ReportCard row once published.
 */
export async function buildReportCard(studentId: string, termId: string): Promise<ReportCardData | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true, school: true },
  });
  if (!student) return null;

  const term = await prisma.term.findUnique({ where: { id: termId } });
  if (!term) return null;

  const subjects = await subjectsFor(studentId, termId);
  const average = averageOf(subjects);

  // Rank against classmates who also have marks this term.
  const classmates = await prisma.student.findMany({
    where: { classId: student.classId, active: true },
    select: { id: true },
  });
  const averages: { id: string; avg: number }[] = [];
  for (const mate of classmates) {
    const mateSubjects = mate.id === studentId ? subjects : await subjectsFor(mate.id, termId);
    if (mateSubjects.length) averages.push({ id: mate.id, avg: averageOf(mateSubjects) });
  }
  averages.sort((a, b) => b.avg - a.avg);
  const rank = averages.findIndex((a) => a.id === studentId);

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { studentId, date: { gte: term.startDate, lte: term.endDate } },
  });
  const present = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const late = attendanceRecords.filter((a) => a.status === "LATE").length;
  const absent = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const total = attendanceRecords.length;

  const card = await prisma.reportCard.findUnique({ where: { studentId_termId: { studentId, termId } } });

  return {
    school: {
      name: student.school.name,
      logoUrl: student.school.logoUrl,
      address: student.school.address,
      phone: student.school.phone,
      gesRegNo: student.school.gesRegNo,
    },
    student: {
      id: student.id,
      name: student.name,
      admissionNo: student.admissionNo,
      className: student.class.name,
    },
    term: {
      name: term.name,
      academicYear: term.academicYear,
      startDate: term.startDate.toISOString(),
      endDate: term.endDate.toISOString(),
    },
    subjects,
    overall: {
      average,
      position: rank >= 0 ? rank + 1 : null,
      classSize: averages.length,
    },
    attendance: {
      present,
      late,
      absent,
      total,
      percentage: total ? Math.round(((present + late) / total) * 100) : 0,
    },
    remarks: {
      teacher: card?.teacherRemark ?? null,
      headTeacher: card?.headTeacherRemark ?? null,
      conduct: card?.conduct ?? null,
      attitude: card?.attitude ?? null,
      interest: card?.interest ?? null,
    },
    nextTermBegins: card?.nextTermBegins?.toISOString() ?? null,
    published: card?.published ?? false,
  };
}

const GRADE_BANDS = [
  { min: 80, grade: "1", remark: "Excellent" },
  { min: 70, grade: "2", remark: "Very Good" },
  { min: 60, grade: "3", remark: "Good" },
  { min: 55, grade: "4", remark: "Credit" },
  { min: 50, grade: "5", remark: "Pass" },
  { min: 45, grade: "6", remark: "Weak Pass" },
  { min: 40, grade: "7", remark: "Weak" },
  { min: 35, grade: "8", remark: "Very Weak" },
  { min: 0, grade: "9", remark: "Fail" },
];

/** GES-style 1–9 numeric grade alongside the letter grade, as Ghanaian reports show. */
export function gesGrade(score: number): { grade: string; remark: string } {
  const band = GRADE_BANDS.find((b) => score >= b.min)!;
  return { grade: band.grade, remark: band.remark };
}

/**
 * Renders the report card as a self-contained printable HTML document.
 * Kept as HTML-for-print rather than a binary PDF: it prints identically through
 * the browser's "Save as PDF", needs no native dependency in the container, and
 * the school can print a stack of them straight from the portal.
 */
export function renderReportCardHtml(data: ReportCardData): string {
  const rows = data.subjects
    .map((s) => {
      const ges = gesGrade(s.finalScore);
      const classScore = s.components
        .filter((c) => c.type !== "END_OF_TERM_EXAM")
        .reduce((sum, c) => sum + (c.score / c.maxScore) * c.weightPct, 0);
      const examScore = s.components
        .filter((c) => c.type === "END_OF_TERM_EXAM")
        .reduce((sum, c) => sum + (c.score / c.maxScore) * c.weightPct, 0);
      return `<tr>
        <td class="subject">${escapeHtml(s.subject)}</td>
        <td>${Math.round(classScore)}</td>
        <td>${Math.round(examScore)}</td>
        <td class="total">${s.finalScore}</td>
        <td>${ges.grade}</td>
        <td class="remark">${escapeHtml(ges.remark)}</td>
      </tr>`;
    })
    .join("");

  const componentLegend = data.subjects[0]?.components
    .map((c) => `${escapeHtml(c.label)} (${c.weightPct}%)`)
    .join(" · ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(data.student.name)} — ${escapeHtml(data.term.name)} Report</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: #22242A; margin: 0; font-size: 12px; }
  .sheet { max-width: 800px; margin: 0 auto; }
  header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #2A2C30; padding-bottom: 14px; }
  header img { width: 62px; height: 62px; object-fit: contain; }
  .school-name { font-size: 21px; font-weight: 800; letter-spacing: -0.01em; }
  .school-meta { font-size: 11px; color: #565A62; margin-top: 3px; }
  .doc-title { text-align: center; font-size: 13px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; margin: 16px 0; }
  .pupil { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #FAF9F6; border: 1px solid #E5E2DA; border-radius: 8px; padding: 12px 14px; }
  .pupil div span { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #8A8F97; font-weight: 700; }
  .pupil div strong { font-size: 13px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #2A2C30; color: #FFC629; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; padding: 9px 8px; text-align: center; }
  th:first-child { text-align: left; }
  td { border-bottom: 1px solid #EEEBE3; padding: 8px; text-align: center; font-size: 12px; }
  td.subject { text-align: left; font-weight: 600; }
  td.total { font-weight: 800; }
  td.remark { text-align: left; color: #565A62; }
  .legend { font-size: 9.5px; color: #8A8F97; margin-top: 6px; font-style: italic; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }
  .stat { border: 1px solid #E5E2DA; border-radius: 8px; padding: 11px 13px; }
  .stat span { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #8A8F97; font-weight: 700; }
  .stat strong { font-size: 19px; font-weight: 800; }
  .remarks { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; }
  .remark-box { border: 1px solid #E5E2DA; border-radius: 8px; padding: 11px 13px; min-height: 46px; }
  .remark-box span { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #8A8F97; font-weight: 700; margin-bottom: 4px; }
  .traits { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 34px; }
  .sign div { border-top: 1px solid #8A8F97; padding-top: 5px; font-size: 10.5px; color: #565A62; text-align: center; }
  footer { margin-top: 22px; padding-top: 10px; border-top: 1px solid #EEEBE3; font-size: 10px; color: #8A8F97; display: flex; justify-content: space-between; }
  .draft { background: #FFF3D6; color: #B07A00; border: 1px solid #FFE08A; border-radius: 6px; padding: 7px 11px; font-size: 10.5px; font-weight: 700; margin-top: 12px; }
  @media print { .draft { -webkit-print-color-adjust: exact; print-color-adjust: exact; } th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="sheet">
  <header>
    ${data.school.logoUrl ? `<img src="${escapeHtml(data.school.logoUrl)}" alt="">` : ""}
    <div>
      <div class="school-name">${escapeHtml(data.school.name)}</div>
      <div class="school-meta">
        ${[data.school.address, data.school.phone, data.school.gesRegNo ? `GES No. ${data.school.gesRegNo}` : null]
          .filter(Boolean)
          .map(escapeHtml)
          .join(" &nbsp;·&nbsp; ")}
      </div>
    </div>
  </header>

  <div class="doc-title">Terminal Report — ${escapeHtml(data.term.name)}, ${escapeHtml(data.term.academicYear)}</div>

  <div class="pupil">
    <div><span>Pupil</span><strong>${escapeHtml(data.student.name)}</strong></div>
    <div><span>Class</span><strong>${escapeHtml(data.student.className)}</strong></div>
    <div><span>Admission No.</span><strong>${escapeHtml(data.student.admissionNo ?? "—")}</strong></div>
    <div><span>Position</span><strong>${data.overall.position ? `${ordinal(data.overall.position)} of ${data.overall.classSize}` : "—"}</strong></div>
  </div>

  ${data.subjects.length === 0 ? `<div class="draft">No assessment entries recorded for this term yet.</div>` : ""}

  <table>
    <thead>
      <tr>
        <th>Subject</th><th>Class Score</th><th>Exam Score</th><th>Total</th><th>Grade</th><th>Remark</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  ${componentLegend ? `<div class="legend">Continuous assessment: ${componentLegend}</div>` : ""}

  <div class="summary">
    <div class="stat"><span>Overall Average</span><strong>${data.overall.average}%</strong></div>
    <div class="stat"><span>Attendance</span><strong>${data.attendance.percentage}%</strong></div>
    <div class="stat"><span>Days Present</span><strong>${data.attendance.present} / ${data.attendance.total}</strong></div>
  </div>

  <div class="traits">
    <div class="stat"><span>Conduct</span><strong style="font-size:13px">${escapeHtml(data.remarks.conduct ?? "—")}</strong></div>
    <div class="stat"><span>Attitude</span><strong style="font-size:13px">${escapeHtml(data.remarks.attitude ?? "—")}</strong></div>
    <div class="stat"><span>Interest</span><strong style="font-size:13px">${escapeHtml(data.remarks.interest ?? "—")}</strong></div>
  </div>

  <div class="remarks">
    <div class="remark-box"><span>Class Teacher's Remark</span>${escapeHtml(data.remarks.teacher ?? "")}</div>
    <div class="remark-box"><span>Head Teacher's Remark</span>${escapeHtml(data.remarks.headTeacher ?? "")}</div>
  </div>

  <div class="sign">
    <div>Class Teacher's Signature</div>
    <div>Head Teacher's Signature</div>
  </div>

  ${!data.published ? `<div class="draft">DRAFT — this report has not been published to parents yet.</div>` : ""}

  <footer>
    <div>${data.nextTermBegins ? `Next term begins: ${new Date(data.nextTermBegins).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}</div>
    <div>Generated ${new Date().toLocaleDateString("en-GB")}</div>
  </footer>
</div>
</body>
</html>`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
