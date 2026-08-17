import { Router } from "express";
import { prisma } from "@kampus/db";

export const schoolRouter = Router();

/** Public — powers the marketing website for a given tenant subdomain. No auth: this is the public site's data source. */
schoolRouter.get("/:subdomain", async (req, res) => {
  const school = await prisma.school.findUnique({
    where: { subdomain: req.params.subdomain },
    include: {
      content: true,
      testimonials: { where: { published: true } },
      events: { where: { date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 5 },
    },
  });
  if (!school) return res.status(404).json({ error: "Unknown school" });

  const staffDirectory = await prisma.staff.findMany({
    where: { schoolId: school.id, status: "ACTIVE" },
    select: { id: true, name: true, title: true },
  });

  const feeSchedule = await prisma.feeLineItem.findMany({
    where: { schoolId: school.id },
    include: { class: true },
    orderBy: { class: { order: "asc" } },
  });

  res.json({
    id: school.id,
    name: school.name,
    subdomain: school.subdomain,
    primaryColor: school.primaryColor,
    logoUrl: school.logoUrl,
    whatsappPhone: school.whatsappPhone,
    accreditation: school.accreditation,
    content: school.content,
    testimonials: school.testimonials,
    events: school.events,
    staffDirectory,
    feeSchedule: feeSchedule.map((f) => ({ label: f.label, amount: f.amount, className: f.class?.name ?? "All levels" })),
  });
});

export const cafeteriaRouter = Router();
cafeteriaRouter.get("/:subdomain", async (req, res) => {
  const school = await prisma.school.findUnique({ where: { subdomain: req.params.subdomain } });
  if (!school) return res.status(404).json({ error: "Unknown school" });
  const menu = await prisma.cafeteriaMenuItem.findMany({ where: { schoolId: school.id } });
  res.json(menu);
});
