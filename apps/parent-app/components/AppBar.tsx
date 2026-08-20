"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";

/**
 * Home screen bar: active child on the left (tap to switch), notifications on the
 * right. The switcher is a sheet that drops from the bar, matching the design —
 * not a separate screen, so switching child never loses your place.
 */
export function AppBar() {
  const { activeChild, children: kids, setActiveChildId } = useSession();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const router = useRouter();

  useEffect(() => {
    api.notifications
      .list()
      .then((list) => setUnread(list.filter((n) => !n.read).length))
      .catch(() => setUnread(0));
  }, []);

  return (
    <>
      <div className="flex shrink-0 items-center justify-between px-[18px] pb-3 pt-4">
        {activeChild ? (
          <button
            onClick={() => kids.length > 1 && setOpen((v) => !v)}
            className="flex items-center gap-2.5 text-left active:opacity-70"
          >
            <span
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-sm font-bold text-text-primary"
              style={{ background: activeChild.avatarColor }}
            >
              {activeChild.avatarInitials}
            </span>
            <span>
              <span className="block text-[15.5px] font-bold text-[#22242A]">{activeChild.name}</span>
              <span className="block text-xs font-semibold text-text-muted">
                {activeChild.className}
                {kids.length > 1 ? " · Tap to switch ▾" : ""}
              </span>
            </span>
          </button>
        ) : (
          <span className="font-display text-[18px] font-semibold">Home</span>
        )}

        <button
          onClick={() => router.push("/notifications")}
          className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-base active:opacity-70"
          aria-label="Notifications"
        >
          🔔
          {unread > 0 && (
            <span className="absolute right-[7px] top-[6px] h-[9px] w-[9px] rounded-full border-[1.5px] border-white bg-[#E15B5B]" />
          )}
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-[18px] right-[18px] z-40 mt-1 animate-fade overflow-hidden rounded-[18px] bg-white shadow-dropdown">
            {kids.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveChildId(c.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 border-b border-[#F0F0EE] px-4 py-3.5 text-left last:border-0 active:bg-bg"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold"
                  style={{ background: c.avatarColor }}
                >
                  {c.avatarInitials}
                </span>
                <span className="flex-1">
                  <span className="block text-[14.5px] font-bold">{c.name}</span>
                  <span className="block text-xs text-text-muted">{c.className}</span>
                </span>
                {c.id === activeChild?.id && <span className="font-bold text-brand-link">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
