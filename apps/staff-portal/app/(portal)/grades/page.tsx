"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GradeSheet } from "@kampus/shared-types";
import { api } from "@/lib/api";
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
            <div className="flex gap-2.5">
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
                    <th key={c.key} className="px-3 py-3.5 text-center text-[12.5px] font-bold text-text-muted">
                      <span className="block">{c.label.toUpperCase()}</span>
                      <span className="block text-[10.5px] font-semibold text-[#B0B4BA]">
                        {c.weightPct}% · /{c.maxScore}
                      </span>
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

      {toastNode}
    </>
  );
}
