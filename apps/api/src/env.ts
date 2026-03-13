import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

let loaded = false;

export function loadEnvironment(): void {
  if (loaded) {
    return;
  }

  const candidates = [
    resolve(process.cwd(), 'apps/api/.env'),
    resolve(process.cwd(), '.env'),
    resolve(__dirname, '../.env'),
    resolve(__dirname, '../../.env'),
  ];

  for (const envPath of uniquePaths(candidates)) {
    if (!existsSync(envPath)) {
      continue;
    }
    loadEnvFile(envPath);
  }

  applyCompatibilityAliases();
  loaded = true;
}

function uniquePaths(paths: string[]): string[] {
  return Array.from(new Set(paths));
}

function loadEnvFile(envPath: string): void {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

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

function applyCompatibilityAliases(): void {
  setAlias('PORT', 'API_PORT');
  setAlias('GOOGLE_OAUTH_REDIRECT_URI', 'GOOGLE_CALLBACK_URL');
  setAlias('AUTH_RESET_TOKEN_PEPPER', 'RESET_TOKEN_PEPPER');
  setAlias('AUTH_BACKUP_CODE_PEPPER', 'BACKUP_CODE_PEPPER');

  if (!process.env.AUTH_TOKEN_SECRET) {
    const secret = process.env.JWT_SECRET?.trim() || process.env.SESSION_SECRET?.trim();
    if (secret) {
      process.env.AUTH_TOKEN_SECRET = secret;
    }
  }

  if (!process.env.AUTH_TOKEN_EXPIRES_IN_SECONDS) {
    const expiresInSeconds = parseDurationSeconds(process.env.JWT_EXPIRES_IN?.trim());
    if (expiresInSeconds !== null) {
      process.env.AUTH_TOKEN_EXPIRES_IN_SECONDS = String(expiresInSeconds);
    }
  }

  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
}

function setAlias(targetKey: string, sourceKey: string): void {
  if (process.env[targetKey] !== undefined) {
    return;
  }

  const sourceValue = process.env[sourceKey]?.trim();
  if (sourceValue) {
    process.env[targetKey] = sourceValue;
  }
}

function parseDurationSeconds(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  const match = raw.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return null;
  }
}
