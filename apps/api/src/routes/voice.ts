import { Router } from "express";
import { z } from "zod";
import { prisma } from "@kampus/db";
import type { ParentVoiceView } from "@kampus/shared-types";
import { requireAuth, requireRole } from "../middleware/auth";

export const voiceRouter = Router();
voiceRouter.use(requireAuth);

const submitSchema = z.object({
  category: z.enum(["SUGGESTION", "COMPLAINT", "HONOUR_A_TEACHER", "GENERAL"]),
  aboutStaffName: z.string().optional(),
  message: z.string().min(1),
});

voiceRouter.post("/", requireRole("parent"), async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const submission = await prisma.parentVoiceSubmission.create({
    data: { schoolId: req.auth!.schoolId, parentId: req.auth!.id, ...parsed.data },
  });
  res.status(201).json(submission);
});

/** Admin inbox — suggestions/complaints/honours from parents across the school. */
voiceRouter.get("/inbox", requireRole("admin"), async (req, res) => {
  const submissions = await prisma.parentVoiceSubmission.findMany({
    where: { schoolId: req.auth!.schoolId },
    include: { parent: true },
    orderBy: { createdAt: "desc" },
  });
  const view: ParentVoiceView[] = submissions.map((s) => ({
    id: s.id,
    category: s.category,
    message: s.message,
    from: s.parent.name,
    resolved: s.resolved,
    createdAt: s.createdAt.toISOString(),
  }));
  res.json(view);
});

const respondSchema = z.object({ resolved: z.boolean().optional(), adminResponse: z.string().optional() });

voiceRouter.patch("/:id", requireRole("admin"), async (req, res) => {
  const parsed = respondSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await prisma.parentVoiceSubmission.update({
    where: { id: req.params.id },
    data: { ...parsed.data, respondedByStaffId: parsed.data.adminResponse ? req.auth!.id : undefined },
  });
  res.json(updated);
});
