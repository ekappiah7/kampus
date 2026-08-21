-- Vendor-level sales enquiries from the Kampus product site. Deliberately not
-- scoped to a school: the school making the enquiry is not a tenant yet.
CREATE TABLE "product_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "size" TEXT,
    "message" TEXT,
    "source" TEXT,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_leads_createdAt_idx" ON "product_leads"("createdAt");
