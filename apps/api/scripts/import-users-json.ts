import { AccountType, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

type LegacyUser = {
  id?: string;
  fullName?: string;
  username?: string;
  usernameNormalized?: string;
  email?: string;
  emailNormalized?: string;
  accountType?: string;
  createdAt?: string;
  passwordSalt?: string;
  passwordHash?: string;
  failedLoginAttempts?: number;
  lockoutUntil?: string | null;
  tokenVersion?: number;
};

type LegacyUsersFile = {
  users?: LegacyUser[];
};

function loadLocalEnvFile(): void {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadLocalEnvFile();

const prisma = new PrismaClient();

function resolveUsersJsonPath(): string {
  const fromRepoRoot = join(process.cwd(), 'apps', 'api', 'data', 'users.json');
  const fromApiRoot = join(process.cwd(), 'data', 'users.json');
  return existsSync(fromRepoRoot) ? fromRepoRoot : fromApiRoot;
}

function normalizeUsername(value: string): { username: string; usernameNormalized: string } {
  const username = value.trim().replace(/^@+/, '');
  return { username, usernameNormalized: username.toLowerCase() };
}

function toAccountType(value?: string): AccountType {
  if (value === 'CLIENT' || value === 'AGENCY' || value === 'CREATIVE') {
    return value;
  }
  return 'CREATIVE';
}

function toPositiveInt(value: number | undefined): number {
  if (!Number.isInteger(value) || value === undefined || value < 0) return 0;
  return value;
}

function toDateOrFallback(value: string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

async function run(): Promise<void> {
  const filePath = resolveUsersJsonPath();
  if (!existsSync(filePath)) {
    console.log(`No users file found at ${filePath}. Nothing to import.`);
    return;
  }

  const raw = readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as LegacyUsersFile;
  const users = Array.isArray(parsed.users) ? parsed.users : [];
  if (!users.length) {
    console.log('No users found in users.json. Nothing to import.');
    return;
  }

  let imported = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.email || !user.passwordSalt || !user.passwordHash || !user.fullName || !user.username) {
      skipped += 1;
      continue;
    }

    const email = user.email.trim();
    const emailNormalized = (user.emailNormalized ?? email).trim().toLowerCase();
    const { username, usernameNormalized } = normalizeUsername(user.username);
    const existingByUsername = await prisma.user.findUnique({ where: { usernameNormalized } });

    if (existingByUsername && existingByUsername.emailNormalized !== emailNormalized) {
      console.warn(
        `Skipping ${emailNormalized}: username '${username}' already belongs to another account.`,
      );
      skipped += 1;
      continue;
    }

    const now = new Date();
    const createdAt = toDateOrFallback(user.createdAt, now);
    const lockoutUntil = user.lockoutUntil ? toDateOrFallback(user.lockoutUntil, now) : null;
    const id = user.id?.trim() || randomBytes(12).toString('hex');

    await prisma.user.upsert({
      where: { emailNormalized },
      update: {
        fullName: user.fullName.trim(),
        username,
        usernameNormalized,
        email,
        accountType: toAccountType(user.accountType),
        passwordSalt: user.passwordSalt,
        passwordHash: user.passwordHash,
        failedLoginAttempts: toPositiveInt(user.failedLoginAttempts),
        lockoutUntil,
        tokenVersion: toPositiveInt(user.tokenVersion),
      },
      create: {
        id,
        fullName: user.fullName.trim(),
        username,
        usernameNormalized,
        email,
        emailNormalized,
        accountType: toAccountType(user.accountType),
        createdAt,
        passwordSalt: user.passwordSalt,
        passwordHash: user.passwordHash,
        failedLoginAttempts: toPositiveInt(user.failedLoginAttempts),
        lockoutUntil,
        tokenVersion: toPositiveInt(user.tokenVersion),
      },
    });

    imported += 1;
  }

  console.log(`User import complete. Imported/updated: ${imported}. Skipped: ${skipped}.`);
}

void run()
  .catch((error: unknown) => {
    console.error('Failed to import users from JSON:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
