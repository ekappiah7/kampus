"use client";

import { useCallback, useEffect, useState } from "react";
import type { AttendanceStatus, RosterView } from "@kampus/shared-types";
import { api } from "@/lib/api";
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Skeleton, useToast } from "@/components/ui";

const STATUSES: AttendanceStatus[] = ["PRESENT", "LATE", "ABSENT"];
const LABEL: Record<AttendanceStatus, string> = { PRESENT: "Present", LATE: "Late", ABSENT: "Absent" };

export default function RosterPage() {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState<RosterView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
    setRoster(null);
    api.staff
      .roster(classId || undefined, date)
      .then(setRoster)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the register."));
  }, [classId, date]);

  useEffect(() => {
    if (classId || classes.length === 0) load();
  }, [classId, date, classes.length, load]);

  /** Writes through on every tap — a teacher shouldn't have to remember to save. */
  async function mark(studentId: string, status: AttendanceStatus) {
    setRoster((prev) =>
      prev ? { ...prev, students: prev.students.map((s) => (s.id === studentId ? { ...s, status } : s)) } : prev,
    );
    try {
      await api.staff.markAttendance([{ studentId, status }], date);
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not save." });
      load();
    }
  }

  async function markAllPresent() {
    if (!roster) return;
    setSaving(true);
    const marks = roster.students.map((s) => ({ studentId: s.id, status: "PRESENT" as const }));
    setRoster({ ...roster, students: roster.students.map((s) => ({ ...s, status: "PRESENT" as const })) });
    try {
      await api.staff.markAttendance(marks, date);
      toast({ kind: "ok", text: `Marked ${marks.length} pupil(s) present` });
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not save." });
      load();
    } finally {
      setSaving(false);
    }
  }

  const marked = roster?.students.filter((s) => s.status).length ?? 0;
  const absent = roster?.students.filter((s) => s.status === "ABSENT").length ?? 0;

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle={roster ? `${roster.class.name} · ${roster.students.length} pupils · ${marked} marked` : "Mark today's register"}
        action={
          roster && roster.students.length > 0 ? (
            <Button onClick={markAllPresent} disabled={saving}>
              {saving ? "Saving…" : "Mark all present"}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        {classes.length > 1 && (
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-[10px] border-[1.5px] border-border-alt bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-brand-link"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-[10px] border-[1.5px] border-border-alt bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-brand-link"
        />
        {absent > 0 && <Badge label={`${absent} absent — guardians notified`} tone="red" />}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !roster && <Skeleton rows={5} />}
      {roster && roster.students.length === 0 && (
        <EmptyState icon="📋" title="No pupils in this class yet" hint="Add pupils under Staff & Pupils, then come back to mark the register." />
      )}

      {roster && roster.students.length > 0 && (
        <Card className="overflow-hidden">
          {roster.students.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3.5 border-b border-[#F0F0EE] px-5 py-3.5 last:border-0">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                style={{ background: s.avatarColor }}
              >
                {s.initials}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-[14.5px] font-semibold">{s.name}</span>
                {s.monitored && <Badge label="★ Monitored" tone="amber" />}
              </span>
              <span className="flex gap-1.5">
                {STATUSES.map((st) => {
                  const active = s.status === st;
                  return (
                    <button
                      key={st}
                      onClick={() => mark(s.id, st)}
                      className="rounded-pill px-3.5 py-[7px] text-[12.5px] font-bold transition-colors"
                      style={{
                        background: active ? "#2A2C30" : "#F4F4F2",
                        color: active ? "#FFC629" : "#8A8F97",
                      }}
                    >
                      {LABEL[st]}
                    </button>
                  );
                })}
              </span>
            </div>
          ))}
        </Card>
      )}

      {toastNode}
    </>
  );
}
