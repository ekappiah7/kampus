"use client";

import { useState } from "react";
import { PRODUCT, TRIAL } from "@/lib/content";
import { KampusMark } from "./Logo";

/**
 * Slim announcement bar, above the sticky nav rather than inside it.
 *
 * This is the line an ad's click-through has to land on saying the same thing the
 * ad said — a school owner arriving from a "free full term" post who finds pricing
 * copy instead has already decided the ad was bait.
 */
export function PromoBar() {
  return (
    <div className="bg-dark-pill py-2 text-center text-[12.5px] font-semibold text-white">
      <a href="#book" className="inline-flex flex-wrap items-center justify-center gap-x-2 px-4">
        <span className="rounded-pill bg-brand px-2 py-0.5 text-[10.5px] font-extrabold tracking-wide text-text-primary">
          {TRIAL.badge}
        </span>
        <span className="text-[#C9CCD1]">Test Kampus alongside what you use now — no card, no commitment.</span>
        <span className="font-bold text-brand underline underline-offset-2">{TRIAL.cta} →</span>
      </a>
    </div>
  );
}

const links = [
  { href: "#product", label: "Product" },
  { href: "#why", label: "Why Kampus" },
  { href: "#features", label: "What it does" },
  { href: "#demo", label: "Live demo" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <KampusMark size={34} />
      <span className={`font-display text-[19px] font-bold ${light ? "text-white" : "text-text-primary"}`}>{PRODUCT.name}</span>
    </span>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[rgba(250,249,246,0.92)] backdrop-blur-[10px]">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-3.5 md:px-10">
        <a href="#top" aria-label={PRODUCT.name}>
          <Wordmark />
        </a>

        <nav className="hidden items-center gap-[20px] text-[13.5px] font-semibold text-[#52565C] lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-brand-link">
              {l.label}
            </a>
          ))}
          <a href="#book" className="rounded-pill bg-dark-pill px-[18px] py-[9px] font-bold text-brand">
            Book a demo
          </a>
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-border px-3 py-2 text-sm font-semibold lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border bg-white px-6 py-4 text-[15px] font-semibold text-[#52565C] lg:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-bg">
              {l.label}
            </a>
          ))}
          <a
            href="#book"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-pill bg-dark-pill px-5 py-3 text-center font-bold text-brand"
          >
            Book a demo
          </a>
        </nav>
      )}
    </header>
  );
}
