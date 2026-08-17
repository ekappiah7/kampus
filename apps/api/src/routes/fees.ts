import { Router } from "express";
import { z } from "zod";
import { prisma } from "@kampus/db";
import type { FeeLineItemView, LedgerEntryView } from "@kampus/shared-types";
import { requireAuth, requireRole } from "../middleware/auth";

export const feesRouter = Router();
feesRouter.use(requireAuth, requireRole("parent"));

async function assertOwnsChild(parentId: string, studentId: string) {
  const link = await prisma.parentStudent.findUnique({ where: { parentId_studentId: { parentId, studentId } } });
  return !!link;
}

feesRouter.get("/children/:id/fees", async (req, res) => {
  const { id } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });

  const term = await prisma.term.findFirst({ where: { schoolId: req.auth!.schoolId, isCurrent: true } });
  if (!term) return res.json([]);

  const charges = await prisma.studentFeeCharge.findMany({
    where: { studentId: id, termId: term.id },
    include: { feeLineItem: true },
  });

  const [scholarships, discounts] = await Promise.all([
    prisma.scholarship.findMany({ where: { studentId: id }, include: { coverage: true } }),
    prisma.discount.findMany({ where: { studentId: id, OR: [{ recurring: true }, { termId: term.id }] } }),
  ]);

  const view: FeeLineItemView[] = charges.map((c) => {
    const cov = scholarships.flatMap((s) => s.coverage).find((cv) => cv.feeLineItemId === c.feeLineItemId);
    const disc = discounts.find((d) => d.feeLineItemId === c.feeLineItemId || d.feeLineItemId === null);
    return {
      id: c.id,
      label: c.feeLineItem.label,
      originalAmount: c.originalAmount,
      netAmount: c.netAmount,
      status: c.status,
      scholarshipNote: cov
        ? `Covered by scholarship (${cov.subsidyType === "PERCENT" ? `${cov.subsidyValue}%` : `GH₵${cov.subsidyValue}`})`
        : null,
      discountNote: disc
        ? `${disc.reason} (${disc.amountType === "PERCENT" ? `${disc.value}%` : `GH₵${disc.value}`} off${disc.feeLineItemId ? "" : " total balance"})`
        : null,
    };
  });

  res.json(view);
});

feesRouter.get("/children/:id/ledger", async (req, res) => {
  const { id } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });

  const entries = await prisma.feeLedgerEntry.findMany({
    where: { studentId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const view: LedgerEntryView[] = entries.map((e) => ({
    id: e.id,
    type: e.type,
    amount: e.amount,
    note: e.note,
    createdAt: e.createdAt.toISOString(),
  }));
  res.json(view);
});

const paySchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["MOMO_MTN", "MOMO_VODAFONE", "MOMO_AIRTELTIGO", "CARD", "CASH"]),
});

/**
 * Simulated payment flow (idle -> success), matching the prototype's `paymentStage`
 * state machine. Wire `status` here to a real Mobile Money/card gateway webhook
 * in production instead of resolving to SUCCESS synchronously.
 */
feesRouter.post("/children/:id/payments", async (req, res) => {
  const { id } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });
  const parsed = paySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const term = await prisma.term.findFirst({ where: { schoolId: req.auth!.schoolId, isCurrent: true } });
  if (!term) return res.status(400).json({ error: "No active term" });

  const payment = await prisma.payment.create({
    data: { studentId: id, parentId: req.auth!.id, amount: parsed.data.amount, method: parsed.data.method, status: "SUCCESS" },
  });
  await prisma.feeLedgerEntry.create({
    data: { studentId: id, termId: term.id, type: "PAYMENT", amount: -payment.amount, paymentId: payment.id, note: `Payment via ${payment.method}` },
  });

  res.status(201).json(payment);
});
