/**
 * Populates a school's *public website* content.
 *
 * This is deliberately separate from operational data (pupils, staff, fees, marks),
 * which always starts empty and is entered by the school itself. A marketing site
 * with no content is just broken, so the website ships with real copy that the
 * school then edits in the portal under Website.
 *
 * Usage:
 *   node scripts/seed-website.mjs --api <url> --email <admin email> --password <pw>
 *
 * Safe to re-run: it only adds sections that are missing, so it won't duplicate
 * cards if you run it twice.
 */

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .join(" ")
    .split("--")
    .filter(Boolean)
    .map((chunk) => {
      const [key, ...rest] = chunk.trim().split(/\s+/);
      return [key, rest.join(" ")];
    }),
);

const API = args.api ?? "http://localhost:4000";
const EMAIL = args.email;
const PASSWORD = args.password;

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node scripts/seed-website.mjs --api <url> --email <admin email> --password <pw>");
  process.exit(1);
}

async function call(path, method = "GET", body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${method} ${path} → ${res.status} ${detail}`);
  }
  return res.status === 204 ? null : res.json();
}

// --- The content -----------------------------------------------------------
// Copy follows the approved prototype. Anything factual the school must confirm
// (roll numbers, ratios, registration) is left for them to correct in the portal.

const CONTENT = {
  heroEyebrow: "CRÈCHE – PRIMARY · ADMISSIONS OPEN",
  heroHeadline: "A joyful place for your child to grow & learn",
  heroSubcopy:
    "Aspire Royal Academy blends warm, attentive care with strong academics — from Crèche through Primary, with JHS coming soon.",

  aboutEyebrow: "OUR STORY",
  aboutHeading: "Rooted in community, built for the future",
  aboutText:
    "Aspire Royal Academy has grown from a single classroom into a full Crèche-to-Primary campus known for nurturing curious, confident learners — with a Junior High School wing on the way.",
  aboutTextSecondary:
    "We pair a rigorous academic curriculum with strong pastoral care, so every child is seen, supported, and challenged to do their best.",
  missionText: "Nurture every child's potential through joyful, purposeful learning.",
  visionText: "Confident, well-rounded graduates ready for the world.",

  academicsHeading: "A curriculum for every stage",
  academicsSubcopy:
    "From first steps through Primary, our programme grows with your child. Junior High School — coming soon.",

  admissionsHeading: "Join our next intake",
  admissionsText:
    "Admissions are open for all levels. Our team will guide you through every step — from application to your child's first day.",

  safetyHeading: "Your child's safety comes first",
  safetySubcopy: "Clear policies our whole community follows, every single day.",

  feesNote:
    "PTA dues, sports and excursion costs are billed separately as they occur. Pay online through the Parent App, or in cash at the school office.",

  voiceText:
    "A suggestion, a concern, or a word of thanks for a teacher who made a difference — Parent Voice goes straight to school leadership, and every message is reviewed.",

  footerBlurb: "A joyful, nurturing place to learn — Crèche through Primary, JHS coming soon.",
};

const PROGRAMMES = [
  { name: "Crèche", ageRange: "6mo – 2yrs", description: "Safe, caring early-years environment with play-based routines.", icon: "🧸", tint: "#FFF0BF", order: 1 },
  { name: "Nursery & KG", ageRange: "3 – 5 yrs", description: "Foundational literacy, numeracy and social skills through play.", icon: "🎨", tint: "#EAF3EA", order: 2 },
  { name: "Primary", ageRange: "6 – 11 yrs", description: "Core subjects taught with strong reading, writing and STEM focus.", icon: "📚", tint: "#E7F0F7", order: 3 },
  { name: "JHS", ageRange: "Coming soon", description: "A Junior High School wing is in development — stay tuned for updates.", icon: "🎓", tint: "#F0F0EE", comingSoon: true, order: 4 },
];

const SAFETY = [
  { title: "Verified Pickup", description: "Only guardians on the approved pickup list, with ID, may collect a child.", icon: "🪪", order: 1 },
  { title: "On-site Nurse", description: "A qualified nurse is on campus every school day for first aid and health checks.", icon: "🏥", order: 2 },
  { title: "CCTV Monitored", description: "Entrances, playgrounds and hallways are monitored throughout the day.", icon: "🎥", order: 3 },
  { title: "Staff Vetting", description: "All staff undergo background checks before working with children.", icon: "👥", order: 4 },
];

const STEPS = [
  { title: "Submit inquiry", description: "Fill the form on this page or visit our admissions office.", order: 1 },
  { title: "Campus tour & assessment", description: "Meet our staff and tour the campus with your child.", order: 2 },
  { title: "Offer & registration", description: "Complete registration and pay the admission fee.", order: 3 },
  { title: "Welcome!", description: "Receive orientation materials and your first-day pack.", order: 4 },
];

async function main() {
  console.log(`Signing in to ${API}…`);
  const session = await call("/auth/staff/login", "POST", { email: EMAIL, password: PASSWORD });
  const token = session.token;
  console.log(`  ok — ${session.user.name}`);

  console.log("Writing page copy…");
  await call("/content", "PATCH", CONTENT, token);

  const existing = await call("/content", "GET", undefined, token);

  const sections = [
    { key: "programmes", label: "programmes", items: PROGRAMMES, existing: existing.programmes, match: (a, b) => a.name === b.name },
    { key: "safety-policies", label: "safety policies", items: SAFETY, existing: existing.safetyPolicies, match: (a, b) => a.title === b.title },
    { key: "admission-steps", label: "admission steps", items: STEPS, existing: existing.admissionSteps, match: (a, b) => a.title === b.title },
  ];

  for (const section of sections) {
    let added = 0;
    for (const item of section.items) {
      if (section.existing.some((e) => section.match(e, item))) continue;
      await call(`/content/${section.key}`, "POST", item, token);
      added++;
    }
    console.log(`  ${section.label}: ${added} added${added === 0 ? " (already present)" : ""}`);
  }

  console.log("\nDone. Remaining steps for the school:");
  console.log("  • Portal → Website → Hero: set the real pupil/teacher/years figures.");
  console.log("  • Portal → Website → Trust badges: add GES number, class size, ratio.");
  console.log("  • Portal → Website → Testimonials: add real parent quotes with permission.");
  console.log("  • Portal → Website → Events: add this term's dates.");
  console.log("  • Drop photography into apps/web/public/images/ — see its README.");
}

main().catch((err) => {
  console.error("\nFailed:", err.message);
  process.exit(1);
});
