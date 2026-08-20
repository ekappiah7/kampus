"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, ScreenHeader } from "@/components/ui";

const CATEGORIES = [
  { key: "SUGGESTION", label: "Suggestion" },
  { key: "COMPLAINT", label: "Complaint" },
  { key: "HONOUR_A_TEACHER", label: "Honour a Teacher" },
  { key: "GENERAL", label: "General" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

export default function VoiceScreen() {
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [staffName, setStaffName] = useState("");
  const [message, setMessage] = useState("");
  const [staff, setStaff] = useState<{ id: string; name: string; title: string | null }[]>([]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.voice.staffList().then(setStaff).catch(() => setStaff([]));
  }, []);

  const showStaff = category === "HONOUR_A_TEACHER" || category === "COMPLAINT";

  async function submit() {
    if (!category || message.trim().length < 4) return;
    setBusy(true);
    setError(null);
    try {
      await api.voice.submit(category, message.trim(), showStaff ? staffName || undefined : undefined);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send your message.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <>
        <ScreenHeader title="Parent Voice" />
        <div className="px-[18px]">
          <Card className="!rounded-[16px] px-5 py-8 text-center">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-[#E9F7EE] text-[26px]">✓</div>
            <p className="mb-1.5 font-display text-[17px] font-semibold">Thank you</p>
            <p className="text-[13px] text-text-muted">Your message has been sent to school leadership.</p>
          </Card>
        </div>
      </>
    );
  }

  const field =
    "w-full rounded-[12px] border-[1.5px] border-border-alt bg-white px-3.5 py-3 text-[14px] outline-none focus:border-brand-link";

  return (
    <>
      <ScreenHeader title="Parent Voice" />
      <div className="px-[18px] pb-6">
        <p className="mb-4 text-[13px] leading-[1.6] text-[#6B6F76]">
          A suggestion, a concern, or a word of thanks for a teacher — this goes straight to school leadership.
        </p>

        <p className="mb-2.5 text-[13.5px] font-bold text-[#22242A]">I&apos;d like to share a&hellip;</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className="rounded-pill border-[1.5px] px-3.5 py-2 text-[12.5px] font-bold"
              style={{
                borderColor: category === c.key ? "#2A2C30" : "#EEEBE3",
                background: category === c.key ? "#2A2C30" : "#fff",
                color: category === c.key ? "#FFC629" : "#565A62",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {showStaff && (
          <select className={`${field} mb-3`} value={staffName} onChange={(e) => setStaffName(e.target.value)}>
            <option value="">Select a staff member (optional)</option>
            {staff.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
                {s.title ? ` — ${s.title}` : ""}
              </option>
            ))}
          </select>
        )}

        <textarea
          className={`${field} mb-3.5 h-[120px] resize-none`}
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {error && <p className="mb-3 rounded-[10px] bg-danger-tint px-3 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

        <button
          onClick={submit}
          disabled={busy || !category || message.trim().length < 4}
          className="w-full rounded-[12px] bg-dark-pill py-3.5 text-[14.5px] font-bold text-brand disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send to School Leadership"}
        </button>
      </div>
    </>
  );
}
