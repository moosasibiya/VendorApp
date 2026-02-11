import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type { StoredUser } from './auth.types';

type UsersFile = {
  users: StoredUser[];
};

@Injectable()
export class UsersStore {
  private readonly filePath: string;

  constructor() {
    this.filePath = this.resolveUsersFilePath();
    this.ensureFile();
  }

  getUsers(): StoredUser[] {
    return this.read().users;
  }

  saveUsers(users: StoredUser[]): void {
    this.write({ users });
  }

  private resolveUsersFilePath(): string {
    const fromRepoRoot = join(process.cwd(), 'apps', 'api', 'data', 'users.json');
    const fromApiRoot = join(process.cwd(), 'data', 'users.json');
    if (existsSync(dirname(fromRepoRoot))) {
      return fromRepoRoot;
    }
    return fromApiRoot;
  }

  private ensureFile(): void {
    const folder = dirname(this.filePath);
    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true });
    }
    if (!existsSync(this.filePath)) {
      this.write({ users: [] });
    }
  }

  private read(): UsersFile {
    try {
      const raw = readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<UsersFile>;
      if (!Array.isArray(parsed.users)) {
        return { users: [] };
      }
      return { users: parsed.users };
    } catch {
      return { users: [] };
    }
  }

  private write(data: UsersFile): void {
    writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
