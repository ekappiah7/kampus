"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

interface RosterRow {
  id: string;
  name: string;
  initials: string | null;
  avatarColor: string | null;
  status: "PRESENT" | "LATE" | "ABSENT";
}

const STATUSES: RosterRow["status"][] = ["PRESENT", "LATE", "ABSENT"];

export default function RosterPage() {
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.staff.roster().then((r) => setRoster(r as RosterRow[]));
  }, []);

  function setStatus(id: string, status: RosterRow["status"]) {
    setRoster((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function save(marks: RosterRow[]) {
    setSaving(true);
    await api.staff.markAttendance(marks.map((r) => ({ studentId: r.id, status: r.status })));
    setSaving(false);
  }

  async function markAllPresent() {
    const updated = roster.map((r) => ({ ...r, status: "PRESENT" as const }));
    setRoster(updated);
    await save(updated);
  }

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="Mark today's attendance for your class"
        action={
          <button onClick={markAllPresent} className="rounded-pill bg-brand px-4 py-2 text-sm font-semibold text-text-primary">
            Mark All Present
          </button>
        }
      />
      <Card className="p-0">
        <ul className="divide-y divide-border-alt">
          {roster.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ backgroundColor: r.avatarColor ?? "#E7F0F7" }}
                >
                  {r.initials}
                </div>
                <p className="font-medium">{r.name}</p>
              </div>
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatus(r.id, s);
                      save(roster.map((row) => (row.id === r.id ? { ...row, status: s } : row)));
                    }}
                    className="rounded-pill px-3 py-1.5 text-xs font-medium capitalize"
                    style={{
                      background: r.status === s ? "#2A2C30" : "#F4F4F2",
                      color: r.status === s ? "#FFC629" : "#8A8F97",
                    }}
                  >
                    {s.toLowerCase()}
                  </button>
                ))}
              </div>
            </li>
          ))}
          {roster.length === 0 && <li className="px-6 py-10 text-center text-sm text-text-muted">No pupils in this class yet.</li>}
        </ul>
      </Card>
      {saving && <p className="mt-3 text-xs text-text-muted">Saving…</p>}
    </>
  );
}
