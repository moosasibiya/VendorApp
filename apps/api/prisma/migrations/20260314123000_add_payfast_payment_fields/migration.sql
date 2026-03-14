CREATE TYPE "PaymentProvider" AS ENUM ('PAYFAST');

ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_FAILED';

ALTER TABLE "bookings"
ADD COLUMN "paymentProvider" "PaymentProvider",
ADD COLUMN "paymentReference" TEXT,
ADD COLUMN "paymentGatewayReference" TEXT,
ADD COLUMN "paymentInitiatedAt" TIMESTAMP(3),
ADD COLUMN "paymentPaidAt" TIMESTAMP(3),
ADD COLUMN "paymentFailedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "bookings_paymentReference_key" ON "bookings"("paymentReference");
CREATE INDEX "bookings_paymentProvider_idx" ON "bookings"("paymentProvider");
