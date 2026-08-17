"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const teacherNav = [
  { href: "/roster", icon: "✅", label: "Attendance" },
  { href: "/grades-entry", icon: "📊", label: "Enter Grades" },
  { href: "/post", icon: "📣", label: "Homework & Posts" },
  { href: "/messages", icon: "💬", label: "Messages" },
];

const adminNav = [
  { href: "/manage", icon: "👥", label: "Manage Staff/Students" },
  { href: "/fee-overview", icon: "💰", label: "Fee Overview" },
  { href: "/post", icon: "📢", label: "School Announcements" },
  { href: "/approvals", icon: "✅", label: "Approvals" },
  { href: "/pickup-desk", icon: "🚗", label: "Pickup Desk" },
  { href: "/voice-inbox", icon: "💬", label: "Parent Voice" },
  { href: "/messages", icon: "✉️", label: "Messages" },
];

const gateStaffNav = [{ href: "/pickup-desk", icon: "🚗", label: "Pickup Desk" }];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  if (!user) return null;

  const items = user.role === "teacher" ? teacherNav : user.role === "gate-staff" ? gateStaffNav : adminNav;

  return (
    <aside className="flex h-screen w-64 flex-col justify-between bg-dark-pill px-4 py-6 text-[#C9CCD1]">
      <div>
        <p className="mb-8 px-2 font-display text-lg font-bold text-white">Aspire Royal Academy</p>
        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-chip px-3 py-2.5 text-sm font-medium"
                style={{ background: active ? "#3A3C42" : "transparent", color: active ? "#FFC629" : "#C9CCD1" }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-text-primary">
            {user.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs capitalize text-[#8A8F97]">{user.role.replace("-", " ")}</p>
          </div>
        </div>
        <button onClick={logout} className="w-full rounded-chip px-3 py-2 text-left text-sm hover:bg-white/5">
          Sign out
        </button>
      </div>
    </aside>
  );
}
