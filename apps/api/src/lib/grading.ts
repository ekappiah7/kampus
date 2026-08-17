import type { AssessmentComponent, SubjectGrade } from "@kampus/shared-types";

/** Rolls up weighted CA components into a final percentage + GES-style letter grade. */
export function rollUpGrade(subjectName: string, components: AssessmentComponent[]): SubjectGrade {
  const totalWeight = components.reduce((sum, c) => sum + c.weightPct, 0) || 1;
  const weightedScore = components.reduce((sum, c) => sum + (c.score / c.maxScore) * c.weightPct, 0);
  const finalScore = Math.round((weightedScore / totalWeight) * 100);

  const { letter, remark } = letterGradeFor(finalScore);
  return { subject: subjectName, finalScore, letterGrade: letter, remark, components };
}

function letterGradeFor(pct: number): { letter: string; remark: string } {
  if (pct >= 90) return { letter: "A", remark: "Excellent" };
  if (pct >= 80) return { letter: "A-", remark: "Excellent" };
  if (pct >= 75) return { letter: "B+", remark: "Very good" };
  if (pct >= 70) return { letter: "B", remark: "Good" };
  if (pct >= 65) return { letter: "C+", remark: "Needs practice" };
  if (pct >= 60) return { letter: "C", remark: "Credit" };
  if (pct >= 50) return { letter: "D", remark: "Pass" };
  return { letter: "F", remark: "Needs support" };
}
