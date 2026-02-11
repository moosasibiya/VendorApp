import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { UsersStore } from './users.store';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService, UsersStore, AuthGuard],
  exports: [AuthService, AuthTokenService, AuthGuard],
})
export class AuthModule {}
