"use client";

import { useEffect, useState } from "react";
import type { ReportCardData, SubjectGrade } from "@kampus/shared-types";
import { useSession } from "@/lib/session";
import { api, API_BASE_URL, TOKEN_KEY } from "@/lib/api";
import { Card, EmptyState, ErrorState, ScreenHeader, Skeleton } from "@/components/ui";

const GRADE_TINT = (score: number) =>
  score >= 80 ? { bg: "#E9F7EE", color: "#2E8B52" } : score >= 65 ? { bg: "#E7F0F7", color: "#3479B0" } : { bg: "#FFF3D6", color: "#B07A00" };

export default function GradesScreen() {
  const { activeChild } = useSession();
  const [grades, setGrades] = useState<SubjectGrade[] | null>(null);
  const [report, setReport] = useState<ReportCardData | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!activeChild) return;
    setError(null);
    setGrades(null);
    api.students
      .grades(activeChild.id)
      .then(setGrades)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load grades."));
    // A published report card unlocks the printable version.
    api.reports.get(activeChild.id).then(setReport).catch(() => setReport(null));
  }

  useEffect(load, [activeChild?.id]);

  /**
   * The print endpoint needs the bearer token, which a plain link can't carry, so
   * fetch it and hand the browser a blob to open in its own tab for printing.
   */
  async function openReport() {
    if (!activeChild) return;
    const token = window.localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_BASE_URL}/reports/${activeChild.id}/print`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) return;
    const html = await res.text();
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  return (
    <>
      <ScreenHeader
        title="Grades"
        action={
          report?.published ? (
            <button onClick={openReport} className="text-[12.5px] font-bold text-brand-link active:opacity-60">
              ⬇ Report Card
            </button>
          ) : undefined
        }
      />
      <div className="px-[18px] pb-6">
        {activeChild?.term && <p className="mb-3.5 text-[13px] font-semibold text-text-muted">{activeChild.term}</p>}

        {error && <ErrorState message={error} onRetry={load} />}
        {!error && grades === null && <Skeleton rows={4} />}
        {!error && grades?.length === 0 && (
          <EmptyState icon="📊" title="No grades posted yet" hint="Subject results appear here once the teacher records assessments." />
        )}

        {grades && grades.length > 0 && (
          <div className="flex flex-col gap-2">
            {grades.map((g) => {
              const tint = GRADE_TINT(g.finalScore);
              const open = expanded === g.subject;
              return (
                <div key={g.subject} className="overflow-hidden rounded-[12px] bg-white">
                  <button
                    onClick={() => setExpanded(open ? null : g.subject)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left active:opacity-70"
                  >
                    <span>
                      <span className="block text-[14.5px] font-bold text-[#22242A]">{g.subject}</span>
                      <span className="block text-xs text-text-muted">
                        {g.remark} · tap for breakdown {open ? "▴" : "▾"}
                      </span>
                    </span>
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-base font-bold"
                      style={{ background: tint.bg, color: tint.color }}
                    >
                      {g.letterGrade}
                    </span>
                  </button>

                  {open && (
                    <div className="border-t border-[#F0F0EE] px-4 py-3">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                        Continuous assessment
                      </p>
                      {g.components.map((c, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-[#F5F5F3] py-1.5 last:border-0">
                          <span className="text-[12.5px] text-text-secondary">
                            {c.label} <span className="text-text-muted">({c.weightPct}%)</span>
                          </span>
                          <span className="text-[12.5px] font-bold">
                            {c.score}/{c.maxScore}
                          </span>
                        </div>
                      ))}
                      <div className="mt-2 flex items-center justify-between rounded-[8px] bg-bg px-3 py-2">
                        <span className="text-[12.5px] font-bold">Final</span>
                        <span className="text-[13px] font-bold">{g.finalScore}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {report?.published && (
          <Card className="mt-4 !rounded-[14px] bg-white">
            <p className="text-[13px] font-bold">Term summary</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-display text-lg font-bold">{report.overall.average}%</p>
                <p className="text-[11px] text-text-muted">Average</p>
              </div>
              <div>
                <p className="font-display text-lg font-bold">
                  {report.overall.position ? `${report.overall.position}/${report.overall.classSize}` : "—"}
                </p>
                <p className="text-[11px] text-text-muted">Position</p>
              </div>
              <div>
                <p className="font-display text-lg font-bold">{report.attendance.percentage}%</p>
                <p className="text-[11px] text-text-muted">Attendance</p>
              </div>
            </div>
            {report.remarks.teacher && (
              <p className="mt-3 border-t border-[#F0F0EE] pt-2.5 text-[12.5px] leading-relaxed text-text-secondary">
                <strong>Teacher:</strong> {report.remarks.teacher}
              </p>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
