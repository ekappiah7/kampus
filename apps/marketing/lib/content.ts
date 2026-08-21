/**
 * Everything the marketing site claims about Kampus, in one file.
 *
 * Keeping it here rather than scattered through JSX matters for one reason: every
 * claim on a sales site is a promise someone will be held to. When a feature slips,
 * or ships, there is exactly one place to correct — and the `status` field below
 * makes the difference between "you can do this today" and "we are building this"
 * a property of the data rather than a turn of phrase someone forgot to update.
 *
 * `shipped`  — working now, on the live demo, safe to show a prospect.
 * `building` — real work underway; say "coming", never imply it exists.
 * `planned`  — on the roadmap, no code yet. Say so plainly if asked.
 */

export type Status = "shipped" | "building" | "planned";

export const STATUS_LABEL: Record<Status, string> = {
  shipped: "Working today",
  building: "In build",
  planned: "Planned",
};

export const PRODUCT = {
  name: "Kampus",
  tagline: "One place to run the whole school",
  vendor: "JAKBRAIN Consult",
  contact: {
    /** International format, digits only — what wa.me expects. */
    whatsapp: "233547731077",
    phoneDisplay: "054 773 1077",
    /** PLACEHOLDER — see apps/marketing/README.md. */
    email: "hello@example.com",
  },
  demo: {
    portal: "https://akampuz-staff-portal.web.app",
    parent: "https://akampuz-parent.web.app",
    website: "https://akampuz-web.web.app",
  },
};

// ---------------------------------------------------------------------------
// The pitch
// ---------------------------------------------------------------------------

export const HERO = {
  eyebrow: "FOR GHANAIAN BASIC SCHOOLS",
  headline: "Run the whole school from one place.",
  subcopy:
    "Fees, marks, attendance, report cards, parent messages and your public website — one system, built around how a Ghanaian basic school actually works.",
};

/** Four claims, each one specific enough to be checked. Vague ones don't sell. */
export const PROOF = [
  { label: "Crèche to JHS", detail: "Terms, not semesters. GES report format." },
  { label: "No app store", detail: "Parents open a link. It installs to their phone." },
  { label: "Works offline", detail: "Teachers mark in Excel and upload later." },
  { label: "Every cedi traced", detail: "Nothing is edited. Nothing disappears." },
];

/**
 * The problem section. Written from what actually happens in these schools, not
 * from a generic "digital transformation" script — a proprietor recognises their
 * own Monday morning here or they stop reading.
 */
export const PROBLEM = {
  heading: "You already have a system. It just lives in six places.",
  items: [
    { icon: "📓", text: "The fee register is a hardback book, and only the bursar can read it." },
    { icon: "💬", text: "Announcements go out on WhatsApp and half the parents never see them." },
    { icon: "📊", text: "Marks live in a spreadsheet on one teacher's laptop." },
    { icon: "🧮", text: "Terminal reports take three evenings and a calculator." },
    { icon: "🚸", text: "Anyone who turns up at closing can collect a child if they look familiar." },
    { icon: "🌍", text: "New parents can't find you online, so they enrol somewhere they can." },
  ],
  close:
    "None of that is disorganisation. It's what happens when a school grows past what paper can hold. Kampus is the same work, in one place, where everyone can see it.",
};

// ---------------------------------------------------------------------------
// The four surfaces
// ---------------------------------------------------------------------------

export interface Surface {
  key: string;
  name: string;
  who: string;
  blurb: string;
  points: string[];
  tint: string;
}

export const SURFACES: Surface[] = [
  {
    key: "portal",
    name: "Staff Portal",
    who: "Head, bursar, teachers",
    blurb: "The engine room. Everything the school records happens here.",
    points: [
      "Pupil and staff register, with access codes instead of shared passwords",
      "Fee items, billing, scholarships, discounts and cash confirmation",
      "Daily attendance and continuous assessment",
      "Report cards in GES format, ready to print",
      "An audit log of who changed what",
    ],
    tint: "#FFF0BF",
  },
  {
    key: "parent",
    name: "Parent App",
    who: "Parents and guardians",
    blurb: "On the phone, from a link — no app store, no download, no storage complaints.",
    points: [
      "The bill, itemised, and what's still owing",
      "Pay by mobile money or get a reference for cash at the office",
      "Marks, attendance and the term's report card",
      "Homework and announcements",
      "A pickup code, so only the right person collects the child",
      "Parent Voice — straight to school leadership",
    ],
    tint: "#E7F0F7",
  },
  {
    key: "website",
    name: "School Website",
    who: "Parents who haven't enrolled yet",
    blurb: "A public site that brings you new admissions, not a brochure nobody visits.",
    points: [
      "Programmes, fees, safety policy and admissions steps",
      "An enquiry form that lands in the portal as a lead",
      "Edited by the school in the portal — no developer, no invoice",
      "Photos, staff, gallery and events",
    ],
    tint: "#E9F7EE",
  },
  {
    key: "gate",
    name: "Pickup Desk",
    who: "Gate staff",
    blurb: "The one screen that stops the wrong adult leaving with a child.",
    points: [
      "Parent raises a pickup notice with a code",
      "Gate confirms the code before the child is released",
      "Every collection is timestamped and recorded",
    ],
    tint: "#F7EAF0",
  },
];

// ---------------------------------------------------------------------------
// Capability table — the honest inventory
// ---------------------------------------------------------------------------

export interface Capability {
  group: string;
  name: string;
  detail: string;
  status: Status;
}

export const CAPABILITIES: Capability[] = [
  // Money
  { group: "Fees & money", name: "Fee items and class billing", detail: "Raise a charge once, bill it to a whole class or the whole school.", status: "shipped" },
  { group: "Fees & money", name: "Scholarships and discounts", detail: "Per-item or off the total bill, spread proportionally across lines.", status: "shipped" },
  { group: "Fees & money", name: "Cash at the office", detail: "Parent gets a reference; the office confirms it; the balance moves only then.", status: "shipped" },
  { group: "Fees & money", name: "Dropping a fee after billing", detail: "Withdraw for a class or waive for one pupil. Charges reverse; overpayment becomes credit.", status: "shipped" },
  { group: "Fees & money", name: "Append-only ledger", detail: "Nothing is edited or deleted. Every balance can be explained line by line.", status: "shipped" },
  { group: "Fees & money", name: "Mobile money and card", detail: "The flow is built and demonstrable; connecting a live payment gateway is the current work.", status: "building" },
  { group: "Fees & money", name: "Automatic fee reminders", detail: "Scheduled nudges to parents carrying a balance.", status: "planned" },

  // Academics
  { group: "Academics", name: "Continuous assessment", detail: "Weighted components — classwork, quizzes, projects, exams — rolling up to a final grade.", status: "shipped" },
  { group: "Academics", name: "Excel mark sheets", detail: "Download the class grid, fill it in offline, upload it back. Nothing saves until you've seen what changes.", status: "shipped" },
  { group: "Academics", name: "Class broadsheet", detail: "Every subject against every pupil, with averages and positions.", status: "shipped" },
  { group: "Academics", name: "GES report cards", detail: "Position in class, grade bands, teacher and head remarks. Print or save as PDF.", status: "shipped" },
  { group: "Academics", name: "Daily attendance", detail: "Marked per class per day, visible to parents the same day.", status: "shipped" },
  { group: "Academics", name: "Homework and announcements", detail: "Teachers post; an administrator approves before parents see it.", status: "shipped" },
  { group: "Academics", name: "Pupil register import", detail: "Bring 600 pupils in from the spreadsheet you already have.", status: "building" },
  { group: "Academics", name: "End-of-year rollover", detail: "Promote a whole class and carry arrears into the new year.", status: "planned" },

  // Communication
  { group: "Communication", name: "Parent messaging", detail: "Threads between parents and staff, inside the app.", status: "shipped" },
  { group: "Communication", name: "Parent Voice", detail: "Suggestions and concerns straight to leadership, with an inbox that tracks replies.", status: "shipped" },
  { group: "Communication", name: "Pickup codes", detail: "A code the gate checks before releasing a child.", status: "shipped" },
  { group: "Communication", name: "SMS", detail: "For the parents who will never install anything. The next thing we build.", status: "building" },
  { group: "Communication", name: "Push notifications", detail: "Alerts on the phone rather than only inside the app.", status: "planned" },

  // Running the school
  { group: "Running the school", name: "Access codes, not shared passwords", detail: "Staff and parents redeem a single-use code and set their own password.", status: "shipped" },
  { group: "Running the school", name: "Audit log", detail: "Who changed what, when, and why — including every fee reversal.", status: "shipped" },
  { group: "Running the school", name: "Public school website", detail: "Yours, editable from the portal, with an enquiry form that feeds admissions.", status: "shipped" },
  { group: "Running the school", name: "Admissions enquiries", detail: "Website leads land in the portal and can be worked through to enrolment.", status: "shipped" },
  { group: "Running the school", name: "QR attendance", detail: "Scan a pupil's card at the door instead of calling a register.", status: "planned" },
  { group: "Running the school", name: "Photo and document uploads", detail: "Crest, staff photos and gallery images uploaded rather than linked.", status: "building" },
  { group: "Running the school", name: "Multiple campuses", detail: "One login across branches, with figures rolled up for the proprietor.", status: "planned" },
];

export const CAPABILITY_GROUPS = ["Fees & money", "Academics", "Communication", "Running the school"];

// ---------------------------------------------------------------------------
// Why us
// ---------------------------------------------------------------------------

export const DIFFERENTIATORS = [
  {
    title: "Built for how the money actually moves",
    body: "Most of your fees arrive as cash at the office, so cash is a first-class path, not an afterthought — the parent gets a reference, the office confirms it, and only then does a balance change. Nothing in the ledger is ever edited or deleted. If a fee has to be dropped after billing, the charge is reversed beside the original, with the reason attached. A year later, every cedi still has an explanation.",
    icon: "🧾",
  },
  {
    title: "Teachers keep working the way they work",
    body: "Marks get done at home, often with no internet, usually in Excel. So the portal hands the teacher their own class as a spreadsheet — pupils listed, columns set, each cell validated against its own maximum. They fill it in offline and upload it back, and the system shows exactly what would change before anything is saved.",
    icon: "📗",
  },
  {
    title: "Parents don't have to install anything",
    body: "Ask a parent to find your school in an app store and you lose most of them. Kampus opens from a link and, if they want, installs to the home screen from the browser — no store, no download, no argument about phone storage.",
    icon: "📱",
  },
  {
    title: "Your public website is part of it",
    body: "New parents look you up before they visit. A school management system that leaves you invisible online has solved the wrong half of the problem. Your site comes with the platform, and the school edits it from the same portal it uses for everything else.",
    icon: "🌍",
  },
];

// ---------------------------------------------------------------------------
// Pricing — structure only; the school-facing numbers are the vendor's to set
// ---------------------------------------------------------------------------

export const PRICING = {
  note: "Priced per pupil, per term — so it scales with the school rather than landing as one bill in September.",
  tiers: [
    { name: "Starter", forWho: "Up to 150 pupils", price: null, features: ["Staff Portal", "Parent App", "School website", "Setup and training included"] },
    { name: "Standard", forWho: "150 – 500 pupils", price: null, features: ["Everything in Starter", "Pickup desk", "Priority support", "Termly review"], featured: true },
    { name: "Group", forWho: "500+ pupils, or multiple campuses", price: null, features: ["Everything in Standard", "Multiple campuses", "Named account manager", "Custom reports"] },
  ],
};

export const FAQ = [
  {
    q: "What happens when the internet goes down?",
    a: "Teachers can download their mark sheets and work offline, then upload when they're back. Cash payments never needed the internet in the first place — the office confirms them. What does need a connection is the portal itself, so a school on very poor internet should plan for a phone hotspot at the office.",
  },
  {
    q: "Who owns the data?",
    a: "The school does. It is your pupils, your fees and your marks, and you can have an export of all of it whenever you ask. We hold it on your behalf; we don't sell it and we don't share it.",
  },
  {
    q: "Do parents have to be good with phones?",
    a: "They need to be able to open a link someone sends them. That's it. There is no app store account, no download, and no password to invent — the school issues a one-time code and the parent chooses their own password.",
  },
  {
    q: "We already have everything in Excel. Do we start again?",
    a: "No. Marks come straight in from a spreadsheet today, and bringing across a full pupil register is the import we're building now. Until it lands, we do that part with you during setup rather than handing you a blank system.",
  },
  {
    q: "How long does setting up take?",
    a: "A school can be running in a day: create the term, the classes and the subjects, add staff, add pupils, set your fee items. The longer part is gathering photos and copy for the public website, which the school can do at its own pace — the site works with them missing.",
  },
  {
    q: "What does it cost to change our minds?",
    a: "Nothing you can't undo. You get your data out on request, in a format you can open. We would rather you stayed because it works than because leaving is painful.",
  },
];
