CREATE TYPE "AccountType" AS ENUM ('CREATIVE', 'CLIENT', 'AGENCY');

CREATE TABLE "users" (
    "id" VARCHAR(64) NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "usernameNormalized" VARCHAR(30) NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordSalt" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_usernameNormalized_key" ON "users"("usernameNormalized");
CREATE UNIQUE INDEX "users_emailNormalized_key" ON "users"("emailNormalized");
CREATE INDEX "users_emailNormalized_idx" ON "users"("emailNormalized");
CREATE INDEX "users_usernameNormalized_idx" ON "users"("usernameNormalized");
