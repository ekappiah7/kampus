import { Router } from "express";
import { z } from "zod";
import { prisma } from "@kampus/db";
import type { LedgerEntryView } from "@kampus/shared-types";
import { requireAuth, requireRole } from "../middleware/auth";
import { computeBreakdown, recomputeCharges, studentBalance } from "../lib/fees";
import { cashReference } from "../lib/codes";

export const feesRouter = Router();
feesRouter.use(requireAuth, requireRole("parent"));

async function assertOwnsChild(parentId: string, studentId: string) {
  const link = await prisma.parentStudent.findUnique({ where: { parentId_studentId: { parentId, studentId } } });
  return !!link;
}

async function currentTerm(schoolId: string) {
  return prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
}

feesRouter.get("/children/:id/fees", async (req, res) => {
  const { id } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });

  const term = await currentTerm(req.auth!.schoolId);
  if (!term) return res.json({ term: null, lines: [], billed: 0, paid: 0, balance: 0 });

  const [lines, charges, balance] = await Promise.all([
    computeBreakdown(id, term.id),
    prisma.studentFeeCharge.findMany({ where: { studentId: id, termId: term.id } }),
    studentBalance(id, term.id),
  ]);
  const statusById = new Map(charges.map((c) => [c.id, c.status]));

  res.json({
    term: `${term.name}, ${term.academicYear}`,
    lines: lines.map((l) => ({ ...l, status: statusById.get(l.chargeId) ?? "PENDING" })),
    ...balance,
  });
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
  method: z.enum(["MOMO_MTN", "MOMO_VODAFONE", "MOMO_AIRTELTIGO", "CARD"]),
  /** Momo number or masked card reference — recorded, never the full PAN. */
  payerReference: z.string().optional(),
});

/**
 * Electronic payment (mobile money / card).
 *
 * The gateway integration is not wired yet, so this records a SUCCESS immediately.
 * When a real gateway is added, this endpoint should create the payment as PENDING,
 * return the checkout handle, and let the gateway's webhook flip it to SUCCESS and
 * write the ledger row — the rest of the system already reads from the ledger and
 * needs no change.
 */
feesRouter.post("/children/:id/payments", async (req, res) => {
  const { id } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });
  const parsed = paySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const term = await currentTerm(req.auth!.schoolId);
  if (!term) return res.status(400).json({ error: "No active term" });

  const { balance } = await studentBalance(id, term.id);
  if (parsed.data.amount > balance + 0.01) {
    return res.status(400).json({ error: `Amount exceeds the outstanding balance of GH₵${balance}` });
  }

  const payment = await prisma.payment.create({
    data: {
      studentId: id,
      parentId: req.auth!.id,
      amount: parsed.data.amount,
      method: parsed.data.method,
      status: "SUCCESS",
      reference: parsed.data.payerReference,
    },
  });
  await prisma.feeLedgerEntry.create({
    data: {
      studentId: id,
      termId: term.id,
      type: "PAYMENT",
      amount: -payment.amount,
      paymentId: payment.id,
      note: `Payment via ${labelForMethod(payment.method)}`,
    },
  });
  await recomputeCharges(id, term.id);

  const after = await studentBalance(id, term.id);
  res.status(201).json({ payment, balance: after.balance });
});

const cashSchema = z.object({ amount: z.number().positive() });

/**
 * Cash at the school office: issues a reference the parent quotes at the desk.
 * The payment stays PENDING — and the balance unchanged — until a staff member
 * confirms receipt in the portal. That keeps the ledger honest: money only lands
 * when the school says it has it.
 */
feesRouter.post("/children/:id/cash-reference", async (req, res) => {
  const { id } = req.params;
  if (!(await assertOwnsChild(req.auth!.id, id))) return res.status(403).json({ error: "Not your child" });
  const parsed = cashSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const term = await currentTerm(req.auth!.schoolId);
  if (!term) return res.status(400).json({ error: "No active term" });

  const student = await prisma.student.findUnique({ where: { id } });
  const existing = await prisma.payment.findFirst({
    where: { studentId: id, method: "CASH", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  // Reuse an outstanding reference rather than littering the desk with codes.
  if (existing) {
    return res.json({ reference: existing.reference, amount: existing.amount, reused: true });
  }

  const reference = cashReference(student?.admissionNo);
  const payment = await prisma.payment.create({
    data: {
      studentId: id,
      parentId: req.auth!.id,
      amount: parsed.data.amount,
      method: "CASH",
      status: "PENDING",
      reference,
    },
  });
  res.status(201).json({ reference: payment.reference, amount: payment.amount, reused: false });
});

function labelForMethod(method: string): string {
  switch (method) {
    case "MOMO_MTN":
      return "MTN Mobile Money";
    case "MOMO_VODAFONE":
      return "Vodafone Cash";
    case "MOMO_AIRTELTIGO":
      return "AirtelTigo Money";
    case "CARD":
      return "card";
    default:
      return "cash";
  }
}
