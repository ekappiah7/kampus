-- A payment confirmed in error is reversed, not deleted: the payment row stays and
-- a REVERSAL sits beside its ledger entry, so the correction reads as a correction.
ALTER TYPE "PaymentStatus" ADD VALUE 'REVERSED';

ALTER TABLE "payments" ADD COLUMN     "reversedAt" TIMESTAMP(3),
ADD COLUMN     "reversedReason" TEXT;
