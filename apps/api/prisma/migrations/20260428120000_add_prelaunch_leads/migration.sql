CREATE TYPE "PrelaunchLeadInterest" AS ENUM ('CREATIVE', 'CLIENT', 'AGENCY', 'GENERAL');

CREATE TABLE "prelaunch_leads" (
    "id" VARCHAR(64) NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "name" TEXT,
    "interestType" "PrelaunchLeadInterest" NOT NULL DEFAULT 'GENERAL',
    "source" VARCHAR(64) NOT NULL DEFAULT 'PRELAUNCH_PAGE',
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prelaunch_leads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prelaunch_leads_email_key" ON "prelaunch_leads"("email");
CREATE UNIQUE INDEX "prelaunch_leads_emailNormalized_key" ON "prelaunch_leads"("emailNormalized");
CREATE INDEX "prelaunch_leads_interestType_idx" ON "prelaunch_leads"("interestType");
CREATE INDEX "prelaunch_leads_source_idx" ON "prelaunch_leads"("source");
CREATE INDEX "prelaunch_leads_createdAt_idx" ON "prelaunch_leads"("createdAt");
