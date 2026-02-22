CREATE TYPE "BookingStatus" AS ENUM ('Pending', 'Confirmed', 'Completed', 'Cancelled');

CREATE TABLE "artists" (
    "slug" VARCHAR(100) NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "rating" VARCHAR(8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("slug")
);

CREATE TABLE "bookings" (
    "id" VARCHAR(64) NOT NULL,
    "artistName" TEXT NOT NULL,
    "artistInitials" VARCHAR(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'Pending',
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "applications" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");
