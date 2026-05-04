CREATE TYPE "PrelaunchInsiderUserType" AS ENUM ('CLIENT', 'ARTIST');
CREATE TYPE "PrelaunchInsiderStatus" AS ENUM ('PENDING', 'VERIFIED');

ALTER TABLE "prelaunch_leads"
  ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "phoneNumber" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "userType" "PrelaunchInsiderUserType" NOT NULL DEFAULT 'CLIENT',
  ADD COLUMN "referralCode" TEXT,
  ADD COLUMN "referredBy" TEXT,
  ADD COLUMN "instagramFollowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tiktokFollowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "insiderStatus" "PrelaunchInsiderStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "referralCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "referralCreditedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedBy" TEXT;

UPDATE "prelaunch_leads"
SET "referralCode" = UPPER(
  COALESCE(
    NULLIF(REGEXP_REPLACE(SPLIT_PART(COALESCE("name", "emailNormalized"), ' ', 1), '[^a-zA-Z0-9]+', '', 'g'), ''),
    'INSIDER'
  )
) || '-' || UPPER(SUBSTRING(MD5("id") FROM 1 FOR 10))
WHERE "referralCode" IS NULL;

ALTER TABLE "prelaunch_leads"
  ALTER COLUMN "referralCode" SET NOT NULL;

CREATE UNIQUE INDEX "prelaunch_leads_referralCode_key" ON "prelaunch_leads"("referralCode");
CREATE INDEX "prelaunch_leads_userType_idx" ON "prelaunch_leads"("userType");
CREATE INDEX "prelaunch_leads_insiderStatus_idx" ON "prelaunch_leads"("insiderStatus");
CREATE INDEX "prelaunch_leads_referredBy_idx" ON "prelaunch_leads"("referredBy");
