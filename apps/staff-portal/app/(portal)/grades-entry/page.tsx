"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

interface Student {
  id: string;
  name: string;
}
interface Subject {
  id: string;
  name: string;
}
interface Entry {
  id: string;
  type: string;
  label: string;
  score: number;
  maxScore: number;
  weightPct: number;
}

const ASSESSMENT_TYPES = [
  "CLASSWORK",
  "QUIZ",
  "GROUP_WORK",
  "PROJECT",
  "HOMEWORK_COMPLETION",
  "MID_TERM_EXAM",
  "END_OF_TERM_EXAM",
];

export default function GradesEntryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [form, setForm] = useState({ type: ASSESSMENT_TYPES[0], label: "", score: 80, maxScore: 100, weightPct: 10 });

  useEffect(() => {
    api.staff.manageStudents().then((r) => setStudents(r as Student[]));
    api.staff.subjects().then((r) => setSubjects(r as Subject[]));
  }, []);

  async function loadEntries() {
    if (!studentId || !subjectId || !termId) return;
    const rows = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/staff/grades/${studentId}/${subjectId}/${termId}`,
      { headers: { Authorization: `Bearer ${window.localStorage.getItem("kampus_staff_token")}` } },
    ).then((r) => r.json());
    setEntries(rows);
  }

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || !subjectId || !termId) return;
    await api.staff.submitGrade({ studentId, subjectId, termId, ...form });
    setForm({ ...form, label: "" });
    loadEntries();
  }

  const totalWeight = entries.reduce((s, e) => s + e.weightPct, 0);
  const finalScore = totalWeight
    ? Math.round(entries.reduce((s, e) => s + (e.score / e.maxScore) * e.weightPct, 0) / totalWeight * 100)
    : null;

  return (
    <>
      <PageHeader title="Enter Grades" subtitle="Continuous assessment — add weighted components per subject, per student" />

      <Card className="mb-6 grid gap-4 sm:grid-cols-3">
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="rounded-chip border border-border-alt px-3 py-2">
          <option value="">Select pupil…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="rounded-chip border border-border-alt px-3 py-2">
          <option value="">Select subject…</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Term ID (from admin)"
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
          className="rounded-chip border border-border-alt px-3 py-2"
        />
        <button onClick={loadEntries} className="col-span-full rounded-pill bg-dark-pill py-2 text-sm font-semibold text-brand">
          Load assessment entries
        </button>
      </Card>

      <Card className="mb-6">
        <p className="mb-4 font-semibold">Assessment entries</p>
        <table className="w-full text-left text-sm">
          <thead className="text-text-muted">
            <tr>
              <th className="pb-2">Type</th>
              <th className="pb-2">Label</th>
              <th className="pb-2">Score</th>
              <th className="pb-2">Weight</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-border-alt">
                <td className="py-2 capitalize">{e.type.replace(/_/g, " ").toLowerCase()}</td>
                <td className="py-2">{e.label}</td>
                <td className="py-2">
                  {e.score}/{e.maxScore}
                </td>
                <td className="py-2">{e.weightPct}%</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-text-muted">
                  No entries yet for this selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {finalScore !== null && (
          <p className="mt-4 rounded-chip bg-tint-green px-4 py-2 text-sm font-semibold text-success">
            Computed final grade: {finalScore}%
          </p>
        )}
      </Card>

      <Card>
        <p className="mb-4 font-semibold">Add assessment entry</p>
        <form onSubmit={addEntry} className="grid gap-3 sm:grid-cols-2">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-chip border border-border-alt px-3 py-2"
          >
            {ASSESSMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input
            placeholder="Label, e.g. Algebra worksheet — Ch. 5"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="rounded-chip border border-border-alt px-3 py-2"
            required
          />
          <input
            type="number"
            placeholder="Score"
            value={form.score}
            onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
            className="rounded-chip border border-border-alt px-3 py-2"
          />
          <input
            type="number"
            placeholder="Max score"
            value={form.maxScore}
            onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })}
            className="rounded-chip border border-border-alt px-3 py-2"
          />
          <input
            type="number"
            placeholder="Weight %"
            value={form.weightPct}
            onChange={(e) => setForm({ ...form, weightPct: Number(e.target.value) })}
            className="rounded-chip border border-border-alt px-3 py-2"
          />
          <button type="submit" className="rounded-pill bg-brand py-2 text-sm font-semibold text-text-primary">
            Add entry
          </button>
        </form>
      </Card>
    </>
  );
}
