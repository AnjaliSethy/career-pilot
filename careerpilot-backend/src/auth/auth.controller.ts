import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';

const COOKIE = 'cp_refresh';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  private setCookie(res: Response, token: string) {
    const days = Number(this.config.get('REFRESH_TOKEN_TTL_DAYS') ?? 14);
    res.cookie(COOKIE, token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: days * 86_400_000,
    });
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...rest } = await this.auth.register(dto.email, dto.password);
    this.setCookie(res, refreshToken);
    return rest;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...rest } = await this.auth.login(dto.email, dto.password);
    this.setCookie(res, refreshToken);
    return rest;
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...rest } = await this.auth.refresh(req.cookies?.[COOKIE]);
    this.setCookie(res, refreshToken);
    return rest;
  }

  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[COOKIE]);
    res.clearCookie(COOKIE, { path: '/api/auth' });
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
