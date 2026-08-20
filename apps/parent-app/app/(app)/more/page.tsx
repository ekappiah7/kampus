"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";

const LINKS = [
  { icon: "📋", label: "Attendance", href: "/attendance", tint: "#FFF3D6" },
  { icon: "📊", label: "Grades & Report Card", href: "/grades", tint: "#E7F0F7" },
  { icon: "📣", label: "Announcements", href: "/announcements", tint: "#F7EAF0" },
  { icon: "🍽️", label: "Cafeteria Menu", href: "/cafeteria", tint: "#E9F7EE" },
  { icon: "💬", label: "Parent Voice", href: "/voice", tint: "#FFF3D6" },
  { icon: "🚗", label: "Pickup Notice", href: "/pickup", tint: "#E7F0F7" },
  { icon: "🔔", label: "Notifications", href: "/notifications", tint: "#F7EAF0" },
];

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout, children: kids } = useSession();
  const [changing, setChanging] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api.auth.changePassword(current, next);
      setMsg({ kind: "ok", text: "Password updated." });
      setCurrent("");
      setNext("");
      setChanging(false);
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Could not update your password." });
    }
  }

  const field =
    "w-full rounded-[12px] border-[1.5px] border-border-alt bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-brand-link";

  return (
    <div className="px-[18px] pb-8 pt-4">
      <p className="mb-4 font-display text-[18px] font-semibold">More</p>

      <div className="mb-5 flex flex-col gap-2.5">
        {LINKS.map((l) => (
          <button
            key={l.href}
            onClick={() => router.push(l.href)}
            className="flex items-center gap-3.5 rounded-[14px] bg-white px-4 py-3.5 text-left active:opacity-70"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[12px] text-xl" style={{ background: l.tint }}>
              {l.icon}
            </span>
            <span className="flex-1 text-[14.5px] font-bold text-[#22242A]">{l.label}</span>
            <span className="text-[#C4C7CC]">→</span>
          </button>
        ))}
      </div>

      <div className="rounded-[14px] bg-white p-4">
        <p className="text-[13px] font-bold text-[#22242A]">{user?.name}</p>
        <p className="mt-0.5 text-[12.5px] text-text-muted">
          {kids.length} {kids.length === 1 ? "child" : "children"} linked
        </p>

        {msg && (
          <p
            className="mt-3 rounded-[10px] px-3 py-2 text-[12.5px] font-medium"
            style={
              msg.kind === "ok"
                ? { background: "#E9F7EE", color: "#2E8B52" }
                : { background: "#FCEAEA", color: "#C74747" }
            }
          >
            {msg.text}
          </p>
        )}

        {changing ? (
          <form onSubmit={changePassword} className="mt-3 flex flex-col gap-2.5">
            <input
              className={field}
              type="password"
              placeholder="Current password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <input
              className={field}
              type="password"
              placeholder="New password (min 8 characters)"
              required
              minLength={8}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded-pill bg-dark-pill py-2.5 text-[13px] font-bold text-brand">
                Save
              </button>
              <button
                type="button"
                onClick={() => setChanging(false)}
                className="flex-1 rounded-pill border border-border py-2.5 text-[13px] font-bold text-text-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setChanging(true)} className="mt-3 text-[13px] font-bold text-brand-link">
            Change password
          </button>
        )}
      </div>

      <button onClick={logout} className="mt-6 w-full py-3 text-center text-sm font-bold text-danger active:opacity-60">
        Sign out
      </button>
    </div>
  );
}
