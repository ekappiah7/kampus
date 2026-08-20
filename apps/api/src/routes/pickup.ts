import { Router } from "express";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { prisma } from "@kampus/db";
import type { PickupNoticeView } from "@kampus/shared-types";
import { requireAuth, requireRole } from "../middleware/auth";

export const pickupRouter = Router();
pickupRouter.use(requireAuth);

const nanoid = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 6);

function toView(n: {
  id: string;
  pickupPersonName: string;
  relation: string;
  code: string;
  status: "PENDING" | "CONFIRMED";
  pickupTime: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
  student: { name: string };
}): PickupNoticeView {
  return {
    id: n.id,
    studentName: n.student.name,
    pickupPersonName: n.pickupPersonName,
    relation: n.relation,
    code: n.code,
    status: n.status,
    pickupTime: n.pickupTime,
    createdAt: n.createdAt.toISOString(),
    confirmedAt: n.confirmedAt?.toISOString() ?? null,
  };
}

const createSchema = z.object({
  studentId: z.string(),
  pickupPersonName: z.string().min(1),
  relation: z.enum(["Parent", "Family member", "Guardian", "Other"]),
  pickupTime: z.string().optional(),
});

/** Parent submits a pickup notice — generates the one-time code shown in the app. */
pickupRouter.post("/", requireRole("parent"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const link = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId: req.auth!.id, studentId: parsed.data.studentId } },
  });
  if (!link) return res.status(403).json({ error: "Not your child" });

  const notice = await prisma.pickupNotice.create({
    data: {
      studentId: parsed.data.studentId,
      requestedByParentId: req.auth!.id,
      pickupPersonName: parsed.data.pickupPersonName,
      relation: parsed.data.relation,
      pickupTime: parsed.data.pickupTime,
      code: `PK-${nanoid()}`,
    },
    include: { student: true },
  });
  res.status(201).json(toView(notice));
});

pickupRouter.get("/children/:id", requireRole("parent"), async (req, res) => {
  const notices = await prisma.pickupNotice.findMany({
    where: { studentId: req.params.id, requestedByParentId: req.auth!.id },
    include: { student: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  res.json(notices.map(toView));
});

/** Pickup Desk queue — pending notices across the school, for gate/admin staff. */
pickupRouter.get("/desk/queue", requireRole("admin", "gate-staff"), async (req, res) => {
  const notices = await prisma.pickupNotice.findMany({
    where: { student: { schoolId: req.auth!.schoolId }, status: "PENDING" },
    include: { student: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(notices.map(toView));
});

/** Pickup Desk history — fulfilled notices log. */
pickupRouter.get("/desk/history", requireRole("admin", "gate-staff"), async (req, res) => {
  const notices = await prisma.pickupNotice.findMany({
    where: { student: { schoolId: req.auth!.schoolId }, status: "CONFIRMED" },
    include: { student: true },
    orderBy: { confirmedAt: "desc" },
    take: 50,
  });
  res.json(notices.map(toView));
});

const confirmSchema = z.object({ code: z.string() });

/** Pickup Desk confirm action — matches the entered/scanned code against the open notice. */
pickupRouter.post("/desk/confirm", requireRole("admin", "gate-staff"), async (req, res) => {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const notice = await prisma.pickupNotice.findUnique({
    where: { code: parsed.data.code },
    include: { student: true },
  });
  if (!notice || notice.student.schoolId !== req.auth!.schoolId) {
    return res.status(404).json({ error: "No pending notice matches this code" });
  }
  if (notice.status === "CONFIRMED") {
    return res.status(409).json({ error: "This code was already confirmed" });
  }

  const updated = await prisma.pickupNotice.update({
    where: { id: notice.id },
    data: { status: "CONFIRMED", confirmedByStaffId: req.auth!.id, confirmedAt: new Date() },
    include: { student: true },
  });

  await prisma.notification.create({
    data: {
      schoolId: req.auth!.schoolId,
      parentId: notice.requestedByParentId,
      type: "PICKUP_CONFIRMED",
      title: "Pickup confirmed",
      body: `${notice.student.name} was released to ${notice.pickupPersonName}.`,
    },
  });

  res.json(toView(updated));
});
