ALTER TABLE "users"
ADD COLUMN "location" TEXT,
ADD COLUMN "clientEventTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "clientBudgetMin" DECIMAL(10,2),
ADD COLUMN "clientBudgetMax" DECIMAL(10,2),
ADD COLUMN "notificationPreferences" JSONB,
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

ALTER TABLE "agencies"
ADD COLUMN "contactName" TEXT,
ADD COLUMN "contactEmail" TEXT;

UPDATE "users"
SET "onboardingCompletedAt" = CURRENT_TIMESTAMP
WHERE "role" = 'ARTIST'::"UserRole"
  AND EXISTS (
    SELECT 1
    FROM "artists"
    WHERE "artists"."userId" = "users"."id"
      AND "artists"."onboardingCompleted" = true
  );

UPDATE "users"
SET
  "location" = 'Johannesburg',
  "clientEventTypes" = ARRAY['Weddings', 'Brand activations']::TEXT[],
  "clientBudgetMin" = 5000,
  "clientBudgetMax" = 20000,
  "notificationPreferences" = '{"email": true}'::JSONB,
  "onboardingCompletedAt" = CURRENT_TIMESTAMP
WHERE "emailNormalized" IN ('sarah@vendorapp.dev', 'musa@vendorapp.dev');

UPDATE "agencies"
SET
  "contactName" = 'Frame House Bookings',
  "contactEmail" = 'bookings@framehouse.example.com'
WHERE "slug" = 'frame-house-collective';
