"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnnouncementView } from "@kampus/shared-types";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { AppBar } from "@/components/AppBar";
import { Card, EmptyState, TAG_TINT, money } from "@/components/ui";

const QUICK_LINKS = [
  { icon: "📋", label: "Attendance", href: "/attendance", tint: "#FFF3D6" },
  { icon: "📊", label: "Grades", href: "/grades", tint: "#E7F0F7" },
  { icon: "📝", label: "Homework", href: "/homework", tint: "#F7EAF0" },
  { icon: "🚗", label: "Pickup", href: "/pickup", tint: "#E7F0F7" },
  { icon: "💳", label: "Fees", href: "/fees", tint: "#E9F7EE" },
  { icon: "📅", label: "Calendar", href: "/calendar", tint: "#FFF3D6" },
  { icon: "📣", label: "Notices", href: "/announcements", tint: "#E7F0F7" },
  { icon: "💬", label: "Parent Voice", href: "/voice", tint: "#E9F7EE" },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { user, activeChild } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<AnnouncementView[]>([]);

  useEffect(() => {
    api.students.announcements().then(setAnnouncements).catch(() => setAnnouncements([]));
  }, []);

  if (!activeChild) {
    return (
      <>
        <AppBar />
        <EmptyState
          icon="🎒"
          title="No pupil linked yet"
          hint="Once the school links your child to this account, everything appears here."
        />
      </>
    );
  }

  const hasBalance = activeChild.feeBalance > 0;

  return (
    <>
      <AppBar />

      <div className="px-[18px] pb-6">
        <div className="mb-4 rounded-[20px] p-5" style={{ background: "linear-gradient(135deg,#FFC629,#FFE08A)" }}>
          <p className="mb-1 font-display text-[17px] font-semibold text-[#22242A]">
            {greeting()}, {user?.name.split(" ")[0]} 👋
          </p>
          <p className="text-[13px] font-semibold text-[#5A5D24]">
            {activeChild.nextEvent
              ? `${activeChild.name.split(" ")[0]}'s next event: ${activeChild.nextEvent}`
              : `${activeChild.name.split(" ")[0]} · ${activeChild.className}`}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <Card onClick={() => router.push("/attendance")} className="!rounded-[16px]">
            <p className="mb-1.5 text-xs font-bold text-text-muted">ATTENDANCE</p>
            {activeChild.attendanceRecorded > 0 ? (
              <p className="font-display text-2xl font-bold text-success">{activeChild.attendancePct}%</p>
            ) : (
              <p className="font-display text-[15px] font-bold text-text-muted">Not marked yet</p>
            )}
          </Card>
          <Card onClick={() => router.push("/fees")} className="!rounded-[16px]">
            <p className="mb-1.5 text-xs font-bold text-text-muted">FEE BALANCE</p>
            <p
              className="font-display text-2xl font-bold"
              style={{ color: hasBalance ? "#C74747" : "#3E9E63" }}
            >
              {money(activeChild.feeBalance)}
            </p>
          </Card>
        </div>

        <p className="mb-3 text-[14.5px] font-bold text-[#22242A]">Quick access</p>
        <div className="mb-5 grid grid-cols-4 gap-2.5">
          {QUICK_LINKS.map((q) => (
            <button key={q.label} onClick={() => router.push(q.href)} className="flex flex-col items-center gap-1.5 active:opacity-70">
              <span
                className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] text-[22px]"
                style={{ background: q.tint }}
              >
                {q.icon}
              </span>
              <span className="text-center text-[11px] font-semibold leading-tight text-text-secondary">{q.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-2.5 flex items-baseline justify-between">
          <p className="text-[14.5px] font-bold text-[#22242A]">Latest announcements</p>
          {announcements.length > 0 && (
            <button onClick={() => router.push("/announcements")} className="text-[12.5px] font-bold text-brand-link">
              See all
            </button>
          )}
        </div>

        {announcements.length === 0 ? (
          <Card className="text-center text-[13px] text-text-muted">No announcements yet.</Card>
        ) : (
          announcements.slice(0, 2).map((a) => {
            const tint = TAG_TINT[a.tag ?? "GENERAL"] ?? TAG_TINT.GENERAL!;
            return (
              <Card key={a.id} className="mb-2.5 !px-4 !py-3.5" onClick={() => router.push("/announcements")}>
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="text-sm font-bold">{a.title}</p>
                  <span className="shrink-0 text-[11.5px] text-text-muted">
                    {new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
                {a.tag && (
                  <span className="mb-1.5 inline-block rounded-pill px-2.5 py-0.5 text-[10.5px] font-bold" style={{ background: tint.bg, color: tint.color }}>
                    {a.tag}
                  </span>
                )}
                <p className="line-clamp-2 text-[13px] leading-[1.5] text-[#6B6F76]">{a.body}</p>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
