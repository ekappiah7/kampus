"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReportCardData } from "@kampus/shared-types";
import { api, API_BASE_URL, TOKEN_KEY } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Modal, PageHeader, Skeleton, inputClass, useToast } from "@/components/ui";

interface Row {
  id: string;
  name: string;
  className: string;
  classId: string;
  initials: string;
  avatarColor: string;
}

const TRAITS = ["Excellent", "Very good", "Good", "Satisfactory", "Needs improvement"];

export default function ReportsPage() {
  const { user } = useSession();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [publishing, setPublishing] = useState(false);
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
    setStudents(null);
    api.admin
      .students(classId ? { classId } : undefined)
      .then((s) => setStudents(s.filter((x) => x.active) as Row[]))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load pupils."));
  }, [classId]);

  useEffect(() => {
    if (classId || classes.length === 0) load();
  }, [classId, classes.length, load]);

  async function openPrint(studentId: string) {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_BASE_URL}/reports/${studentId}/print`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      toast({ kind: "err", text: "Could not open the report." });
      return;
    }
    const html = await res.text();
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      const res = await api.reports.publish(classId ? { classId } : {});
      toast({
        kind: "ok",
        text: res.published ? `Published ${res.published} report(s) — parents notified` : "No reports to publish (no marks recorded yet)",
      });
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not publish." });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Report Cards"
        subtitle="Write remarks, print, and publish to parents"
        action={
          user?.role === "admin" && students && students.length > 0 ? (
            <Button variant="gold" onClick={publish} disabled={publishing}>
              {publishing ? "Publishing…" : "Publish to parents"}
            </Button>
          ) : undefined
        }
      />

      {classes.length > 1 && (
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="mb-5 rounded-[10px] border-[1.5px] border-border-alt bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-brand-link"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !students && <Skeleton rows={5} />}
      {students && students.length === 0 && (
        <EmptyState icon="🎓" title="No pupils to report on" hint="Add pupils and record some marks, then come back here." />
      )}

      {students && students.length > 0 && (
        <Card className="overflow-hidden">
          {students.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 border-b border-[#F0F0EE] px-5 py-3.5 last:border-0">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                style={{ background: s.avatarColor }}
              >
                {s.initials}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-sm font-semibold">{s.name}</span>
                <span className="block text-[12px] text-text-muted">{s.className}</span>
              </span>
              <span className="flex gap-2.5">
                <Button variant="ghost" onClick={() => setEditing(s)}>
                  Remarks
                </Button>
                <Button variant="ghost" onClick={() => openPrint(s.id)}>
                  Print
                </Button>
              </span>
            </div>
          ))}
        </Card>
      )}

      <p className="mt-3 text-[12.5px] text-text-muted">
        Parents can only see a report card after it is published. Printing opens a page you can save as PDF with your
        browser&apos;s print dialog.
      </p>

      {editing && (
        <RemarksModal
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast({ kind: "ok", text: "Remarks saved" });
          }}
        />
      )}

      {toastNode}
    </>
  );
}

function RemarksModal({ student, onClose, onSaved }: { student: Row; onClose: () => void; onSaved: () => void }) {
  const [data, setData] = useState<ReportCardData | null>(null);
  const [form, setForm] = useState({ teacherRemark: "", headTeacherRemark: "", conduct: "", attitude: "", interest: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.reports
      .get(student.id)
      .then((d) => {
        setData(d);
        setForm({
          teacherRemark: d.remarks.teacher ?? "",
          headTeacherRemark: d.remarks.headTeacher ?? "",
          conduct: d.remarks.conduct ?? "",
          attitude: d.remarks.attitude ?? "",
          interest: d.remarks.interest ?? "",
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the report."));
  }, [student.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.reports.saveRemarks(student.id, form);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setBusy(false);
    }
  }

  return (
    <Modal title={`Report — ${student.name}`} onClose={onClose} wide>
      {!data && !error && <div className="py-8 text-center text-sm text-text-muted">Loading…</div>}
      {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

      {data && (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3 rounded-[12px] bg-bg p-4 text-center">
            <div>
              <p className="font-display text-[20px] font-bold">{data.overall.average}%</p>
              <p className="text-[11.5px] text-text-muted">Average</p>
            </div>
            <div>
              <p className="font-display text-[20px] font-bold">
                {data.overall.position ? `${data.overall.position}/${data.overall.classSize}` : "—"}
              </p>
              <p className="text-[11.5px] text-text-muted">Position</p>
            </div>
            <div>
              <p className="font-display text-[20px] font-bold">{data.attendance.percentage}%</p>
              <p className="text-[11.5px] text-text-muted">Attendance</p>
            </div>
          </div>

          {data.subjects.length === 0 && (
            <p className="rounded-[10px] bg-[#FFF3D6] px-3.5 py-2.5 text-[13px] font-medium text-[#B07A00]">
              No marks recorded this term yet — the report will be mostly empty until grades are entered.
            </p>
          )}

          <div className="grid grid-cols-3 gap-3">
            {(["conduct", "attitude", "interest"] as const).map((k) => (
              <Field key={k} label={k[0]!.toUpperCase() + k.slice(1)}>
                <select className={inputClass} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>
                  <option value="">—</option>
                  {TRAITS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            ))}
          </div>

          <Field label="Class teacher's remark">
            <textarea
              className={`${inputClass} h-20 resize-none`}
              value={form.teacherRemark}
              onChange={(e) => setForm({ ...form, teacherRemark: e.target.value })}
              placeholder="A hardworking pupil who contributes well in class."
            />
          </Field>
          <Field label="Head teacher's remark">
            <textarea
              className={`${inputClass} h-20 resize-none`}
              value={form.headTeacherRemark}
              onChange={(e) => setForm({ ...form, headTeacherRemark: e.target.value })}
            />
          </Field>

          {data.published && <Badge label="Published — parents can see this" tone="green" />}

          <Button type="submit" className="!py-3" disabled={busy}>
            {busy ? "Saving…" : "Save remarks"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
