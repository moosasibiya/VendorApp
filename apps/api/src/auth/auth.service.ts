import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import type { AuthResponse, User } from '@vendorapp/shared';
import { AuthTokenService } from './auth-token.service';
import type { StoredUser } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { SignupDto } from './dto/signup.dto';
import { UsersStore } from './users.store';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersStore: UsersStore,
    private readonly tokenService: AuthTokenService,
  ) {}

  signup(input: SignupDto): AuthResponse {
    const users = this.usersStore.getUsers();
    const emailNormalized = input.email.trim().toLowerCase();
    const username = input.username.trim().replace(/^@+/, '');

    if (users.some((user) => user.emailNormalized === emailNormalized)) {
      throw new ConflictException('An account with this email already exists');
    }
    if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      throw new ConflictException('Username is already taken');
    }

    const passwordSalt = randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(input.password, passwordSalt);

    const user: StoredUser = {
      id: randomBytes(12).toString('hex'),
      fullName: input.fullName.trim(),
      username,
      email: input.email.trim(),
      emailNormalized,
      accountType: input.accountType,
      createdAt: new Date().toISOString(),
      passwordSalt,
      passwordHash,
    };

    users.push(user);
    this.usersStore.saveUsers(users);
    return {
      token: this.tokenService.sign({ sub: user.id, email: user.email }),
      user: this.toPublicUser(user),
    };
  }

  login(input: LoginDto): AuthResponse {
    const users = this.usersStore.getUsers();
    const emailNormalized = input.email.trim().toLowerCase();
    const user = users.find((item) => item.emailNormalized === emailNormalized);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const expectedHash = this.hashPassword(input.password, user.passwordSalt);
    const passwordMatches = this.constantTimeEquals(expectedHash, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      token: this.tokenService.sign({ sub: user.id, email: user.email }),
      user: this.toPublicUser(user),
    };
  }

  getMe(userId: string): User {
    const users = this.usersStore.getUsers();
    const user = users.find((item) => item.id === userId);
    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }
    return this.toPublicUser(user);
  }

  private toPublicUser(user: StoredUser): User {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      accountType: user.accountType,
      createdAt: user.createdAt,
    };
  }

  private hashPassword(password: string, salt: string): string {
    return scryptSync(password, salt, 64).toString('hex');
  }

  private constantTimeEquals(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a, 'hex');
    const bBuffer = Buffer.from(b, 'hex');
    if (aBuffer.length !== bBuffer.length) {
      return false;
    }
    return timingSafeEqual(aBuffer, bBuffer);
  }
}
