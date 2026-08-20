import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@kampus/db";
import type { AuthUser, Session } from "@kampus/shared-types";
import { signToken } from "../lib/auth";
import { initialsOf } from "../lib/codes";

export const setupRouter = Router();

/** Whether any school exists yet — drives the portal's first-run redirect. */
setupRouter.get("/status", async (_req, res) => {
  const count = await prisma.school.count();
  res.json({ initialised: count > 0 });
});

const setupSchema = z.object({
  school: z.object({
    name: z.string().min(2),
    shortName: z.string().optional(),
    subdomain: z
      .string()
      .min(2)
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
    primaryColor: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    whatsappPhone: z.string().optional(),
    address: z.string().optional(),
    officeHours: z.string().optional(),
    accreditation: z.string().optional(),
    gesRegNo: z.string().optional(),
  }),
  admin: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    title: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(8, "Use at least 8 characters"),
  }),
});

/**
 * First-run bootstrap: creates the school and its head-administrator account.
 *
 * Guarded by "no schools exist yet" rather than by auth, because there is nobody to
 * authenticate as before it runs. Once one school exists this endpoint is closed and
 * further schools are added by an authenticated admin (multi-tenant onboarding).
 */
setupRouter.post("/", async (req, res) => {
  const existing = await prisma.school.count();
  if (existing > 0) {
    return res.status(409).json({ error: "Already initialised. Sign in instead." });
  }

  const parsed = setupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { school, admin } = parsed.data;

  const created = await prisma.school.create({
    data: {
      name: school.name,
      shortName: school.shortName || school.name,
      subdomain: school.subdomain,
      primaryColor: school.primaryColor || "#FFC629",
      phone: school.phone,
      email: school.email || null,
      whatsappPhone: school.whatsappPhone,
      address: school.address,
      officeHours: school.officeHours,
      accreditation: school.accreditation,
      gesRegNo: school.gesRegNo,
      content: { create: {} },
      staff: {
        create: {
          name: admin.name,
          email: admin.email,
          title: admin.title || "Head Teacher & Administrator",
          phone: admin.phone,
          role: "ADMIN",
          passwordHash: await bcrypt.hash(admin.password, 10),
          mustSetPassword: false,
        },
      },
    },
    include: { staff: true },
  });

  const staff = created.staff[0]!;
  const user: AuthUser = {
    id: staff.id,
    schoolId: created.id,
    name: staff.name,
    role: "admin",
    initials: initialsOf(staff.name),
  };
  const session: Session = { token: signToken(user), user };
  res.status(201).json({ ...session, school: { id: created.id, name: created.name, subdomain: created.subdomain } });
});
