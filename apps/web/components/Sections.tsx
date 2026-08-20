import type { SiteData } from "@/lib/api";
import { InquiryForm } from "./InquiryForm";
import { VoiceForm } from "./VoiceForm";

/** Wraps a full-bleed section with the prototype's generous vertical rhythm. */
function Section({
  id,
  bg,
  className = "",
  children,
}: {
  id?: string;
  bg?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`px-6 py-16 md:px-12 md:py-[100px] ${className}`} style={bg ? { background: bg } : undefined}>
      <div className="mx-auto max-w-[1180px]">{children}</div>
    </section>
  );
}

function Eyebrow({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "onDark" }) {
  return (
    <p
      className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em]"
      style={{ color: tone === "onDark" ? "#FFC629" : "#C98A00" }}
    >
      {children}
    </p>
  );
}

/** Drop-zone styling for imagery the school hasn't uploaded yet. */
function ImageSlot({ label, className = "", url }: { label: string; className?: string; url?: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={label} className={`h-full w-full rounded-[20px] object-cover ${className}`} />;
  }
  return (
    <div
      className={`flex items-center justify-center rounded-[20px] border-2 border-dashed border-border bg-white/60 px-4 text-center text-[13px] font-medium text-text-muted ${className}`}
    >
      {label}
    </div>
  );
}

export function Hero({ site }: { site: SiteData }) {
  const c = site.content;
  const stats = [
    { value: c?.statsStudents, label: "Students" },
    { value: c?.statsTeachers, label: "Teachers" },
    { value: c?.statsYears, label: "Years Running" },
  ].filter((s) => s.value != null);

  return (
    <div
      id="home"
      className="grid items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-12 md:py-[80px] md:pb-[90px]"
      style={{ background: "linear-gradient(180deg,#FFF7DF 0%,#FAF9F6 100%)" }}
    >
      <div className="mx-auto w-full max-w-[1180px] md:col-span-2 md:grid md:grid-cols-2 md:items-center md:gap-10">
        <div>
          {c?.heroEyebrow && (
            <div className="mb-[22px] inline-flex items-center gap-2 rounded-pill bg-[#FFF0BF] px-4 py-2 text-[13px] font-bold tracking-[0.03em] text-[#8A6200]">
              {c.heroEyebrow}
            </div>
          )}
          <h1 className="font-display text-[38px] font-bold leading-[1.08] text-[#22242A] md:text-[56px]">
            {c?.heroHeadline ?? site.school.name}
          </h1>
          {c?.heroSubcopy && (
            <p className="mt-5 max-w-[460px] text-[18px] leading-[1.6] text-text-secondary">{c.heroSubcopy}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3.5">
            <a
              href="#admissions"
              className="rounded-pill px-7 py-4 text-[15.5px] font-bold text-text-primary"
              style={{ background: site.school.primaryColor }}
            >
              Start Admission
            </a>
            <a
              href="#about"
              className="rounded-pill border-[1.5px] border-border bg-white px-7 py-4 text-[15.5px] font-bold text-text-primary"
            >
              Learn More
            </a>
          </div>
          {stats.length > 0 && (
            <div className="mt-11 flex flex-wrap gap-9">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-[28px] font-bold text-text-primary">{s.value}+</div>
                  <div className="text-[13px] font-semibold text-text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative mt-8 md:mt-0">
          <ImageSlot label="Hero photo of students or campus" className="h-[300px] md:h-[460px]" url={site.gallery[0]?.url} />
          {site.school.accreditation && (
            <div className="absolute -bottom-5 -left-2 flex items-center gap-3 rounded-[18px] bg-white px-5 py-4 shadow-card md:-left-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9F7EE] text-lg">✓</div>
              <div>
                <div className="text-sm font-bold">Fully Accredited</div>
                <div className="text-xs text-text-muted">{site.school.accreditation}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TrustSignals({ site }: { site: SiteData }) {
  if (!site.trustBadges.length && !site.testimonials.length) return null;
  return (
    <Section bg="#fff" className="border-y border-border-alt !py-16">
      <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Eyebrow>Why families trust us</Eyebrow>
          <div className="flex flex-wrap gap-3.5">
            {site.trustBadges.map((b) => (
              <div key={b.id} className="flex items-center gap-2.5 rounded-pill bg-bg px-4 py-2.5">
                {b.icon && <span className="text-[17px]">{b.icon}</span>}
                <span className="text-[13.5px] font-bold">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        {site.testimonials.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {site.testimonials.slice(0, 2).map((t) => (
              <blockquote key={t.id} className="rounded-[16px] bg-bg p-[18px]">
                <p className="mb-3 text-[13.5px] leading-[1.6] text-[#52565C]">&ldquo;{t.quote}&rdquo;</p>
                <footer className="flex items-center gap-2.5">
                  <ImageSlot label="Photo" className="!h-[34px] !w-[34px] !rounded-full !text-[9px]" url={t.photoUrl} />
                  <span className="text-[12.5px] font-bold">
                    {t.authorName}
                    {t.relation ? `, ${t.relation}` : ""}
                  </span>
                </footer>
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

export function About({ site }: { site: SiteData }) {
  const c = site.content;
  if (!c?.aboutText && !c?.aboutHeading) return null;
  return (
    <Section id="about" bg="#fff">
      <div className="grid items-center gap-14 md:grid-cols-2">
        <ImageSlot label="Photo of the school or a classroom" className="h-[280px] md:order-1 md:h-[420px]" url={site.gallery[1]?.url} />
        <div className="md:order-2">
          <Eyebrow>{c?.aboutEyebrow ?? "Our story"}</Eyebrow>
          <h2 className="mb-5 font-display text-[30px] font-semibold text-[#22242A] md:text-[38px]">
            {c?.aboutHeading ?? `About ${site.school.name}`}
          </h2>
          {c?.aboutText && <p className="mb-4 text-[16.5px] leading-[1.75] text-[#52565C]">{c.aboutText}</p>}
          {c?.aboutTextSecondary && <p className="mb-7 text-[16.5px] leading-[1.75] text-[#52565C]">{c.aboutTextSecondary}</p>}
          {(c?.missionText || c?.visionText) && (
            <div className="grid gap-5 sm:grid-cols-2">
              {c?.missionText && (
                <div className="rounded-[16px] bg-[#FFF7DF] px-5 py-[18px]">
                  <div className="mb-1 font-display text-[16px] font-semibold">Our Mission</div>
                  <div className="text-sm text-[#6B6F76]">{c.missionText}</div>
                </div>
              )}
              {c?.visionText && (
                <div className="rounded-[16px] bg-[#EFF5EE] px-5 py-[18px]">
                  <div className="mb-1 font-display text-[16px] font-semibold">Our Vision</div>
                  <div className="text-sm text-[#6B6F76]">{c.visionText}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

export function Academics({ site }: { site: SiteData }) {
  if (!site.programmes.length) return null;
  const c = site.content;
  return (
    <Section id="academics" bg="#FAF9F6">
      <div className="mx-auto mb-14 max-w-[640px] text-center">
        <Eyebrow>Academics</Eyebrow>
        <h2 className="mb-3.5 font-display text-[30px] font-semibold text-[#22242A] md:text-[38px]">
          {c?.academicsHeading ?? "A curriculum for every stage"}
        </h2>
        {c?.academicsSubcopy && <p className="text-[16px] text-[#6B6F76]">{c.academicsSubcopy}</p>}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {site.programmes.map((p) => (
          <div
            key={p.id}
            className="relative rounded-[20px] border border-border-alt bg-white px-[26px] py-[30px]"
            style={{ opacity: p.comingSoon ? 0.6 : 1 }}
          >
            {p.comingSoon && (
              <div
                className="absolute right-5 top-5 rounded-pill bg-dark-pill px-2.5 py-[5px] text-[10.5px] font-bold tracking-[0.04em]"
                style={{ color: site.school.primaryColor }}
              >
                COMING SOON
              </div>
            )}
            <div
              className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-2xl"
              style={{ background: p.tint ?? "#FFF0BF" }}
            >
              {p.icon ?? "📚"}
            </div>
            <div className="mb-2 font-display text-[19px] font-semibold">{p.name}</div>
            {p.ageRange && <div className="mb-3.5 text-[13.5px] text-text-muted">{p.ageRange}</div>}
            {p.description && <div className="text-[14.5px] leading-[1.6] text-text-secondary">{p.description}</div>}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Admissions({ site }: { site: SiteData }) {
  const c = site.content;
  return (
    <Section id="admissions" bg="#2A2C30" className="text-white">
      <div className="grid gap-14 lg:grid-cols-2">
        <div>
          <Eyebrow tone="onDark">Admissions</Eyebrow>
          <h2 className="mb-5 font-display text-[28px] font-semibold md:text-[36px]">
            {c?.admissionsHeading ?? "Join our next intake"}
          </h2>
          {c?.admissionsText && (
            <p className="mb-8 max-w-[440px] text-[16px] leading-[1.7] text-[#C9CCD1]">{c.admissionsText}</p>
          )}
          {site.admissionSteps.length > 0 && (
            <div className="flex flex-col gap-[18px]">
              {site.admissionSteps.map((s, i) => (
                <div key={s.id} className="flex items-start gap-4">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-text-primary"
                    style={{ background: site.school.primaryColor }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="mb-0.5 text-[15.5px] font-bold">{s.title}</div>
                    {s.description && <div className="text-sm text-[#9EA2A9]">{s.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <InquiryForm site={site} />
      </div>
    </Section>
  );
}

export function Fees({ site }: { site: SiteData }) {
  if (!site.feeSchedule.length && !site.otherFees.length) return null;
  return (
    <Section id="fees" bg="#fff">
      <div className="mx-auto mb-12 max-w-[640px] text-center">
        <Eyebrow>Transparent fees</Eyebrow>
        <h2 className="mb-3.5 font-display text-[30px] font-semibold text-[#22242A] md:text-[38px]">Fee schedule by class</h2>
        <p className="text-[16px] text-[#6B6F76]">
          Published each term so there are never any surprises. All amounts in Ghana Cedis (GH₵).
        </p>
      </div>

      {site.feeSchedule.length > 0 && (
        <div className="mx-auto max-w-[820px] overflow-hidden rounded-[20px] bg-bg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="bg-dark-pill" style={{ color: site.school.primaryColor }}>
                  <th className="px-7 py-4 text-[12.5px] font-bold">CLASS</th>
                  <th className="px-7 py-4 text-[12.5px] font-bold">TUITION / TERM</th>
                  <th className="px-7 py-4 text-[12.5px] font-bold">FEEDING FEE</th>
                </tr>
              </thead>
              <tbody>
                {site.feeSchedule.map((row, i) => (
                  <tr key={i} className="border-b border-border-alt last:border-0">
                    <td className="px-7 py-[15px] text-[14.5px] font-bold">{row.className}</td>
                    <td className="px-7 py-[15px] text-sm text-[#52565C]">
                      {row.tuition != null ? `GH₵${row.tuition.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-7 py-[15px] text-sm text-[#52565C]">
                      {row.feeding != null ? `GH₵${row.feeding.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {site.otherFees.length > 0 && (
        <div className="mx-auto mt-6 max-w-[820px] rounded-[16px] border border-border-alt p-5">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-text-muted">Other charges</p>
          <div className="flex flex-wrap gap-2.5">
            {site.otherFees.map((f, i) => (
              <span key={i} className="rounded-pill bg-bg px-3.5 py-2 text-[13px] font-semibold">
                {f.label} — GH₵{f.amount.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mx-auto mt-5 max-w-[820px] text-center text-[13.5px] text-text-muted">
        {site.content?.feesNote ??
          "Scholarships and discounts, where granted, appear as visible line-item deductions on each family's statement."}
      </p>
    </Section>
  );
}

export function Events({ site }: { site: SiteData }) {
  if (!site.events.length) return null;
  const tints = ["#FFF0BF", "#EAF3EA", "#E7F0F7"];
  return (
    <Section id="events" bg="#fff">
      <div className="mb-11 flex items-baseline justify-between gap-4">
        <div>
          <Eyebrow>What&apos;s on</Eyebrow>
          <h2 className="font-display text-[28px] font-semibold text-[#22242A] md:text-[36px]">Upcoming events</h2>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {site.events.slice(0, 3).map((e, i) => {
          const d = new Date(e.date);
          return (
            <div key={e.id} className="overflow-hidden rounded-[20px] border border-border-alt">
              <div className="flex flex-col items-start p-[22px]" style={{ background: tints[i % tints.length] }}>
                <div className="text-[13px] font-bold tracking-[0.05em] text-[#5A5D63]">
                  {d.toLocaleString("en-GB", { month: "short" }).toUpperCase()}
                </div>
                <div className="font-display text-[40px] font-bold leading-none text-[#22242A]">{d.getDate()}</div>
              </div>
              <div className="px-[22px] py-5">
                <div className="mb-1.5 text-[16px] font-bold">{e.title}</div>
                {e.time && <div className="text-[13.5px] text-text-muted">{e.time}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function Safety({ site }: { site: SiteData }) {
  if (!site.safetyPolicies.length) return null;
  const c = site.content;
  return (
    <Section id="safety" bg="#2A2C30" className="text-white">
      <div className="mx-auto mb-12 max-w-[640px] text-center">
        <Eyebrow tone="onDark">Safety &amp; wellbeing</Eyebrow>
        <h2 className="mb-3.5 font-display text-[30px] font-semibold md:text-[38px]">
          {c?.safetyHeading ?? "Your child's safety comes first"}
        </h2>
        {c?.safetySubcopy && <p className="text-[16px] text-[#C9CCD1]">{c.safetySubcopy}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {site.safetyPolicies.map((p) => (
          <div key={p.id} className="rounded-[18px] bg-[#33353B] p-6">
            {p.icon && <div className="mb-3.5 text-2xl">{p.icon}</div>}
            <div className="mb-2 text-[15.5px] font-bold">{p.title}</div>
            {p.description && <div className="text-[13.5px] leading-[1.6] text-[#9EA2A9]">{p.description}</div>}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Staff({ site }: { site: SiteData }) {
  if (!site.staff.length) return null;
  return (
    <Section id="staff" bg="#FAF9F6">
      <div className="mx-auto mb-14 max-w-[640px] text-center">
        <Eyebrow>Our people</Eyebrow>
        <h2 className="mb-3.5 font-display text-[30px] font-semibold text-[#22242A] md:text-[38px]">Meet the staff</h2>
        <p className="text-[16px] text-[#6B6F76]">
          Experienced educators and administrators dedicated to your child&apos;s growth.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {site.staff.slice(0, 8).map((s) => (
          <div key={s.id} className="rounded-[20px] border border-border-alt bg-white p-6 text-center">
            <ImageSlot label="Photo" className="!mx-auto !mb-4 !h-24 !w-24 !rounded-full !text-[10px]" url={s.photoUrl} />
            <div className="mb-1 text-[16px] font-bold">{s.name}</div>
            {s.title && <div className="text-[13px] font-semibold text-brand-link">{s.title}</div>}
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Asymmetric bento grid from the prototype — first tile spans 2×2, last spans 2 wide. */
export function Gallery({ site }: { site: SiteData }) {
  const slots = Array.from({ length: 6 }, (_, i) => site.gallery[i] ?? null);
  return (
    <Section id="gallery" bg="#fff">
      <div className="mx-auto mb-12 max-w-[640px] text-center">
        <Eyebrow>Gallery</Eyebrow>
        <h2 className="font-display text-[30px] font-semibold text-[#22242A] md:text-[38px]">Life at {site.school.name}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-[repeat(2,220px)]">
        {slots.map((img, i) => (
          <ImageSlot
            key={i}
            label="Photo"
            url={img?.url}
            className={`h-[160px] md:h-auto ${i === 0 ? "md:col-span-2 md:row-span-2" : ""} ${i === 5 ? "md:col-span-2" : ""}`}
          />
        ))}
      </div>
    </Section>
  );
}

export function ParentVoice({ site }: { site: SiteData }) {
  return (
    <Section id="voice" bg="#FAF9F6">
      <div className="grid gap-14 lg:grid-cols-2">
        <div>
          <Eyebrow>Parent Voice</Eyebrow>
          <h2 className="mb-5 font-display text-[28px] font-semibold text-[#22242A] md:text-[36px]">Tell us anything</h2>
          <p className="mb-6 max-w-[420px] text-[16px] leading-[1.7] text-[#52565C]">
            {site.content?.voiceText ??
              "A suggestion, a concern, or a word of thanks for a teacher who made a difference — Parent Voice goes straight to school leadership, and every message is reviewed."}
          </p>
          <div className="flex flex-col gap-3.5">
            {[
              { icon: "💡", title: "Suggestions", text: "ideas to improve school life" },
              { icon: "📣", title: "Complaints", text: "concerns we should address" },
              { icon: "🌟", title: "Honours", text: "commend a teacher or staff member by name" },
            ].map((r) => (
              <div key={r.title} className="flex items-start gap-3">
                <span className="text-lg">{r.icon}</span>
                <span className="text-sm text-[#52565C]">
                  <strong>{r.title}</strong> — {r.text}
                </span>
              </div>
            ))}
          </div>
        </div>
        <VoiceForm site={site} />
      </div>
    </Section>
  );
}

export function Contact({ site }: { site: SiteData }) {
  const s = site.school;
  const rows = [
    s.address && { icon: "📍", label: "Address", value: s.address },
    s.phone && { icon: "📞", label: "Phone", value: s.phone },
    s.whatsappPhone && { icon: "💬", label: "WhatsApp", value: "Chat with the office →", href: `https://wa.me/${s.whatsappPhone.replace(/\D/g, "")}` },
    s.email && { icon: "✉️", label: "Email", value: s.email },
    s.officeHours && { icon: "🕐", label: "Office Hours", value: s.officeHours },
  ].filter(Boolean) as { icon: string; label: string; value: string; href?: string }[];

  if (!rows.length) return null;

  return (
    <Section id="contact" bg="#FFF7DF">
      <div className="grid gap-14 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[#8A6200]">Get in touch</p>
          <h2 className="mb-6 font-display text-[28px] font-semibold text-[#22242A] md:text-[36px]">Visit or contact us</h2>
          <div className="flex flex-col gap-5">
            {rows.map((r) => (
              <div key={r.label} className="flex items-start gap-3.5">
                <span className="text-xl">{r.icon}</span>
                <div>
                  <div className="text-[15px] font-bold">{r.label}</div>
                  {r.href ? (
                    <a href={r.href} target="_blank" rel="noreferrer" className="text-[14.5px] font-bold text-success">
                      {r.value}
                    </a>
                  ) : (
                    <div className="text-[14.5px] text-[#6B6F76]">{r.value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <ImageSlot label="Map or location image" className="min-h-[280px] md:min-h-[340px]" />
      </div>
    </Section>
  );
}

export function Footer({ site }: { site: SiteData }) {
  return (
    <footer className="bg-dark-pill px-6 pb-7 pt-14 text-[#C9CCD1] md:px-12">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-3.5 flex items-center gap-2.5">
              {site.school.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.school.logoUrl} alt="" className="h-[34px] w-[34px] rounded-lg object-cover" />
              ) : (
                <span
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-lg font-display font-bold text-text-primary"
                  style={{ background: site.school.primaryColor }}
                >
                  {site.school.name.charAt(0)}
                </span>
              )}
              <span className="font-display text-[17px] font-semibold text-white">{site.school.name}</span>
            </div>
            {site.content?.footerBlurb && (
              <p className="max-w-[280px] text-[13.5px] leading-[1.7] text-[#9EA2A9]">{site.content.footerBlurb}</p>
            )}
          </div>
          <div>
            <div className="mb-3.5 text-sm font-bold text-white">Explore</div>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              {[
                { href: "#about", label: "About" },
                { href: "#academics", label: "Academics" },
                { href: "#admissions", label: "Admissions" },
              ].map((l) => (
                <a key={l.href} href={l.href} className="text-[#9EA2A9] hover:text-white">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3.5 text-sm font-bold text-white">More</div>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              {[
                { href: "#events", label: "Events" },
                { href: "#staff", label: "Staff" },
                { href: "#gallery", label: "Gallery" },
                { href: "#voice", label: "Parent Voice" },
              ].map((l) => (
                <a key={l.href} href={l.href} className="text-[#9EA2A9] hover:text-white">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3.5 text-sm font-bold text-white">Get the app</div>
            <p className="text-[13.5px] leading-[1.6] text-[#9EA2A9]">
              Parents &amp; staff — open the {site.school.name} app for attendance, grades &amp; fees.
            </p>
          </div>
        </div>
        <div className="border-t border-[#3F4147] pt-5 text-[12.5px] text-[#7A7E85]">
          © {new Date().getFullYear()} {site.school.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/** Fixed WhatsApp action — the primary contact channel for Ghanaian parents. */
export function WhatsAppFab({ site }: { site: SiteData }) {
  if (!site.school.whatsappPhone) return null;
  return (
    <a
      href={`https://wa.me/${site.school.whatsappPhone.replace(/\D/g, "")}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-7 right-7 z-[70] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-success text-[26px] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform hover:scale-105"
    >
      💬
    </a>
  );
}
