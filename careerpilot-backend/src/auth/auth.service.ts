import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async register(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    // Single-owner mode: once an owner exists, registration is closed unless explicitly enabled.
    const count = await this.prisma.user.count();
    if (count > 0 && this.config.get('ALLOW_REGISTRATION') !== 'true') {
      throw new ForbiddenException('Registration is closed');
    }
    if (await this.prisma.user.findUnique({ where: { email: normalized } })) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        role: count === 0 ? 'OWNER' : 'USER',
        profile: { create: { professionalEmail: normalized } },
        jobPreference: { create: {} },
        automationSettings: { create: {} },
      },
    });
    await this.audit.log(user.id, 'auth.register', 'User', user.id);
    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), deletedAt: null },
    });
    // Same error for unknown user / wrong password; compare against a dummy hash to keep timing similar.
    const hash = user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
    const ok = await bcrypt.compare(password, hash);
    if (!user || !ok) {
      await this.audit.log(user?.id ?? null, 'auth.login_failed');
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.audit.log(user.id, 'auth.login', 'User', user.id);
    return this.issueTokens(user.id, user.email, user.role);
  }

  /** Rotates the refresh token. Reuse of a revoked token revokes the whole family for that user. */
  async refresh(rawToken: string | undefined) {
    if (!rawToken) throw new UnauthorizedException();
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(rawToken) },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date() || record.user.deletedAt) throw new UnauthorizedException();
    if (record.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.log(record.userId, 'auth.refresh_reuse_detected');
      throw new UnauthorizedException();
    }
    await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(record.userId, record.user.email, record.user.role);
  }

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('ACCESS_TOKEN_TTL') ?? '15m',
      },
    );
    const refreshToken = randomBytes(48).toString('base64url');
    const days = Number(this.config.get('REFRESH_TOKEN_TTL_DAYS') ?? 14);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + days * 86_400_000),
      },
    });
    return { accessToken, refreshToken, user: { id: userId, email, role } };
  }
}
