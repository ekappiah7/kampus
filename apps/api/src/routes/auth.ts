import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@kampus/db";
import type { AuthUser, Role, Session } from "@kampus/shared-types";
import { signToken } from "../lib/auth";
import { requireAuth } from "../middleware/auth";
import { initialsOf } from "../lib/codes";

export const authRouter = Router();

function staffRole(role: "TEACHER" | "ADMIN" | "GATE_STAFF"): Role {
  return role === "TEACHER" ? "teacher" : role === "GATE_STAFF" ? "gate-staff" : "admin";
}

/**
 * Tenant resolution: with a single school (the common case, and every demo) the
 * subdomain is optional — we resolve to the only school. Multi-tenant deployments
 * pass it explicitly.
 */
async function resolveSchool(subdomain?: string) {
  if (subdomain) return prisma.school.findUnique({ where: { subdomain } });
  const count = await prisma.school.count();
  if (count === 1) return prisma.school.findFirst();
  return null;
}

const staffLoginSchema = z.object({
  schoolSubdomain: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/staff/login", async (req, res) => {
  const parsed = staffLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { schoolSubdomain, email, password } = parsed.data;

  const school = await resolveSchool(schoolSubdomain);
  if (!school) return res.status(404).json({ error: "School not found" });

  const staff = await prisma.staff.findUnique({
    where: { schoolId_email: { schoolId: school.id, email: email.toLowerCase().trim() } },
  });
  // Uniform error text: never reveal whether the address exists.
  const invalid = { error: "Invalid email or password" };
  if (!staff || !staff.passwordHash) return res.status(401).json(invalid);
  if (staff.status !== "ACTIVE") return res.status(403).json({ error: "This account is not active. Contact your administrator." });
  if (!(await bcrypt.compare(password, staff.passwordHash))) return res.status(401).json(invalid);

  const user: AuthUser = {
    id: staff.id,
    schoolId: school.id,
    name: staff.name,
    role: staffRole(staff.role),
    initials: initialsOf(staff.name),
  };
  const session: Session = { token: signToken(user), user };
  res.json(session);
});

const parentLoginSchema = z.object({
  schoolSubdomain: z.string().optional(),
  phone: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post("/parent/login", async (req, res) => {
  const parsed = parentLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { schoolSubdomain, phone, password } = parsed.data;

  const school = await resolveSchool(schoolSubdomain);
  if (!school) return res.status(404).json({ error: "School not found" });

  const parent = await prisma.parent.findUnique({
    where: { schoolId_phone: { schoolId: school.id, phone: normalisePhone(phone) } },
  });
  const invalid = { error: "Invalid phone number or password" };
  if (!parent || !parent.passwordHash) return res.status(401).json(invalid);
  if (!(await bcrypt.compare(password, parent.passwordHash))) return res.status(401).json(invalid);

  const user: AuthUser = {
    id: parent.id,
    schoolId: school.id,
    name: parent.name,
    role: "parent",
    initials: initialsOf(parent.name),
  };
  const session: Session = { token: signToken(user), user };
  res.json(session);
});

/**
 * Access-code redemption. Admin issues a code when creating a teacher or parent;
 * the holder redeems it once to choose their own password. Codes are single-use —
 * cleared on success — so a screenshot of a handed-out code stops working the
 * moment it's used.
 */
const redeemSchema = z.object({
  code: z.string().min(4),
  password: z.string().min(8, "Use at least 8 characters"),
});

authRouter.post("/redeem", async (req, res) => {
  const parsed = redeemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const code = parsed.data.code.toUpperCase().trim();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const staff = await prisma.staff.findUnique({ where: { accessCode: code } });
  if (staff) {
    const updated = await prisma.staff.update({
      where: { id: staff.id },
      data: { passwordHash, accessCode: null, mustSetPassword: false },
    });
    const user: AuthUser = {
      id: updated.id,
      schoolId: updated.schoolId,
      name: updated.name,
      role: staffRole(updated.role),
      initials: initialsOf(updated.name),
    };
    return res.json({ token: signToken(user), user, audience: "staff" });
  }

  const parent = await prisma.parent.findUnique({ where: { accessCode: code } });
  if (parent) {
    const updated = await prisma.parent.update({
      where: { id: parent.id },
      data: { passwordHash, accessCode: null, mustSetPassword: false },
    });
    const user: AuthUser = {
      id: updated.id,
      schoolId: updated.schoolId,
      name: updated.name,
      role: "parent",
      initials: initialsOf(updated.name),
    };
    return res.json({ token: signToken(user), user, audience: "parent" });
  }

  res.status(404).json({ error: "That access code is not valid or has already been used." });
});

/** Lets a code holder confirm who they are before committing to a password. */
authRouter.get("/redeem/:code", async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const [staff, parent] = await Promise.all([
    prisma.staff.findUnique({ where: { accessCode: code }, include: { school: true } }),
    prisma.parent.findUnique({ where: { accessCode: code }, include: { school: true } }),
  ]);
  const found = staff ?? parent;
  if (!found) return res.status(404).json({ error: "That access code is not valid or has already been used." });
  res.json({
    name: found.name,
    schoolName: found.school.name,
    audience: staff ? "staff" : "parent",
    role: staff ? staffRole(staff.role) : "parent",
  });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Use at least 8 characters"),
});

authRouter.post("/change-password", requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { currentPassword, newPassword } = parsed.data;
  const auth = req.auth!;

  const record =
    auth.role === "parent"
      ? await prisma.parent.findUnique({ where: { id: auth.id } })
      : await prisma.staff.findUnique({ where: { id: auth.id } });
  if (!record?.passwordHash || !(await bcrypt.compare(currentPassword, record.passwordHash))) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  if (auth.role === "parent") {
    await prisma.parent.update({ where: { id: auth.id }, data: { passwordHash, mustSetPassword: false } });
  } else {
    await prisma.staff.update({ where: { id: auth.id }, data: { passwordHash, mustSetPassword: false } });
  }
  res.json({ ok: true });
});

/** Current session identity — used by both PWAs to restore state on load. */
authRouter.get("/me", requireAuth, async (req, res) => {
  const auth = req.auth!;
  const school = await prisma.school.findUnique({ where: { id: auth.schoolId } });
  if (!school) return res.status(404).json({ error: "School not found" });

  if (auth.role === "parent") {
    const parent = await prisma.parent.findUnique({ where: { id: auth.id } });
    if (!parent) return res.status(404).json({ error: "Account not found" });
    return res.json({
      user: { id: parent.id, schoolId: school.id, name: parent.name, role: "parent", initials: initialsOf(parent.name) },
      school: { id: school.id, name: school.name, primaryColor: school.primaryColor, logoUrl: school.logoUrl },
    });
  }

  const staff = await prisma.staff.findUnique({ where: { id: auth.id }, include: { homeroomClass: true } });
  if (!staff) return res.status(404).json({ error: "Account not found" });
  res.json({
    user: {
      id: staff.id,
      schoolId: school.id,
      name: staff.name,
      role: staffRole(staff.role),
      initials: initialsOf(staff.name),
      title: staff.title,
      className: staff.homeroomClass?.name ?? null,
    },
    school: { id: school.id, name: school.name, shortName: school.shortName, primaryColor: school.primaryColor, logoUrl: school.logoUrl },
  });
});

export function normalisePhone(phone: string): string {
  return phone.replace(/\s+/g, "");
}
