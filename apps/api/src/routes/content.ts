import { Router } from "express";
import { z } from "zod";
import { prisma } from "@kampus/db";
import { requireAuth, requireRole } from "../middleware/auth";

export const contentRouter = Router();
contentRouter.use(requireAuth, requireRole("admin"));

/** Everything the admin can edit about the public site, in one payload. */
contentRouter.get("/", async (req, res) => {
  const schoolId = req.auth!.schoolId;
  const [school, programmes, safetyPolicies, trustBadges, admissionSteps, testimonials, events, cafeteria, gallery] =
    await Promise.all([
      prisma.school.findUnique({ where: { id: schoolId }, include: { content: true } }),
      prisma.programme.findMany({ where: { schoolId }, orderBy: { order: "asc" } }),
      prisma.safetyPolicy.findMany({ where: { schoolId }, orderBy: { order: "asc" } }),
      prisma.trustBadge.findMany({ where: { schoolId }, orderBy: { order: "asc" } }),
      prisma.admissionStep.findMany({ where: { schoolId }, orderBy: { order: "asc" } }),
      prisma.testimonial.findMany({ where: { schoolId } }),
      prisma.event.findMany({ where: { schoolId }, orderBy: { date: "asc" } }),
      prisma.cafeteriaMenuItem.findMany({ where: { schoolId } }),
      prisma.galleryImage.findMany({ where: { schoolId }, orderBy: { order: "asc" } }),
    ]);
  if (!school) return res.status(404).json({ error: "School not found" });

  res.json({ school, content: school.content, programmes, safetyPolicies, trustBadges, admissionSteps, testimonials, events, cafeteria, gallery });
});

const schoolSchema = z.object({
  name: z.string().min(2).optional(),
  shortName: z.string().optional(),
  primaryColor: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  phone: z.string().optional(),
  email: z.string().optional(),
  whatsappPhone: z.string().optional(),
  address: z.string().optional(),
  officeHours: z.string().optional(),
  accreditation: z.string().optional(),
  gesRegNo: z.string().optional(),
});

contentRouter.patch("/school", async (req, res) => {
  const parsed = schoolSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.school.update({ where: { id: req.auth!.schoolId }, data: parsed.data });
  res.json(updated);
});

const contentSchema = z.object({
  heroEyebrow: z.string().optional(),
  heroHeadline: z.string().optional(),
  heroSubcopy: z.string().optional(),
  aboutEyebrow: z.string().optional(),
  aboutHeading: z.string().optional(),
  aboutText: z.string().optional(),
  aboutTextSecondary: z.string().optional(),
  missionText: z.string().optional(),
  visionText: z.string().optional(),
  academicsHeading: z.string().optional(),
  academicsSubcopy: z.string().optional(),
  admissionsHeading: z.string().optional(),
  admissionsText: z.string().optional(),
  safetyHeading: z.string().optional(),
  safetySubcopy: z.string().optional(),
  feesNote: z.string().optional(),
  voiceText: z.string().optional(),
  footerBlurb: z.string().optional(),
  statsStudents: z.number().int().nonnegative().optional(),
  statsTeachers: z.number().int().nonnegative().optional(),
  statsYears: z.number().int().nonnegative().optional(),
  teacherRatio: z.string().optional(),
  maxClassSize: z.string().optional(),
});

contentRouter.patch("/", async (req, res) => {
  const parsed = contentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const updated = await prisma.schoolContent.upsert({
    where: { schoolId },
    update: parsed.data,
    create: { schoolId, ...parsed.data },
  });
  res.json(updated);
});

/**
 * Repeated website sections (programmes, policies, badges, steps, testimonials,
 * events, menu) all follow the same shape, so one generic handler pair covers
 * them instead of eight near-identical routes.
 */
const collections = {
  programmes: {
    schema: z.object({
      name: z.string().min(1),
      ageRange: z.string().optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      tint: z.string().optional(),
      comingSoon: z.boolean().optional(),
      order: z.number().int().optional(),
    }),
    model: () => prisma.programme,
  },
  "safety-policies": {
    schema: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
      order: z.number().int().optional(),
    }),
    model: () => prisma.safetyPolicy,
  },
  "trust-badges": {
    schema: z.object({ label: z.string().min(1), icon: z.string().optional(), order: z.number().int().optional() }),
    model: () => prisma.trustBadge,
  },
  "admission-steps": {
    schema: z.object({ title: z.string().min(1), description: z.string().optional(), order: z.number().int().optional() }),
    model: () => prisma.admissionStep,
  },
  testimonials: {
    schema: z.object({
      authorName: z.string().min(1),
      relation: z.string().optional(),
      quote: z.string().min(1),
      photoUrl: z.string().optional(),
      published: z.boolean().optional(),
    }),
    model: () => prisma.testimonial,
  },
  gallery: {
    schema: z.object({ url: z.string().min(1), caption: z.string().optional(), order: z.number().int().optional() }),
    model: () => prisma.galleryImage,
  },
} as const;

type CollectionKey = keyof typeof collections;

function collectionFor(key: string) {
  return (collections as Record<string, (typeof collections)[CollectionKey] | undefined>)[key];
}

contentRouter.post("/:collection", async (req, res) => {
  const spec = collectionFor(req.params.collection);
  if (!spec) return res.status(404).json({ error: "Unknown section" });
  const parsed = spec.schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const created = await (spec.model() as any).create({ data: { schoolId: req.auth!.schoolId, ...parsed.data } });
  res.status(201).json(created);
});

contentRouter.patch("/:collection/:id", async (req, res) => {
  const spec = collectionFor(req.params.collection);
  if (!spec) return res.status(404).json({ error: "Unknown section" });
  const parsed = spec.schema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const model = spec.model() as any;
  const existing = await model.findFirst({ where: { id: req.params.id, schoolId: req.auth!.schoolId } });
  if (!existing) return res.status(404).json({ error: "Item not found" });
  res.json(await model.update({ where: { id: req.params.id }, data: parsed.data }));
});

contentRouter.delete("/:collection/:id", async (req, res) => {
  const spec = collectionFor(req.params.collection);
  if (!spec) return res.status(404).json({ error: "Unknown section" });
  const model = spec.model() as any;
  const existing = await model.findFirst({ where: { id: req.params.id, schoolId: req.auth!.schoolId } });
  if (!existing) return res.status(404).json({ error: "Item not found" });
  await model.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Events and cafeteria have date/day fields, so they get their own handlers.

const eventSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  time: z.string().optional(),
  location: z.string().optional(),
});

contentRouter.post("/events", async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.event.create({
    data: { schoolId: req.auth!.schoolId, ...parsed.data, date: new Date(parsed.data.date) },
  });
  res.status(201).json(created);
});

contentRouter.delete("/events/:id", async (req, res) => {
  const event = await prisma.event.findFirst({ where: { id: req.params.id, schoolId: req.auth!.schoolId } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  await prisma.event.delete({ where: { id: event.id } });
  res.json({ ok: true });
});

const menuSchema = z.object({
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]),
  main: z.string().min(1),
  side: z.string().optional(),
});

contentRouter.put("/cafeteria", async (req, res) => {
  const parsed = menuSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const schoolId = req.auth!.schoolId;
  const saved = await prisma.cafeteriaMenuItem.upsert({
    where: { schoolId_dayOfWeek: { schoolId, dayOfWeek: parsed.data.dayOfWeek } },
    update: { main: parsed.data.main, side: parsed.data.side },
    create: { schoolId, ...parsed.data },
  });
  res.json(saved);
});
