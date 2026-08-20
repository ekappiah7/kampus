"use client";

import { useEffect, useState } from "react";
import type { AttendanceEntry } from "@kampus/shared-types";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Card, EmptyState, ErrorState, ScreenHeader, Skeleton, STATUS_TINT } from "@/components/ui";

export default function AttendanceScreen() {
  const { activeChild } = useSession();
  const [entries, setEntries] = useState<AttendanceEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!activeChild) return;
    setError(null);
    setEntries(null);
    api.students
      .attendance(activeChild.id)
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load attendance."));
  }

  useEffect(load, [activeChild?.id]);

  return (
    <>
      <ScreenHeader title="Attendance" />
      <div className="px-[18px] pb-6">
        {activeChild && activeChild.attendanceRecorded > 0 && (
          <Card className="mb-4 !rounded-[18px] !p-5 text-center">
            <p className="mb-2 text-[12.5px] font-bold text-text-muted">THIS TERM</p>
            <p className="font-display text-[40px] font-bold leading-none text-success">{activeChild.attendancePct}%</p>
            <p className="mt-1.5 text-[13px] text-text-muted">present rate</p>
          </Card>
        )}

        {error && <ErrorState message={error} onRetry={load} />}
        {!error && entries === null && <Skeleton rows={5} />}
        {!error && entries?.length === 0 && (
          <EmptyState icon="📋" title="No attendance recorded yet" hint="Days appear here once the teacher marks the register." />
        )}

        {entries && entries.length > 0 && (
          <>
            <p className="mb-2.5 text-sm font-bold text-[#22242A]">Recent days</p>
            <div className="flex flex-col gap-2">
              {entries.map((d) => {
                const tint = STATUS_TINT[d.status]!;
                return (
                  <div key={d.date} className="flex items-center justify-between rounded-[12px] bg-white px-4 py-3">
                    <span className="text-[13.5px] font-semibold text-[#22242A]">
                      {new Date(d.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span className="rounded-pill px-3 py-1 text-xs font-bold" style={{ background: tint.bg, color: tint.color }}>
                      {d.status.charAt(0) + d.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
