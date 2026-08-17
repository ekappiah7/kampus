import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@kampus/db";
import type { AuthUser, Session } from "@kampus/shared-types";
import { signToken } from "../lib/auth";

export const authRouter = Router();

const parentLoginSchema = z.object({
  schoolSubdomain: z.string(),
  phone: z.string(),
  password: z.string(),
});

authRouter.post("/parent/login", async (req, res) => {
  const parsed = parentLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { schoolSubdomain, phone, password } = parsed.data;

  const school = await prisma.school.findUnique({ where: { subdomain: schoolSubdomain } });
  if (!school) return res.status(404).json({ error: "Unknown school" });

  const parent = await prisma.parent.findUnique({ where: { schoolId_phone: { schoolId: school.id, phone } } });
  if (!parent || !(await bcrypt.compare(password, parent.passwordHash))) {
    return res.status(401).json({ error: "Invalid phone or password" });
  }

  const initials = parent.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const user: AuthUser = { id: parent.id, schoolId: school.id, name: parent.name, role: "parent", initials };
  const session: Session = { token: signToken(user), user };
  res.json(session);
});

const staffLoginSchema = z.object({
  schoolSubdomain: z.string(),
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/staff/login", async (req, res) => {
  const parsed = staffLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { schoolSubdomain, email, password } = parsed.data;

  const school = await prisma.school.findUnique({ where: { subdomain: schoolSubdomain } });
  if (!school) return res.status(404).json({ error: "Unknown school" });

  const staff = await prisma.staff.findUnique({ where: { schoolId_email: { schoolId: school.id, email } } });
  if (!staff || staff.status !== "ACTIVE" || !(await bcrypt.compare(password, staff.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const initials = staff.name
    .replace(/^(Mrs|Mr|Ms)\.\s*/, "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const role = staff.role === "TEACHER" ? "teacher" : staff.role === "GATE_STAFF" ? "gate-staff" : "admin";
  const user: AuthUser = { id: staff.id, schoolId: school.id, name: staff.name, role, initials };
  const session: Session = { token: signToken(user), user };
  res.json(session);
});
