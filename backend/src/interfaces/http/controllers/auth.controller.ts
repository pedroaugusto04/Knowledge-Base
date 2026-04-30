import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService, type AuthenticatedUser } from '../../../application/auth.js';
import { CurrentUser } from '../auth.decorators.js';
import { AccessTokenAuthGuard, AuthRateLimitGuard, TrustedOriginGuard } from '../auth.guards.js';
import { loginBodySchema, signupBodySchema, type LoginBody, type SignupBody } from '../dto/auth.dto.js';
import { clearAuthCookies, refreshTokenFromRequest, setAuthCookies } from '../http-security.js';
import { ZodValidationPipe } from '../zod-validation.pipe.js';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @UseGuards(AuthRateLimitGuard, TrustedOriginGuard)
  async login(
    @Body(new ZodValidationPipe(loginBodySchema, 'invalid_login_payload')) body: LoginBody,
    @Req() _request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, tokens } = await this.auth.login(body.email, body.password);
    setAuthCookies(response, tokens);
    return { ok: true, user };
  }

  @Post('signup')
  @UseGuards(AuthRateLimitGuard, TrustedOriginGuard)
  async signup(
    @Body(new ZodValidationPipe(signupBodySchema, 'invalid_signup_payload')) body: SignupBody,
    @Req() _request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, tokens } = await this.auth.signup({
      email: body.email,
      password: body.password,
      name: body.name,
    });
    setAuthCookies(response, tokens);
    return { ok: true, user };
  }

  @Post('refresh')
  @UseGuards(AuthRateLimitGuard, TrustedOriginGuard)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const { user, tokens } = await this.auth.refresh(refreshTokenFromRequest(request) || '');
    setAuthCookies(response, tokens);
    return { ok: true, user };
  }

  @Post('logout')
  @UseGuards(TrustedOriginGuard)
  logout(@Req() _request: Request, @Res({ passthrough: true }) response: Response) {
    clearAuthCookies(response);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AccessTokenAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return { ok: true, user };
  }
}
