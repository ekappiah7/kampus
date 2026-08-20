"use client";

import { useEffect, useState } from "react";
import type { AnnouncementView } from "@kampus/shared-types";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, ScreenHeader, Skeleton, TAG_TINT } from "@/components/ui";

export default function AnnouncementsScreen() {
  const [items, setItems] = useState<AnnouncementView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    setItems(null);
    api.students
      .announcements()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load announcements."));
  }

  useEffect(load, []);

  return (
    <>
      <ScreenHeader title="Announcements" />
      <div className="px-[18px] pb-6">
        {error && <ErrorState message={error} onRetry={load} />}
        {!error && items === null && <Skeleton rows={4} />}
        {!error && items?.length === 0 && (
          <EmptyState icon="📣" title="No announcements yet" hint="School notices will appear here." />
        )}

        {items && items.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {items.map((a) => {
              const tint = TAG_TINT[a.tag ?? "GENERAL"] ?? TAG_TINT.GENERAL!;
              return (
                <div key={a.id} className="rounded-[14px] bg-white p-4">
                  <div className="mb-1.5 flex items-start justify-between gap-3">
                    {a.tag ? (
                      <span
                        className="rounded-pill px-2.5 py-1 text-[11px] font-bold"
                        style={{ background: tint.bg, color: tint.color }}
                      >
                        {a.tag}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="shrink-0 text-[11.5px] text-text-muted">
                      {new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="mb-1 text-[14.5px] font-bold text-[#22242A]">{a.title}</p>
                  <p className="whitespace-pre-wrap text-[13px] leading-[1.55] text-[#6B6F76]">{a.body}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
