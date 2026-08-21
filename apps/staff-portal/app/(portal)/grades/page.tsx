"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GradeSheet } from "@kampus/shared-types";
import { api } from "@/lib/api";
import type { MarkSheetImportReport } from "@kampus/api-client";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Modal, PageHeader, Skeleton, inputClass, useToast } from "@/components/ui";

const TYPES = [
  { value: "CLASSWORK", label: "Classwork" },
  { value: "QUIZ", label: "Quiz" },
  { value: "GROUP_WORK", label: "Group work" },
  { value: "PROJECT", label: "Project" },
  { value: "HOMEWORK_COMPLETION", label: "Homework completion" },
  { value: "MID_TERM_EXAM", label: "Mid-term exam" },
  { value: "END_OF_TERM_EXAM", label: "End-of-term exam" },
];

/**
 * Mark book: pupils down the side, assessment components across the top.
 * Scores are held locally while typing and written in a single bulk save, so a
 * teacher can fill a whole column without a round trip per cell.
 */
export default function GradesPage() {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [sheet, setSheet] = useState<GradeSheet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ type: "CLASSWORK", label: "", weightPct: 20, maxScore: 100 });
  const [sheetModal, setSheetModal] = useState(false);
  const { toast, toastNode } = useToast();

  useEffect(() => {
    api.staff
      .myClasses()
      .then((list) => {
        setClasses(list);
        setClassId((c) => c || list[0]?.id || "");
      })
      .catch(() => setClasses([]));
  }, []);

  const load = useCallback(() => {
    setError(null);
    setSheet(null);
    setEdits({});
    api.staff
      .gradeSheet(classId || undefined, subjectId)
      .then(setSheet)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the grade sheet."));
  }, [classId, subjectId]);

  useEffect(() => {
    if (classId || classes.length === 0) load();
  }, [classId, subjectId, classes.length, load]);

  const usedWeight = useMemo(() => sheet?.components.reduce((sum, c) => sum + c.weightPct, 0) ?? 0, [sheet]);

  function cellKey(studentId: string, componentKey: string) {
    return `${studentId}|${componentKey}`;
  }

  function setCell(studentId: string, componentKey: string, raw: string) {
    const value = raw === "" ? NaN : Number(raw);
    setEdits((prev) => {
      const next = { ...prev };
      if (Number.isNaN(value)) delete next[cellKey(studentId, componentKey)];
      else next[cellKey(studentId, componentKey)] = value;
      return next;
    });
  }

  async function save() {
    if (!sheet?.subject) return;
    const scores = Object.entries(edits).map(([key, score]) => {
      const [studentId, componentKey] = key.split("|");
      return { studentId: studentId!, componentKey: componentKey!, score };
    });
    if (!scores.length) return;

    setSaving(true);
    try {
      const res = await api.staff.saveGradeSheet(sheet.subject.id, scores);
      toast({ kind: "ok", text: `Saved ${res.updated} score(s)` });
      load();
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  }

  /** An assessment added at the wrong weight, or twice, has to be removable. */
  async function removeComponent(componentKey: string, label: string) {
    if (!sheet?.subject) return;
    if (!window.confirm(`Remove "${label}" from ${sheet.subject.name}?\n\nEvery score recorded under it goes too.`)) return;
    try {
      const r = await api.staff.removeComponent(sheet.subject.id, componentKey);
      toast({ kind: "ok", text: `${label} removed (${r.removed} score row(s))` });
      load();
    } catch (err) {
      toast({ kind: "err", text: err instanceof Error ? err.message : "Could not remove that assessment." });
    }
  }

  async function addComponent(e: React.FormEvent) {
    e.preventDefault();
    if (!sheet?.subject) return;
    try {
      await api.staff.addComponent({ subjectId: sheet.subject.id, ...form });
      setAdding(false);
      setForm({ type: "CLASSWORK", label: "", weightPct: 20, maxScore: 100 });
      load();
    } catch (err) {
      toast({ kind: "err", text: err instanceof Error ? err.message : "Could not add the assessment." });
    }
  }

  const dirty = Object.keys(edits).length;

  return (
    <>
      <PageHeader
        title="Enter Grades"
        subtitle={sheet ? `${sheet.class.name} · ${sheet.term.name}, ${sheet.term.academicYear}` : "Continuous assessment"}
        action={
          sheet?.subject ? (
            <div className="flex flex-wrap gap-2.5">
              <Button variant="ghost" onClick={() => setSheetModal(true)}>
                Mark sheet
              </Button>
              <Button variant="ghost" onClick={() => setAdding(true)}>
                + Assessment
              </Button>
              <Button variant="gold" onClick={save} disabled={saving || !dirty}>
                {saving ? "Saving…" : dirty ? `Save ${dirty} change${dirty > 1 ? "s" : ""}` : "Saved"}
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        {classes.length > 1 && (
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSubjectId(undefined);
            }}
            className="rounded-[10px] border-[1.5px] border-border-alt bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-brand-link"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        {sheet && sheet.subjects.length > 0 && (
          <select
            value={sheet.subject?.id ?? ""}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded-[10px] border-[1.5px] border-border-alt bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-brand-link"
          >
            {sheet.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        {sheet && sheet.components.length > 0 && (
          <Badge
            label={`Weights total ${usedWeight}%${usedWeight === 100 ? " ✓" : ` — ${100 - usedWeight}% unassigned`}`}
            tone={usedWeight === 100 ? "green" : "amber"}
          />
        )}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !sheet && <Skeleton rows={6} />}

      {sheet && sheet.subjects.length === 0 && (
        <EmptyState icon="📚" title="No subjects for this class" hint="An administrator can add subjects under Classes & Terms." />
      )}

      {sheet && sheet.subjects.length > 0 && sheet.rows.length === 0 && (
        <EmptyState icon="🎒" title="No pupils in this class" hint="Add pupils under Staff & Pupils to start recording marks." />
      )}

      {sheet && sheet.rows.length > 0 && sheet.components.length === 0 && (
        <EmptyState
          icon="📊"
          title="No assessments yet"
          hint="Add the components that make up the term's grade — classwork, quizzes, the end-of-term exam — then enter marks against them."
          action={<Button onClick={() => setAdding(true)}>+ Add first assessment</Button>}
        />
      )}

      {sheet && sheet.rows.length > 0 && sheet.components.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-bg text-left">
                  <th className="sticky left-0 z-10 bg-bg px-5 py-3.5 text-[12.5px] font-bold text-text-muted">PUPIL</th>
                  {sheet.components.map((c) => (
                    <th key={c.key} className="group px-3 py-3.5 text-center text-[12.5px] font-bold text-text-muted">
                      <span className="block">{c.label.toUpperCase()}</span>
                      <span className="block text-[10.5px] font-semibold text-[#B0B4BA]">
                        {c.weightPct}% · /{c.maxScore}
                      </span>
                      <button
                        onClick={() => removeComponent(c.key, c.label)}
                        title={`Remove ${c.label}`}
                        className="mt-0.5 text-[10.5px] font-bold text-[#C9CCD1] opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                      >
                        remove
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3.5 text-center text-[12.5px] font-bold text-text-muted">FINAL</th>
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row) => (
                  <tr key={row.studentId} className="border-b border-[#F0F0EE] last:border-0">
                    <td className="sticky left-0 z-10 bg-white px-5 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                          style={{ background: row.avatarColor }}
                        >
                          {row.initials}
                        </span>
                        <span className="text-sm font-semibold">{row.name}</span>
                        {row.monitored && <span title="Monitored pupil">★</span>}
                      </span>
                    </td>
                    {sheet.components.map((c) => {
                      const key = cellKey(row.studentId, c.key);
                      const value = key in edits ? edits[key] : row.scores[c.key];
                      return (
                        <td key={c.key} className="px-3 py-2.5 text-center">
                          <input
                            className="cell-input"
                            type="number"
                            min={0}
                            max={c.maxScore}
                            value={value ?? ""}
                            onChange={(e) => setCell(row.studentId, c.key, e.target.value)}
                            style={key in edits ? { borderColor: "#FFC629", background: "#FFFDF5" } : undefined}
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-center">
                      {row.finalScore != null ? (
                        <span className="text-sm font-bold">
                          {row.finalScore}%{" "}
                          <span className="text-[12px] font-semibold text-text-muted">{row.letterGrade}</span>
                        </span>
                      ) : (
                        <span className="text-[13px] text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {sheet?.components.length ? (
        <p className="mt-3 text-[12.5px] text-text-muted">
          Final grade is the weighted rollup of every column. Marks save when you press Save.
        </p>
      ) : null}

      {adding && (
        <Modal title="Add an assessment" onClose={() => setAdding(false)}>
          <form onSubmit={addComponent} className="flex flex-col gap-4">
            <Field label="Type">
              <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Name" hint="What pupils and parents will see, e.g. “Quiz 1”">
              <input className={inputClass} required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Weight %" hint={`${100 - usedWeight}% remaining`}>
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={100 - usedWeight}
                  required
                  value={form.weightPct}
                  onChange={(e) => setForm({ ...form, weightPct: Number(e.target.value) })}
                />
              </Field>
              <Field label="Marked out of">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  required
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Button type="submit" className="!py-3">
              Add column for every pupil
            </Button>
          </form>
        </Modal>
      )}

      {sheetModal && sheet?.subject && (
        <MarkSheetModal
          classId={sheet.class.id}
          subjectId={sheet.subject.id}
          subjectName={sheet.subject.name}
          className={sheet.class.name}
          onClose={() => setSheetModal(false)}
          onImported={() => {
            setSheetModal(false);
            load();
            toast({ kind: "ok", text: "Marks imported from the spreadsheet" });
          }}
        />
      )}

      {toastNode}
    </>
  );
}

/**
 * The offline route into the mark book.
 *
 * Teachers here mark at home, and most of them are quicker in Excel than in any web
 * grid. So: download the class's own sheet, fill it on a laptop with no internet,
 * bring it back. The upload never writes on the first pass — it reports what would
 * change and waits, because a teacher who grabs the wrong file should find out from
 * a summary rather than from a term of marks quietly overwritten.
 */
function MarkSheetModal({
  classId,
  subjectId,
  subjectName,
  className,
  onClose,
  onImported,
}: {
  classId: string;
  subjectId: string;
  subjectName: string;
  className: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [busy, setBusy] = useState<null | "download" | "preview" | "commit" | "broadsheet">(null);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<MarkSheetImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(kind: NonNullable<typeof busy>, fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(kind);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      return undefined;
    } finally {
      setBusy(null);
    }
  }

  async function preview(f: File) {
    setFile(f);
    setReport(null);
    const r = await run("preview", () => api.staff.importMarkSheet(f, { classId, subjectId }));
    if (r) setReport(r);
  }

  async function commit() {
    if (!file) return;
    const r = await run("commit", () => api.staff.importMarkSheet(file, { classId, subjectId, commit: true }));
    if (r?.committed) onImported();
  }

  const blocked = (report?.outOfRange.length ?? 0) > 0;

  return (
    <Modal title="Mark sheet" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-2.5">
          <p className="text-[13px] font-bold uppercase tracking-wide text-text-muted">1 · Download</p>
          <p className="text-[13.5px] leading-relaxed text-text-secondary">
            An Excel file for <strong>{className} — {subjectName}</strong>, with your pupils and your assessment columns already
            in it. Fill it in anywhere, online or not.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="gold"
              disabled={busy !== null}
              onClick={() => run("download", () => api.staff.markSheetTemplate(classId, subjectId))}
            >
              {busy === "download" ? "Preparing…" : "Download mark sheet"}
            </Button>
            <Button variant="ghost" disabled={busy !== null} onClick={() => run("broadsheet", () => api.staff.broadsheet(classId))}>
              {busy === "broadsheet" ? "Preparing…" : "Class broadsheet"}
            </Button>
          </div>
          <p className="text-[12px] leading-relaxed text-text-muted">
            The broadsheet is every subject for the whole class, with averages and positions — for the end-of-term meeting, not
            for uploading back.
          </p>
        </section>

        <section className="flex flex-col gap-2.5 border-t border-border pt-5">
          <p className="text-[13px] font-bold uppercase tracking-wide text-text-muted">2 · Upload it back</p>
          <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[14px] border-2 border-dashed border-border-alt bg-bg px-4 py-6 text-center hover:border-brand">
            <span className="text-xl opacity-50">📄</span>
            <span className="text-[13.5px] font-bold text-text-primary">{file ? file.name : "Choose the filled-in file"}</span>
            <span className="text-[12px] text-text-muted">.xlsx or .csv · nothing is saved until you confirm</span>
            <input
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void preview(f);
              }}
            />
          </label>
          {busy === "preview" && <p className="text-[13px] font-semibold text-text-muted">Reading the file…</p>}
        </section>

        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

        {report && (
          <section className="flex flex-col gap-3 border-t border-border pt-5">
            <p className="text-[13px] font-bold uppercase tracking-wide text-text-muted">3 · Check, then save</p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "To change", value: report.changeCount, tone: "#22242A" },
                { label: "Unchanged", value: report.unchanged, tone: "#6B6F76" },
                { label: "Problems", value: report.outOfRange.length + report.unmatchedPupils.length + report.unmatchedColumns.length, tone: "#C74747" },
              ].map((s) => (
                <div key={s.label} className="rounded-[12px] bg-bg px-3 py-2.5 text-center">
                  <p className="font-display text-[20px] font-bold" style={{ color: s.tone }}>
                    {s.value}
                  </p>
                  <p className="text-[11.5px] font-semibold text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>

            {report.problems.map((p) => (
              <p key={p} className="rounded-[10px] bg-[#FFF7DF] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#8A6200]">
                {p}
              </p>
            ))}

            {report.outOfRange.length > 0 && (
              <div className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[12.5px] leading-relaxed text-danger">
                <p className="mb-1 font-bold">Fix these in the file first — nothing can be saved while they're there:</p>
                <ul className="list-disc pl-4">
                  {report.outOfRange.slice(0, 8).map((o, i) => (
                    <li key={i}>
                      {o.name} — {o.column}: {o.score} is above the maximum of {o.max}
                    </li>
                  ))}
                </ul>
                {report.outOfRange.length > 8 && <p className="mt-1">…and {report.outOfRange.length - 8} more.</p>}
              </div>
            )}

            {report.unmatchedPupils.length > 0 && (
              <p className="rounded-[10px] bg-[#FFF7DF] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#8A6200]">
                <strong>Skipped — no pupil by that name in {report.class.name}:</strong> {report.unmatchedPupils.slice(0, 10).join(", ")}
                {report.unmatchedPupils.length > 10 && ` and ${report.unmatchedPupils.length - 10} more`}.
              </p>
            )}

            {report.unmatchedColumns.length > 0 && (
              <p className="rounded-[10px] bg-[#FFF7DF] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#8A6200]">
                <strong>Skipped — no matching assessment:</strong> {report.unmatchedColumns.slice(0, 10).join(", ")}. Add the
                assessment in the portal first, or rename the column to match.
              </p>
            )}

            {report.changes.length > 0 && (
              <div className="max-h-52 overflow-y-auto rounded-[12px] border border-border">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="sticky top-0 bg-bg">
                    <tr>
                      {["PUPIL", "ASSESSMENT", "FROM", "TO"].map((h) => (
                        <th key={h} className="px-3 py-2 font-bold text-text-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.changes.map((c, i) => (
                      <tr key={i} className="border-t border-[#F0F0EE]">
                        <td className="px-3 py-1.5 font-semibold">{c.name}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{c.column}</td>
                        <td className="px-3 py-1.5 text-text-muted">{c.from ?? "—"}</td>
                        <td className="px-3 py-1.5 font-bold">{c.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {report.changeCount > report.changes.length && (
                  <p className="px-3 py-2 text-[12px] text-text-muted">
                    …and {report.changeCount - report.changes.length} more, all included when you save.
                  </p>
                )}
              </div>
            )}

            {report.changeCount === 0 && !blocked && (
              <p className="text-[13px] text-text-secondary">Nothing in that file differs from what's already recorded.</p>
            )}

            <Button variant="gold" className="!py-3" disabled={busy !== null || blocked || report.changeCount === 0} onClick={commit}>
              {busy === "commit" ? "Saving…" : `Save ${report.changeCount} score${report.changeCount === 1 ? "" : "s"}`}
            </Button>
          </section>
        )}
      </div>
    </Modal>
  );
}

