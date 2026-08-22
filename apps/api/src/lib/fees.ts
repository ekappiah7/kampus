import { prisma } from "@kampus/db";

/**
 * Fee maths lives here so the parent app, the admin fee overview and the report
 * card can never disagree about what a family owes.
 *
 * Model: each StudentFeeCharge is one billable line for one term. Scholarships and
 * discounts reduce it, and every reduction is written to the ledger as its own row
 * so "why is this balance what it is" always has an answer. A payment is a
 * ledger row too, never an edit to a charge.
 */

export interface ChargeBreakdown {
  chargeId: string;
  feeLineItemId: string;
  label: string;
  originalAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  netAmount: number;
  scholarshipNote: string | null;
  discountNote: string | null;
}

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Computes what each line costs this term after subsidies, without writing anything.
 * `StudentFeeCharge.netAmount` is kept in sync with this by `recomputeCharges`.
 */
export async function computeBreakdown(studentId: string, termId: string): Promise<ChargeBreakdown[]> {
  const [charges, scholarships, discounts] = await Promise.all([
    prisma.studentFeeCharge.findMany({
      where: { studentId, termId },
      include: { feeLineItem: true },
      orderBy: { feeLineItem: { label: "asc" } },
    }),
    prisma.scholarship.findMany({
      where: {
        studentId,
        OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
      },
      include: { coverage: true },
    }),
    prisma.discount.findMany({ where: { studentId, OR: [{ recurring: true }, { termId }] } }),
  ]);

  // Discounts with no feeLineItemId apply to the whole term bill; spread them
  // proportionally across lines so each line shows its share of the reduction.
  const totalDiscounts = discounts.filter((d) => !d.feeLineItemId);
  const grossTotal = charges.reduce((sum, c) => sum + c.originalAmount, 0);

  return charges.map((charge) => {
    const gross = charge.originalAmount;

    let scholarshipAmount = 0;
    const scholarshipNotes: string[] = [];
    for (const s of scholarships) {
      const cov = s.coverage.find((c) => c.feeLineItemId === charge.feeLineItemId);
      if (!cov) continue;
      const amount = cov.subsidyType === "PERCENT" ? (gross * cov.subsidyValue) / 100 : cov.subsidyValue;
      scholarshipAmount += amount;
      scholarshipNotes.push(
        `${s.name} — ${cov.subsidyType === "PERCENT" ? `${cov.subsidyValue}%` : `GH₵${cov.subsidyValue}`} off`,
      );
    }

    let discountAmount = 0;
    const discountNotes: string[] = [];
    for (const d of discounts.filter((d) => d.feeLineItemId === charge.feeLineItemId)) {
      const amount = d.amountType === "PERCENT" ? (gross * d.value) / 100 : d.value;
      discountAmount += amount;
      discountNotes.push(`${d.reason} — ${d.amountType === "PERCENT" ? `${d.value}%` : `GH₵${d.value}`} off`);
    }
    for (const d of totalDiscounts) {
      const share = grossTotal > 0 ? gross / grossTotal : 0;
      const amount = d.amountType === "PERCENT" ? (gross * d.value) / 100 : d.value * share;
      discountAmount += amount;
      discountNotes.push(`${d.reason} (applied to total)`);
    }

    // Subsidies can never push a line below zero, or the school would owe the parent.
    const capped = Math.min(scholarshipAmount + discountAmount, gross);
    const scale = scholarshipAmount + discountAmount > 0 ? capped / (scholarshipAmount + discountAmount) : 0;
    scholarshipAmount = money(scholarshipAmount * scale);
    discountAmount = money(discountAmount * scale);

    return {
      chargeId: charge.id,
      feeLineItemId: charge.feeLineItemId,
      label: charge.feeLineItem.label,
      originalAmount: money(gross),
      scholarshipAmount,
      discountAmount,
      netAmount: money(gross - scholarshipAmount - discountAmount),
      scholarshipNote: scholarshipNotes.join(" · ") || null,
      discountNote: discountNotes.join(" · ") || null,
    };
  });
}

/**
 * Recomputes and persists netAmount for a student's term charges, and rewrites the
 * SCHOLARSHIP/DISCOUNT ledger rows to match. Payments and CHARGE rows are left
 * untouched — only the derived subsidy rows are regenerated.
 */
export async function recomputeCharges(studentId: string, termId: string): Promise<void> {
  const breakdown = await computeBreakdown(studentId, termId);
  const paid = await totalPaid(studentId, termId);

  await prisma.$transaction(async (tx) => {
    await tx.feeLedgerEntry.deleteMany({
      where: { studentId, termId, type: { in: ["SCHOLARSHIP", "DISCOUNT"] } },
    });

    let remainingCredit = paid;
    for (const line of breakdown) {
      // Apply payments oldest-line-first so a partial payment marks whole lines paid
      // rather than leaving every line half-settled.
      const settled = Math.min(remainingCredit, line.netAmount);
      remainingCredit -= settled;

      await tx.studentFeeCharge.update({
        where: { id: line.chargeId },
        data: {
          netAmount: line.netAmount,
          status: line.netAmount === 0 || settled >= line.netAmount ? "PAID" : settled > 0 ? "PENDING" : "PENDING",
        },
      });

      if (line.scholarshipAmount > 0) {
        await tx.feeLedgerEntry.create({
          data: {
            studentId,
            termId,
            type: "SCHOLARSHIP",
            amount: -line.scholarshipAmount,
            feeLineItemId: line.feeLineItemId,
            note: line.scholarshipNote,
          },
        });
      }
      if (line.discountAmount > 0) {
        await tx.feeLedgerEntry.create({
          data: {
            studentId,
            termId,
            type: "DISCOUNT",
            amount: -line.discountAmount,
            feeLineItemId: line.feeLineItemId,
            note: line.discountNote,
          },
        });
      }
    }
  });
}

/**
 * What a pupil has actually paid this term.
 *
 * A reversed payment stops counting here, but its ledger row stays put — that is
 * the whole point of reversing rather than deleting. The REVERSAL row beside it is
 * the visible record and is deliberately *not* summed, or the correction would be
 * counted twice.
 */
export async function totalPaid(studentId: string, termId: string): Promise<number> {
  const entries = await prisma.feeLedgerEntry.findMany({
    where: { studentId, termId, type: "PAYMENT" },
    include: { payment: { select: { status: true } } },
  });
  const total = entries
    .filter((e) => e.payment?.status !== "REVERSED")
    .reduce((sum, e) => sum + e.amount, 0);
  return money(Math.abs(total));
}

export interface StudentBalance {
  billed: number;
  paid: number;
  balance: number;
  /** Paid beyond what is owed — usually because a billed item was later withdrawn. */
  credit: number;
}

export async function studentBalance(studentId: string, termId: string): Promise<StudentBalance> {
  const breakdown = await computeBreakdown(studentId, termId);
  const billed = money(breakdown.reduce((sum, l) => sum + l.netAmount, 0));
  const paid = await totalPaid(studentId, termId);
  return {
    billed,
    paid,
    balance: money(Math.max(billed - paid, 0)),
    credit: money(Math.max(paid - billed, 0)),
  };
}

/**
 * Cancels a pupil's charge for one fee item.
 *
 * The ledger is append-only, so the CHARGE row stays and a matching REVERSAL is
 * written beside it — "this was billed, then withdrawn on this date, for this
 * reason" reads correctly a year later, which a delete would destroy. The charge
 * row itself goes, because balances are computed from charges and a withdrawn fee
 * should stop being owed.
 *
 * Returns the amount reversed, or null if the pupil was never charged for it.
 */
export async function reverseCharge(
  studentId: string,
  feeLineItemId: string,
  termId: string,
  reason: string,
  staffId?: string,
): Promise<number | null> {
  const charge = await prisma.studentFeeCharge.findUnique({
    where: { studentId_feeLineItemId_termId: { studentId, feeLineItemId, termId } },
  });
  if (!charge) return null;

  await prisma.$transaction([
    prisma.feeLedgerEntry.create({
      data: {
        studentId,
        termId,
        type: "REVERSAL",
        amount: -charge.originalAmount,
        feeLineItemId,
        note: reason,
        createdByStaffId: staffId ?? null,
      },
    }),
    prisma.studentFeeCharge.delete({ where: { id: charge.id } }),
  ]);

  await recomputeCharges(studentId, termId);
  return money(charge.originalAmount);
}

/**
 * Bills every active pupil in a class for a fee line item, skipping anyone already
 * charged for it this term so re-running is safe.
 */
export async function billClass(feeLineItemId: string, termId: string): Promise<number> {
  const item = await prisma.feeLineItem.findUnique({ where: { id: feeLineItemId } });
  if (!item) throw new Error("Fee line item not found");
  if (item.archived) throw new Error("This fee item has been withdrawn. Restore it before billing.");

  const students = await prisma.student.findMany({
    where: { schoolId: item.schoolId, active: true, ...(item.classId ? { classId: item.classId } : {}) },
    select: { id: true },
  });

  let created = 0;
  for (const s of students) {
    const existing = await prisma.studentFeeCharge.findUnique({
      where: { studentId_feeLineItemId_termId: { studentId: s.id, feeLineItemId, termId } },
    });
    if (existing) continue;

    await prisma.studentFeeCharge.create({
      data: {
        studentId: s.id,
        feeLineItemId,
        termId,
        originalAmount: item.amount,
        netAmount: item.amount,
        status: "PENDING",
      },
    });
    await prisma.feeLedgerEntry.create({
      data: { studentId: s.id, termId, type: "CHARGE", amount: item.amount, feeLineItemId, note: `Charged ${item.label}` },
    });
    await recomputeCharges(s.id, termId);
    created++;
  }
  return created;
}
