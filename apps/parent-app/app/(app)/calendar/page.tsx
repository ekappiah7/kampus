"use client";

import { useEffect, useState } from "react";
import type { EventView } from "@kampus/shared-types";
import { api } from "@/lib/api";
import { AppBar } from "@/components/AppBar";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui";

export default function CalendarScreen() {
  const [events, setEvents] = useState<EventView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    setEvents(null);
    api.events
      .list()
      .then(setEvents)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the calendar."));
  }

  useEffect(load, []);

  return (
    <>
      <AppBar />
      <div className="px-[18px] pb-6">
        <p className="mb-3 font-display text-[18px] font-semibold">Calendar</p>

        {error && <ErrorState message={error} onRetry={load} />}
        {!error && events === null && <Skeleton rows={4} />}
        {!error && events?.length === 0 && (
          <EmptyState icon="📅" title="No events scheduled" hint="School events and holidays appear here." />
        )}

        {events && events.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {events.map((e) => {
              const d = new Date(e.date);
              const past = d < new Date(new Date().setHours(0, 0, 0, 0));
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3.5 rounded-[14px] bg-white px-4 py-3.5"
                  style={{ opacity: past ? 0.55 : 1 }}
                >
                  <div className="w-[52px] shrink-0 text-center">
                    <p className="text-[11px] font-bold text-text-muted">
                      {d.toLocaleString("en-GB", { month: "short" }).toUpperCase()}
                    </p>
                    <p className="font-display text-[22px] font-bold leading-none text-[#22242A]">{d.getDate()}</p>
                  </div>
                  <div>
                    <p className="text-[14.5px] font-bold text-[#22242A]">{e.title}</p>
                    {e.time && <p className="text-[12.5px] text-text-muted">{e.time}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
