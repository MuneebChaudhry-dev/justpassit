import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '../audit/audit.actions';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestDto } from './dto/create-test.dto';
import type { UpdateTestDto } from './dto/update-test.dto';

@Injectable()
export class TestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** All tests, newest first. (SuperAdmin sees everything.) */
  findAll() {
    return this.prisma.test.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const test = await this.prisma.test.findUnique({ where: { id } });
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    return test;
  }

  async create(dto: CreateTestDto, actorId: string) {
    const test = await this.prisma.test.create({
      data: {
        name: dto.name,
        description: dto.description,
        passingPct: dto.passingPct,
        createdBy: actorId,
      },
    });
    await this.audit.log({
      actorId,
      action: AuditAction.TEST_CREATED,
      entityType: 'Test',
      entityId: test.id,
      metadata: { name: test.name, passingPct: test.passingPct },
    });
    return test;
  }

  async update(id: string, dto: UpdateTestDto, actorId: string) {
    const test = await this.findOne(id);

    // Lock rule (AGENTS.md §6 rule 2): once a test is locked by a first attempt,
    // questions and passingPct are frozen — only name/description/isActive may change.
    if (
      test.isLocked &&
      dto.passingPct !== undefined &&
      dto.passingPct !== test.passingPct
    ) {
      throw new ForbiddenException(
        'This test is locked (it has attempts); the passing % can no longer be changed.',
      );
    }

    const updated = await this.prisma.test.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        passingPct: dto.passingPct,
        isActive: dto.isActive,
      },
    });

    // Audit a passing-% change specifically (old/new), plus a generic update otherwise.
    if (dto.passingPct !== undefined && dto.passingPct !== test.passingPct) {
      await this.audit.log({
        actorId,
        action: AuditAction.PASSING_PCT_CHANGED,
        entityType: 'Test',
        entityId: id,
        metadata: { oldPct: test.passingPct, newPct: dto.passingPct },
      });
    } else {
      await this.audit.log({
        actorId,
        action: AuditAction.TEST_UPDATED,
        entityType: 'Test',
        entityId: id,
      });
    }

    return updated;
  }

  /** Delete a test — only if it has no attempts. Cascades to its questions. */
  async remove(id: string, actorId: string) {
    const test = await this.findOne(id);

    const attemptCount = await this.prisma.testAttempt.count({
      where: { testId: id },
    });
    if (attemptCount > 0) {
      throw new ConflictException(
        'This test has attempts and cannot be deleted; deactivate it instead.',
      );
    }

    await this.prisma.test.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: AuditAction.TEST_DELETED,
      entityType: 'Test',
      entityId: id,
      metadata: { name: test.name },
    });
    return { id };
  }
}
