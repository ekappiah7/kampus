"use client";

import { useState } from "react";
import type { SiteData } from "@/lib/api";
import { Crest } from "./Sections";

const primary = [
  { href: "#about", label: "About" },
  { href: "#academics", label: "Academics" },
  { href: "#admissions", label: "Admissions" },
  { href: "#fees", label: "Fees" },
  { href: "#events", label: "Events" },
];

// "More" absorbs overflow so the bar never wraps as sections are added per tenant.
const more = [
  { href: "#safety", label: "Safety" },
  { href: "#staff", label: "Staff" },
  { href: "#gallery", label: "Gallery" },
  { href: "#voice", label: "Parent Voice" },
];

export function Nav({ site }: { site: SiteData }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[rgba(250,249,246,0.92)] backdrop-blur-[10px]">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-3.5 md:px-12">
        <a href="#home" className="flex items-center gap-3">
          <Crest site={site} size={42} />
          <span className="font-display text-[19px] font-semibold text-text-primary">{site.school.name}</span>
        </a>

        <nav className="hidden items-center gap-[18px] text-[13.5px] font-semibold text-[#52565C] lg:flex">
          {primary.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-brand-link">
              {l.label}
            </a>
          ))}
          <div className="group relative py-1">
            <button className="flex items-center gap-1 transition-colors hover:text-brand-link">More ▾</button>
            <div className="invisible absolute left-0 top-full min-w-[170px] flex-col rounded-[12px] bg-white p-2 opacity-0 shadow-dropdown transition-all group-hover:visible group-hover:opacity-100">
              {more.map((l) => (
                <a key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 hover:bg-bg">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <a href="#contact" className="transition-colors hover:text-brand-link">
            Contact
          </a>
          <a
            href="#admissions"
            className="rounded-pill bg-dark-pill px-[18px] py-[9px] font-bold"
            style={{ color: site.school.primaryColor }}
          >
            Enroll Now
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
          {[...primary, ...more, { href: "#contact", label: "Contact" }].map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-bg">
              {l.label}
            </a>
          ))}
          <a
            href="#admissions"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-pill bg-dark-pill px-5 py-3 text-center font-bold"
            style={{ color: site.school.primaryColor }}
          >
            Enroll Now
          </a>
        </nav>
      )}
    </header>
  );
}
