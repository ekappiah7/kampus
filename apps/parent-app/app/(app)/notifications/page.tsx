"use client";

import { useEffect, useState } from "react";
import type { NotificationView } from "@kampus/shared-types";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, ScreenHeader, Skeleton } from "@/components/ui";

const ICONS: Record<string, { icon: string; bg: string }> = {
  ANNOUNCEMENT: { icon: "📣", bg: "#F7EAF0" },
  HOMEWORK: { icon: "📝", bg: "#FFF3D6" },
  GRADE_POSTED: { icon: "📊", bg: "#E7F0F7" },
  FEE_REMINDER: { icon: "💳", bg: "#FCEAEA" },
  PICKUP_CONFIRMED: { icon: "🚗", bg: "#E9F7EE" },
  POST_APPROVED: { icon: "✅", bg: "#E9F7EE" },
  VOICE_RESPONSE: { icon: "💬", bg: "#E9F7EE" },
};

function ago(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    setItems(null);
    api.notifications
      .list()
      .then((list) => {
        setItems(list);
        // Opening the screen is the read receipt.
        list.filter((n) => !n.read).forEach((n) => void api.notifications.markRead(n.id).catch(() => {}));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load notifications."));
  }

  useEffect(load, []);

  return (
    <>
      <ScreenHeader title="Notifications" />
      <div className="px-[18px] pb-6">
        {error && <ErrorState message={error} onRetry={load} />}
        {!error && items === null && <Skeleton rows={4} />}
        {!error && items?.length === 0 && (
          <EmptyState icon="🔔" title="You're all caught up" hint="Alerts about fees, grades and pickups appear here." />
        )}

        {items && items.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {items.map((n) => {
              const meta = ICONS[n.type] ?? { icon: "🔔", bg: "#F0F0EE" };
              return (
                <div
                  key={n.id}
                  className="flex gap-3 rounded-[14px] bg-white px-4 py-3.5"
                  style={!n.read ? { boxShadow: "inset 0 0 0 1.5px #FFC629" } : undefined}
                >
                  <span
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[17px]"
                    style={{ background: meta.bg }}
                  >
                    {meta.icon}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-[#22242A]">{n.title}</span>
                    <span className="block text-[12.5px] leading-[1.5] text-text-muted">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-[#C4C7CC]">{ago(n.createdAt)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
