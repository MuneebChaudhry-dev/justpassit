import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { LoginResponse } from 'shared';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { RequestUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login — public. The LocalAuthGuard runs the local strategy, which
   * validates credentials and attaches the user; we then issue the JWT.
   * `@Body() LoginDto` is here for validation/shape only — the guard reads the body.
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('login')
  login(
    @Body() _dto: LoginDto,
    @CurrentUser() user: RequestUser,
  ): LoginResponse {
    return this.authService.login(user);
  }

  /** GET /auth/me — returns the live current user (proves the JWT + active check). */
  @Get('me')
  me(@CurrentUser() user: RequestUser): RequestUser {
    return user;
  }
}
