ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUB_ADMIN';

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'BOOKED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'AWAITING_START_CODE';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'AWAITING_CLIENT_APPROVAL';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PAYOUT_PENDING';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PAYOUT_RELEASED';

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUPPORT_THREAD_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUPPORT_THREAD_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ARTIST_APPLICATION_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYOUT_STATUS_UPDATED';

CREATE TYPE "ArtistApplicationStatus" AS ENUM (
  'SUBMITTED',
  'PRELAUNCH_POOL',
  'WAITLISTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'LIVE'
);

CREATE TYPE "OnboardingFeeModel" AS ENUM ('UPFRONT', 'FIRST_BOOKING_DEDUCTION');
CREATE TYPE "ConversationKind" AS ENUM ('DIRECT', 'BOOKING', 'SUPPORT');
CREATE TYPE "SupportCategory" AS ENUM (
  'BOOKING_HELP',
  'PAYMENT_ISSUE',
  'PROFILE_ISSUE',
  'DISPUTE_HELP',
  'REFUND_HELP',
  'OTHER'
);
CREATE TYPE "SupportThreadStatus" AS ENUM (
  'OPEN',
  'AWAITING_USER',
  'ESCALATED',
  'RESOLVED'
);
CREATE TYPE "BookingVerificationStatus" AS ENUM (
  'NOT_REQUIRED',
  'PENDING',
  'VERIFIED',
  'FAILED',
  'MANUAL_OVERRIDE'
);
CREATE TYPE "PayoutStatus" AS ENUM (
  'NOT_READY',
  'PENDING',
  'ON_HOLD',
  'RELEASED',
  'MANUAL_REVIEW'
);

ALTER TABLE "artists"
ADD COLUMN "applicationStatus" "ArtistApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
ADD COLUMN "applicationSequence" INTEGER,
ADD COLUMN "applicationSubmittedAt" TIMESTAMP(3),
ADD COLUMN "applicationReviewedAt" TIMESTAMP(3),
ADD COLUMN "applicationReviewedByUserId" VARCHAR(64),
ADD COLUMN "applicationReviewNotes" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedByUserId" VARCHAR(64),
ADD COLUMN "isLive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "wentLiveAt" TIMESTAMP(3),
ADD COLUMN "liveEnabledByUserId" VARCHAR(64),
ADD COLUMN "onboardingFeeModel" "OnboardingFeeModel" NOT NULL DEFAULT 'FIRST_BOOKING_DEDUCTION',
ADD COLUMN "firstBookingOnboardingDeductionApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "firstBookingOnboardingDeductionAt" TIMESTAMP(3),
ADD COLUMN "normalCommissionRate" DECIMAL(5,2) NOT NULL DEFAULT 15,
ADD COLUMN "temporaryFirstBookingCommissionRate" DECIMAL(5,2) NOT NULL DEFAULT 25;

WITH ordered_artists AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS seq
  FROM "artists"
)
UPDATE "artists" artist
SET
  "applicationSequence" = ordered_artists.seq,
  "applicationSubmittedAt" = COALESCE(artist."createdAt", CURRENT_TIMESTAMP),
  "applicationReviewedAt" = CASE
    WHEN artist."onboardingCompleted" THEN COALESCE(artist."updatedAt", artist."createdAt", CURRENT_TIMESTAMP)
    ELSE NULL
  END,
  "approvedAt" = CASE
    WHEN artist."onboardingCompleted" THEN COALESCE(artist."createdAt", CURRENT_TIMESTAMP)
    ELSE NULL
  END,
  "applicationStatus" = CASE
    WHEN artist."onboardingCompleted" THEN 'LIVE'::"ArtistApplicationStatus"
    ELSE 'SUBMITTED'::"ArtistApplicationStatus"
  END,
  "isLive" = COALESCE(artist."onboardingCompleted", false),
  "wentLiveAt" = CASE
    WHEN artist."onboardingCompleted" THEN COALESCE(artist."createdAt", CURRENT_TIMESTAMP)
    ELSE NULL
  END,
  "onboardingFeeModel" = 'FIRST_BOOKING_DEDUCTION'::"OnboardingFeeModel",
  "normalCommissionRate" = 15,
  "temporaryFirstBookingCommissionRate" = 25
FROM ordered_artists
WHERE artist."id" = ordered_artists."id";

CREATE UNIQUE INDEX "artists_applicationSequence_key" ON "artists"("applicationSequence");
CREATE INDEX "artists_applicationStatus_idx" ON "artists"("applicationStatus");
CREATE INDEX "artists_isLive_idx" ON "artists"("isLive");
CREATE INDEX "artists_applicationSubmittedAt_idx" ON "artists"("applicationSubmittedAt");

ALTER TABLE "artists"
ADD CONSTRAINT "artists_applicationReviewedByUserId_fkey"
FOREIGN KEY ("applicationReviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "artists"
ADD CONSTRAINT "artists_approvedByUserId_fkey"
FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "artists"
ADD CONSTRAINT "artists_liveEnabledByUserId_fkey"
FOREIGN KEY ("liveEnabledByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bookings"
ADD COLUMN "verificationCodeCiphertext" TEXT,
ADD COLUMN "verificationCodeSentAt" TIMESTAMP(3),
ADD COLUMN "verificationCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN "verificationStatus" "BookingVerificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "verificationEnteredAt" TIMESTAMP(3),
ADD COLUMN "verificationEnteredByUserId" VARCHAR(64),
ADD COLUMN "verificationOverrideByUserId" VARCHAR(64),
ADD COLUMN "verificationOverrideReason" TEXT,
ADD COLUMN "jobStartedAt" TIMESTAMP(3),
ADD COLUMN "jobCompletedAt" TIMESTAMP(3),
ADD COLUMN "clientApprovedAt" TIMESTAMP(3),
ADD COLUMN "disputeOpenedAt" TIMESTAMP(3),
ADD COLUMN "disputeWindowEndsAt" TIMESTAMP(3),
ADD COLUMN "disputeWindowDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'NOT_READY',
ADD COLUMN "payoutPendingAt" TIMESTAMP(3),
ADD COLUMN "estimatedPayoutReleaseAt" TIMESTAMP(3),
ADD COLUMN "payoutReleasedAt" TIMESTAMP(3),
ADD COLUMN "payoutHoldReason" TEXT,
ADD COLUMN "payoutDelayDaysSnapshot" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "payoutOverrideByUserId" VARCHAR(64),
ADD COLUMN "payoutOverrideReason" TEXT,
ADD COLUMN "normalCommissionRate" DECIMAL(5,2) NOT NULL DEFAULT 15,
ADD COLUMN "appliedCommissionRate" DECIMAL(5,2) NOT NULL DEFAULT 15,
ADD COLUMN "onboardingExtraCutAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "bookings"
SET
  "jobCompletedAt" = CASE
    WHEN "status" = 'Completed'::"BookingStatus" THEN COALESCE("eventEndDate", "eventDate", "updatedAt", "createdAt")
    ELSE NULL
  END,
  "disputeOpenedAt" = CASE
    WHEN "status" = 'Disputed'::"BookingStatus" THEN COALESCE("updatedAt", "createdAt")
    ELSE NULL
  END,
  "verificationStatus" = 'NOT_REQUIRED'::"BookingVerificationStatus",
  "disputeWindowDays" = 3,
  "payoutStatus" = CASE
    WHEN "status" = 'Completed'::"BookingStatus" THEN 'RELEASED'::"PayoutStatus"
    WHEN "status" = 'Disputed'::"BookingStatus" THEN 'MANUAL_REVIEW'::"PayoutStatus"
    ELSE 'NOT_READY'::"PayoutStatus"
  END,
  "payoutReleasedAt" = CASE
    WHEN "status" = 'Completed'::"BookingStatus" THEN COALESCE("paymentPaidAt", "updatedAt", "createdAt")
    ELSE NULL
  END,
  "normalCommissionRate" = 15,
  "appliedCommissionRate" = 15,
  "onboardingExtraCutAmount" = 0;

CREATE INDEX "bookings_verificationStatus_idx" ON "bookings"("verificationStatus");
CREATE INDEX "bookings_payoutStatus_idx" ON "bookings"("payoutStatus");
CREATE INDEX "bookings_disputeWindowEndsAt_idx" ON "bookings"("disputeWindowEndsAt");
CREATE INDEX "bookings_estimatedPayoutReleaseAt_idx" ON "bookings"("estimatedPayoutReleaseAt");

DROP INDEX "conversations_bookingId_key";

ALTER TABLE "conversations"
ADD COLUMN "kind" "ConversationKind" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN "subject" TEXT,
ADD COLUMN "supportCategory" "SupportCategory",
ADD COLUMN "supportStatus" "SupportThreadStatus",
ADD COLUMN "supportTicketNumber" TEXT,
ADD COLUMN "assignedAdminUserId" VARCHAR(64),
ADD COLUMN "resolvedAt" TIMESTAMP(3);

UPDATE "conversations"
SET "kind" = CASE
  WHEN "bookingId" IS NOT NULL THEN 'BOOKING'::"ConversationKind"
  ELSE 'DIRECT'::"ConversationKind"
END;

CREATE UNIQUE INDEX "conversations_supportTicketNumber_key" ON "conversations"("supportTicketNumber");
CREATE INDEX "conversations_bookingId_idx" ON "conversations"("bookingId");
CREATE INDEX "conversations_kind_idx" ON "conversations"("kind");
CREATE INDEX "conversations_supportStatus_idx" ON "conversations"("supportStatus");
CREATE INDEX "conversations_supportCategory_idx" ON "conversations"("supportCategory");
CREATE INDEX "conversations_assignedAdminUserId_idx" ON "conversations"("assignedAdminUserId");

ALTER TABLE "conversations"
ADD CONSTRAINT "conversations_assignedAdminUserId_fkey"
FOREIGN KEY ("assignedAdminUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "sequence_counters" (
  "key" VARCHAR(64) NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sequence_counters_pkey" PRIMARY KEY ("key")
);

INSERT INTO "sequence_counters" ("key", "value", "updatedAt")
VALUES
  ('artistApplications', COALESCE((SELECT MAX("applicationSequence") FROM "artists"), 0), CURRENT_TIMESTAMP),
  ('supportTickets', 0, CURRENT_TIMESTAMP);

CREATE TABLE "system_settings" (
  "key" VARCHAR(120) NOT NULL,
  "value" JSONB NOT NULL,
  "description" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedByUserId" VARCHAR(64),
  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "system_settings_updatedAt_idx" ON "system_settings"("updatedAt");

ALTER TABLE "system_settings"
ADD CONSTRAINT "system_settings_updatedByUserId_fkey"
FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "system_settings" ("key", "value", "description", "updatedAt")
VALUES
  ('maxPrelaunchPoolSize', '100'::jsonb, 'Maximum number of artist applications auto-routed into the prelaunch pool.', CURRENT_TIMESTAMP),
  ('liveArtistSlotLimit', '20'::jsonb, 'Maximum number of artist profiles allowed to be live in the current rollout wave.', CURRENT_TIMESTAMP),
  ('onboardingFeeModel', '"FIRST_BOOKING_DEDUCTION"'::jsonb, 'Switch between upfront onboarding fees and first-booking deduction.', CURRENT_TIMESTAMP),
  ('normalCommissionRate', '15'::jsonb, 'Base platform commission percentage for artists after onboarding recovery.', CURRENT_TIMESTAMP),
  ('temporaryFirstBookingCommissionRate', '25'::jsonb, 'Temporary commission percentage used to recover onboarding cost on the first completed booking.', CURRENT_TIMESTAMP),
  ('disputeWindowDays', '3'::jsonb, 'Default number of days clients can open a standard dispute after completion approval.', CURRENT_TIMESTAMP),
  ('bookingStartCodeLength', '6'::jsonb, 'Number of digits in the client safety verification code.', CURRENT_TIMESTAMP),
  ('startCodeActivationHours', '24'::jsonb, 'Hours before the booking start when the booking moves into the awaiting-start-code stage.', CURRENT_TIMESTAMP),
  ('clientApprovalGraceHours', '24'::jsonb, 'Hours after artist completion before the booking auto-moves into the completed state.', CURRENT_TIMESTAMP);

CREATE TABLE "booking_audit_events" (
  "id" VARCHAR(64) NOT NULL,
  "bookingId" VARCHAR(64) NOT NULL,
  "actorUserId" VARCHAR(64),
  "eventType" VARCHAR(64) NOT NULL,
  "message" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "booking_audit_events_bookingId_idx" ON "booking_audit_events"("bookingId");
CREATE INDEX "booking_audit_events_actorUserId_idx" ON "booking_audit_events"("actorUserId");
CREATE INDEX "booking_audit_events_eventType_idx" ON "booking_audit_events"("eventType");
CREATE INDEX "booking_audit_events_createdAt_idx" ON "booking_audit_events"("createdAt");

ALTER TABLE "booking_audit_events"
ADD CONSTRAINT "booking_audit_events_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_audit_events"
ADD CONSTRAINT "booking_audit_events_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "artist_tier_definitions" (
  "id" VARCHAR(64) NOT NULL,
  "key" VARCHAR(64) NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "thresholds" JSONB,
  "benefits" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artist_tier_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artist_tier_definitions_key_key" ON "artist_tier_definitions"("key");
CREATE INDEX "artist_tier_definitions_sortOrder_idx" ON "artist_tier_definitions"("sortOrder");
CREATE INDEX "artist_tier_definitions_isActive_idx" ON "artist_tier_definitions"("isActive");

INSERT INTO "artist_tier_definitions" (
  "id",
  "key",
  "name",
  "description",
  "sortOrder",
  "isActive",
  "thresholds",
  "benefits",
  "createdAt",
  "updatedAt"
)
VALUES
  ('tier_definition_1', 'tier_1', 'Tier 1', 'Initial launch tier. Placeholder thresholds should be tuned by admins before wider rollout.', 1, true, '{"completedPlatformBookings":0,"minProfileCompleteness":40}'::jsonb, '{"visibilityBoost":1,"recommendedBoost":1,"payoutDelayDays":7,"badgeLabel":"Tier 1","trustIndicator":"Emerging","accessToSpecialOpportunities":false}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tier_definition_2', 'tier_2', 'Tier 2', 'Placeholder mid-tier for dependable artists. Thresholds are configurable in admin.', 2, true, '{"completedPlatformBookings":10,"platformRevenue":25000,"averageRating":4.4,"minProfileCompleteness":70,"minReliabilityScore":90,"maxDisputeRate":15}'::jsonb, '{"visibilityBoost":1.08,"recommendedBoost":1.1,"payoutDelayDays":5,"badgeLabel":"Tier 2","trustIndicator":"Established","accessToSpecialOpportunities":false}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tier_definition_3', 'tier_3', 'Tier 3', 'Placeholder high-performance tier. Tune before launch waves expand.', 3, true, '{"completedPlatformBookings":25,"platformRevenue":75000,"averageRating":4.6,"minProfileCompleteness":85,"minReliabilityScore":94,"maxDisputeRate":10,"minRepeatBookings":3}'::jsonb, '{"visibilityBoost":1.16,"recommendedBoost":1.2,"payoutDelayDays":3,"badgeLabel":"Tier 3","trustIndicator":"Trusted","accessToSpecialOpportunities":true}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tier_definition_4', 'tier_4', 'Tier 4', 'Placeholder top tier for launch-era routing and payout rewards.', 4, true, '{"completedPlatformBookings":60,"platformRevenue":180000,"averageRating":4.8,"minProfileCompleteness":95,"minReliabilityScore":97,"maxDisputeRate":6,"minRepeatBookings":8,"maxResponseTimeMinutes":240}'::jsonb, '{"visibilityBoost":1.28,"recommendedBoost":1.35,"payoutDelayDays":2,"badgeLabel":"Tier 4","trustIndicator":"Priority","accessToSpecialOpportunities":true}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE "artist_tier_snapshots" (
  "id" VARCHAR(64) NOT NULL,
  "artistId" VARCHAR(64) NOT NULL,
  "currentTierId" VARCHAR(64),
  "evaluatedTierId" VARCHAR(64),
  "manualTierId" VARCHAR(64),
  "manualOverrideReason" TEXT,
  "completedPlatformBookings" INTEGER NOT NULL DEFAULT 0,
  "verifiedPlatformBookings" INTEGER NOT NULL DEFAULT 0,
  "platformRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cancellationCount" INTEGER NOT NULL DEFAULT 0,
  "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "responseTimeMinutes" INTEGER,
  "disputeCount" INTEGER NOT NULL DEFAULT 0,
  "disputeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
  "repeatBookings" INTEGER NOT NULL DEFAULT 0,
  "evaluationDetails" JSONB,
  "lastEvaluatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artist_tier_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artist_tier_snapshots_artistId_key" ON "artist_tier_snapshots"("artistId");
CREATE INDEX "artist_tier_snapshots_currentTierId_idx" ON "artist_tier_snapshots"("currentTierId");
CREATE INDEX "artist_tier_snapshots_evaluatedTierId_idx" ON "artist_tier_snapshots"("evaluatedTierId");
CREATE INDEX "artist_tier_snapshots_manualTierId_idx" ON "artist_tier_snapshots"("manualTierId");
CREATE INDEX "artist_tier_snapshots_lastEvaluatedAt_idx" ON "artist_tier_snapshots"("lastEvaluatedAt");

ALTER TABLE "artist_tier_snapshots"
ADD CONSTRAINT "artist_tier_snapshots_artistId_fkey"
FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "artist_tier_snapshots"
ADD CONSTRAINT "artist_tier_snapshots_currentTierId_fkey"
FOREIGN KEY ("currentTierId") REFERENCES "artist_tier_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "artist_tier_snapshots"
ADD CONSTRAINT "artist_tier_snapshots_evaluatedTierId_fkey"
FOREIGN KEY ("evaluatedTierId") REFERENCES "artist_tier_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "artist_tier_snapshots"
ADD CONSTRAINT "artist_tier_snapshots_manualTierId_fkey"
FOREIGN KEY ("manualTierId") REFERENCES "artist_tier_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
