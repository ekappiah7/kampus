"use client";

import { useState } from "react";
import { API_BASE_URL, SCHOOL_SUBDOMAIN, type SiteData } from "@/lib/api";

/**
 * The school's lead capture. Submits straight into the admin's Admissions inbox,
 * so an inquiry raised on the website is actionable in the portal within seconds.
 */
export function InquiryForm({ site }: { site: SiteData }) {
  const [form, setForm] = useState({ parentName: "", phone: "", childAge: "", interestedLevel: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const levels = site.programmes.filter((p) => !p.comingSoon).map((p) => p.name);
  const options = levels.length ? levels : site.classes.map((c) => c.name);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/public/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolSubdomain: SCHOOL_SUBDOMAIN, ...form }),
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
      <div className="rounded-[24px] bg-[#33353B] p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E9F7EE] text-3xl">✓</div>
        <p className="font-display text-[19px] font-semibold text-white">Thank you</p>
        <p className="mt-2 text-sm text-[#9EA2A9]">
          Our admissions team will call you on {form.phone} shortly.
        </p>
      </div>
    );
  }

  const field =
    "w-full rounded-[12px] border-none bg-[#3F4147] px-4 py-3.5 text-[14.5px] text-white outline-none placeholder:text-[#9EA2A9] focus:ring-2 focus:ring-brand/60";

  return (
    <form onSubmit={submit} className="rounded-[24px] bg-[#33353B] p-8 md:p-10">
      <p className="mb-6 font-display text-[22px] font-semibold text-white">Request Information</p>
      <div className="flex flex-col gap-4">
        <input
          className={field}
          placeholder="Parent full name"
          required
          value={form.parentName}
          onChange={(e) => setForm({ ...form, parentName: e.target.value })}
        />
        <input
          className={field}
          placeholder="Phone number"
          required
          inputMode="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className={field}
          placeholder="Child's age"
          value={form.childAge}
          onChange={(e) => setForm({ ...form, childAge: e.target.value })}
        />
        <select
          className={field}
          value={form.interestedLevel}
          onChange={(e) => setForm({ ...form, interestedLevel: e.target.value })}
        >
          <option value="">Interested level</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <textarea
          className={`${field} resize-none`}
          rows={3}
          placeholder="Anything you'd like us to know (optional)"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        {error && <p className="text-sm text-[#FF9B9B]">{error}</p>}
        <button
          type="submit"
          disabled={state === "sending"}
          className="mt-1.5 rounded-[12px] px-5 py-[15px] text-[15px] font-bold text-text-primary transition-opacity disabled:opacity-60"
          style={{ background: site.school.primaryColor }}
        >
          {state === "sending" ? "Sending…" : "Send Request"}
        </button>
      </div>
    </form>
  );
}
