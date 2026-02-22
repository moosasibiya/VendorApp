import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { User as PrismaUser } from '@prisma/client';
import type { StoredUser } from './auth.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersStore {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.toStoredUser(user) : null;
  }

  async findByEmailNormalized(emailNormalized: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { emailNormalized },
    });
    return user ? this.toStoredUser(user) : null;
  }

  async findByUsernameNormalized(usernameNormalized: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { usernameNormalized },
    });
    return user ? this.toStoredUser(user) : null;
  }

  async findByPasswordResetHash(passwordResetHash: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { passwordResetHash },
    });
    return user ? this.toStoredUser(user) : null;
  }

  async createUser(user: StoredUser): Promise<StoredUser> {
    const created = await this.prisma.user.create({
      data: this.toCreateData(user),
    });
    return this.toStoredUser(created);
  }

  async updateAuthFields(
    userId: string,
    input: {
      failedLoginAttempts?: number;
      lockoutUntil?: string | null;
      tokenVersion?: number;
      passwordSalt?: string;
      passwordHash?: string;
      passwordResetHash?: string | null;
      passwordResetExpiry?: string | null;
      mfaEnabled?: boolean;
      mfaSecret?: string | null;
      mfaTempSecret?: string | null;
      mfaBackupCodeHashes?: string[] | null;
    },
  ): Promise<void> {
    const data: Prisma.UserUpdateInput = {};
    if (input.failedLoginAttempts !== undefined) {
      data.failedLoginAttempts = input.failedLoginAttempts;
    }
    if (input.lockoutUntil !== undefined) {
      data.lockoutUntil = input.lockoutUntil ? new Date(input.lockoutUntil) : null;
    }
    if (input.tokenVersion !== undefined) {
      data.tokenVersion = input.tokenVersion;
    }
    if (input.passwordSalt !== undefined) {
      data.passwordSalt = input.passwordSalt;
    }
    if (input.passwordHash !== undefined) {
      data.passwordHash = input.passwordHash;
    }
    if (input.passwordResetHash !== undefined) {
      data.passwordResetHash = input.passwordResetHash;
    }
    if (input.passwordResetExpiry !== undefined) {
      data.passwordResetExpiry = input.passwordResetExpiry
        ? new Date(input.passwordResetExpiry)
        : null;
    }
    if (input.mfaEnabled !== undefined) {
      data.mfaEnabled = input.mfaEnabled;
    }
    if (input.mfaSecret !== undefined) {
      data.mfaSecret = input.mfaSecret;
    }
    if (input.mfaTempSecret !== undefined) {
      data.mfaTempSecret = input.mfaTempSecret;
    }
    if (input.mfaBackupCodeHashes !== undefined) {
      data.mfaBackupCodeHashes =
        input.mfaBackupCodeHashes === null ? Prisma.DbNull : input.mfaBackupCodeHashes;
    }
    if (!Object.keys(data).length) {
      return;
    }
    await this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  private toCreateData(user: StoredUser): Prisma.UserCreateInput {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      usernameNormalized: user.usernameNormalized,
      email: user.email,
      emailNormalized: user.emailNormalized,
      accountType: user.accountType,
      createdAt: new Date(user.createdAt),
      passwordSalt: user.passwordSalt,
      passwordHash: user.passwordHash,
      passwordResetHash: user.passwordResetHash,
      passwordResetExpiry: user.passwordResetExpiry ? new Date(user.passwordResetExpiry) : null,
      mfaEnabled: user.mfaEnabled,
      mfaSecret: user.mfaSecret,
      mfaTempSecret: user.mfaTempSecret,
      mfaBackupCodeHashes:
        user.mfaBackupCodeHashes === undefined
          ? undefined
          : user.mfaBackupCodeHashes === null
            ? Prisma.DbNull
            : user.mfaBackupCodeHashes,
      failedLoginAttempts: user.failedLoginAttempts ?? 0,
      lockoutUntil: user.lockoutUntil ? new Date(user.lockoutUntil) : null,
      tokenVersion: user.tokenVersion ?? 0,
    };
  }

  private toStoredUser(user: PrismaUser): StoredUser {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      usernameNormalized: user.usernameNormalized,
      email: user.email,
      emailNormalized: user.emailNormalized,
      accountType: user.accountType,
      createdAt: user.createdAt.toISOString(),
      passwordSalt: user.passwordSalt,
      passwordHash: user.passwordHash,
      passwordResetHash: user.passwordResetHash,
      passwordResetExpiry: user.passwordResetExpiry ? user.passwordResetExpiry.toISOString() : null,
      mfaEnabled: user.mfaEnabled,
      mfaSecret: user.mfaSecret,
      mfaTempSecret: user.mfaTempSecret,
      mfaBackupCodeHashes: this.toStringArray(user.mfaBackupCodeHashes),
      failedLoginAttempts: user.failedLoginAttempts,
      lockoutUntil: user.lockoutUntil ? user.lockoutUntil.toISOString() : null,
      tokenVersion: user.tokenVersion,
    };
  }

  private toStringArray(value: Prisma.JsonValue | null | undefined): string[] | null {
    if (!Array.isArray(value)) {
      return null;
    }
    const out = value.filter((item): item is string => typeof item === 'string');
    return out.length ? out : [];
  }
}
