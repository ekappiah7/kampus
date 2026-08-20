"use client";

import { useEffect, useState } from "react";
import type { CafeteriaItem } from "@kampus/shared-types";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, ScreenHeader, Skeleton } from "@/components/ui";

const ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

export default function CafeteriaScreen() {
  const [menu, setMenu] = useState<CafeteriaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    setMenu(null);
    api.school
      .cafeteria()
      .then((m) => setMenu([...m].sort((a, b) => ORDER.indexOf(a.dayOfWeek) - ORDER.indexOf(b.dayOfWeek))))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the menu."));
  }

  useEffect(load, []);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();

  return (
    <>
      <ScreenHeader title="Cafeteria Menu" />
      <div className="px-[18px] pb-6">
        {error && <ErrorState message={error} onRetry={load} />}
        {!error && menu === null && <Skeleton rows={5} />}
        {!error && menu?.length === 0 && (
          <EmptyState icon="🍽️" title="Menu not published" hint="The week's meals will appear here once the school adds them." />
        )}

        {menu && menu.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {menu.map((m) => (
              <div
                key={m.id}
                className="rounded-[14px] bg-white px-4 py-3.5"
                style={m.dayOfWeek === today ? { boxShadow: "inset 0 0 0 2px #FFC629" } : undefined}
              >
                <p className="mb-1.5 text-xs font-bold text-brand-link">
                  {m.dayOfWeek}
                  {m.dayOfWeek === today ? " · TODAY" : ""}
                </p>
                <p className="text-[14.5px] font-bold text-[#22242A]">{m.main}</p>
                {m.side && <p className="mt-0.5 text-[12.5px] text-text-muted">{m.side}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
