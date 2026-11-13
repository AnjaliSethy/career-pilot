import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { GeminiService } from '../ai/gemini.service';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService, private readonly gemini: GeminiService) {}

  /** Reports only what has actually been verified: DB is pinged; Gemini reports configuration only. */
  @Public()
  @SkipThrottle()
  @Get()
  async check() {
    let database: 'up' | 'down' = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      time: new Date().toISOString(),
      services: {
        database,
        gemini: this.gemini.isConfigured() ? 'configured' : 'not_configured',
      },
    };
  }
}
