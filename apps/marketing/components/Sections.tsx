"use client";

import { useState } from "react";
import {
  CAPABILITIES,
  CAPABILITY_GROUPS,
  DIFFERENTIATORS,
  FAQ,
  HERO,
  PRICING,
  PROBLEM,
  PRODUCT,
  PROOF,
  STATUS_LABEL,
  SURFACES,
  type Status,
} from "@/lib/content";
import { FeesMockup, ImportPreviewMockup, MarkSheetMockup, ParentMockup } from "./Mockups";
import { Wordmark } from "./Nav";

const SECTION = "mx-auto max-w-[1180px] px-6 md:px-10";

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`mb-3 text-[12px] font-extrabold tracking-[0.14em] ${light ? "text-brand" : "text-brand-link"}`}>{children}</p>
  );
}

function Heading({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2
      className={`font-display text-[30px] font-bold leading-[1.15] md:text-[40px] ${light ? "text-white" : "text-text-primary"}`}
    >
      {children}
    </h2>
  );
}

const STATUS_STYLE: Record<Status, { bg: string; fg: string }> = {
  shipped: { bg: "#E9F7EE", fg: "#2E8B52" },
  building: { bg: "#FFF3D6", fg: "#B07A00" },
  planned: { bg: "#F0F0EE", fg: "#6B6F76" },
};

export function StatusPill({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="whitespace-nowrap rounded-pill px-2.5 py-1 text-[11px] font-bold" style={{ background: s.bg, color: s.fg }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute -right-32 -top-40 h-[460px] w-[460px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, #FFF0BF 0%, rgba(255,240,191,0) 70%)" }}
      />
      <div className={`${SECTION} relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr]`}>
        <div>
          <Eyebrow>{HERO.eyebrow}</Eyebrow>
          <h1 className="font-display text-[38px] font-bold leading-[1.08] text-text-primary md:text-[54px]">{HERO.headline}</h1>
          <p className="mt-5 max-w-[540px] text-[16.5px] leading-relaxed text-text-secondary md:text-[18px]">{HERO.subcopy}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#book" className="rounded-pill bg-dark-pill px-7 py-3.5 text-[15px] font-bold text-brand transition-opacity hover:opacity-90">
              Book a demo
            </a>
            <a
              href="#demo"
              className="rounded-pill border-[1.5px] border-border-alt bg-white px-7 py-3.5 text-[15px] font-bold text-text-primary transition-colors hover:border-brand"
            >
              See it running now
            </a>
          </div>

          <dl className="mt-10 grid max-w-[560px] grid-cols-2 gap-x-6 gap-y-4">
            {PROOF.map((p) => (
              <div key={p.label} className="border-l-2 border-brand pl-3">
                <dt className="text-[14px] font-bold text-text-primary">{p.label}</dt>
                <dd className="text-[12.5px] leading-snug text-text-muted">{p.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The phone overlaps the portal card's edge, never its content — a mockup
            that hides the numbers it is meant to be showing sells nothing. */}
        <div className="relative">
          <div className="sm:ml-[136px]">
            <FeesMockup />
          </div>
          <div className="absolute bottom-0 left-0 hidden w-[150px] sm:block">
            <ParentMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Problem() {
  return (
    <section className="border-b border-border bg-white py-16 md:py-20">
      <div className={SECTION}>
        <div className="max-w-[720px]">
          <Eyebrow>THE PROBLEM</Eyebrow>
          <Heading>{PROBLEM.heading}</Heading>
        </div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEM.items.map((i) => (
            <div key={i.text} className="flex gap-3 rounded-[14px] bg-bg px-4 py-3.5">
              <span className="text-[17px] leading-none">{i.icon}</span>
              <p className="text-[13.5px] leading-relaxed text-text-secondary">{i.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-[760px] border-l-[3px] border-brand pl-5 text-[16px] leading-relaxed text-text-primary">
          {PROBLEM.close}
        </p>
      </div>
    </section>
  );
}

export function Surfaces() {
  const [active, setActive] = useState(SURFACES[0]!.key);
  const current = SURFACES.find((s) => s.key === active)!;

  return (
    <section id="product" className="border-b border-border py-16 md:py-20">
      <div className={SECTION}>
        <div className="max-w-[720px]">
          <Eyebrow>WHAT YOU GET</Eyebrow>
          <Heading>Four surfaces, one system underneath.</Heading>
          <p className="mt-4 text-[16px] leading-relaxed text-text-secondary">
            Everyone at the school sees the part of it that belongs to them — and they are all looking at the same records, so
            nothing has to be reconciled at the end of term.
          </p>
        </div>

        <div className="mt-9 flex flex-wrap gap-2">
          {SURFACES.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className="rounded-pill px-4 py-2.5 text-[13.5px] font-bold transition-colors"
              style={{
                background: active === s.key ? "#2A2C30" : "#FFFFFF",
                color: active === s.key ? "#FFC629" : "#565A62",
                border: `1.5px solid ${active === s.key ? "#2A2C30" : "#EEEBE3"}`,
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="mt-6 grid items-start gap-8 rounded-[20px] border border-border bg-white p-6 md:p-8 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <span
              className="inline-block rounded-pill px-3 py-1 text-[11.5px] font-bold text-text-primary"
              style={{ background: current.tint }}
            >
              {current.who}
            </span>
            <h3 className="mt-3 font-display text-[26px] font-bold">{current.name}</h3>
            <p className="mt-2 text-[15.5px] leading-relaxed text-text-secondary">{current.blurb}</p>
            <ul className="mt-5 flex flex-col gap-2.5">
              {current.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-[14px] leading-relaxed text-text-primary">
                  <span className="mt-[3px] text-brand-link">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center">
            {current.key === "parent" ? <ParentMockup /> : current.key === "portal" ? <FeesMockup /> : <MarkSheetMockup />}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Differentiators() {
  return (
    <section id="why" className="border-b border-border bg-dark-pill py-16 text-white md:py-20">
      <div className={SECTION}>
        <div className="max-w-[760px]">
          <Eyebrow light>WHY THIS ONE</Eyebrow>
          <Heading light>Anyone can list features. These are the decisions behind them.</Heading>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {DIFFERENTIATORS.map((d) => (
            <div key={d.title} className="rounded-[18px] bg-white/[0.06] p-6">
              <span className="text-[22px]">{d.icon}</span>
              <h3 className="mt-3 font-display text-[20px] font-bold text-white">{d.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#C9CCD1]">{d.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarkSheetFeature() {
  return (
    <section className="border-b border-border bg-white py-16 md:py-20">
      <div className={`${SECTION} grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]`}>
        <div>
          <Eyebrow>FOR TEACHERS</Eyebrow>
          <Heading>Mark at home. Upload when you&apos;re back.</Heading>
          <p className="mt-4 text-[16px] leading-relaxed text-text-secondary">
            The portal hands a teacher their own class as a spreadsheet — pupils listed, columns set, every cell checked against
            its own maximum. They fill it in on a laptop with no internet and bring it back.
          </p>
          <p className="mt-4 text-[16px] leading-relaxed text-text-secondary">
            Uploading it never writes straight away. Kampus shows every score that would change, every name it couldn&apos;t
            match and every mark above its maximum — and waits. A teacher who grabs last term&apos;s file finds out from a
            summary, not from discovering a term of marks overwritten.
          </p>
          <ul className="mt-6 flex flex-col gap-2.5">
            {[
              "The file knows which class, subject and term it belongs to",
              "A pupil renamed in the meantime still lands on the right row",
              "Scores above the maximum block the save outright",
              "Class broadsheet exports every subject with averages and positions",
            ].map((p) => (
              <li key={p} className="flex gap-2.5 text-[14px] leading-relaxed">
                <span className="mt-[3px] text-brand-link">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <MarkSheetMockup />
          <ImportPreviewMockup />
        </div>
      </div>
    </section>
  );
}

export function Capabilities() {
  const [group, setGroup] = useState(CAPABILITY_GROUPS[0]!);
  const rows = CAPABILITIES.filter((c) => c.group === group);

  return (
    <section id="features" className="border-b border-border py-16 md:py-20">
      <div className={SECTION}>
        <div className="max-w-[760px]">
          <Eyebrow>EVERYTHING IT DOES</Eyebrow>
          <Heading>The full list — and what&apos;s still coming.</Heading>
          <p className="mt-4 text-[16px] leading-relaxed text-text-secondary">
            Marked honestly. If it says <strong>Working today</strong>, you can see it on the live demo before you sign anything.
            If it says <strong>In build</strong> or <strong>Planned</strong>, it isn&apos;t there yet and we won&apos;t pretend
            otherwise.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {CAPABILITY_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className="rounded-pill px-4 py-2.5 text-[13.5px] font-bold transition-colors"
              style={{
                background: group === g ? "#2A2C30" : "#FFFFFF",
                color: group === g ? "#FFC629" : "#565A62",
                border: `1.5px solid ${group === g ? "#2A2C30" : "#EEEBE3"}`,
              }}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-[18px] border border-border bg-white">
          {rows.map((c) => (
            <div
              key={c.name}
              className="flex flex-wrap items-start gap-x-4 gap-y-1.5 border-b border-[#F0F0EE] px-5 py-4 last:border-0 sm:flex-nowrap sm:items-center"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-bold">{c.name}</span>
                <span className="block text-[13px] leading-snug text-text-muted">{c.detail}</span>
              </span>
              <StatusPill status={c.status} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LiveDemo() {
  const cards = [
    { name: "Staff Portal", who: "Head, bursar, teachers", url: PRODUCT.demo.portal, tint: "#FFF0BF" },
    { name: "Parent App", who: "Parents and guardians", url: PRODUCT.demo.parent, tint: "#E7F0F7" },
    { name: "School Website", who: "Parents looking for a school", url: PRODUCT.demo.website, tint: "#E9F7EE" },
  ];
  return (
    <section id="demo" className="border-b border-border bg-white py-16 md:py-20">
      <div className={SECTION}>
        <div className="max-w-[760px]">
          <Eyebrow>SEE IT YOURSELF</Eyebrow>
          <Heading>It&apos;s running right now.</Heading>
          <p className="mt-4 text-[16px] leading-relaxed text-text-secondary">
            Not a video, not a slide deck — the real system, live. Ask us for a login and walk through it at your own pace, or
            book a session and we&apos;ll set up your own school on it while you watch.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cards.map((c) => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-[18px] border border-border bg-bg p-6 transition-colors hover:border-brand"
            >
              <span className="inline-block rounded-pill px-3 py-1 text-[11.5px] font-bold" style={{ background: c.tint }}>
                {c.who}
              </span>
              <h3 className="mt-3 font-display text-[21px] font-bold">{c.name}</h3>
              <p className="mt-2 break-all text-[12.5px] text-text-muted">{c.url.replace("https://", "")}</p>
              <p className="mt-4 text-[13.5px] font-bold text-brand-link group-hover:underline">Open it →</p>
            </a>
          ))}
        </div>
        <p className="mt-6 rounded-[12px] bg-[#FFF7DF] px-5 py-3.5 text-[13.5px] leading-relaxed text-[#8A6200]">
          The demo school starts empty on purpose. We set it up in front of you — add a teacher, a parent, a pupil, bill a fee,
          enter a mark — so you can see it is your school being built, not a canned recording.
        </p>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border py-16 md:py-20">
      <div className={SECTION}>
        <div className="max-w-[760px]">
          <Eyebrow>PRICING</Eyebrow>
          <Heading>Priced per pupil, per term.</Heading>
          <p className="mt-4 text-[16px] leading-relaxed text-text-secondary">{PRICING.note}</p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {PRICING.tiers.map((t) => (
            <div
              key={t.name}
              className="rounded-[20px] border-[1.5px] bg-white p-6"
              style={{ borderColor: t.featured ? "#FFC629" : "#E5E2DA" }}
            >
              {t.featured && (
                <span className="mb-3 inline-block rounded-pill bg-brand px-3 py-1 text-[11px] font-bold text-text-primary">
                  Most schools
                </span>
              )}
              <h3 className="font-display text-[23px] font-bold">{t.name}</h3>
              <p className="mt-1 text-[13.5px] font-semibold text-text-muted">{t.forWho}</p>
              <p className="mt-4 font-display text-[28px] font-bold text-text-primary">
                {t.price ?? <span className="text-[19px] text-text-muted">Talk to us</span>}
              </p>
              <ul className="mt-5 flex flex-col gap-2">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-[13.5px] leading-relaxed">
                    <span className="mt-[2px] text-brand-link">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#book"
                className="mt-6 block rounded-pill bg-dark-pill py-3 text-center text-[14px] font-bold text-brand transition-opacity hover:opacity-90"
              >
                Get a quote
              </a>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[13.5px] leading-relaxed text-text-muted">
          Setup, data entry help and staff training are included in every tier. There is no separate installation fee, and no
          charge for the school website.
        </p>
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-b border-border bg-white py-16 md:py-20">
      <div className={SECTION}>
        <div className="max-w-[760px]">
          <Eyebrow>QUESTIONS</Eyebrow>
          <Heading>The ones every head asks.</Heading>
        </div>
        <div className="mt-8 max-w-[860px] overflow-hidden rounded-[18px] border border-border">
          {FAQ.map((f, i) => (
            <div key={f.q} className="border-b border-[#F0F0EE] last:border-0">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={open === i}
              >
                <span className="text-[15px] font-bold">{f.q}</span>
                <span className="text-[15px] text-text-muted">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <p className="px-5 pb-5 text-[14.5px] leading-relaxed text-text-secondary">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-dark-pill py-12 text-white">
      <div className={`${SECTION} flex flex-wrap items-start justify-between gap-8`}>
        <div className="max-w-[340px]">
          <Wordmark light />
          <p className="mt-3 text-[13.5px] leading-relaxed text-[#9EA2A9]">
            School management built for Ghanaian basic schools. Fees, marks, attendance, report cards, parents and your public
            website — one system.
          </p>
          <p className="mt-4 text-[13px] text-[#9EA2A9]">
            By <span className="font-bold text-white">{PRODUCT.vendor}</span>
          </p>
        </div>
        <div className="flex gap-12">
          <div>
            <p className="mb-2.5 text-[12px] font-bold tracking-wide text-brand">PRODUCT</p>
            <ul className="flex flex-col gap-2 text-[13.5px] text-[#C9CCD1]">
              <li>
                <a href="#features" className="hover:text-white">
                  What it does
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#demo" className="hover:text-white">
                  Live demo
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2.5 text-[12px] font-bold tracking-wide text-brand">TALK TO US</p>
            <ul className="flex flex-col gap-2 text-[13.5px] text-[#C9CCD1]">
              <li>
                <a href={`https://wa.me/${PRODUCT.contact.whatsapp}`} className="hover:text-white">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${PRODUCT.contact.email}`} className="hover:text-white">
                  {PRODUCT.contact.email}
                </a>
              </li>
              <li>
                <a href="#book" className="hover:text-white">
                  Book a demo
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className={`${SECTION} mt-10 border-t border-white/10 pt-6 text-[12.5px] text-[#8A8F97]`}>
        © {new Date().getFullYear()} {PRODUCT.vendor}. All rights reserved.
      </div>
    </footer>
  );
}
