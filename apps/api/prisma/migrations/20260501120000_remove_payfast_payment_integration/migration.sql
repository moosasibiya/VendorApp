DROP INDEX IF EXISTS "bookings_paymentProvider_idx";
DROP INDEX IF EXISTS "bookings_paymentReference_key";

ALTER TABLE "bookings"
DROP COLUMN IF EXISTS "paymentProvider",
DROP COLUMN IF EXISTS "stripePaymentIntentId",
DROP COLUMN IF EXISTS "paymentReference",
DROP COLUMN IF EXISTS "paymentGatewayReference",
DROP COLUMN IF EXISTS "paymentInitiatedAt",
DROP COLUMN IF EXISTS "paymentPaidAt",
DROP COLUMN IF EXISTS "paymentFailedAt";

DROP TYPE IF EXISTS "PaymentProvider";
