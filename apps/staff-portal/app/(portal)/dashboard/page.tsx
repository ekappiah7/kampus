"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DashboardStats } from "@kampus/shared-types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Button, Card, ErrorState, PageHeader, Skeleton, money } from "@/components/ui";

/** Ordered checklist that walks a brand-new school through getting usable. */
function SetupChecklist({ stats }: { stats: DashboardStats }) {
  const steps = [
    { done: !!stats.term, label: "Open a term", hint: "Everything — fees, marks, reports — hangs off the current term.", href: "/academics" },
    { done: stats.classes > 0, label: "Add your classes", hint: "Crèche through Primary 6, or whatever your school runs.", href: "/academics" },
    { done: stats.staff > 1, label: "Add teachers", hint: "Each gets an access code to set their own password.", href: "/people" },
    { done: stats.students > 0, label: "Add pupils and guardians", hint: "Parents get an access code for the Parent App.", href: "/people" },
    { done: stats.fees.expected > 0, label: "Set up fees", hint: "Create fee items, then bill them to a class.", href: "/fees" },
  ];
  const remaining = steps.filter((s) => !s.done);
  if (!remaining.length) return null;

  return (
    <Card className="mb-6 border-[1.5px] border-brand bg-[#FFF7DF] p-6">
      <p className="font-display text-[17px] font-semibold">Finish setting up</p>
      <p className="mt-1 text-[13px] text-[#6B6F76]">
        {steps.length - remaining.length} of {steps.length} done. Work through these and the school is live.
      </p>
      <div className="mt-4 flex flex-col gap-2.5">
        {steps.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex items-start gap-3 rounded-[12px] bg-white/70 px-4 py-3 transition-colors hover:bg-white"
          >
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: s.done ? "#3E9E63" : "#E5E2DA", color: s.done ? "#fff" : "#8A8F97" }}
            >
              {s.done ? "✓" : ""}
            </span>
            <span>
              <span className="block text-[13.5px] font-bold" style={{ textDecoration: s.done ? "line-through" : undefined, opacity: s.done ? 0.5 : 1 }}>
                {s.label}
              </span>
              {!s.done && <span className="block text-[12px] text-text-muted">{s.hint}</span>}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    api.admin
      .dashboard()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the dashboard."));
  }

  useEffect(load, []);

  const actions = stats
    ? [
        { count: stats.actionable.pendingApprovals, label: "posts awaiting approval", href: "/approvals" },
        { count: stats.actionable.pendingCash, label: "cash payments to confirm", href: "/fees" },
        { count: stats.actionable.pendingPickups, label: "pickups waiting at the gate", href: "/pickup-desk" },
        { count: stats.actionable.openVoice, label: "unresolved parent messages", href: "/voice-inbox" },
        { count: stats.actionable.newInquiries, label: "new admission enquiries", href: "/admissions" },
      ].filter((a) => a.count > 0)
    : [];

  return (
    <>
      <PageHeader
        title={`Good day, ${user?.name.split(" ").slice(-1)[0] ?? ""}`}
        subtitle={stats?.term ? `${stats.term.name}, ${stats.term.academicYear}` : "No term open yet"}
        action={
          <Button variant="gold" onClick={() => router.push("/people")}>
            + Add pupil
          </Button>
        }
      />

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !stats && <Skeleton rows={4} />}

      {stats && (
        <>
          <SetupChecklist stats={stats} />

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "PUPILS", value: stats.students.toLocaleString(), tone: "#22242A" },
              { label: "STAFF", value: stats.staff.toLocaleString(), tone: "#22242A" },
              { label: "COLLECTED", value: money(stats.fees.collected), tone: "#2E8B52" },
              { label: "OUTSTANDING", value: money(stats.fees.outstanding), tone: "#C74747" },
            ].map((s) => (
              <Card key={s.label} className="p-[18px]">
                <p className="mb-1.5 text-[12.5px] font-bold text-text-muted">{s.label}</p>
                <p className="font-display text-[24px] font-bold" style={{ color: s.tone }}>
                  {s.value}
                </p>
              </Card>
            ))}
          </div>

          {actions.length > 0 && (
            <Card className="mb-6 p-6">
              <p className="mb-4 font-display text-[17px] font-semibold">Needs your attention</p>
              <div className="flex flex-col gap-2">
                {actions.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex items-center justify-between rounded-[12px] bg-bg px-4 py-3 transition-colors hover:bg-[#F0EFEA]"
                  >
                    <span className="text-sm font-semibold">
                      <span className="mr-2 inline-block rounded-full bg-brand px-2 py-0.5 text-[12px] font-bold text-text-primary">
                        {a.count}
                      </span>
                      {a.label}
                    </span>
                    <span className="text-text-muted">→</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { icon: "👥", title: "Staff & pupils", text: "Add people and issue access codes.", href: "/people" },
              { icon: "💰", title: "Fees", text: "Bill items, confirm cash, apply discounts.", href: "/fees" },
              { icon: "🎓", title: "Report cards", text: "Write remarks and publish to parents.", href: "/reports" },
            ].map((c) => (
              <Link key={c.href} href={c.href}>
                <Card className="h-full p-6 transition-shadow hover:shadow-card">
                  <div className="mb-3 text-2xl">{c.icon}</div>
                  <p className="mb-1 text-[15px] font-bold">{c.title}</p>
                  <p className="text-[13px] leading-relaxed text-text-muted">{c.text}</p>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
