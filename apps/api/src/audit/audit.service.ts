import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuditAction, AuditEntityType } from './audit.actions';

interface LogParams {
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  /** Freeform extra context, e.g. { oldPct, newPct } or { inserted }. */
  metadata?: Prisma.InputJsonValue;
}

/**
 * Append-only audit log. Records the important state-changing actions
 * (AGENTS.md §6 rule 9). Failures here must never break the user action, so
 * callers `await` it inside their own try/catch where appropriate; the write
 * itself is a single insert.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log({
    actorId,
    action,
    entityType,
    entityId,
    metadata,
  }: LogParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: { actorId, action, entityType, entityId, metadata },
    });
  }
}
