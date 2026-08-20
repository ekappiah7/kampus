"use client";

import { useEffect, useState } from "react";
import type { HomeworkItem } from "@kampus/shared-types";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { AppBar } from "@/components/AppBar";
import { Card, EmptyState, ErrorState, Skeleton, STATUS_TINT } from "@/components/ui";

export default function HomeworkScreen() {
  const { activeChild } = useSession();
  const [items, setItems] = useState<HomeworkItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    if (!activeChild) return;
    setError(null);
    setItems(null);
    api.students
      .homework(activeChild.id)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load homework."));
  }

  useEffect(load, [activeChild?.id]);

  async function markDone(postId: string) {
    if (!activeChild) return;
    setBusyId(postId);
    try {
      await api.students.submitHomework(activeChild.id, postId);
      setItems((prev) => prev?.map((i) => (i.id === postId ? { ...i, status: "SUBMITTED" } : i)) ?? null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <AppBar />
      <div className="px-[18px] pb-6">
        <p className="mb-3 font-display text-[18px] font-semibold">Homework</p>

        {error && <ErrorState message={error} onRetry={load} />}
        {!error && items === null && <Skeleton rows={4} />}
        {!error && items?.length === 0 && (
          <EmptyState icon="📝" title="No homework set" hint="Assignments from the teacher will show up here." />
        )}

        {items && items.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {items.map((h) => {
              const tint = STATUS_TINT[h.status]!;
              return (
                <Card key={h.id} className="!px-4 !py-3.5">
                  <div className="mb-1.5 flex items-start justify-between gap-3">
                    {h.subject && <span className="text-[11.5px] font-bold text-brand-link">{h.subject}</span>}
                    <span className="rounded-pill px-2.5 py-1 text-[11px] font-bold" style={{ background: tint.bg, color: tint.color }}>
                      {h.status === "SUBMITTED" ? "Done" : "Pending"}
                    </span>
                  </div>
                  <p className="mb-1 text-[14.5px] font-bold text-[#22242A]">{h.title}</p>
                  {h.body && <p className="mb-2 text-[13px] leading-[1.5] text-[#6B6F76]">{h.body}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] text-text-muted">
                      {h.due ? `Due ${new Date(h.due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No due date"}
                    </span>
                    {h.status === "PENDING" && (
                      <button
                        onClick={() => markDone(h.id)}
                        disabled={busyId === h.id}
                        className="rounded-pill bg-dark-pill px-3.5 py-1.5 text-[11.5px] font-bold text-brand disabled:opacity-60"
                      >
                        {busyId === h.id ? "Saving…" : "Mark done"}
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
