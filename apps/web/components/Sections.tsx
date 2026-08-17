import type { SchoolContentData } from "@/lib/content";

function Section({ id, className = "", children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`px-6 py-16 md:py-[90px] ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-link">{children}</p>;
}

export function Hero({ school }: { school: SchoolContentData }) {
  const stats = [
    { label: "Students", value: school.content.statsStudents },
    { label: "Teachers", value: school.content.statsTeachers },
    { label: "Years", value: school.content.statsYears },
  ];
  return (
    <Section className="grid items-center gap-10 md:grid-cols-2">
      <div>
        <h1 className="font-display text-[40px] font-bold leading-[1.08] md:text-[56px]">{school.content.heroHeadline}</h1>
        <p className="mt-5 text-[18px] leading-[1.6] text-text-secondary">{school.content.heroSubcopy}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a href="#admissions" className="rounded-pill bg-brand px-6 py-3 font-semibold text-text-primary shadow-card">
            Enroll Now
          </a>
          <a href="#about" className="rounded-pill border border-border px-6 py-3 font-semibold text-text-primary">
            Learn More
          </a>
        </div>
        <div className="mt-10 flex gap-8">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-[28px] font-bold">{s.value}+</p>
              <p className="text-sm text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
        {school.accreditation && (
          <span className="mt-6 inline-block rounded-pill bg-tint-green px-4 py-1.5 text-sm font-medium text-success">
            {school.accreditation}
          </span>
        )}
      </div>
      <div className="image-slot h-72 md:h-96">Hero photography</div>
    </Section>
  );
}

export function TrustSignals({ school }: { school: SchoolContentData }) {
  return (
    <Section className="border-y border-border-alt bg-white">
      <Eyebrow>Trusted by families</Eyebrow>
      <div className="grid gap-6 md:grid-cols-2">
        {school.testimonials.map((t) => (
          <blockquote key={t.id} className="rounded-card-lg border border-border-alt bg-bg p-6">
            <p className="text-[18px] leading-[1.6]">&ldquo;{t.quote}&rdquo;</p>
            <footer className="mt-4 text-sm text-text-muted">
              — {t.authorName}
              {t.relation ? `, ${t.relation}` : ""}
            </footer>
          </blockquote>
        ))}
      </div>
    </Section>
  );
}

export function About({ school }: { school: SchoolContentData }) {
  return (
    <Section id="about" className="grid items-center gap-10 md:grid-cols-2">
      <div className="image-slot h-64 md:order-2">About photography</div>
      <div>
        <Eyebrow>About Us</Eyebrow>
        <h2 className="font-display text-[28px] font-bold">{school.name}</h2>
        <p className="mt-4 text-[18px] leading-[1.6] text-text-secondary">{school.content.aboutText}</p>
      </div>
    </Section>
  );
}

const ACADEMIC_LEVELS = ["Crèche", "Nursery", "Kindergarten", "Primary 1 – 3", "Primary 4 – 6"];

export function Academics({ school }: { school: SchoolContentData }) {
  return (
    <Section id="academics" className="border-y border-border-alt bg-white">
      <Eyebrow>Academics</Eyebrow>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-[28px] font-bold">Our academic levels</h2>
        {school.content.jhsComingSoon && (
          <span className="rounded-pill bg-tint-gold px-3 py-1 text-xs font-semibold text-brand-pending">JHS — Coming Soon</span>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {ACADEMIC_LEVELS.map((level) => (
          <div key={level} className="rounded-card-lg border border-border-alt bg-bg p-6">
            <p className="font-display text-lg font-semibold">{level}</p>
            <p className="mt-2 text-sm text-text-secondary">GES-aligned curriculum with continuous assessment.</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Admissions({ school }: { school: SchoolContentData }) {
  return (
    <Section id="admissions">
      <Eyebrow>Admissions</Eyebrow>
      <h2 className="font-display text-[28px] font-bold">Join {school.name}</h2>
      <p className="mt-4 max-w-2xl text-[18px] leading-[1.6] text-text-secondary">{school.content.admissionsText}</p>
      <a href="#contact" className="mt-6 inline-block rounded-pill bg-dark-pill px-6 py-3 font-semibold text-brand">
        Start Application
      </a>
    </Section>
  );
}

export function FeeSchedule({ school }: { school: SchoolContentData }) {
  return (
    <Section id="fees" className="border-y border-border-alt bg-white">
      <Eyebrow>Transparent Pricing</Eyebrow>
      <h2 className="mb-6 font-display text-[28px] font-bold">Fee Schedule</h2>
      <div className="overflow-x-auto rounded-card-lg border border-border-alt">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-bg text-text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Item</th>
              <th className="px-5 py-3 font-medium">Level</th>
              <th className="px-5 py-3 font-medium">Amount (GH₵)</th>
            </tr>
          </thead>
          <tbody>
            {school.feeSchedule.map((row, i) => (
              <tr key={i} className="border-t border-border-alt">
                <td className="px-5 py-3">{row.label}</td>
                <td className="px-5 py-3 text-text-secondary">{row.className}</td>
                <td className="px-5 py-3 font-semibold">{row.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-muted">
        Scholarships and discounts, when applied, appear as visible line-item deductions on each family&apos;s statement.
      </p>
    </Section>
  );
}

export function Safety({ school }: { school: SchoolContentData }) {
  return (
    <Section id="safety">
      <Eyebrow>Safety &amp; Pickup Policy</Eyebrow>
      <h2 className="font-display text-[28px] font-bold">Every pickup, verified</h2>
      <p className="mt-4 max-w-2xl text-[18px] leading-[1.6] text-text-secondary">{school.content.safetyPickupPolicy}</p>
    </Section>
  );
}

export function StaffDirectory({ school }: { school: SchoolContentData }) {
  return (
    <Section id="staff" className="border-y border-border-alt bg-white">
      <Eyebrow>Our Team</Eyebrow>
      <h2 className="mb-6 font-display text-[28px] font-bold">Staff Directory</h2>
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {school.staffDirectory.map((s) => (
          <div key={s.id} className="rounded-card-lg border border-border-alt bg-bg p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-tint-blue font-display font-semibold">
              {s.name
                .replace(/^(Mrs|Mr|Ms)\.\s*/, "")
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <p className="font-semibold">{s.name}</p>
            <p className="text-sm text-text-muted">{s.title}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Gallery() {
  return (
    <Section id="gallery">
      <Eyebrow>Life at School</Eyebrow>
      <h2 className="mb-6 font-display text-[28px] font-bold">Gallery</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="image-slot aspect-square">
            Photo
          </div>
        ))}
      </div>
    </Section>
  );
}

export function ParentVoice() {
  return (
    <Section id="parent-voice" className="border-y border-border-alt bg-white">
      <Eyebrow>Parent Voice</Eyebrow>
      <h2 className="font-display text-[28px] font-bold">We listen — and we act</h2>
      <p className="mt-4 max-w-2xl text-[18px] leading-[1.6] text-text-secondary">
        Enrolled parents can send suggestions, complaints, or honour a teacher directly from the Parent App. Every submission
        reaches the admin inbox and can receive a direct response.
      </p>
    </Section>
  );
}

export function EventsPreview({ school }: { school: SchoolContentData }) {
  return (
    <Section id="events">
      <Eyebrow>What&apos;s Coming Up</Eyebrow>
      <h2 className="mb-6 font-display text-[28px] font-bold">Events &amp; Calendar</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {school.events.map((e) => {
          const d = new Date(e.date);
          return (
            <div key={e.id} className="flex gap-4 rounded-card-lg border border-border-alt bg-white p-5">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase text-brand-link">{d.toLocaleString("en", { month: "short" })}</p>
                <p className="font-display text-2xl font-bold">{d.getDate()}</p>
              </div>
              <div>
                <p className="font-semibold">{e.title}</p>
                <p className="text-sm text-text-muted">{e.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function Contact({ school }: { school: SchoolContentData }) {
  const wa = school.whatsappPhone?.replace(/[^\d]/g, "");
  return (
    <Section id="contact" className="border-y border-border-alt bg-white">
      <Eyebrow>Get in Touch</Eyebrow>
      <h2 className="font-display text-[28px] font-bold">Questions? Message us on WhatsApp</h2>
      <p className="mt-4 max-w-xl text-[18px] leading-[1.6] text-text-secondary">
        Our admissions team typically replies within a few hours during school days.
      </p>
      {wa && (
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-pill bg-success px-6 py-3 font-semibold text-white shadow-card"
        >
          Chat on WhatsApp
        </a>
      )}
    </Section>
  );
}

export function Footer({ school }: { school: SchoolContentData }) {
  return (
    <footer className="px-6 py-10 text-center text-sm text-text-muted">
      <p>
        © {new Date().getFullYear()} {school.name}. Built on the Kampus platform by JAKBRAIN Consult.
      </p>
    </footer>
  );
}
