ALTER TABLE "users"
ADD COLUMN "passwordResetHash" TEXT,
ADD COLUMN "passwordResetExpiry" TIMESTAMP(3),
ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mfaSecret" TEXT,
ADD COLUMN "mfaTempSecret" TEXT,
ADD COLUMN "mfaBackupCodeHashes" JSONB;

CREATE TABLE "auth_audit_events" (
    "id" VARCHAR(64) NOT NULL,
    "userId" VARCHAR(64),
    "emailNormalized" TEXT,
    "eventType" VARCHAR(64) NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" VARCHAR(64),
    "requestId" VARCHAR(128),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_audit_events_userId_idx" ON "auth_audit_events"("userId");
CREATE INDEX "auth_audit_events_eventType_idx" ON "auth_audit_events"("eventType");
CREATE INDEX "auth_audit_events_createdAt_idx" ON "auth_audit_events"("createdAt");

ALTER TABLE "auth_audit_events"
ADD CONSTRAINT "auth_audit_events_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
