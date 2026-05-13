import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsOptional()
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  // Database — loaded by Prisma directly; must be present
  @IsString()
  DATABASE_URL!: string;

  // Auth tokens — required for any signed token to work
  @IsString()
  AUTH_TOKEN_SECRET!: string;

  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  @IsOptional()
  @IsString()
  EMAIL_FROM?: string;

  @IsOptional()
  @IsString()
  WEB_ORIGIN?: string;

  // PORT is handled at runtime with a default fallback — skip class-validator for it
  PORT?: string;

  // Google OAuth — required if Google login is used
  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  GOOGLE_OAUTH_REDIRECT_URI?: string;

  @IsOptional()
  @IsString()
  UPSTASH_REDIS_REST_URL?: string;

  @IsOptional()
  @IsString()
  UPSTASH_REDIS_REST_TOKEN?: string;
}

// Required vars that must be non-empty strings (cannot be expressed cleanly with class-validator alone)
const REQUIRED_ENV_VARS: (keyof NodeJS.ProcessEnv)[] = ['DATABASE_URL', 'AUTH_TOKEN_SECRET'];

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const val = process.env[key]?.trim();
    return !val;
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        `Copy apps/api/.env.example to apps/api/.env and fill in the values.`,
    );
  }

  const validated = plainToInstance(EnvironmentVariables, process.env, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new Error(`Environment validation failed:\n${messages.join('\n')}`);
  }
}
