"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: "🏠", label: "Home" },
  { href: "/homework", icon: "📝", label: "Homework" },
  { href: "/fees", icon: "💳", label: "Fees" },
  { href: "/calendar", icon: "📅", label: "Calendar" },
  { href: "/more", icon: "⋯", label: "More" },
];

const PRIMARY = new Set(TABS.map((t) => t.href));

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-20 flex shrink-0 justify-around border-t border-[#EFEFEC] bg-white px-2 pt-2.5"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      {TABS.map((t) => {
        // "More" owns every screen that isn't one of the four primary tabs.
        const active = t.href === "/more" ? !PRIMARY.has(pathname) || pathname === "/more" : pathname === t.href;
        return (
          <Link key={t.href} href={t.href} className="flex min-w-[52px] flex-col items-center gap-[3px]">
            <span className="text-[19px]" style={{ opacity: active ? 1 : 0.45 }}>
              {t.icon}
            </span>
            <span className="text-[10.5px] font-bold" style={{ color: active ? "#C98A00" : "#8A8F97" }}>
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
