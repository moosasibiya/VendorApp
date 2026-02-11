import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthResponse, User } from '@vendorapp/shared';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() input: SignupDto): AuthResponse {
    return this.authService.signup(input);
  }

  @Post('login')
  login(@Body() input: LoginDto): AuthResponse {
    return this.authService.login(input);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: { auth: { userId: string } }): User {
    return this.authService.getMe(req.auth.userId);
  }
}
