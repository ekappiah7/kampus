-- A withdrawn fee is reversed, never deleted: the original CHARGE row stays and a
-- REVERSAL is written beside it, so the ledger still explains the balance a year on.
ALTER TYPE "LedgerEntryType" ADD VALUE 'REVERSAL';

-- Withdrawn items keep their history but drop out of the billable list.
ALTER TABLE "fee_line_items" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedReason" TEXT;
