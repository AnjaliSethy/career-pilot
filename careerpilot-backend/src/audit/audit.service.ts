import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private readonly prisma: PrismaService) {}

  /** Append-only activity record. Never throws: auditing must not break the request. */
  async log(
    userId: string | null,
    action: string,
    entityType?: string,
    entityId?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    try {
      await this.prisma.activityLog.create({
        data: { userId, action, entityType, entityId, metadata },
      });
    } catch (e) {
      this.logger.error(`Failed to write audit log for ${action}`, e as Error);
    }
  }

  recent(userId: string, take = 50) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
