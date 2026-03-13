ALTER TABLE "artists"
ADD COLUMN "userId" VARCHAR(64),
ADD COLUMN "bio" TEXT NOT NULL DEFAULT '',
ADD COLUMN "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "specialties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "pricingSummary" TEXT,
ADD COLUMN "availabilitySummary" TEXT,
ADD COLUMN "portfolioLinks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "artists"
SET "onboardingCompleted" = true;

CREATE UNIQUE INDEX "artists_userId_key" ON "artists"("userId");

ALTER TABLE "artists"
ADD CONSTRAINT "artists_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
