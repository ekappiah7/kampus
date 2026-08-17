import Link from "next/link";
import type { SchoolContentData } from "@/lib/content";

const primaryLinks = [
  { href: "#about", label: "About" },
  { href: "#academics", label: "Academics" },
  { href: "#admissions", label: "Admissions" },
  { href: "#fees", label: "Fees" },
  { href: "#events", label: "Events" },
];

// "More" absorbs overflow items so the nav never clips as sections grow — preserve
// this pattern when adding sections for other tenants (see design handoff README).
const moreLinks = [
  { href: "#safety", label: "Safety" },
  { href: "#staff", label: "Staff" },
  { href: "#gallery", label: "Gallery" },
  { href: "#parent-voice", label: "Parent Voice" },
  { href: "#contact", label: "Contact" },
];

export function Nav({ school }: { school: SchoolContentData }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border-alt bg-bg/80 backdrop-blur-[10px]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="#" className="flex items-center gap-2 font-display text-lg font-bold">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: school.primaryColor, color: "#2A2C30" }}
          >
            {school.name.charAt(0)}
          </span>
          {school.name}
        </Link>

        <nav className="hidden items-center gap-7 text-[15.5px] font-medium text-text-secondary md:flex">
          {primaryLinks.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-brand-link">
              {l.label}
            </a>
          ))}
          <div className="group relative">
            <button className="flex items-center gap-1 hover:text-brand-link">More ▾</button>
            <div className="invisible absolute right-0 top-full flex w-44 flex-col gap-1 rounded-card border border-border-alt bg-white p-2 opacity-0 shadow-dropdown transition-all group-hover:visible group-hover:opacity-100">
              {moreLinks.map((l) => (
                <a key={l.href} href={l.href} className="rounded-chip px-3 py-2 text-sm hover:bg-tint-gold">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        <a
          href="#admissions"
          className="rounded-pill px-5 py-2.5 text-sm font-semibold text-text-primary shadow-card"
          style={{ backgroundColor: school.primaryColor }}
        >
          Enroll Now
        </a>
      </div>
    </header>
  );
}
