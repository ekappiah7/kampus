"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badgeKey?: "pendingApprovals" | "openVoice" | "newInquiries" | "pendingPickups" | "pendingCash";
}

const TEACHER_NAV: NavItem[] = [
  { href: "/roster", icon: "✅", label: "Attendance" },
  { href: "/grades", icon: "📊", label: "Enter Grades" },
  { href: "/reports", icon: "🎓", label: "Report Cards" },
  { href: "/post", icon: "📣", label: "Homework & Posts" },
  { href: "/messages", icon: "💬", label: "Messages" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", icon: "🏫", label: "Dashboard" },
  { href: "/people", icon: "👥", label: "Staff & Pupils" },
  { href: "/academics", icon: "📚", label: "Classes & Terms" },
  { href: "/fees", icon: "💰", label: "Fees" },
  { href: "/reports", icon: "🎓", label: "Report Cards" },
  { href: "/post", icon: "📢", label: "Announcements" },
  { href: "/approvals", icon: "✅", label: "Approvals", badgeKey: "pendingApprovals" },
  { href: "/pickup-desk", icon: "🚗", label: "Pickup Desk", badgeKey: "pendingPickups" },
  { href: "/voice-inbox", icon: "💬", label: "Parent Voice", badgeKey: "openVoice" },
  { href: "/admissions", icon: "📥", label: "Admissions", badgeKey: "newInquiries" },
  { href: "/roster", icon: "📋", label: "Attendance" },
  { href: "/grades", icon: "📊", label: "Enter Grades" },
  { href: "/messages", icon: "✉️", label: "Messages" },
  { href: "/website", icon: "🌐", label: "Website" },
];

const GATE_NAV: NavItem[] = [{ href: "/pickup-desk", icon: "🚗", label: "Pickup Desk", badgeKey: "pendingPickups" }];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, school, logout } = useSession();
  const pathname = usePathname();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user?.role !== "admin") return;
    // Badge counts make the queues that need attention obvious at a glance.
    const load = () =>
      api.admin
        .dashboard()
        .then((d) => setCounts(d.actionable as unknown as Record<string, number>))
        .catch(() => setCounts({}));
    void load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user?.role, pathname]);

  if (!user) return null;
  const items = user.role === "teacher" ? TEACHER_NAV : user.role === "gate-staff" ? GATE_NAV : ADMIN_NAV;

  return (
    <aside className="flex h-full w-[250px] shrink-0 flex-col bg-dark-pill px-[18px] py-6 text-white">
      <div className="mb-7 flex items-center gap-2.5 px-1.5">
        {school?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-[9px] object-cover" />
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] font-display font-bold text-text-primary"
            style={{ background: school?.primaryColor ?? "#FFC629" }}
          >
            {(school?.name ?? "S").charAt(0)}
          </span>
        )}
        <span className="font-display text-[15.5px] font-semibold leading-tight">
          {school?.shortName || school?.name || "Staff Portal"}
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.href;
          const count = item.badgeKey ? counts[item.badgeKey] ?? 0 : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-[10px] px-3 py-[11px] text-sm font-semibold transition-colors"
              style={{ background: active ? "#3A3C42" : "transparent", color: active ? "#FFC629" : "#C9CCD1" }}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {count > 0 && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-text-primary">{count}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-[#3F4147] pt-4">
        <div className="mb-2.5 flex items-center gap-2.5 px-1.5">
          <span
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-text-primary"
            style={{ background: school?.primaryColor ?? "#FFC629" }}
          >
            {user.initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-bold">{user.name}</span>
            <span className="block truncate text-[11.5px] text-[#9EA2A9]">
              {user.title || user.role.replace("-", " ")}
              {user.className ? ` · ${user.className}` : ""}
            </span>
          </span>
        </div>
        <button onClick={logout} className="w-full rounded-[10px] px-3 py-2 text-left text-[13px] font-semibold text-[#9EA2A9] hover:bg-white/5">
          Sign out
        </button>
      </div>
    </aside>
  );
}
