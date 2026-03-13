-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'ARTIST', 'AGENCY', 'ADMIN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
    'BOOKING_REQUEST',
    'BOOKING_CONFIRMED',
    'BOOKING_CANCELLED',
    'MESSAGE_RECEIVED',
    'PAYMENT_RECEIVED',
    'REVIEW_RECEIVED'
);

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'InProgress';
ALTER TYPE "BookingStatus" ADD VALUE 'Disputed';

-- CreateTable
CREATE TABLE "agencies" (
    "id" VARCHAR(64) NOT NULL,
    "ownerId" VARCHAR(64) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" VARCHAR(64) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

INSERT INTO "categories" ("id", "name", "slug", "iconUrl")
VALUES
    ('cat_photography', 'Photography', 'photography', 'https://cdn.vendorapp.local/categories/photography.svg'),
    ('cat_videography', 'Videography', 'videography', 'https://cdn.vendorapp.local/categories/videography.svg'),
    ('cat_live_entertainment', 'Live Entertainment', 'live-entertainment', 'https://cdn.vendorapp.local/categories/live-entertainment.svg');

-- CreateTable
CREATE TABLE "reviews" (
    "id" VARCHAR(64) NOT NULL,
    "bookingId" VARCHAR(64) NOT NULL,
    "reviewerId" VARCHAR(64) NOT NULL,
    "artistId" VARCHAR(64) NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" VARCHAR(64) NOT NULL,
    "bookingId" VARCHAR(64),
    "participantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" VARCHAR(64) NOT NULL,
    "conversationId" VARCHAR(64) NOT NULL,
    "senderId" VARCHAR(64) NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" VARCHAR(64) NOT NULL,
    "userId" VARCHAR(64) NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" VARCHAR(64) NOT NULL,
    "userId" VARCHAR(64) NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_uploads" (
    "id" VARCHAR(64) NOT NULL,
    "uploaderId" VARCHAR(64) NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_uploads_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "googleId" VARCHAR(191),
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "users"
SET
    "name" = COALESCE(NULLIF("fullName", ''), "username"),
    "role" = CASE
        WHEN "accountType" = 'CREATIVE' THEN 'ARTIST'::"UserRole"
        WHEN "accountType" = 'AGENCY' THEN 'AGENCY'::"UserRole"
        ELSE 'CLIENT'::"UserRole"
    END,
    "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP);

ALTER TABLE "users"
ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "artists"
ADD COLUMN "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "categoryId" VARCHAR(64),
ADD COLUMN "displayName" TEXT,
ADD COLUMN "hourlyRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "id" VARCHAR(64),
ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "portfolioImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "totalReviews" INTEGER NOT NULL DEFAULT 0;

UPDATE "artists"
SET
    "id" = CONCAT('artist_', SUBSTRING(md5("slug"), 1, 24)),
    "displayName" = COALESCE(NULLIF("name", ''), "slug"),
    "categoryId" = CASE
        WHEN LOWER("role") LIKE '%photo%' THEN 'cat_photography'
        WHEN LOWER("role") LIKE '%video%' THEN 'cat_videography'
        ELSE 'cat_live_entertainment'
    END,
    "portfolioImages" = COALESCE("portfolioLinks", ARRAY[]::TEXT[]),
    "tags" = COALESCE("specialties", ARRAY[]::TEXT[]),
    "averageRating" = CASE
        WHEN "rating" ~ '^[0-9]+([.][0-9]+)?$' THEN "rating"::DOUBLE PRECISION
        ELSE 0
    END,
    "rating" = CASE
        WHEN "rating" ~ '^[0-9]+([.][0-9]+)?$' THEN "rating"
        ELSE '0.0'
    END;

INSERT INTO "artists" (
    "id",
    "slug",
    "displayName",
    "name",
    "role",
    "location",
    "rating",
    "bio",
    "services",
    "specialties",
    "pricingSummary",
    "availabilitySummary",
    "portfolioLinks",
    "onboardingCompleted",
    "createdAt",
    "updatedAt",
    "categoryId",
    "hourlyRate",
    "isAvailable",
    "portfolioImages",
    "tags",
    "averageRating",
    "totalReviews",
    "isVerified"
)
SELECT
    CONCAT('artist_', SUBSTRING(md5(source."artistName"), 1, 24)),
    CONCAT(
        regexp_replace(LOWER(source."artistName"), '[^a-z0-9]+', '-', 'g'),
        '-',
        SUBSTRING(md5(source."artistName"), 1, 6)
    ),
    source."artistName",
    source."artistName",
    'Creative',
    source."location",
    '0.0',
    '',
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    NULL,
    NULL,
    ARRAY[]::TEXT[],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'cat_photography',
    COALESCE(
        ROUND((NULLIF(regexp_replace(source."amount", '[^0-9.]', '', 'g'), '')::NUMERIC / 8.0), 2),
        0
    ),
    true,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    0,
    0,
    false
FROM (
    SELECT DISTINCT "artistName", "location", "amount"
    FROM "bookings"
) AS source
WHERE NOT EXISTS (
    SELECT 1
    FROM "artists" existing
    WHERE existing."displayName" = source."artistName"
       OR existing."name" = source."artistName"
);

CREATE UNIQUE INDEX "artists_slug_key" ON "artists"("slug");

ALTER TABLE "artists" DROP CONSTRAINT "artists_pkey";

ALTER TABLE "artists"
ALTER COLUMN "id" SET NOT NULL,
ALTER COLUMN "displayName" SET NOT NULL;

ALTER TABLE "artists"
ADD CONSTRAINT "artists_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "bookings"
ADD COLUMN "agencyId" VARCHAR(64),
ADD COLUMN "artistId" VARCHAR(64),
ADD COLUMN "artistPayout" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "cancelReason" TEXT,
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "clientId" VARCHAR(64),
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "eventEndDate" TIMESTAMP(3),
ADD COLUMN "notes" TEXT,
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "stripePaymentIntentId" TEXT,
ADD COLUMN "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

INSERT INTO "users" (
    "id",
    "fullName",
    "name",
    "username",
    "usernameNormalized",
    "email",
    "emailNormalized",
    "accountType",
    "role",
    "createdAt",
    "updatedAt",
    "passwordSalt",
    "passwordHash",
    "isEmailVerified",
    "isActive",
    "mfaEnabled",
    "failedLoginAttempts",
    "tokenVersion"
)
SELECT
    'user_legacy_client',
    'Legacy Client',
    'Legacy Client',
    'legacyclient',
    'legacyclient',
    'legacy-client@vendorapp.local',
    'legacy-client@vendorapp.local',
    'CLIENT'::"AccountType",
    'CLIENT'::"UserRole",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'seeded-password-salt',
    'seeded-password-hash',
    true,
    true,
    false,
    0,
    0
WHERE NOT EXISTS (
    SELECT 1 FROM "users" WHERE "emailNormalized" = 'legacy-client@vendorapp.local'
);

UPDATE "bookings"
SET
    "clientId" = COALESCE(
        "clientId",
        (
            SELECT "id"
            FROM "users"
            WHERE "emailNormalized" = 'legacy-client@vendorapp.local'
            LIMIT 1
        )
    ),
    "description" = COALESCE(NULLIF("description", ''), "title"),
    "eventDate" = COALESCE(
        TO_DATE("date", 'DD Mon YYYY')::TIMESTAMP,
        "createdAt"
    ),
    "totalAmount" = COALESCE(
        NULLIF(regexp_replace("amount", '[^0-9.]', '', 'g'), '')::DECIMAL(10,2),
        0
    ),
    "platformFee" = ROUND(
        COALESCE(NULLIF(regexp_replace("amount", '[^0-9.]', '', 'g'), '')::NUMERIC, 0) * 0.10,
        2
    ),
    "artistPayout" = COALESCE(NULLIF(regexp_replace("amount", '[^0-9.]', '', 'g'), '')::NUMERIC, 0)
        - ROUND(
            COALESCE(NULLIF(regexp_replace("amount", '[^0-9.]', '', 'g'), '')::NUMERIC, 0) * 0.10,
            2
        );

UPDATE "bookings" b
SET "artistId" = a."id"
FROM "artists" a
WHERE (a."displayName" = b."artistName" OR a."name" = b."artistName")
  AND b."artistId" IS NULL;

INSERT INTO "artists" (
    "id",
    "slug",
    "displayName",
    "name",
    "role",
    "location",
    "rating",
    "bio",
    "services",
    "specialties",
    "pricingSummary",
    "availabilitySummary",
    "portfolioLinks",
    "onboardingCompleted",
    "createdAt",
    "updatedAt",
    "categoryId",
    "hourlyRate",
    "isAvailable",
    "portfolioImages",
    "tags",
    "averageRating",
    "totalReviews",
    "isVerified"
)
SELECT
    'artist_legacy_bookings',
    'legacy-bookings-artist',
    'Legacy Bookings Artist',
    'Legacy Bookings Artist',
    'Creative',
    'South Africa',
    '0.0',
    '',
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    NULL,
    NULL,
    ARRAY[]::TEXT[],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'cat_photography',
    0,
    true,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    0,
    0,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM "artists" WHERE "slug" = 'legacy-bookings-artist'
);

UPDATE "bookings"
SET "artistId" = COALESCE(
    "artistId",
    (
        SELECT "id"
        FROM "artists"
        WHERE "slug" = 'legacy-bookings-artist'
        LIMIT 1
    )
)
WHERE "artistId" IS NULL;

ALTER TABLE "bookings"
ALTER COLUMN "clientId" SET NOT NULL,
ALTER COLUMN "artistId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "agencies_ownerId_key" ON "agencies"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_slug_key" ON "agencies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");

-- CreateIndex
CREATE INDEX "reviews_artistId_idx" ON "reviews"("artistId");

-- CreateIndex
CREATE INDEX "reviews_reviewerId_idx" ON "reviews"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_bookingId_key" ON "conversations"("bookingId");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_isRead_idx" ON "messages"("isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "media_uploads_key_key" ON "media_uploads"("key");

-- CreateIndex
CREATE INDEX "media_uploads_uploaderId_idx" ON "media_uploads"("uploaderId");

-- CreateIndex
CREATE INDEX "artists_categoryId_idx" ON "artists"("categoryId");

-- CreateIndex
CREATE INDEX "artists_isAvailable_idx" ON "artists"("isAvailable");

-- CreateIndex
CREATE INDEX "bookings_clientId_idx" ON "bookings"("clientId");

-- CreateIndex
CREATE INDEX "bookings_artistId_idx" ON "bookings"("artistId");

-- CreateIndex
CREATE INDEX "bookings_paymentStatus_idx" ON "bookings"("paymentStatus");

-- CreateIndex
CREATE INDEX "bookings_eventDate_idx" ON "bookings"("eventDate");

-- CreateIndex
CREATE INDEX "bookings_agencyId_idx" ON "bookings"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "artists"
ADD CONSTRAINT "artists_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencies"
ADD CONSTRAINT "agencies_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_artistId_fkey"
FOREIGN KEY ("artistId") REFERENCES "artists"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_agencyId_fkey"
FOREIGN KEY ("agencyId") REFERENCES "agencies"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_artistId_fkey"
FOREIGN KEY ("artistId") REFERENCES "artists"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations"
ADD CONSTRAINT "conversations_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages"
ADD CONSTRAINT "messages_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages"
ADD CONSTRAINT "messages_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens"
ADD CONSTRAINT "password_reset_tokens_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_uploads"
ADD CONSTRAINT "media_uploads_uploaderId_fkey"
FOREIGN KEY ("uploaderId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
