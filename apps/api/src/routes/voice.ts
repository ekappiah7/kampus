import { Router } from "express";
import { z } from "zod";
import { prisma } from "@kampus/db";
import { requireAuth, requireRole } from "../middleware/auth";

export const voiceRouter = Router();
voiceRouter.use(requireAuth, requireRole("parent"));

const submitSchema = z.object({
  category: z.enum(["SUGGESTION", "COMPLAINT", "HONOUR_A_TEACHER", "GENERAL"]),
  aboutStaffName: z.string().optional(),
  message: z.string().min(4, "Please write a short message"),
});

/** Parent Voice from inside the app — identity comes from the session. */
voiceRouter.post("/", async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const submission = await prisma.parentVoiceSubmission.create({
    data: {
      schoolId: req.auth!.schoolId,
      parentId: req.auth!.id,
      authorName: req.auth!.name,
      ...parsed.data,
    },
  });
  res.status(201).json(submission);
});

/** A parent's own submissions, so they can see whether the school replied. */
voiceRouter.get("/mine", async (req, res) => {
  const submissions = await prisma.parentVoiceSubmission.findMany({
    where: { parentId: req.auth!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    submissions.map((s) => ({
      id: s.id,
      category: s.category,
      message: s.message,
      resolved: s.resolved,
      adminResponse: s.adminResponse,
      createdAt: s.createdAt.toISOString(),
    })),
  );
});

/** Staff names a parent can credit in an "Honour a teacher" submission. */
voiceRouter.get("/staff-list", async (req, res) => {
  const staff = await prisma.staff.findMany({
    where: { schoolId: req.auth!.schoolId, status: "ACTIVE" },
    select: { id: true, name: true, title: true },
    orderBy: { name: "asc" },
  });
  res.json(staff);
});
