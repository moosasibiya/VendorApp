CREATE TABLE "booking_status_history" (
    "id" VARCHAR(64) NOT NULL,
    "bookingId" VARCHAR(64) NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "reason" TEXT,
    "actorUserId" VARCHAR(64),
    "actorName" TEXT,
    "actorRole" "UserRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "booking_status_history_bookingId_idx" ON "booking_status_history"("bookingId");
CREATE INDEX "booking_status_history_actorUserId_idx" ON "booking_status_history"("actorUserId");
CREATE INDEX "booking_status_history_createdAt_idx" ON "booking_status_history"("createdAt");

ALTER TABLE "booking_status_history"
ADD CONSTRAINT "booking_status_history_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_status_history"
ADD CONSTRAINT "booking_status_history_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
