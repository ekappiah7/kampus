"use client";

import { useEffect, useState } from "react";
import type { GuardianView, PickupNoticeView } from "@kampus/shared-types";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Card, ScreenHeader } from "@/components/ui";

const RELATIONS = ["Parent", "Family member", "Guardian", "Other"] as const;

export default function PickupScreen() {
  const { activeChild } = useSession();
  const [guardians, setGuardians] = useState<GuardianView[]>([]);
  const [notice, setNotice] = useState<PickupNoticeView | null>(null);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<string | null>(null);
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!activeChild) return;
    api.students.guardians(activeChild.id).then(setGuardians).catch(() => setGuardians([]));
    // Surface an open notice so reopening the screen shows the live code.
    api.pickup
      .forChild(activeChild.id)
      .then((list) => setNotice(list.find((n) => n.status === "PENDING") ?? null))
      .catch(() => setNotice(null));
  }, [activeChild?.id]);

  async function send() {
    if (!activeChild || !relation || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.pickup.send(activeChild.id, name.trim(), relation, time || undefined);
      setNotice(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the notice.");
    } finally {
      setBusy(false);
    }
  }

  const firstName = activeChild?.name.split(" ")[0] ?? "your child";
  const primary = guardians[0];
  const field =
    "w-full rounded-[12px] border-[1.5px] border-border-alt bg-white px-3.5 py-3 text-[14px] outline-none focus:border-brand-link";

  const steps = [
    { mark: "✓", label: "Notice sent to school", done: true },
    { mark: "2", label: "Awaiting gate confirmation", done: notice?.status === "CONFIRMED" },
    { mark: "3", label: `${firstName} released`, done: notice?.status === "CONFIRMED" },
  ];

  return (
    <>
      <ScreenHeader title="Pickup" />
      <div className="px-[18px] pb-6">
        {primary && (
          <Card className="mb-4 !rounded-[16px] !p-[18px]">
            <p className="mb-2 text-xs font-bold text-text-muted">TODAY&apos;S PICKUP PLAN</p>
            <p className="text-[15px] font-bold text-[#22242A]">{firstName} will be picked up by:</p>
            <div className="mt-2.5 flex items-center gap-2.5 rounded-[12px] bg-bg px-3.5 py-3">
              <span
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-[13px] font-bold"
                style={{ background: primary.avatarColor }}
              >
                {primary.initials}
              </span>
              <span>
                <span className="block text-sm font-bold">{notice ? notice.pickupPersonName : primary.name}</span>
                <span className="block text-xs text-text-muted">{notice ? notice.relation : primary.relation}</span>
              </span>
            </div>
          </Card>
        )}

        {notice ? (
          <div className="mb-4 rounded-[16px] bg-dark-pill p-5 text-white">
            <p className="mb-2.5 text-xs font-bold text-[#C9CCD1]">PICKUP NOTICE SENT</p>
            <p className="mb-3.5 rounded-[10px] bg-[#33353B] py-3.5 text-center font-mono text-[20px] font-bold tracking-[0.06em]">
              {notice.code}
            </p>
            {notice.pickupTime && (
              <p className="mb-3 text-center text-[12.5px] text-[#9EA2A9]">Expected around {notice.pickupTime}</p>
            )}
            <div className="flex flex-col gap-2.5">
              {steps.map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <span
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: s.done ? "#3E9E63" : "#565A62", color: "#fff" }}
                  >
                    {s.done ? "✓" : s.mark}
                  </span>
                  <span className="text-[13.5px] font-semibold" style={{ color: s.done ? "#fff" : "#C9CCD1" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3.5 text-[12.5px] leading-relaxed text-[#9EA2A9]">
              Gate staff will verify this person&apos;s ID against your notice before releasing {firstName}.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2.5 text-sm font-bold text-[#22242A]">Someone else picking up today?</p>
            <input className={`${field} mb-2.5`} placeholder="Pickup person's full name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="mb-2.5 grid grid-cols-4 gap-2">
              {RELATIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRelation(r)}
                  className="rounded-[12px] border-[1.5px] px-1 py-2.5 text-[12px] font-bold leading-tight"
                  style={{
                    borderColor: relation === r ? "#2A2C30" : "#EEEBE3",
                    background: relation === r ? "#2A2C30" : "#fff",
                    color: relation === r ? "#FFC629" : "#565A62",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <input className={`${field} mb-4`} placeholder="Pickup time (e.g. 2:30pm)" value={time} onChange={(e) => setTime(e.target.value)} />
            {error && <p className="mb-3 rounded-[10px] bg-danger-tint px-3 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
            <button
              onClick={send}
              disabled={busy || !name.trim() || !relation}
              className="w-full rounded-[12px] bg-dark-pill py-3.5 text-[14.5px] font-bold text-brand disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send Pickup Notice"}
            </button>
          </>
        )}

        <p className="mb-2.5 mt-6 text-[13.5px] font-bold text-[#22242A]">Approved guardians</p>
        <div className="flex flex-col gap-2">
          {guardians.map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-[12px] bg-white px-3.5 py-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: g.avatarColor }}
              >
                {g.initials}
              </span>
              <span>
                <span className="block text-[13.5px] font-bold">{g.name}</span>
                <span className="block text-[11.5px] text-text-muted">{g.relation}</span>
              </span>
            </div>
          ))}
          {guardians.length === 0 && <p className="text-[13px] text-text-muted">No guardians on file yet.</p>}
        </div>
      </div>
    </>
  );
}
