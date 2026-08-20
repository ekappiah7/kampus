"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-brand-link" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Fixed rail on desktop; slide-over on tablets and phones. */}
      <div className="sticky top-0 hidden h-screen lg:block">
        <Sidebar />
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNavOpen(false)} />
          <div className="relative h-full animate-fade">
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-alt bg-[#F4F4F2]/90 px-5 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setNavOpen(true)}
            className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm font-bold"
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="font-display text-[15px] font-semibold">Staff Portal</span>
        </div>

        <main className="min-w-0 flex-1 px-5 py-7 md:px-11 md:py-9">{children}</main>
      </div>
    </div>
  );
}
