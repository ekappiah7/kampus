"use client";

import { useState } from "react";
import { API_BASE_URL, SCHOOL_SUBDOMAIN, type SiteData } from "@/lib/api";

const CATEGORIES = [
  { key: "SUGGESTION", label: "Suggestion" },
  { key: "COMPLAINT", label: "Complaint" },
  { key: "HONOUR_A_TEACHER", label: "Honour a Teacher" },
  { key: "GENERAL", label: "General" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

/** Public Parent Voice — lands in the same admin inbox as in-app submissions. */
export function VoiceForm({ site }: { site: SiteData }) {
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [aboutStaffName, setAboutStaffName] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Naming a staff member only makes sense for praise or a specific complaint.
  const showStaffPicker = category === "HONOUR_A_TEACHER" || category === "COMPLAINT";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      setError("Please choose what you'd like to share.");
      return;
    }
    setState("sending");
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/public/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolSubdomain: SCHOOL_SUBDOMAIN,
          category,
          authorName,
          aboutStaffName: showStaffPicker ? aboutStaffName || undefined : undefined,
          message,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Please check your details and try again.");
      }
      setState("sent");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-[24px] border border-border-alt bg-white p-9 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E9F7EE] text-3xl">✓</div>
        <p className="font-display text-[19px] font-semibold">Thank you</p>
        <p className="mt-2 text-sm text-text-muted">Your message has been sent to school leadership.</p>
      </div>
    );
  }

  const field =
    "w-full rounded-[12px] border-[1.5px] border-border-alt px-3.5 py-3 text-sm outline-none focus:border-brand-link";

  return (
    <form onSubmit={submit} className="rounded-[24px] border border-border-alt bg-white p-8 md:p-9">
      <p className="mb-3.5 text-[15px] font-bold">I&apos;d like to share a&hellip;</p>
      <div className="mb-4.5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = category === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className="rounded-pill border-[1.5px] px-4 py-2.5 text-[13px] font-bold transition-colors"
              style={{
                background: active ? "#2A2C30" : "#fff",
                color: active ? site.school.primaryColor : "#565A62",
                borderColor: active ? "#2A2C30" : "#EEEBE3",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3.5">
        {showStaffPicker && (
          <select className={field} value={aboutStaffName} onChange={(e) => setAboutStaffName(e.target.value)}>
            <option value="">Select a staff member (optional)</option>
            {site.staff.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
                {s.title ? ` — ${s.title}` : ""}
              </option>
            ))}
          </select>
        )}
        <input
          className={field}
          placeholder="Your name"
          required
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
        <textarea
          className={`${field} h-[120px] resize-none`}
          placeholder="Write your message..."
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={state === "sending"}
          className="w-full rounded-[12px] bg-dark-pill px-5 py-[15px] text-[15px] font-bold transition-opacity disabled:opacity-60"
          style={{ color: site.school.primaryColor }}
        >
          {state === "sending" ? "Sending…" : "Send to School Leadership"}
        </button>
      </div>
    </form>
  );
}
