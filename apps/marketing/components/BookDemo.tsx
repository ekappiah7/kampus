"use client";

import { useState } from "react";
import { PRODUCT } from "@/lib/content";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const field =
  "w-full rounded-[12px] border-[1.5px] border-border-alt bg-white px-4 py-3 text-[14.5px] outline-none transition-colors focus:border-brand-link";

const ROLES = ["Proprietor / Owner", "Head teacher", "Administrator / Bursar", "Teacher", "Something else"];
const SIZES = ["Under 100", "100 – 300", "300 – 600", "Over 600", "Not sure yet"];

/**
 * Demo request.
 *
 * The form stores a lead, but WhatsApp sits right beside it and gets equal weight
 * on purpose: a school proprietor in Ghana is far likelier to send a message than
 * to fill in seven fields and trust that someone reads them. The form is for the
 * ones who prefer it, not the only way in.
 */
export function BookDemo() {
  const [form, setForm] = useState({ name: "", role: ROLES[0]!, schoolName: "", phone: "", email: "", size: SIZES[1]!, message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch(`${API}/public/product-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Could not send that.");
      setState("sent");
    } catch (err) {
      // A failed form must never be a dead end — the WhatsApp route is still there.
      setError(err instanceof Error ? err.message : "Could not send that. Please message us on WhatsApp instead.");
      setState("idle");
    }
  }

  const waText = encodeURIComponent(
    `Hello, I'd like a demo of ${PRODUCT.name} for my school.`,
  );

  return (
    <section id="book" className="border-b border-border py-16 md:py-20">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-6 md:px-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-3 text-[12px] font-extrabold tracking-[0.14em] text-brand-link">GET STARTED</p>
          <h2 className="font-display text-[30px] font-bold leading-[1.15] md:text-[40px]">
            Let&apos;s set your school up on it.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-text-secondary">
            Tell us about the school and we&apos;ll walk you through it — a real session on the live system, with your classes,
            your fees and your terms, not a slideshow.
          </p>

          <a
            href={`https://wa.me/${PRODUCT.contact.whatsapp}?text=${waText}`}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex items-center gap-3 rounded-[14px] bg-[#25D366] px-6 py-4 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
          >
            <span className="text-[18px]">💬</span>
            Message us on WhatsApp
          </a>
          <p className="mt-3 text-[13.5px] text-text-muted">
            Or call <span className="font-bold text-text-primary">{PRODUCT.contact.phoneDisplay}</span>
          </p>
        </div>

        <div className="rounded-[20px] border border-border bg-white p-6 md:p-8">
          {state === "sent" ? (
            <div className="flex flex-col items-start gap-3 py-6">
              <span className="text-[30px]">✅</span>
              <h3 className="font-display text-[22px] font-bold">Got it — thank you.</h3>
              <p className="text-[15px] leading-relaxed text-text-secondary">
                We&apos;ll be in touch within a working day. If it&apos;s urgent, WhatsApp is faster.
              </p>
              <a
                href={`https://wa.me/${PRODUCT.contact.whatsapp}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 rounded-pill bg-[#25D366] px-5 py-2.5 text-[13.5px] font-bold text-white"
              >
                Message on WhatsApp
              </a>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-bold">Your name</span>
                  <input className={field} required value={form.name} onChange={set("name")} placeholder="Ama Owusu" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-bold">Your role</span>
                  <select className={field} value={form.role} onChange={set("role")}>
                    {ROLES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold">School name</span>
                <input className={field} required value={form.schoolName} onChange={set("schoolName")} placeholder="Aspire Royal Academy" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-bold">Phone</span>
                  <input className={field} required value={form.phone} onChange={set("phone")} placeholder="024 000 0000" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-bold">
                    Email <span className="font-medium text-text-muted">(optional)</span>
                  </span>
                  <input className={field} type="email" value={form.email} onChange={set("email")} placeholder="you@school.edu.gh" />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold">How many pupils?</span>
                <select className={field} value={form.size} onChange={set("size")}>
                  {SIZES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold">
                  Anything we should know? <span className="font-medium text-text-muted">(optional)</span>
                </span>
                <textarea
                  className={`${field} min-h-[88px] resize-y`}
                  value={form.message}
                  onChange={set("message")}
                  placeholder="What's giving you the most trouble at the moment?"
                />
              </label>

              {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

              <button
                type="submit"
                disabled={state === "sending"}
                className="rounded-pill bg-dark-pill py-3.5 text-[15px] font-bold text-brand transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {state === "sending" ? "Sending…" : "Request a demo"}
              </button>
              <p className="text-[12px] leading-relaxed text-text-muted">
                We use this to contact you about {PRODUCT.name} and nothing else. No lists, no forwarding.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
