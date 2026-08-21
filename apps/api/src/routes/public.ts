import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "@kampus/db";

export const publicRouter = Router();

/** Resolves the tenant by subdomain, or the only school when there's just one. */
async function resolveSchool(subdomain?: string) {
  if (subdomain && subdomain !== "default") return prisma.school.findUnique({ where: { subdomain } });
  const count = await prisma.school.count();
  if (count === 1) return prisma.school.findFirst();
  return null;
}

/**
 * Everything the marketing site renders, in one request. Public and unauthenticated
 * by design — this is the school's shop window.
 */
publicRouter.get("/site/:subdomain?", async (req, res) => {
  const school = await resolveSchool(req.params.subdomain);
  if (!school) return res.status(404).json({ error: "School not found" });

  const [content, programmes, safetyPolicies, trustBadges, admissionSteps, testimonials, events, staff, feeItems, classes, gallery] =
    await Promise.all([
      prisma.schoolContent.findUnique({ where: { schoolId: school.id } }),
      prisma.programme.findMany({ where: { schoolId: school.id }, orderBy: { order: "asc" } }),
      prisma.safetyPolicy.findMany({ where: { schoolId: school.id }, orderBy: { order: "asc" } }),
      prisma.trustBadge.findMany({ where: { schoolId: school.id }, orderBy: { order: "asc" } }),
      prisma.admissionStep.findMany({ where: { schoolId: school.id }, orderBy: { order: "asc" } }),
      prisma.testimonial.findMany({ where: { schoolId: school.id, published: true } }),
      prisma.event.findMany({
        where: { schoolId: school.id, date: { gte: startOfToday() } },
        orderBy: { date: "asc" },
        take: 6,
      }),
      prisma.staff.findMany({
        where: { schoolId: school.id, status: "ACTIVE" },
        select: { id: true, name: true, title: true, role: true, photoUrl: true },
        orderBy: { name: "asc" },
      }),
      prisma.feeLineItem.findMany({ where: { schoolId: school.id }, include: { class: true } }),
      prisma.class.findMany({ where: { schoolId: school.id }, orderBy: { order: "asc" } }),
      prisma.galleryImage.findMany({ where: { schoolId: school.id }, orderBy: { order: "asc" } }),
    ]);

  // Fee schedule is presented per class as tuition/feeding columns, matching the
  // published table design; anything else is listed as an additional charge.
  const byClass = new Map<string, { className: string; order: number; tuition: number | null; feeding: number | null }>();
  const otherItems: { label: string; amount: number; className: string }[] = [];
  for (const item of feeItems) {
    const label = item.label.toLowerCase();
    const key = item.classId ?? "all";
    const className = item.class?.name ?? "All levels";
    const order = item.class?.order ?? 999;
    if (label.includes("tuition") || label.includes("feeding")) {
      const row = byClass.get(key) ?? { className, order, tuition: null, feeding: null };
      if (label.includes("tuition")) row.tuition = item.amount;
      else row.feeding = item.amount;
      byClass.set(key, row);
    } else {
      otherItems.push({ label: item.label, amount: item.amount, className });
    }
  }

  res.json({
    school: {
      id: school.id,
      name: school.name,
      subdomain: school.subdomain,
      primaryColor: school.primaryColor,
      logoUrl: school.logoUrl,
      phone: school.phone,
      email: school.email,
      whatsappPhone: school.whatsappPhone,
      address: school.address,
      officeHours: school.officeHours,
      accreditation: school.accreditation,
      gesRegNo: school.gesRegNo,
    },
    content,
    programmes,
    safetyPolicies,
    trustBadges,
    admissionSteps,
    testimonials,
    events: events.map((e) => ({ id: e.id, title: e.title, date: e.date.toISOString(), time: e.time })),
    staff,
    classes: classes.map((c) => ({ id: c.id, name: c.name })),
    feeSchedule: Array.from(byClass.values()).sort((a, b) => a.order - b.order),
    otherFees: otherItems,
    gallery,
  });
});

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const inquirySchema = z.object({
  schoolSubdomain: z.string().optional(),
  parentName: z.string().min(2, "Please enter your name"),
  phone: z.string().min(6, "Please enter a reachable phone number"),
  childAge: z.string().optional(),
  interestedLevel: z.string().optional(),
  message: z.string().optional(),
});

/** "Request Information" form on the website — the school's lead capture. */
publicRouter.post("/inquiries", async (req, res) => {
  const parsed = inquirySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { schoolSubdomain, ...data } = parsed.data;

  const school = await resolveSchool(schoolSubdomain);
  if (!school) return res.status(404).json({ error: "School not found" });

  await prisma.admissionInquiry.create({ data: { schoolId: school.id, ...data } });
  res.status(201).json({ ok: true });
});

const publicVoiceSchema = z.object({
  schoolSubdomain: z.string().optional(),
  category: z.enum(["SUGGESTION", "COMPLAINT", "HONOUR_A_TEACHER", "GENERAL"]),
  authorName: z.string().min(2, "Please enter your name"),
  aboutStaffName: z.string().optional(),
  message: z.string().min(4, "Please write a short message"),
});

/**
 * Parent Voice from the public website. Enrolled parents submit through the app
 * (which attaches their identity); this accepts submissions from anyone, so the
 * author is recorded as free text and matched to a parent record only if the
 * name happens to line up — the admin inbox shows both cases the same way.
 */
publicRouter.post("/voice", async (req, res) => {
  const parsed = publicVoiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { schoolSubdomain, authorName, ...data } = parsed.data;

  const school = await resolveSchool(schoolSubdomain);
  if (!school) return res.status(404).json({ error: "School not found" });

  const match = await prisma.parent.findFirst({
    where: { schoolId: school.id, name: { equals: authorName.trim(), mode: "insensitive" } },
  });

  await prisma.parentVoiceSubmission.create({
    data: {
      schoolId: school.id,
      parentId: match?.id ?? undefined,
      authorName: authorName.trim(),
      category: data.category,
      aboutStaffName: data.aboutStaffName,
      message: data.message,
    },
  });
  res.status(201).json({ ok: true });
});

publicRouter.get("/cafeteria/:subdomain?", async (req, res) => {
  const school = await resolveSchool(req.params.subdomain);
  if (!school) return res.status(404).json({ error: "School not found" });
  const menu = await prisma.cafeteriaMenuItem.findMany({ where: { schoolId: school.id } });
  res.json(menu);
});

// ---------------------------------------------------------------------------
// Vendor-level: enquiries from the Kampus product site
// ---------------------------------------------------------------------------

const productLeadSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(80),
  schoolName: z.string().min(1).max(160),
  phone: z.string().min(6).max(40),
  email: z.string().email().max(160).optional().or(z.literal("")),
  size: z.string().max(40).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(80).optional(),
});

/**
 * A school asking about Kampus itself.
 *
 * Unauthenticated and unscoped — the school making the enquiry isn't a tenant yet.
 * Kept deliberately dumb: store it and return, because a sales form that fails is a
 * lost customer, and the site offers WhatsApp beside it for exactly that reason.
 */
publicRouter.post("/product-lead", async (req, res) => {
  const parsed = productLeadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the form and try again." });

  const { email, ...rest } = parsed.data;
  await prisma.productLead.create({ data: { ...rest, email: email || null } });
  res.status(201).json({ ok: true });
});

/**
 * Everything below is guarded by a vendor key rather than tenant auth.
 *
 * These are the vendor's own sales enquiries. Putting them behind school admin auth
 * would mean any school's administrator could read every other school's enquiry, so
 * they get a separate key held only by the vendor. With no key configured the
 * endpoints stay shut rather than falling open.
 */
function requireVendorKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.VENDOR_KEY;
  if (!expected) return res.status(404).json({ error: "Not found" });
  if (req.header("x-vendor-key") !== expected) return res.status(401).json({ error: "Unauthorised" });
  next();
}

publicRouter.get("/product-leads", requireVendorKey, async (_req, res) => {
  const leads = await prisma.productLead.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  res.json(leads);
});

/** Marks an enquiry dealt with, so the list shows what still needs a call. */
publicRouter.patch("/product-leads/:id", requireVendorKey, async (req, res) => {
  const handled = typeof req.body?.handled === "boolean" ? req.body.handled : true;
  const lead = await prisma.productLead.findUnique({ where: { id: req.params.id } });
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  await prisma.productLead.update({ where: { id: lead.id }, data: { handled } });
  res.json({ ok: true, handled });
});

/** For spam and test entries. Real enquiries are better marked handled than deleted. */
publicRouter.delete("/product-leads/:id", requireVendorKey, async (req, res) => {
  const lead = await prisma.productLead.findUnique({ where: { id: req.params.id } });
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  await prisma.productLead.delete({ where: { id: lead.id } });
  res.json({ ok: true });
});
